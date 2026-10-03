(async()=>{
 const pause=()=>new Promise(r=>setTimeout(r,100));
 const wait=async(test,label)=>{for(let i=0;i<120;i++){if(await test())return;await pause();}throw new Error('Tiempo agotado: '+label);};
 const config=await window.gestionDesktop.getConfig();
 if(new URL(config.apiUrl).port!=='8081')throw new Error('Estas pruebas requieren el backend aislado en 8081');
 const auth={Authorization:'Bearer '+localStorage.getItem('token')};
 const request=async(path,method='GET',body,headers=auth)=>{
  const multipart=body instanceof FormData;
  const response=await fetch(config.apiUrl+path,{method,headers:{...headers,...(body&&!multipart?{'Content-Type':'application/json'}:{})},body:body?(multipart?body:JSON.stringify(body)):undefined});
  if(!response.ok)throw new Error('API '+method+' '+path+': '+response.status+' '+await response.text());return response.json();
 };
 const navigate=async(route,selector)=>{document.querySelector('a[href="'+route+'"]').click();await wait(()=>document.querySelector(selector),'navegar '+route);await pause();};
 const input=(name,value)=>{const el=document.querySelector('.drawer input[name="'+name+'"]');if(!el)throw new Error('Falta campo '+name);el.value=value;el.dispatchEvent(new Event('input',{bubbles:true}));};
 const blob=async(type,color)=>{const canvas=document.createElement('canvas');canvas.width=160;canvas.height=100;const ctx=canvas.getContext('2d');ctx.fillStyle=color;ctx.fillRect(0,0,160,100);ctx.fillStyle='#fff';ctx.font='22px sans-serif';ctx.fillText('Producto',24,55);return new Promise(r=>canvas.toBlob(r,type));};
 const selectImage=async(type,extension,color)=>{const file=new File([await blob(type,color)],'producto.'+extension,{type});const dt=new DataTransfer();dt.items.add(file);const el=document.querySelector('.drawer input[type="file"]');el.files=dt.files;el.dispatchEvent(new Event('change',{bubbles:true}));await wait(()=>{const img=document.querySelector('.product-preview img');return img&&img.complete&&img.naturalWidth===160;},'vista previa');};
 const save=async()=>{document.querySelector('.drawer form').dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));await wait(()=>!document.querySelector('.drawer'),'guardar producto');await pause();};
 const sku='MEDIA-'+crypto.randomUUID();
 await navigate('/productos','app-productos');
 [...document.querySelectorAll('button')].find(b=>b.textContent.includes('Nuevo producto')).click();await pause();
 for(const [name,value] of Object.entries({sku,nombre:'Producto imagen validación '+sku.slice(-8),categoria:'Periféricos',marca:'Prueba',compra:'20',venta:'49',stock:'6',minimo:'1'}))input(name,value);
 await selectImage('image/png','png','#2868d9');await save();
 let producto=(await request('/productos')).find(p=>p.sku===sku);if(!producto?.imagenUrl)throw new Error('Ruta de imagen no guardada');
 const initialUrl=producto.imagenUrl;
 const imageResponse=await fetch(new URL(initialUrl,config.apiUrl));if(imageResponse.status!==200||imageResponse.headers.get('content-type')!=='image/png')throw new Error('Imagen pública PNG no accesible');
 const row=()=>[...document.querySelectorAll('tbody tr')].find(r=>r.textContent.includes(sku));
 await wait(()=>row()?.querySelector('img')?.naturalWidth===160,'miniatura');
 row().querySelector('button').click();await pause();await selectImage('image/webp','webp','#148768');await save();
 producto=(await request('/productos')).find(p=>p.sku===sku);
 if(producto.imagenUrl===initialUrl||!producto.imagenUrl.endsWith('.webp'))throw new Error('No se reemplazó la imagen');
 if((await fetch(new URL(initialUrl,config.apiUrl))).status!==404)throw new Error('Archivo anterior conservado');
 const webpUrl=producto.imagenUrl;
 await wait(()=>row()?.querySelector('img')?.naturalWidth===160,'miniatura WEBP');
 row().querySelector('button').click();await pause();[...document.querySelectorAll('.drawer button')].find(b=>b.textContent==='Eliminar imagen').click();await save();
 producto=(await request('/productos')).find(p=>p.sku===sku);
 if(producto.imagenUrl||(await fetch(new URL(webpUrl,config.apiUrl))).status!==404)throw new Error('No se eliminó la imagen');
 await wait(()=>row()?.querySelector('.placeholder'),'placeholder después de quitar imagen');
 row().querySelector('button').click();await pause();await selectImage('image/jpeg','jpeg','#8b59b5');await save();
 producto=(await request('/productos')).find(p=>p.sku===sku);
 const sinImagen=await request('/productos','POST',{sku:sku+'-SIN',nombre:'Producto sin imagen validación '+sku.slice(-8),categoria:'Periféricos',marca:'Prueba',precioCompra:5,precioVenta:10,stockInicial:2,stockMinimo:1,activo:true});
 await navigate('/nueva-venta','app-nueva-venta');
 await wait(()=>[...document.querySelectorAll('.product-card')].find(c=>c.textContent.includes(producto.nombre))?.querySelector('img')?.naturalWidth===160,'imagen JPEG en POS');
 if(![...document.querySelectorAll('.product-card')].find(c=>c.textContent.includes(sinImagen.nombre))?.querySelector('.placeholder'))throw new Error('Placeholder POS ausente');
 const invalid=new FormData();invalid.append('producto',new Blob([JSON.stringify({...producto,stockInicial:0})],{type:'application/json'}));invalid.append('imagen',new File(['falso'],'falso.png',{type:'image/png'}));
 const rechazo=await fetch(config.apiUrl+'/productos/'+producto.id,{method:'PUT',headers:auth,body:invalid});if(rechazo.status!==400)throw new Error('Archivo falso no rechazado');
 if((await request('/productos')).find(p=>p.id===producto.id).imagenUrl!==producto.imagenUrl)throw new Error('Archivo inválido alteró la imagen');
 const grande=new FormData();grande.append('producto',new Blob([JSON.stringify({...producto,stockInicial:0})],{type:'application/json'}));grande.append('imagen',new File([new Uint8Array(2*1024*1024+1)],'grande.png',{type:'image/png'}));
 const limite=await fetch(config.apiUrl+'/productos/'+producto.id,{method:'PUT',headers:auth,body:grande});if(limite.status!==413)throw new Error('Límite de tamaño no aplicado: '+limite.status);
 const libre=await request('/clientes','POST',{nombre:'Sin ventas '+sku,activo:true});
 const vendido=await request('/clientes','POST',{nombre:'Con ventas '+sku,activo:true});
 const antes=await request('/ventas');
 // Una venta por la interfaz completa prueba stock, detalle y movimiento con imagen.
 await navigate('/inicio','app-inicio');await navigate('/nueva-venta','app-nueva-venta');
 await wait(()=>[...document.querySelectorAll('select[aria-label="Cliente de venta"] option')].some(o=>o.value===vendido.id),'cliente venta');
 const card=[...document.querySelectorAll('.product-card')].find(c=>c.textContent.includes(producto.nombre));card.querySelector('button').click();await pause();
 const clienteSelect=document.querySelector('select[aria-label="Cliente de venta"]');clienteSelect.value=vendido.id;clienteSelect.dispatchEvent(new Event('change',{bubbles:true}));await pause();document.querySelector('.finalize').click();await wait(()=>document.querySelector('.success'),'venta completa');
 const historial=await request('/ventas');const venta=historial.find(v=>v.clienteId===vendido.id);if(historial.length!==antes.length+1||venta.total!==49)throw new Error('Venta incorrecta');
 const detalleAntes=await request('/ventas/'+venta.id);const movimientosAntes=await request('/inventario/movimientos');
 if(detalleAntes.detalles.length!==1||(await request('/productos')).find(p=>p.id===producto.id).stock!==5||movimientosAntes.filter(m=>m.ventaId===venta.id).length!==1)throw new Error('Detalle, stock o movimiento incorrecto');
 await navigate('/clientes','app-clientes-comerciales');
 const eliminarUI=async cliente=>{await wait(()=>[...document.querySelectorAll('tbody tr')].some(r=>r.textContent.includes(cliente.nombre)),'cliente en tabla');const fila=[...document.querySelectorAll('tbody tr')].find(r=>r.textContent.includes(cliente.nombre));[...fila.querySelectorAll('button')].find(b=>b.textContent==='Eliminar').click();await wait(()=>document.querySelector('[role="alertdialog"]'),'confirmación');if(!document.querySelector('[role="alertdialog"]').textContent.includes('¿Seguro que deseas eliminar este cliente?'))throw new Error('Confirmación ausente');[...document.querySelectorAll('[role="alertdialog"] button')].find(b=>b.textContent==='Eliminar cliente').click();await wait(()=>!document.querySelector('[role="alertdialog"]'),'eliminar cliente');await pause();};
 await eliminarUI(libre);if((await request('/clientes?incluirInactivos=true')).some(c=>c.id===libre.id))throw new Error('Cliente sin ventas no eliminado');
 await eliminarUI(vendido);
 const todos=await request('/clientes?incluirInactivos=true');if(todos.find(c=>c.id===vendido.id)?.activo!==false)throw new Error('Cliente con ventas no inactivado');
 if((await request('/clientes')).some(c=>c.id===vendido.id))throw new Error('Cliente inactivo aparece en lista normal');
 const filtro=document.querySelector('select[aria-label="Estado de clientes"]');filtro.value='inactivos';filtro.dispatchEvent(new Event('change',{bubbles:true}));await wait(()=>[...document.querySelectorAll('tbody tr')].some(r=>r.textContent.includes(vendido.nombre)),'filtro inactivos');
 const detalleDespues=await request('/ventas/'+venta.id);if(JSON.stringify(detalleAntes)!==JSON.stringify(detalleDespues)||(await request('/ventas')).length!==historial.length||(await request('/inventario/movimientos')).length!==movimientosAntes.length)throw new Error('Historial alterado');
 const vendedor=await request('/auth/register','POST',{nombre:'Vendedor prueba',username:sku.toLowerCase(),email:sku.toLowerCase()+'@local.test',password:'123456',rol:'VENDEDOR'});
 const supervisor=await request('/auth/register','POST',{nombre:'Supervisor prueba',username:sku.toLowerCase()+'-sup',email:sku.toLowerCase()+'-sup@local.test',password:'123456',rol:'SUPERVISOR'});
 for(const cuenta of [vendedor,supervisor]){
  const rolHeaders={Authorization:'Bearer '+cuenta.token,'Content-Type':'application/json'};
  for(const [method,path,body] of [['DELETE','/clientes/'+vendido.id,null],['GET','/clientes?incluirInactivos=true',null],['PUT','/clientes/'+vendido.id,{...vendido,activo:true}]]){
    const r=await fetch(config.apiUrl+path,{method,headers:rolHeaders,body:body?JSON.stringify(body):undefined});if(r.status!==403)throw new Error('Permiso insuficiente no rechazado: '+method+' '+r.status);
  }
 }
 const clienteActivo=(await request('/clientes'))[0];
 await navigate('/nueva-venta','app-nueva-venta');await wait(()=>document.querySelector('select[aria-label="Cliente de venta"] option[value="'+clienteActivo.id+'"]'),'clientes cargados en POS');
 if(document.querySelector('select[aria-label="Cliente de venta"] option[value="'+vendido.id+'"]'))throw new Error('POS ofrece cliente inactivo');
 await wait(()=>[...document.querySelectorAll('.product-card')].find(c=>c.textContent.includes(producto.nombre))?.querySelector('img')?.naturalWidth===160,'imagen final POS');
 return {imagenes:['PNG','WEBP','JPEG'],vistaPrevia:true,reemplazo:true,eliminacionImagen:true,placeholder:true,posImagen:true,rechazoInvalido:true,limite2MB:true,clienteEliminado:true,clienteInactivado:true,historialIntacto:true,permisosAdministrador:true,ventaTotal:venta.total,stock:5};
})()
