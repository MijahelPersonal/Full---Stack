import {Component,inject,signal} from '@angular/core';import {CommonModule} from '@angular/common';import {FormsModule} from '@angular/forms';import {ComercioService} from '../../core/services/comercio.service';import {Pedido,PedidoInterno} from '../../core/models/comercio.model';
@Component({selector:'app-pedidos-web',imports:[CommonModule,FormsModule],templateUrl:'./pedidos-web.html'})
export class PedidosWeb {
 api=inject(ComercioService);pedidos=signal<Pedido[]>([]);seleccion=signal<PedidoInterno|null>(null);error=signal('');ocupado=signal(false);estado='';codigo='';estados=['PENDIENTE','CONFIRMADO','LISTO_PARA_RECOGER','ENTREGADO','CANCELADO'];
 constructor(){this.cargar();}cargar(){this.api.pedidos(this.estado).subscribe({next:d=>this.pedidos.set(d),error:e=>this.error.set(e.error?.error||'No se pudieron cargar los pedidos')});}
 abrir(id:string){this.error.set('');this.api.pedido(id).subscribe({next:d=>this.seleccion.set(d),error:e=>this.error.set(e.error?.error||'Pedido no encontrado')});}
 buscar(){if(!this.codigo.trim())return;this.error.set('');this.api.codigo(this.codigo).subscribe({next:d=>this.seleccion.set(d),error:e=>this.error.set(e.error?.error||'Código no encontrado')});}
 accion(tipo:string){const d=this.seleccion();if(!d||this.ocupado())return;if(tipo==='cancelar'&&!confirm('¿Cancelar este pedido y liberar su reserva?'))return;this.ocupado.set(true);this.error.set('');this.api.accionPedido(d.pedido.id,tipo).subscribe({next:()=>{this.ocupado.set(false);this.abrir(d.pedido.id);this.cargar();},error:e=>{this.ocupado.set(false);this.error.set(e.error?.error||'No se pudo actualizar el pedido');this.abrirSinLimpiar(d.pedido.id);}});}
 abrirSinLimpiar(id:string){this.api.pedido(id).subscribe({next:d=>this.seleccion.set(d)});}
 etiqueta(e:string){return e.replaceAll('_',' ');}
}
