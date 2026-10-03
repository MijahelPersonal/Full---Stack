import test from 'node:test';
import assert from 'node:assert/strict';
import {origen} from '../src/lib/catalogo.ts';
test('Vercel requiere API HTTPS explícita, sin credenciales ni localhost',()=>{
 const oldApi=process.env.API_URL,oldTarget=process.env.DEPLOY_TARGET;
 process.env.DEPLOY_TARGET='vercel';
 try {
  for(const value of ['', 'http://localhost:8080','https://localhost','https://usuario:clave@api.example.com']) {process.env.API_URL=value;assert.throws(()=>origen());}
  process.env.API_URL='https://api.example.com';assert.equal(origen(),'https://api.example.com');
 } finally {
  if(oldApi===undefined)delete process.env.API_URL;else process.env.API_URL=oldApi;
  if(oldTarget===undefined)delete process.env.DEPLOY_TARGET;else process.env.DEPLOY_TARGET=oldTarget;
 }
});
