import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class RuntimeConfigService {
  apiUrl = environment.apiUrl;

  async initialize(): Promise<void> {
    if (window.gestionDesktop) {
      this.apiUrl = (await window.gestionDesktop.getConfig()).apiUrl.replace(/\/$/, '');
    }
  }
}
