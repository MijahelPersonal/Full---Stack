import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';
import { RuntimeConfigService } from './runtime-config.service';
import { Producto, ClienteComercial, Venta, VentaDetalle, Movimiento, InicioResumen } from '../models/comercio.model';
@Injectable({providedIn:'root'})
export class ComercioService {
 private api=inject(ApiService);
 private auth=inject(AuthService);
 private config=inject(RuntimeConfigService);
 get esAdministrador(){return this.auth.obtenerRol()==='ADMINISTRADOR';}
 imagen(url?:string|null){return url?new URL(url,this.config.apiUrl).href:'';}
 get administra(){return ['ADMINISTRADOR','SUPERVISOR'].includes(this.auth.obtenerRol() || '');}
 productos(){return this.api.get<Producto[]>('/productos');}
 guardarProducto(id:string|null,datos:unknown,imagen?:File,eliminarImagen=false){
  let cuerpo:unknown=datos;
  if(imagen||eliminarImagen){const multipart=new FormData();multipart.append('producto',new Blob([JSON.stringify(datos)],{type:'application/json'}));if(imagen)multipart.append('imagen',imagen);cuerpo=multipart;}
  return id?this.api.put<Producto>('/productos/'+id,cuerpo,eliminarImagen?{eliminarImagen:true}:undefined):this.api.post<Producto>('/productos',cuerpo);
 }
 clientes(incluirInactivos=false){return this.api.get<ClienteComercial[]>('/clientes',incluirInactivos?{incluirInactivos:true}:undefined);}
 eliminarCliente(id:string){return this.api.delete<{eliminado:boolean;mensaje:string}>('/clientes/'+id);}
 guardarCliente(id:string|null,datos:unknown){return id?this.api.put<ClienteComercial>('/clientes/'+id,datos):this.api.post<ClienteComercial>('/clientes',datos);}
 movimientos(){return this.api.get<Movimiento[]>('/inventario/movimientos');}
 mover(datos:unknown){return this.api.post<Producto>('/inventario/movimientos',datos);}
 ventas(){return this.api.get<Venta[]>('/ventas');}
 detalle(id:string){return this.api.get<VentaDetalle>('/ventas/'+id);}
 vender(datos:unknown){return this.api.post<VentaDetalle>('/ventas',datos);}
 inicio(){return this.api.get<InicioResumen>('/inicio/resumen');}
}
