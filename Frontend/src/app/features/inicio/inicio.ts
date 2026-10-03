import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ComercioService } from '../../core/services/comercio.service';
import { InicioResumen, Pedido } from '../../core/models/comercio.model';
@Component({selector:'app-inicio',imports:[CommonModule,RouterLink],templateUrl:'./inicio.html'})
export class Inicio {
 private api=inject(ComercioService);
 pedidos=signal<Pedido[]>([]); datos=signal<InicioResumen|null>(null); error=signal(''); cargando=signal(true);
 pendientes(){return this.pedidos().filter(p=>p.estado==='PENDIENTE').length;}
 listos(){return this.pedidos().filter(p=>p.estado==='LISTO_PARA_RECOGER').length;}
 atender(){return this.pedidos().filter(p=>!['ENTREGADO','CANCELADO'].includes(p.estado)).slice(0,8);}
 constructor(){this.api.pedidos().subscribe({next:d=>this.pedidos.set(d),error:()=>this.error.set("No se pudieron cargar los pedidos web")});this.api.inicio().subscribe({next:d=>{this.datos.set(d);this.cargando.set(false);},error:e=>{this.error.set(e.error?.error||'No se pudo cargar el resumen');this.cargando.set(false);}});}
}
