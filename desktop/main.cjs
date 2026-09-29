const {
  app,
  BrowserWindow,
  ipcMain,
  safeStorage,
  shell,
  session,
  dialog,
  desktopCapturer,
} = require("electron");
const { createServer } = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const { allowedPath, errorMessage } = require("./faceit-policy.cjs");
const { createDiagnostics } = require("./diagnostics.cjs");
const { isJitsi, allowedCallPermission } = require("./call-policy.cjs");

let origin, server, win;
let callActive = false;
let mediaApproved = false;
let callGeneration = 0;
const callWindows = new Set();
if (!app.isPackaged && process.env.NOCTYS_TEST_DATA_DIR) {
  fs.mkdirSync(process.env.NOCTYS_TEST_DATA_DIR, { recursive: true });
  app.setPath("userData", process.env.NOCTYS_TEST_DATA_DIR);
}
const diagnostics = createDiagnostics(app.getPath("userData"));
diagnostics.log("starting", {
  version: app.getVersion(),
  electron: process.versions.electron,
  platform: process.platform,
  arch: process.arch,
});
app.on("child-process-gone", (_event, details) =>
  diagnostics.log("child-process-gone", details),
);
app.on("render-process-gone", (_event, _contents, details) =>
  diagnostics.log("render-process-gone", details),
);

