import {Component,inject} from '@angular/core';
import {DesktopUpdateService} from '../../core/services/desktop-update.service';
@Component({selector:'app-acerca-de',template:`<div class="page-heading"><div><h1>Acerca de SistemaGestión</h1><p>Aplicación de inventario, pedidos y ventas.</p></div></div>
 <section class="surface" style="padding:24px;max-width:600px">
 @if(updates.state(); as state){<p>Versión: <b>{{state.version}}</b></p><p aria-live="polite">{{updates.message()}}</p>
 @if(state.nextVersion){<p>Disponible: {{state.nextVersion}}</p>}
 <div class="compact-actions">
 <button class="btn btn-secondary" [disabled]="['disabled','checking','downloading','ready','available'].includes(state.status)" (click)="updates.action('check')">Buscar actualizaciones</button>
 @if(['available','downloading','ready'].includes(state.status)){<button class="btn btn-primary" (click)="updates.visible.set(true)">Ver actualización</button>}
 </div>}@else{<p>Versión web. Las actualizaciones se gestionan desde el despliegue.</p>}
 <p class="muted">Guarda tu trabajo antes de reiniciar para instalar una actualización.</p></section>`})
export class AcercaDe {readonly updates=inject(DesktopUpdateService);}
