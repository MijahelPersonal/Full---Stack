import type { APIRoute } from 'astro';
import { tienda,cookieSesion,CuentaError,destinoSeguro } from '../../../lib/cuenta';
export const POST:APIRoute=async({request,url,cookies,params})=>{
 const headers={'Cache-Control':'no-store'};
 if(request.headers.get('origin')!==url.origin)return Response.json({error:'Origen no permitido'},{status:403,headers});
 try{
  if(params.accion==='logout'){cookies.delete(cookieSesion,{path:'/'});return Response.json({destino:'/cuenta'},{headers});}
  const body=await request.json();
  if(params.accion==='pedido'){
   const pedido=await tienda<{id:string}>('pedidos',cookies,{clave:body.clave,lineas:Array.isArray(body.lineas)?body.lineas.map((l:{productoId:string;cantidad:number})=>({productoId:l.productoId,cantidad:l.cantidad})):[]});
   return Response.json({id:pedido.id,destino:`/pedidos/${pedido.id}`},{headers});
  }
  if(!['login','registro'].includes(params.accion||''))return new Response(null,{status:404,headers});
  const datos=params.accion==='registro'?{nombres:body.nombres,apellidos:body.apellidos,email:body.email,password:body.password,telefono:body.telefono,documento:body.documento||null}:{email:body.email,password:body.password};
  const respuesta=await tienda<{token:string}>(`auth/${params.accion}`,cookies,datos);
  cookies.set(cookieSesion,respuesta.token,{path:'/',httpOnly:true,secure:url.protocol==='https:',sameSite:'lax',maxAge:86400});
  return Response.json({destino:destinoSeguro(body.destino)},{headers});
 }catch(e){return Response.json({error:e instanceof CuentaError?e.message:'Solicitud inválida'},{status:e instanceof CuentaError?e.status:400,headers});}
};
