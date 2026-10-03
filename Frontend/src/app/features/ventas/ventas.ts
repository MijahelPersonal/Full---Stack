import { Component,inject,signal,computed } from '@angular/core';import { CommonModule } from '@angular/common';import { FormsModule } from '@angular/forms';
import { ComercioService } from '../../core/services/comercio.service';import { Venta,VentaDetalle } from '../../core/models/comercio.model';
@Component({selector:'app-ventas',imports:[CommonModule,FormsModule],templateUrl:'./ventas.html'})
export class Ventas {
 private api=inject(ComercioService);items=signal<Venta[]>([]);busqueda=signal('');desde=signal('');hasta=signal('');error=signal('');seleccion=signal<VentaDetalle|null>(null);
 filtrados=computed(()=>this.items().filter(v=>(v.numero+' '+v.clienteNombre+' '+v.vendedorNombre).toLowerCase().includes(this.busqueda().toLowerCase())&&(!this.desde()||v.fecha.slice(0,10)>=this.desde())&&(!this.hasta()||v.fecha.slice(0,10)<=this.hasta())));
 constructor(){this.api.ventas().subscribe({next:d=>this.items.set(d),error:e=>this.error.set(e.error?.error||'Error al cargar ventas')});}
 abrir(v:Venta){this.api.detalle(v.id).subscribe({next:d=>this.seleccion.set(d),error:e=>this.error.set(e.error?.error||'Error al cargar detalle')});}
}
