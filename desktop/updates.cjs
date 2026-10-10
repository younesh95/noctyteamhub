const fs = require("node:fs/promises"),
  path = require("node:path"),
  crypto = require("node:crypto");
module.exports = async function configureUpdates({ app, shell, handler, fetcher = fetch }) {
  const { repository, newerVersion, releaseAssets, allowedUpdateUrl } =
    await import("./update-policy.mjs");
  let offer = null,
    verified = null,
    downloading = false;
  async function asset(url) {
    for (let i = 0; i < 5; i++) {
      if (!allowedUpdateUrl(url)) throw Error("Source de mise à jour refusée.");
      const r = await fetcher(url, {
        redirect: "manual",
        signal: AbortSignal.timeout(300000),
      });
      if ([301, 302, 303, 307, 308].includes(r.status)) {
        url = new URL(r.headers.get("location"), url).href;
        continue;
      }
      if (!r.ok) throw Error("Téléchargement indisponible.");
      return r;
    }
    throw Error("Trop de redirections.");
  }
  handler("updates:check", async () => {
    if (downloading) throw Error("Téléchargement en cours.");
    const r = await fetcher(
      "https://api.github.com/repos/" + repository + "/releases/latest",
      {
        headers: {
          Accept: "application/vnd.github+json",
          "User-Agent": "NOCTYS-HQ",
        },
        redirect: "error",
        signal: AbortSignal.timeout(15000),
      },
    );
    if (!r.ok)
      throw Error("Vérification GitHub indisponible. Réessayez plus tard.");
    const next = releaseAssets(await r.json());
    offer = newerVersion(next.version, app.getVersion()) ? next : null;
    return { current: app.getVersion(), available: offer?.version || null };
  });
  handler("updates:download", async () => {
    if (!offer || downloading)
      throw Error("Vérifiez les mises à jour avant de télécharger.");
    downloading = true;
    const target = path.join(
      app.getPath("temp"),
      "noctys-update-" + offer.version + ".exe",
    );
    verified = null;
    try {
      const sumResponse = await asset(offer.checksum);
      if (Number(sumResponse.headers.get("content-length")) > 4096)
        throw Error("Empreinte invalide.");
      const text = await sumResponse.text();
      const match = text.match(/^([a-f0-9]{64})\s+noctysstartbook\.exe\s*$/i);
      if (!match) throw Error("Empreinte invalide.");
      const r = await asset(offer.installer),
        file = await fs.open(target + ".part", "w"),
        hash = crypto.createHash("sha256");
      let size = 0;
      try {
        for await (const chunk of r.body) {
          size += chunk.length;
          if (size > offer.size) throw Error("Taille de fichier inattendue.");
          hash.update(chunk);
          await file.writeFile(chunk);
        }
        await file.sync();
      } finally {
        await file.close();
      }
      const digest = hash.digest("hex");
      if (size !== offer.size || digest !== match[1].toLowerCase())
        throw Error("Vérification d’intégrité échouée.");
      await fs.rename(target + ".part", target);
      verified = { target, hash: digest };
      return { version: offer.version };
    } finally {
      downloading = false;
      await fs.rm(target + ".part", { force: true }).catch(() => {});
    }
  });
  handler("updates:install", async () => {
    if (!verified)
      throw Error("Téléchargez et vérifiez la mise à jour avant installation.");
    const value = await fs.readFile(verified.target);
    if (
      crypto.createHash("sha256").update(value).digest("hex") !== verified.hash
    )
      throw Error("Le fichier a changé depuis sa vérification.");
    const error = await shell.openPath(verified.target);
    if (error) throw Error("Impossible de lancer l’assistant Windows.");
    setTimeout(() => app.quit(), 500);
    return true;
  });
};
