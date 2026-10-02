const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('gestionDesktop', {
  getConfig: () => ipcRenderer.invoke('gestion:config')
});
