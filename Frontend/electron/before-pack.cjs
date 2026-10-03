const fs = require('node:fs');
const path = require('node:path');
const {publicApi} = require('./config.cjs');
module.exports = () => {
 const config = JSON.parse(fs.readFileSync(path.join(__dirname,'config.production.json'),'utf8'));
 if(config.apiUrl !== publicApi(process.env.GESTION_API_URL || '')) throw new Error('Preparar la configuración con la URL definitiva antes de empaquetar');
};
