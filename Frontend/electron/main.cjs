const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('node:path');
const { registerScheme, serveAngular } = require('./protocol.cjs');

registerScheme();
const development = !app.isPackaged && process.argv.includes('--dev');
const smoke = process.argv.includes('--smoke');
if(smoke){
  const smokeData=path.join(require('node:os').tmpdir(),'gestion-mvp-smoke-'+process.pid);
  require('node:fs').mkdirSync(smokeData,{recursive:true});
  app.setPath('userData',smokeData);
}
const origin = development ? 'http://localhost:4200' : 'app://gestion';
const apiUrl = require('./config.cjs').apiConfig({packaged:app.isPackaged,development,smoke});
const parsedApi = new URL(apiUrl);
if (!['http:', 'https:'].includes(parsedApi.protocol)) throw new Error('Invalid API URL');

app.whenReady().then(async () => {
  serveAngular(path.join(__dirname, '../dist/desktop/browser'),apiUrl);
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
        const credentials = process.env.GESTION_TEST_USERNAME && process.env.GESTION_TEST_PASSWORD
          ? { username: process.env.GESTION_TEST_USERNAME, password: process.env.GESTION_TEST_PASSWORD }
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
            const username = document.querySelector('input[name="username"]');
            const password = document.querySelector('input[type="password"]');
            username.value = credentials.username;
            password.value = credentials.password;
            username.dispatchEvent(new Event('input', { bubbles: true }));
            password.dispatchEvent(new Event('input', { bubbles: true }));
            document.querySelector('app-login form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
            for (let i = 0; i < 100 && !document.querySelector('app-inicio'); i++) await new Promise(r => setTimeout(r, 100));
            login = { authenticated: !!localStorage.getItem('token'), dashboardRendered: !!document.querySelector('app-inicio'), error: document.querySelector('.login-error, .error-msg')?.textContent?.trim() || null };
            if (login.authenticated) {
              const response = await fetch(config.apiUrl + '/inicio/resumen', { headers: { Authorization: 'Bearer ' + localStorage.getItem('token') }, signal: AbortSignal.timeout(3000) });
              login.protectedApiStatus = response.status;
            }
            username.value = ''; password.value = '';
          }
          return { loginRendered, nodeUnavailable: typeof window.require === 'undefined', apiUrl: config.apiUrl, url: location.href, backend, login };
        })()`);
        const preferences = window.webContents.getLastWebPreferences();
        console.log('ELECTRON_SMOKE', JSON.stringify({ ...result, nodeIntegration: preferences.nodeIntegration, contextIsolation: preferences.contextIsolation, sandbox: preferences.sandbox }));
        if (!result.loginRendered || !result.nodeUnavailable || !preferences.contextIsolation || !preferences.sandbox || preferences.nodeIntegration) throw new Error('Smoke check failed');
        if (credentials && (!result.login?.authenticated || !result.login.dashboardRendered || result.login.error || result.login.protectedApiStatus !== 200)) throw new Error('Login check failed');
        if (process.env.GESTION_TEST_SALE === '1') {
          if (!credentials || parsedApi.port !== '8081') throw new Error('La venta smoke requiere el backend de pruebas en 8081');
          const source = require('node:fs').readFileSync(path.join(__dirname,'sale-smoke.cjs'),'utf8');
          const sale = await window.webContents.executeJavaScript(source);
          console.log('ELECTRON_SALE',JSON.stringify(sale));
        }
        if(process.env.GESTION_TEST_MEDIA === '1'){
          if(!credentials || parsedApi.port!=='8081')throw new Error('La prueba de imágenes y clientes requiere el backend aislado en 8081');
          const source=require('node:fs').readFileSync(path.join(__dirname,'media-smoke.cjs'),'utf8');
          console.log('ELECTRON_MEDIA',JSON.stringify(await window.webContents.executeJavaScript(source)));
        }
        if(process.env.GESTION_TEST_PEDIDOS === '1'){
          if(!credentials || parsedApi.port!=='8081')throw new Error('La prueba de pedidos requiere el backend aislado en 8081');
          const source=require('node:fs').readFileSync(path.join(__dirname,'pedidos-smoke.cjs'),'utf8');
          console.log('ELECTRON_PEDIDOS',JSON.stringify(await window.webContents.executeJavaScript(source)));
        }
        if(process.env.GESTION_TEST_CAPTURE_DIR){
          const fs=require('node:fs/promises');
          if(credentials && process.env.GESTION_TEST_SALE!=='1'){
            await window.webContents.executeJavaScript(`(async()=>{
              document.querySelector('a[href="/nueva-venta"]').click();
              for(let i=0;i<100&&!document.querySelectorAll('.product-card').length;i++)await new Promise(r=>setTimeout(r,100));
            })()`);
          }
          window.showInactive();
          await new Promise(resolve=>setTimeout(resolve,500));
          await fs.mkdir(process.env.GESTION_TEST_CAPTURE_DIR,{recursive:true});
          await fs.writeFile(path.join(process.env.GESTION_TEST_CAPTURE_DIR,development?'mvp-dev.png':'mvp-desktop.png'),(await window.webContents.capturePage()).toPNG());
        }
        await window.webContents.executeJavaScript("['token','rol','username','email'].forEach(k=>localStorage.removeItem(k))");
        app.exit(0);
      } catch (error) { console.error(error); app.exit(1); }
    }
  };
  await createWindow();
  app.on('activate', () => { if (!BrowserWindow.getAllWindows().length) createWindow().catch(console.error); });
}).catch(error => { console.error(error); app.exit(1); });
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
