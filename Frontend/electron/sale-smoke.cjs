(async () => {
 const pause=()=>new Promise(r=>setTimeout(r,100));
 const wait=async test=>{for(let i=0;i<100;i++){if(test())return;await pause();}throw new Error('Tiempo agotado en flujo de venta');};
 const config=await window.gestionDesktop.getConfig();
 const headers={Authorization:'Bearer '+localStorage.getItem('token')};
 const read=async path=>{const r=await fetch(config.apiUrl+path,{headers});if(!r.ok)throw new Error('API '+path+' '+r.status);return r.json();};
 const antes=await read('/productos');
 const rtx=antes.find(p=>p.sku==='VALIDACION-RTX'),mouse=antes.find(p=>p.sku==='VALIDACION-MOUSE');
 if(!rtx||!mouse||rtx.stock<1||mouse.stock<2)throw new Error('Faltan productos de prueba');
 document.querySelector('a[href="/nueva-venta"]').click();
 await wait(()=>document.querySelectorAll('.product-card').length>0);
 for(const nombre of ['RTX 4060 · Validación','Mouse Logitech G203 · Validación','Mouse Logitech G203 · Validación']){
   const card=[...document.querySelectorAll('.product-card')].find(c=>c.textContent.includes(nombre));
   if(!card)throw new Error('Producto no renderizado');
   card.querySelector('button').click();await pause();
 }
 const select=document.querySelector('select[aria-label="Cliente de venta"]');
 await wait(()=>select.options.length>1);
 select.value=select.options[1].value;select.dispatchEvent(new Event('change',{bubbles:true}));await pause();
 const button=document.querySelector('.finalize');if(button.disabled)throw new Error('Finalizar venta está deshabilitado');
 button.click();await wait(()=>document.querySelector('.success'));
 const despues=await read('/productos');const historial=await read('/ventas');const ultima=historial[0];
 const detalle=await read('/ventas/'+ultima.id);const movimientos=await read('/inventario/movimientos');
 if(ultima.total!==1677||detalle.detalles.length!==2)throw new Error('Total o detalles incorrectos');
 if(despues.find(p=>p.id===rtx.id).stock!==rtx.stock-1||despues.find(p=>p.id===mouse.id).stock!==mouse.stock-2)throw new Error('Stock incorrecto');
 if(movimientos.filter(m=>m.ventaId===ultima.id&&m.tipo==='SALIDA').length!==2)throw new Error('Movimientos no registrados');
 for(const [route,selector] of [['/productos','app-productos'],['/inventario','app-inventario'],['/clientes','app-clientes-comerciales'],['/ventas','app-ventas'],['/reportes','app-reportes'],['/inicio','app-inicio']]){
   document.querySelector('a[href="'+route+'"]').click();await wait(()=>location.pathname===route&&document.querySelector(selector));
   await new Promise(r=>setTimeout(r,400));
   if(document.querySelector('.error-msg'))throw new Error('Error en '+route);
 }
 document.querySelector('a[href="/nueva-venta"]').click();await wait(()=>location.pathname==='/nueva-venta'&&document.querySelectorAll('.product-card').length>0);
 await new Promise(r=>setTimeout(r,500));
 return {ventaId:ultima.id,total:ultima.total,detalles:detalle.detalles.length,stockValidado:true,movimientosValidado:true,navegacionValidada:true};
})()
