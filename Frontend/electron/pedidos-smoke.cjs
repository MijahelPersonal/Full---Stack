(async()=>{
 const config=await window.gestionDesktop.getConfig();
 const headers={Authorization:'Bearer '+localStorage.getItem('token')};
 const datos=await fetch(config.apiUrl+'/pedidos-web',{headers}).then(r=>{if(!r.ok)throw new Error('Pedidos inaccesibles');return r.json();});
 document.querySelector('a[href="/pedidos-web"]').click();
 for(let i=0;i<100&&(!document.querySelector('app-pedidos-web')||!document.querySelector('app-pedidos-web tbody')?.textContent?.includes(datos[0]?.codigoRecojo));i++)await new Promise(r=>setTimeout(r,100));
 if(!document.querySelector('app-pedidos-web'))throw new Error('Módulo Pedidos web no renderizado');
 if(datos.length&&!document.querySelector('app-pedidos-web tbody').textContent.includes(datos[0].codigoRecojo))throw new Error('Pedido real no visible');
 document.querySelector('a[href="/reportes"]').click();
 for(let i=0;i<100&&!document.querySelector('app-reportes table');i++)await new Promise(r=>setTimeout(r,100));
 if(!document.querySelector('app-reportes table')?.textContent?.includes('WEB'))throw new Error('Reporte por origen no visible');
 const reporte=await fetch(config.apiUrl+'/reportes/resumen?periodo=HOY',{headers}).then(r=>r.json());
 document.querySelector('a[href="/nueva-venta"]').click();
 for(let i=0;i<100&&!document.querySelector('app-nueva-venta select');i++)await new Promise(r=>setTimeout(r,100));
 const publicoGeneral=document.querySelector('app-nueva-venta option')?.textContent?.includes('Público general');
 if(!publicoGeneral)throw new Error('POS sin público general');
 return {pedidosRenderizados:true,pedidos:datos.length,reportesRenderizados:true,ventasWeb:reporte.ventasWeb,publicoGeneral};
})()
