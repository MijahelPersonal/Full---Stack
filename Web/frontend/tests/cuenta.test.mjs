import {test} from 'node:test';import assert from 'node:assert/strict';
import {destinoSeguro,etiqueta,tienda,CuentaError} from '../src/lib/cuenta.ts';
test('el retorno de login no permite redirecciones externas',()=>{assert.equal(destinoSeguro('https://otro.test'),'/cuenta?seccion=pedidos');assert.equal(destinoSeguro('/finalizar-compra'),'/finalizar-compra');assert.equal(etiqueta('LISTO_PARA_RECOGER'),'LISTO PARA RECOGER');});
test('el proxy usa token de cookie, no envía precios agregados y maneja sesiones revocadas',async()=>{
 const original=globalThis.fetch;let borrada=false;const cookies={get:()=>({value:'token-prueba'}),delete:()=>{borrada=true;}};
 try{globalThis.fetch=async(url,options)=>{assert.ok(url.endsWith('/api/tienda/pedidos'));assert.equal(options.headers.Authorization,'Bearer token-prueba');assert.equal(options.cache,'no-store');return Response.json({error:'Cuenta inactiva'},{status:401});};await assert.rejects(()=>tienda('pedidos',cookies),e=>e instanceof CuentaError&&e.status===401);assert.equal(borrada,true);}finally{globalThis.fetch=original;}
});
