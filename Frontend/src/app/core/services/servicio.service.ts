import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Servicio, EstadoServicio } from '../models/servicio.model';

@Injectable({ providedIn: 'root' })
export class ServicioService {
  constructor(private api: ApiService) {}

  listar() {
    return this.api.get<Servicio[]>('/servicios');
  }

  crear(servicio: any) {
    return this.api.post<Servicio>('/servicios', servicio);
  }

  asignarTecnico(servicioId: string, tecnicoId: string) {
    return this.api.put<Servicio>(`/servicios/${servicioId}/asignar-tecnico`, {}, { tecnicoId });
  }

  cambiarEstado(servicioId: string, nuevoEstado: EstadoServicio, observacion: string) {
    return this.api.put<Servicio>(`/servicios/${servicioId}/estado`, {}, { nuevoEstado, observacion });
  }
}
