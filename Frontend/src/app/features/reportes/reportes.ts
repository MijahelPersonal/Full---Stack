import { Component,inject,signal } from '@angular/core';import { CommonModule } from '@angular/common';import { RouterLink } from '@angular/router';
import { ComercioService } from '../../core/services/comercio.service';import { InicioResumen,Movimiento } from '../../core/models/comercio.model';
@Component({selector:'app-reportes',imports:[CommonModule,RouterLink],template:`
<div class="page-heading"><div><span class="eyebrow">CONSULTAS OPERATIVAS</span><h1>Reportes</h1><p>Resumen básico de ventas, reposición y movimientos recientes.</p></div></div>
@if(error()){<p class="error-msg">{{error()}}</p>}
@if(datos();as d){<div class="metrics"><div><span>Ventas de hoy</span><strong>{{d.ventasHoy}}</strong></div><div><span>Total de hoy</span><strong>{{d.totalHoy|currency:'PEN':'S/ '}}</strong></div><div><span>Productos activos</span><strong>{{d.productos}}</strong></div><div><span>Stock bajo actual</span><strong>{{d.stockBajo}}</strong></div></div>}
<section class="surface"><header><h2>Movimientos recientes</h2><a routerLink="/inventario">Ver inventario →</a></header><div class="table-wrap"><table><thead><tr><th>Fecha</th><th>Producto</th><th>Tipo</th><th>Cantidad</th><th>Responsable</th></tr></thead><tbody>@for(m of movimientos();track m.id){<tr><td>{{m.fecha|date:'dd/MM/yyyy HH:mm'}}</td><td>{{m.productoNombre}}</td><td>{{m.tipo}}</td><td>{{m.cantidad}}</td><td>{{m.responsable}}</td></tr>}@empty{<tr><td colspan="5" class="empty">Sin movimientos registrados.</td></tr>}</tbody></table></div></section>
`})
export class Reportes {
 private api=inject(ComercioService);datos=signal<InicioResumen|null>(null);movimientos=signal<Movimiento[]>([]);error=signal('');
 constructor(){this.api.inicio().subscribe({next:d=>this.datos.set(d),error:()=>this.error.set('No se pudo cargar el resumen')});this.api.movimientos().subscribe({next:d=>this.movimientos.set(d.slice(0,20)),error:()=>this.error.set('No se pudieron cargar los movimientos')});}
}
