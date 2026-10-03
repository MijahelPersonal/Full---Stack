import type { AstroCookies } from 'astro';
import { origen } from './catalogo';
export interface Cuenta {id:string;nombre:string;email:string;telefono:string;documento:string|null;}
export interface Pedido {id:string;numeroPedido:string;codigoRecojo:string;clienteNombre:string;estado:string;total:number;fechaCreacion:string;modalidad:string;ventaId:string|null;detalles:{productoId:string;nombreHistorico:string;skuHistorico:string;cantidad:number;precioUnitario:number;subtotal:number}[];}
export const cookieSesion='struch_sesion';
export class CuentaError extends Error {constructor(public status:number,mensaje:string){super(mensaje);}}
export async function tienda<T>(ruta:string,cookies:AstroCookies,body?:unknown):Promise<T>{
 const token=cookies.get(cookieSesion)?.value;
 let respuesta:Response;try{respuesta=await fetch(`${origen()}/api/tienda/${ruta}`,{method:body===undefined?'GET':'POST',headers:{Accept:'application/json',...(body===undefined?{}:{'Content-Type':'application/json'}),...(token?{Authorization:`Bearer ${token}`}:{})},body:body===undefined?undefined:JSON.stringify(body),cache:'no-store',signal:AbortSignal.timeout(10000)});}catch{throw new CuentaError(503,'No pudimos conectar con la tienda. Intenta nuevamente.');}
 if(!respuesta.ok){const data=await respuesta.json().catch(()=>null);if(respuesta.status===401)cookies.delete(cookieSesion,{path:'/'});throw new CuentaError(respuesta.status,data?.error||'No se pudo completar la solicitud');}return respuesta.json() as Promise<T>;
}
export function destinoSeguro(valor:unknown){return valor==='/finalizar-compra'?'/finalizar-compra':'/cuenta?seccion=pedidos';}
export async function sesion(cookies:AstroCookies):Promise<Cuenta|null>{if(!cookies.has(cookieSesion))return null;try{return await tienda<Cuenta>('cuenta',cookies);}catch(e){if(e instanceof CuentaError&&e.status===401)return null;throw e;}}
export function etiqueta(estado:string){return estado.replaceAll('_',' ');}
