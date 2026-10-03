import { Injectable, signal } from '@angular/core';

@Injectable({providedIn:'root'})
export class DesktopUpdateService {
  readonly state = signal<DesktopUpdateState | null>(null);
  readonly visible = signal(false);
  private readonly bridge = window.gestionDesktop?.updates;
  constructor() {
    if (!this.bridge) return;
    this.bridge.onState(state => {
      this.state.set(state);
      if (state.status === 'available' || state.status === 'ready') this.visible.set(true);
    });
    this.bridge.getState().then(state => this.state.set(state)).catch(() => {});
  }
  async action(name: 'check' | 'download' | 'install') {
    if (!this.bridge) return;
    try { this.state.set(await this.bridge[name]()); }
    catch { this.state.update(state => state ? {...state,status:'error'} : null); }
  }
  message() {
    const status = this.state()?.status;
    return ({idle:'',disabled:'Actualizaciones desactivadas en desarrollo y pruebas.',checking:'Buscando actualizaciones…',current:'Tienes la última versión.',available:'Nueva actualización disponible.',downloading:'Descargando actualización…',ready:'Actualización lista para instalar.',error:'No se pudo comprobar o descargar la actualización. Puedes seguir utilizando Gestión.'})[status || 'idle'];
  }
}
