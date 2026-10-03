import { Component,inject,signal,computed } from '@angular/core';import { CommonModule } from '@angular/common';import { FormsModule } from '@angular/forms';
import { ComercioService } from '../../core/services/comercio.service';import { ClienteComercial } from '../../core/models/comercio.model';
const nuevo=()=>({nombre:'',documento:'',correo:'',telefono:'',direccion:'',activo:true});
@Component({selector:'app-clientes-comerciales',imports:[CommonModule,FormsModule],templateUrl:'./clientes-comerciales.html'})
export class ClientesComerciales {
 api=inject(ComercioService);items=signal<ClienteComercial[]>([]);busqueda=signal('');estado=signal('activos');error=signal('');mensaje=signal('');guardando=signal(false);eliminando=signal(false);porEliminar:ClienteComercial|null=null;abierto=false;id:string|null=null;form=nuevo();
 filtrados=computed(()=>this.items().filter(c=>(this.estado()==='todos'||c.activo===(this.estado()==='activos'))&&(c.nombre+' '+(c.documento||'')+' '+(c.telefono||'')).toLowerCase().includes(this.busqueda().toLowerCase())));
 constructor(){this.cargar();}
 cargar(){this.api.clientes(this.api.esAdministrador).subscribe({next:d=>this.items.set(d),error:e=>this.error.set(e.error?.error||'Error al cargar clientes')});}
 eliminar(){if(!this.porEliminar||this.eliminando())return;this.eliminando.set(true);this.error.set('');this.api.eliminarCliente(this.porEliminar.id).subscribe({next:r=>{this.mensaje.set(r.mensaje);this.porEliminar=null;this.eliminando.set(false);this.cargar();},error:e=>{this.error.set(e.error?.error||'No se pudo eliminar el cliente');this.eliminando.set(false);}});}
 editar(c?:ClienteComercial){this.id=c?.id||null;this.form=c?{...c}:nuevo();this.abierto=true;this.error.set('');}
 guardar(){this.guardando.set(true);this.api.guardarCliente(this.id,this.form).subscribe({next:()=>{this.abierto=false;this.guardando.set(false);this.cargar();},error:e=>{this.error.set(e.error?.error||'No se pudo guardar el cliente');this.guardando.set(false);}});}
}
