import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Tecnico } from '../models/servicio.model';

@Injectable({ providedIn: 'root' })
export class TecnicoService {
  constructor(private api: ApiService) {}

  listar() { return this.api.get<Tecnico[]>('/tecnicos'); }
  crear(usuarioId: string, especialidad: string) {
    return this.api.post<Tecnico>('/tecnicos', {}, { usuarioId, especialidad });
  }
  actualizar(id: string, especialidad: string) {
    return this.api.put<Tecnico>(`/tecnicos/${id}`, {}, { especialidad });
  }
  eliminar(id: string) { return this.api.delete<void>(`/tecnicos/${id}`); }
}
