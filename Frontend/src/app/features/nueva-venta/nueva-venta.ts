import { Component,inject,signal,computed } from '@angular/core';import { CommonModule } from '@angular/common';import { FormsModule } from '@angular/forms';import { RouterLink } from '@angular/router';
import { ComercioService } from '../../core/services/comercio.service';import { Producto,ClienteComercial,Venta } from '../../core/models/comercio.model';
import { ProductoImagen } from '../../shared/producto-imagen';
@Component({selector:'app-nueva-venta',imports:[CommonModule,FormsModule,RouterLink,ProductoImagen],templateUrl:'./nueva-venta.html',styleUrl:'./nueva-venta.scss'})
export class NuevaVenta {
 api=inject(ComercioService);productos=signal<Producto[]>([]);clientes=signal<ClienteComercial[]>([]);carrito=signal<{producto:Producto;cantidad:number}[]>([]);
 busqueda=signal('');categoria=signal('');error=signal('');enviando=signal(false);resultado=signal<Venta|null>(null);clienteId='';clave=crypto.randomUUID();
 categorias=computed(()=>[...new Set(this.productos().filter(p=>p.activo).map(p=>p.categoria))].sort());
 filtrados=computed(()=>this.productos().filter(p=>p.activo&&(!this.categoria()||p.categoria===this.categoria())&&(p.nombre+' '+p.sku+' '+p.marca).toLowerCase().includes(this.busqueda().toLowerCase())));
 total=computed(()=>this.carrito().reduce((s,l)=>s+Math.round(l.producto.precioVenta*100)*l.cantidad,0)/100);
 constructor(){this.cargar();this.api.clientes().subscribe({next:d=>this.clientes.set(d.filter(c=>c.activo)),error:e=>this.error.set(e.error?.error||'Error al cargar clientes')});}
 cargar(){this.api.productos().subscribe({next:d=>this.productos.set(d),error:e=>this.error.set(e.error?.error||'Error al cargar productos')});}
 agregar(p:Producto){if(this.enviando())return;const actual=this.carrito().find(l=>l.producto.id===p.id);this.cantidad(p,(actual?.cantidad||0)+1);}
 cantidad(p:Producto,n:number){if(this.enviando())return;if(!Number.isInteger(n)||n<1||n>p.stock){this.error.set('Cantidad inválida o superior al stock disponible');return;}this.error.set('');this.carrito.update(ls=>ls.some(l=>l.producto.id===p.id)?ls.map(l=>l.producto.id===p.id?{...l,cantidad:n}:l):[...ls,{producto:p,cantidad:n}]);}
 quitar(id:string){if(!this.enviando())this.carrito.update(ls=>ls.filter(l=>l.producto.id!==id));}
 finalizar(){if(this.enviando()||!this.clienteId||!this.carrito().length)return;this.enviando.set(true);this.error.set('');
 this.api.vender({clave:this.clave,clienteId:this.clienteId,lineas:this.carrito().map(l=>({productoId:l.producto.id,cantidad:l.cantidad}))}).subscribe({
 next:d=>{this.resultado.set(d.venta);this.carrito.set([]);this.clave=crypto.randomUUID();this.enviando.set(false);this.cargar();},
 error:e=>{this.error.set(e.error?.error||'No se pudo confirmar la venta. Puedes reintentar sin duplicarla.');this.enviando.set(false);this.cargar();}
 });}
}
