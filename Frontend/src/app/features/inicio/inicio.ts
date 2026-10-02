import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ComercioService } from '../../core/services/comercio.service';
import { InicioResumen } from '../../core/models/comercio.model';
@Component({selector:'app-inicio',imports:[CommonModule,RouterLink],templateUrl:'./inicio.html'})
export class Inicio {
 private api=inject(ComercioService);
 datos=signal<InicioResumen|null>(null); error=signal(''); cargando=signal(true);
 constructor(){this.api.inicio().subscribe({next:d=>{this.datos.set(d);this.cargando.set(false);},error:e=>{this.error.set(e.error?.error||'No se pudo cargar el resumen');this.cargando.set(false);}});}
}
