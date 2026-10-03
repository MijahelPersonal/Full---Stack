// El renderer recibe estados públicos; nunca URLs de descarga, rutas o errores internos.
function createUpdater({ app, ipcMain, updater, trusted, send, enabled }) {
  let state = { status: enabled ? 'idle' : 'disabled', version: app.getVersion() };
  let busy = false;
  const emit = (status, extra = {}) => {
    state = { status, version: app.getVersion(), ...extra };
    send(state);
    return state;
  };
  if (enabled) {
    updater.logger = null;
    updater.autoDownload = false;
    updater.autoInstallOnAppQuit = false;
    updater.allowPrerelease = false;
    updater.allowDowngrade = false;
    updater.on('checking-for-update', () => emit('checking'));
    updater.on('update-available', info => emit('available', { nextVersion: info.version }));
    updater.on('update-not-available', () => emit('current'));
    updater.on('download-progress', progress => emit('downloading', { nextVersion: state.nextVersion, percent: Math.max(0, Math.min(100, Math.round(progress.percent))) }));
    updater.on('update-downloaded', info => emit('ready', { nextVersion: info.version }));
    updater.on('error', () => emit('error'));
  }
  const check = async () => {
    if (!enabled || busy || ['available', 'downloading', 'ready'].includes(state.status)) return state;
    busy = true;
    emit('checking');
    try { await updater.checkForUpdates(); } catch { emit('error'); }
    finally { busy = false; }
    return state;
  };
  const handle = (channel, action) => ipcMain.handle(channel, (event, ...args) => {
    if (!trusted(event) || args.length) throw new Error('Solicitud no permitida');
    return action();
  });
  handle('gestion:update:state', () => state);
  handle('gestion:update:check', check);
  handle('gestion:update:download', async () => {
    if (!enabled || busy || state.status !== 'available') return state;
    busy = true;
    emit('downloading', { nextVersion: state.nextVersion, percent: 0 });
    try { await updater.downloadUpdate(); } catch { emit('error'); }
    finally { busy = false; }
    return state;
  });
  handle('gestion:update:install', () => {
    if (!enabled || state.status !== 'ready' || busy) throw new Error('Actualización no preparada');
    busy = true;
    setImmediate(() => { try { updater.quitAndInstall(false, true); } catch { busy = false; emit('error'); } });
    return state;
  });
  return { check, getState: () => state };
}
module.exports = { createUpdater };
