import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Cliente } from '../models/servicio.model';

@Injectable({ providedIn: 'root' })
export class ClienteService {
  constructor(private api: ApiService) {}

  listar() { return this.api.get<Cliente[]>('/clientes'); }
  crear(cliente: Partial<Cliente>) { return this.api.post<Cliente>('/clientes', cliente); }
  actualizar(id: string, cliente: Partial<Cliente>) { return this.api.put<Cliente>(`/clientes/${id}`, cliente); }
  eliminar(id: string) { return this.api.delete<void>(`/clientes/${id}`); }
}
