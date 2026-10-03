const fs = require('node:fs');
const path = require('node:path');
const {publicApi} = require('./config.cjs');
const apiUrl = publicApi(process.env.GESTION_API_URL || '');
fs.writeFileSync(path.join(__dirname,'config.production.json'),JSON.stringify({apiUrl},null,2)+'\n');
console.log('Configuración HTTPS de escritorio preparada.');
