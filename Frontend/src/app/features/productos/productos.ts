import { Component, inject, signal, computed, OnDestroy } from '@angular/core';
import { ProductoImagen } from '../../shared/producto-imagen';
import { CommonModule } from '@angular/common';import { FormsModule } from '@angular/forms';
import { ComercioService } from '../../core/services/comercio.service';import { Producto } from '../../core/models/comercio.model';
const nuevo=()=>({sku:'',nombre:'',categoria:'',marca:'',precioCompra:0,precioVenta:0,stockInicial:0,stockMinimo:1,activo:true,web:{descripcion:'',especificaciones:{} as Record<string,string>,destacado:false,precioAnterior:null as number|null}});
@Component({selector:'app-productos',imports:[CommonModule,FormsModule,ProductoImagen],templateUrl:'./productos.html'})
export class Productos implements OnDestroy {
 especificacionesTexto='';imagen?:File;vistaPrevia='';eliminarImagen=false;private objetoUrl='';
 private liberar(){if(this.objetoUrl)URL.revokeObjectURL(this.objetoUrl);this.objetoUrl='';}
 ngOnDestroy(){this.liberar();}
 cerrar(){this.abierto=false;this.liberar();}
 seleccionarImagen(event:Event){
  const input=event.target as HTMLInputElement;const archivo=input.files?.[0];if(!archivo)return;
  if(!/\.(jpe?g|png|webp)$/i.test(archivo.name)||!['image/jpeg','image/png','image/webp'].includes(archivo.type)||archivo.size>2*1024*1024||!archivo.size){this.error.set('Selecciona una imagen JPG, PNG o WEBP de hasta 2 MB.');input.value='';return;}
  this.liberar();this.imagen=archivo;this.eliminarImagen=false;this.objetoUrl=URL.createObjectURL(archivo);this.vistaPrevia=this.objetoUrl;this.error.set('');
 }
 quitarImagen(input:HTMLInputElement){this.liberar();this.imagen=undefined;this.vistaPrevia='';this.eliminarImagen=true;input.value='';}
 api=inject(ComercioService);items=signal<Producto[]>([]);error=signal('');cargando=signal(true);guardando=signal(false);busqueda=signal('');abierto=false;id:string|null=null;form=nuevo();
 filtrados=computed(()=>this.items().filter(p=>(p.nombre+' '+p.sku+' '+p.marca+' '+p.categoria).toLowerCase().includes(this.busqueda().toLowerCase())));
 constructor(){this.cargar();}
 cargar(){this.api.productos().subscribe({next:d=>{this.items.set(d);this.cargando.set(false);},error:e=>{this.error.set(e.error?.error||'Error al cargar productos');this.cargando.set(false);}});}
 editar(p?:Producto){this.liberar();this.imagen=undefined;this.eliminarImagen=false;this.vistaPrevia=this.api.imagen(p?.imagenUrl);this.error.set('');this.id=p?.id||null;this.form=p?{...p,stockInicial:0,web:{descripcion:p.descripcion||'',especificaciones:p.especificaciones||{},destacado:p.destacado||false,precioAnterior:p.precioAnterior||null}}:nuevo();this.especificacionesTexto=Object.entries(this.form.web.especificaciones).map(([k,v])=>k+': '+v).join('\n');this.abierto=true;}
 guardar(){const specs:Record<string,string>={};const lines=this.especificacionesTexto.split('\n').filter(l=>l.trim());if(lines.length>40){this.error.set('Máximo 40 especificaciones.');return;}for(const line of lines){const i=line.indexOf(':');const k=line.slice(0,i).trim(),v=line.slice(i+1).trim();if(i<1||!k||!v||k.length>80||v.length>300||Object.hasOwn(specs,k)){this.error.set('Usa una especificación por línea: Característica: valor, sin nombres repetidos.');return;}Object.defineProperty(specs,k,{value:v,enumerable:true});}this.form.web.especificaciones=specs;this.guardando.set(true);this.api.guardarProducto(this.id,this.form,this.imagen,this.eliminarImagen).subscribe({next:()=>{this.cerrar();this.guardando.set(false);this.cargar();},error:e=>{this.error.set(e.error?.error||'Revisa los datos del producto');this.guardando.set(false);}});}
}
