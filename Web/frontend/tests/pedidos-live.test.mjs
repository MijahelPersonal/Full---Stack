import {test} from 'node:test';import assert from 'node:assert/strict';import {randomUUID} from 'node:crypto';
const base=process.env.PICKUP_TEST_URL,id=process.env.PICKUP_TEST_PRODUCT_ID;
test('Astro: registro, cookie segura, checkout idempotente, constancia y aislamiento de cuentas',{skip:!base||!id},async()=>{
 assert.equal(new URL(base).port,'4322','Solo ejecutar contra la tienda aislada en 4322');
 let cookie='';
 const post=async(accion,body,origin=base)=>fetch(`${base}/api/cuenta/${accion}`,{method:'POST',headers:{'Content-Type':'application/json',Origin:origin,...(cookie?{Cookie:cookie}:{})},body:JSON.stringify(body)});
 assert.equal((await post('login',{email:'qa@local.test',password:'Cliente123!'},'http://externo.test')).status,403);
 const email=`astro-${randomUUID()}@local.test`;const registro=await post('registro',{nombres:'Cliente',apellidos:'Astro QA',email,password:'Cliente123!',telefono:'999999999'});
 assert.equal(registro.status,200);const raw=registro.headers.get('set-cookie');assert.match(raw,/HttpOnly/i);assert.match(raw,/SameSite=Lax/i);cookie=raw.split(';')[0];assert.equal('token' in await registro.json(),false);
 const cuenta=await fetch(base+'/cuenta',{headers:{Cookie:cookie}});assert.match(await cuenta.text(),/Cliente Astro QA/);assert.equal(cuenta.headers.get('cache-control'),'no-store');
 const request={clave:randomUUID(),lineas:[{productoId:id,cantidad:1,precio:1}],total:1,clienteId:randomUUID()};
 const a=await post('pedido',request);assert.equal(a.status,200);const pedido=await a.json();assert.equal((await(await post('pedido',request)).json()).id,pedido.id);
 for(let i=0;i<2;i++){const r=await fetch(base+pedido.destino,{headers:{Cookie:cookie}});assert.equal(r.status,200);const html=await r.text();assert.match(html,/CONSTANCIA DE PEDIDO/);assert.match(html,/720[.,]00/);assert.match(html,/RECOJO EN TIENDA/);}
 const primeraCookie=cookie;cookie='';const otro=await post('registro',{nombres:'Otro',apellidos:'Cliente',email:`astro-${randomUUID()}@local.test`,password:'Cliente123!',telefono:'999999999'});cookie=otro.headers.get('set-cookie').split(';')[0];assert.equal((await fetch(base+pedido.destino,{headers:{Cookie:cookie}})).status,404);
 cookie=primeraCookie;assert.equal((await post('logout',{})).status,200);cookie='';const login=await post('login',{email,password:'Cliente123!'});assert.equal(login.status,200);
});
