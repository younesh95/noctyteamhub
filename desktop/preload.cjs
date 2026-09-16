const { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld(
  "noctys",
  Object.freeze({
    keyStatus: () => ipcRenderer.invoke("faceit:status"),
    setKey: (key) => ipcRenderer.invoke("faceit:key", key),
    faceit: (path) => ipcRenderer.invoke("faceit:request", path),
    login: (credentials) => ipcRenderer.invoke("auth:login", credentials),
  }),
);
