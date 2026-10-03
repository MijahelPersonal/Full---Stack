import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class RuntimeConfigService {
  apiUrl = environment.apiUrl;

  async initialize(): Promise<void> {
    if (window.gestionDesktop) {
      this.apiUrl = (await window.gestionDesktop.getConfig()).apiUrl.replace(/\/$/, '');
    } else {
      const response = await fetch('/config.json', {cache:'no-store'});
      if (!response.ok) throw new Error('Configuración del API no disponible');
      const config = await response.json();
      const url = new URL(config.apiUrl);
      if (!['http:','https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash)
        throw new Error('URL de API inválida');
      if (location.protocol === 'https:' && url.protocol !== 'https:') throw new Error('El API debe usar HTTPS');
      this.apiUrl = url.href.replace(/\/$/,'');
    }
  }
}