const keyFile = () => path.join(app.getPath("userData"), "faceit-key.enc");
function key() {
  try {
    return safeStorage.decryptString(fs.readFileSync(keyFile()));
  } catch {
    return "";
  }
}
function trusted(event) {
  if (
    !win ||
    event.sender !== win.webContents ||
    event.senderFrame !== win.webContents.mainFrame ||
    new URL(event.senderFrame.url).origin !== origin
  )
    throw Error("Accès refusé");
}
function handler(name, fn) {
  ipcMain.handle(name, async (event, ...args) => {
    trusted(event);
    return fn(...args);
  });
}
app
  .whenReady()
  .then(async () => {
    const { validateConnection, connectionCsp } =
      await import("./connection-policy.mjs");
    const connectionFile = path.join(
      app.getPath("userData"),
      "team-connection.json",
    );
    let connection = null;
    try {
      connection = validateConnection(
        JSON.parse(fs.readFileSync(connectionFile, "utf8")),
      );
    } catch {}
    const root = path.resolve(__dirname, "../desktop-renderer");
    server = createServer((req, res) => {
      try {
        if (!["GET", "HEAD"].includes(req.method)) {
          res.writeHead(405).end();
          return;
        }
        const route = decodeURIComponent(
          new URL(req.url, "http://localhost").pathname,
        );
        const file = ["/", "/workspace"].includes(route)
          ? path.join(root, "index.html")
          : path.resolve(root, "." + route);
        if (
          !file.startsWith(root + path.sep) ||
          !fs.existsSync(file) ||
          !fs.statSync(file).isFile()
        ) {
          res.writeHead(404).end();
          return;
        }
        const type =
          {
            ".html": "text/html",
            ".js": "text/javascript",
            ".css": "text/css",
            ".png": "image/png",
            ".svg": "image/svg+xml",
            ".woff2": "font/woff2",
          }[path.extname(file)] || "application/octet-stream";
        res.setHeader("Content-Type", type);
        res.setHeader("X-Content-Type-Options", "nosniff");
        res.setHeader("Content-Security-Policy", connectionCsp(connection));
        res.setHeader("Referrer-Policy", "no-referrer");
        res.setHeader("Cache-Control", "no-store");
        fs.createReadStream(file).pipe(res);
      } catch {
        res.writeHead(400).end();
      }
    });
    await new Promise((resolve, reject) => {
      server.once("error", reject);
      server.listen(0, "127.0.0.1", resolve);
    });
    origin = "http://127.0.0.1:" + server.address().port;
    handler("connection:get", () => connection);
    handler("connection:set", (value) => {
      const next = validateConnection(value);
      fs.writeFileSync(connectionFile + ".tmp", JSON.stringify(next));
      fs.renameSync(connectionFile + ".tmp", connectionFile);
      connection = next;
    });
    handler("faceit:status", () => !!key());
    handler("faceit:key", (value) => {
      if (typeof value !== "string" || value.length > 256)
        throw Error("Clé invalide");
      if (!value) {
        fs.rmSync(keyFile(), { force: true });
        return;
      }
      if (!safeStorage.isEncryptionAvailable())
        throw Error("Chiffrement Windows indisponible.");
      fs.writeFileSync(keyFile(), safeStorage.encryptString(value.trim()));
    });
    handler("faceit:request", async (route) => {
      if (!allowedPath(route)) throw Error("Requête FACEIT non autorisée");
      const secret = key();
      if (!secret) throw Error("Configurez la clé FACEIT dans les paramètres.");
      const r = await fetch("https://open.faceit.com/data/v4" + route, {
        headers: { Authorization: "Bearer " + secret },
        signal: AbortSignal.timeout(20000),
        redirect: "error",
      });
      if (!r.ok) throw Error(errorMessage(r.status));
      return r.json();
    });
    handler("auth:login", async (value) => {
      if (!connection) throw Error("Configurez la connexion de votre équipe.");
      if (
        !value ||
        typeof value.username !== "string" ||
        typeof value.password !== "string" ||
        value.username.length > 24 ||
        value.password.length > 256
      )
        throw Error("Identifiants invalides");
      const r = await fetch(
        connection.supabaseUrl + "/functions/v1/username-login",
        {
          method: "POST",
          headers: {
            apikey: connection.publishableKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: value.username,
            password: value.password,
          }),
          signal: AbortSignal.timeout(20000),
          redirect: "error",
        },
      );
      const data = await r.json();
      if (!r.ok) throw Error(data.error || "Connexion impossible");
      return data;
    });
    handler("call:active", (value) => {
      callGeneration++;
      callActive = value === true;
      mediaApproved = false;
      if (!callActive)
        for (const child of callWindows)
          if (!child.isDestroyed()) child.close();
    });
    session.defaultSession.setPermissionCheckHandler(
      (wc, permission, requestingOrigin) =>
        wc === win?.webContents &&
        allowedCallPermission(permission, requestingOrigin, callActive) &&
        (permission !== "media" || mediaApproved),
    );
    session.defaultSession.setPermissionRequestHandler(
      async (wc, permission, callback, details) => {
        if (
          wc !== win?.webContents ||
          !allowedCallPermission(permission, details.requestingUrl, callActive)
        )
          return callback(false);
        if (permission !== "media") return callback(true);
        try {
          const generation = callGeneration;
          const { response } = await dialog.showMessageBox(win, {
            type: "question",
            title: "Appel Jitsi",
            message:
              "Autoriser le microphone et/ou la caméra pour cet appel Jitsi ?",
            detail: "Vous pouvez les couper à tout moment dans l’appel.",
            buttons: ["Refuser", "Autoriser"],
            defaultId: 0,
            cancelId: 0,
          });
          mediaApproved =
            response === 1 &&
            callActive &&
            generation === callGeneration &&
            !wc.isDestroyed();
          callback(mediaApproved);
        } catch {
          callback(false);
        }
      },
    );
    session.defaultSession.setDisplayMediaRequestHandler(
      async (request, callback) => {
        try {
          if (
            !callActive ||
            !win ||
            request.frame?.top !== win.webContents.mainFrame ||
            !isJitsi(request.frame.url)
          )
            return callback({});
          const generation = callGeneration;
          const { response } = await dialog.showMessageBox(win, {
            type: "question",
            title: "Partager NOCTYS",
            message:
              "Partager la fenêtre NOCTYS avec les participants de cet appel ?",
            detail:
              "Tout ce qui apparaît dans cette fenêtre sera visible, y compris les onglets et messages que vous ouvrez.",
            buttons: ["Annuler", "Partager NOCTYS"],
            defaultId: 0,
            cancelId: 0,
          });
          if (
            response !== 1 ||
            !callActive ||
            generation !== callGeneration ||
            win.isDestroyed()
          )
            return callback({});
          const sources = await desktopCapturer.getSources({
            types: ["window"],
            thumbnailSize: { width: 0, height: 0 },
          });
          const source = sources.find((s) => s.id === win.getMediaSourceId());
          if (
            !source ||
            !callActive ||
            generation !== callGeneration ||
            !isJitsi(request.frame.url)
          )
            return callback({});
          callback({ video: source });
        } catch {
          callback({});
        }
      },
    );
    win = new BrowserWindow({
      title: "NOCTYS HQ",
      width: 1500,
      height: 960,
      minWidth: 960,
      minHeight: 680,
      backgroundColor: "#090a10",
      autoHideMenuBar: true,
      icon: path.join(root, "noctys.png"),
      webPreferences: {
        preload: path.join(__dirname, "preload.cjs"),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
      },
    });
    win.webContents.setWindowOpenHandler(({ url, referrer }) => {
      try {
        if (
          callActive &&
          new URL(url).protocol === "https:" &&
          (isJitsi(url) || isJitsi(referrer?.url))
        ) {
          return {
            action: "allow",
            overrideBrowserWindowOptions: {
              parent: win,
              width: 650,
              height: 780,
              autoHideMenuBar: true,
              webPreferences: {
                preload: "",
                nodeIntegration: false,
                contextIsolation: true,
                sandbox: true,
              },
            },
          };
        }
        if (new URL(url).protocol === "https:") shell.openExternal(url);
      } catch {}
      return { action: "deny" };
    });
    win.webContents.on("did-create-window", (child) => {
      callWindows.add(child);
      child.on("closed", () => callWindows.delete(child));
      child.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
      child.webContents.on("will-navigate", (event, url) => {
        if (new URL(url).protocol !== "https:") event.preventDefault();
      });
    });
    win.webContents.on("will-navigate", (event, url) => {
      if (new URL(url).origin !== origin) {
        event.preventDefault();
        if (new URL(url).protocol === "https:") shell.openExternal(url);
      }
    });
    win.webContents.once("did-finish-load", () =>
      diagnostics.log("renderer-ready"),
    );
    win.webContents.on("did-navigate", () => {
      callGeneration++;
      callActive = false;
      mediaApproved = false;
    });
    win.webContents.on(
      "did-fail-load",
      (_event, errorCode, _description, _url, isMainFrame) => {
        if (!isMainFrame) return;
        diagnostics.log("load-failed", { errorCode });
        dialog.showErrorBox(
          "NOCTYS — démarrage impossible",
          "La fenêtre n’a pas pu charger. Fermez puis relancez NOCTYS.\nJournal de diagnostic : " +
            diagnostics.filename,
        );
      },
    );
    await win.loadURL(origin);
  })
  .catch(() => {
    diagnostics.log("startup-failed");
    dialog.showErrorBox(
      "NOCTYS — démarrage impossible",
      "Le démarrage a échoué.\nJournal de diagnostic : " + diagnostics.filename,
    );
    app.quit();
  });
app.on("window-all-closed", () => app.quit());
app.on("before-quit", () => server?.close());
