const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('gestionDesktop', {
  getConfig: () => ipcRenderer.invoke('gestion:config'),
  updates: {
    getState: () => ipcRenderer.invoke('gestion:update:state'),
    check: () => ipcRenderer.invoke('gestion:update:check'),
    download: () => ipcRenderer.invoke('gestion:update:download'),
    install: () => ipcRenderer.invoke('gestion:update:install'),
    onState: callback => {
      const listener = (_event, state) => callback(state);
      ipcRenderer.on('gestion:update:state', listener);
      return () => ipcRenderer.removeListener('gestion:update:state', listener);
    }
  }
});
