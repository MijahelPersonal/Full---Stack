const {test}=require('node:test');
const assert=require('node:assert/strict');
const {publicApi,apiConfig}=require('./config.cjs');
test('producción rechaza localhost, HTTP, credenciales y URL sin /api',()=>{
 for(const url of ['http://localhost:8080/api','https://localhost/api','https://127.0.0.1/api','https://user:password@example.com/api','https://example.com']) assert.throws(()=>publicApi(url));
 assert.equal(publicApi('https://backend.example.com/api/'),'https://backend.example.com/api');
});
test('desarrollo mantiene el backend local',()=>{
 const old=process.env.GESTION_API_URL; delete process.env.GESTION_API_URL;
 try { assert.equal(apiConfig({packaged:false,development:true,smoke:false}),'http://localhost:8080/api'); }
 finally { if(old!==undefined)process.env.GESTION_API_URL=old; }
});
