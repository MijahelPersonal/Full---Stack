import { Component, inject } from '@angular/core';
import { DesktopUpdateService } from '../core/services/desktop-update.service';
@Component({
 selector:'app-desktop-updates',
 template:`@if(updates.state(); as state){@if(updates.visible()){
 <div class="update-backdrop"><section class="update-dialog" role="dialog" aria-modal="true" aria-labelledby="update-title">
 <h2 id="update-title">SistemaGestión</h2><p aria-live="polite">{{updates.message()}}</p>
 <p>Versión instalada: {{state.version}}</p>@if(state.nextVersion){<p>Nueva versión: {{state.nextVersion}}</p>}
 @if(state.status==='downloading'){<progress max="100" [value]="state.percent||0"></progress><p>{{state.percent||0}} %</p>}
 <div class="actions"><button class="btn btn-secondary" (click)="updates.visible.set(false)">Más tarde</button>
 @if(state.status==='available'){<button class="btn btn-primary" (click)="updates.action('download')">Descargar actualización</button>}
 @if(state.status==='ready'){<button class="btn btn-primary" (click)="updates.action('install')">Reiniciar y actualizar</button>}
 </div></section></div>}}`,
 styles:`.update-backdrop{position:fixed;inset:0;background:#15233766;display:grid;place-items:center;z-index:100;padding:20px}.update-dialog{background:var(--surface);color:var(--text);padding:24px;border-radius:12px;width:min(460px,100%);box-shadow:0 20px 60px #15233733}.actions{display:flex;justify-content:flex-end;gap:10px;flex-wrap:wrap;margin-top:22px}progress{width:100%}`
})
export class DesktopUpdates { readonly updates=inject(DesktopUpdateService); }
