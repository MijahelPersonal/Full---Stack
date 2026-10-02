const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('node:path');
const { registerScheme, serveAngular } = require('./protocol.cjs');

registerScheme();
const development = process.argv.includes('--dev');
const smoke = process.argv.includes('--smoke');
const origin = development ? 'http://localhost:4200' : 'app://gestion';
const apiUrl = process.env.GESTION_API_URL || 'http://localhost:8080/api';
const parsedApi = new URL(apiUrl);
if (!['http:', 'https:'].includes(parsedApi.protocol)) throw new Error('Invalid API URL');

app.whenReady().then(async () => {
  serveAngular(path.join(__dirname, '../dist/desktop/browser'));
  ipcMain.handle('gestion:config', (event) => {
    if (!event.senderFrame || new URL(event.senderFrame.url).host !== new URL(origin).host ||
        new URL(event.senderFrame.url).protocol !== new URL(origin).protocol) {
      throw new Error('Untrusted configuration request');
    }
    return { apiUrl };
  });
  const createWindow = async () => {
    const window = new BrowserWindow({
      width: 1280, height: 800, minWidth: 900, minHeight: 600,
      show: !smoke,
      webPreferences: {
        preload: path.join(__dirname, 'preload.cjs'),
        nodeIntegration: false, contextIsolation: true, sandbox: true
      }
    });
    window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
    window.webContents.on('will-navigate', (event, url) => {
      const destination = new URL(url);
      if (destination.protocol !== new URL(origin).protocol || destination.host !== new URL(origin).host) event.preventDefault();
    });
    await window.loadURL(smoke ? origin + '/login' : origin);
    if (smoke) {
      try {
        const credentials = process.env.GESTION_TEST_EMAIL && process.env.GESTION_TEST_PASSWORD
          ? { email: process.env.GESTION_TEST_EMAIL, password: process.env.GESTION_TEST_PASSWORD }
          : null;
        const result = await window.webContents.executeJavaScript(`(async () => {
          for (let i = 0; i < 100 && !document.querySelector('app-login'); i++) await new Promise(r => setTimeout(r, 100));
          const config = await window.gestionDesktop.getConfig();
          let backend;
          try {
            const response = await fetch(config.apiUrl + '/usuarios', { signal: AbortSignal.timeout(3000) });
            backend = { reachable: true, status: response.status };
          } catch { backend = { reachable: false }; }
          const loginRendered = !!document.querySelector('app-login');
          const credentials = ${JSON.stringify(credentials)};
          let login;
          if (credentials) {
            const email = document.querySelector('input[type="email"]');
            const password = document.querySelector('input[type="password"]');
            email.value = credentials.email;
            password.value = credentials.password;
            email.dispatchEvent(new Event('input', { bubbles: true }));
            password.dispatchEvent(new Event('input', { bubbles: true }));
            document.querySelector('app-login form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
            for (let i = 0; i < 100 && !document.querySelector('app-dashboard'); i++) await new Promise(r => setTimeout(r, 100));
            login = { authenticated: !!localStorage.getItem('token'), dashboardRendered: !!document.querySelector('app-dashboard'), error: document.querySelector('.error-msg')?.textContent?.trim() || null };
            if (login.authenticated) {
              const response = await fetch(config.apiUrl + '/dashboard/resumen', { headers: { Authorization: 'Bearer ' + localStorage.getItem('token') }, signal: AbortSignal.timeout(3000) });
              login.protectedApiStatus = response.status;
            }
            email.value = ''; password.value = '';
            localStorage.removeItem('token');
            localStorage.removeItem('rol');
            localStorage.removeItem('email');
          }
          return { loginRendered, nodeUnavailable: typeof window.require === 'undefined', apiUrl: config.apiUrl, url: location.href, backend, login };
        })()`);
        const preferences = window.webContents.getLastWebPreferences();
        console.log('ELECTRON_SMOKE', JSON.stringify({ ...result, nodeIntegration: preferences.nodeIntegration, contextIsolation: preferences.contextIsolation, sandbox: preferences.sandbox }));
        if (!result.loginRendered || !result.nodeUnavailable || !preferences.contextIsolation || !preferences.sandbox || preferences.nodeIntegration) throw new Error('Smoke check failed');
        if (credentials && (!result.login?.authenticated || !result.login.dashboardRendered || result.login.error || result.login.protectedApiStatus !== 200)) throw new Error('Login check failed');
        app.exit(0);
      } catch (error) { console.error(error); app.exit(1); }
    }
  };
  await createWindow();
  app.on('activate', () => { if (!BrowserWindow.getAllWindows().length) createWindow().catch(console.error); });
}).catch(error => { console.error(error); app.exit(1); });
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
