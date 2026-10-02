import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Usuario } from '../models/usuario.model';

@Injectable({ providedIn: 'root' })
export class UsuarioService {
  constructor(private api: ApiService) {}

  listar() {
    return this.api.get<Usuario[]>('/usuarios');
  }
}
