import { Component, inject, signal, computed } from '@angular/core';import { CommonModule } from '@angular/common';import { FormsModule } from '@angular/forms';
import { ComercioService } from '../../core/services/comercio.service';import { Producto,Movimiento } from '../../core/models/comercio.model';
@Component({selector:'app-inventario',imports:[CommonModule,FormsModule],templateUrl:'./inventario.html'})
export class Inventario {
 api=inject(ComercioService);productos=signal<Producto[]>([]);movimientos=signal<Movimiento[]>([]);error=signal('');busqueda=signal('');soloBajo=signal(false);seleccion=signal<Producto|null>(null);guardando=signal(false);
 tipo='ENTRADA';cantidad=1;motivo='';
 filtrados=computed(()=>this.productos().filter(p=>(p.nombre+' '+p.sku).toLowerCase().includes(this.busqueda().toLowerCase())&&(!this.soloBajo()||p.stock<=p.stockMinimo)));
 historial=computed(()=>this.movimientos().filter(m=>m.productoId===this.seleccion()?.id));
 constructor(){this.cargar();}
 cargar(){this.api.productos().subscribe({next:d=>this.productos.set(d),error:e=>this.error.set(e.error?.error||'Error al cargar inventario')});this.api.movimientos().subscribe({next:d=>this.movimientos.set(d),error:e=>this.error.set(e.error?.error||'Error al cargar movimientos')});}
 abrir(p:Producto){this.seleccion.set(p);this.error.set('');this.cantidad=1;this.motivo='';}
 guardar(){this.guardando.set(true);this.api.mover({productoId:this.seleccion()!.id,tipo:this.tipo,cantidad:this.cantidad,motivo:this.motivo}).subscribe({next:p=>{this.seleccion.set(p);this.guardando.set(false);this.motivo='';this.cargar();},error:e=>{this.error.set(e.error?.error||'No se pudo registrar el movimiento');this.guardando.set(false);}});}
}
