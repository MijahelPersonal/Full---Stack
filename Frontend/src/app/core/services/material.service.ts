import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Material } from '../models/material.model';

@Injectable({ providedIn: 'root' })
export class MaterialService {
  constructor(private api: ApiService) {}

  listar() { return this.api.get<Material[]>('/materiales'); }
  crear(material: Partial<Material>) { return this.api.post<Material>('/materiales', material); }
  actualizar(id: string, material: Partial<Material>) { return this.api.put<Material>(`/materiales/${id}`, material); }
  eliminar(id: string) { return this.api.delete<void>(`/materiales/${id}`); }
}
