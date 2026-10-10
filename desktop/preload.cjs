const { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld(
  "noctys",
  Object.freeze({
    getConnection: () => ipcRenderer.invoke("connection:get"),
    checkUpdate: () => ipcRenderer.invoke('updates:check'),
    downloadUpdate: () => ipcRenderer.invoke('updates:download'),
    installUpdate: () => ipcRenderer.invoke('updates:install'),
    setConnection: (value) => ipcRenderer.invoke("connection:set", value),
    keyStatus: () => ipcRenderer.invoke("faceit:status"),
    setKey: (key) => ipcRenderer.invoke("faceit:key", key),
    faceit: (path) => ipcRenderer.invoke("faceit:request", path),
    login: (credentials) => ipcRenderer.invoke("auth:login", credentials),
    callActive: (active) => ipcRenderer.invoke('call:active', active),
  }),
);
