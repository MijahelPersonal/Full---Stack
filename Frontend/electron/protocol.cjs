const { protocol, net } = require('electron');
const path = require('node:path');
const fs = require('node:fs/promises');
const { pathToFileURL } = require('node:url');

function registerScheme() {
  protocol.registerSchemesAsPrivileged([{ scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true } }]);
}
function serveAngular(root) {
  protocol.handle('app', async request => {
    const url = new URL(request.url);
    if (url.host !== 'gestion' || request.method !== 'GET') return new Response('Not found', { status: 404 });
    const requested = path.resolve(root, '.' + decodeURIComponent(url.pathname));
    const relative = path.relative(root, requested);
    if (relative.startsWith('..') || path.isAbsolute(relative)) return new Response('Forbidden', { status: 403 });
    let file = requested;
    try { if (!(await fs.stat(file)).isFile()) file = path.join(root, 'index.html'); }
    catch { if (path.extname(url.pathname)) return new Response('Not found', { status: 404 }); file = path.join(root, 'index.html'); }
    const response = await net.fetch(pathToFileURL(file).toString());
    const headers = new Headers(response.headers);
    headers.set('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: http://localhost:8080 " + (process.env.GESTION_API_URL ? new URL(process.env.GESTION_API_URL).origin : '') + "; connect-src http://localhost:8080 " + (process.env.GESTION_API_URL ? new URL(process.env.GESTION_API_URL).origin : '') + "; object-src 'none'; base-uri 'self'; frame-src 'none'");
    return new Response(response.body, { status: response.status, headers });
  });
}
module.exports = { registerScheme, serveAngular };
