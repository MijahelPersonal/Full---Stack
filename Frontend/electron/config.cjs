const fs = require('node:fs');
const path = require('node:path');
function publicApi(value) {
 const url = new URL(value);
 if(url.protocol !== 'https:' || ['localhost','127.0.0.1','[::1]'].includes(url.hostname) || url.username || url.password || url.search || url.hash || !/\/api\/?$/.test(url.pathname))
  throw new Error('GESTION_API_URL debe ser una URL pública HTTPS terminada en /api');
 return url.href.replace(/\/$/,'');
}
function apiConfig({packaged,development,smoke}) {
 if(packaged) return publicApi(JSON.parse(fs.readFileSync(path.join(__dirname,'config.production.json'),'utf8')).apiUrl);
 if(!development && !smoke && fs.existsSync(path.join(__dirname,'config.production.json')))
  return publicApi(JSON.parse(fs.readFileSync(path.join(__dirname,'config.production.json'),'utf8')).apiUrl);
 return process.env.GESTION_API_URL || 'http://localhost:8080/api';
}
module.exports = {publicApi,apiConfig};
