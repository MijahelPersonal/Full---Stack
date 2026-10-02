import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MaterialService } from '../../core/services/material.service';
import { Material } from '../../core/models/material.model';

@Component({
  selector: 'app-materiales',
  imports: [CommonModule, FormsModule],
  templateUrl: './materiales.html',
  styleUrl: './materiales.scss'
})
export class Materiales implements OnInit {

  materiales = signal<Material[]>([]);
  cargando = signal(true);
  error = signal<string | null>(null);

  nombre = '';
  categoria = '';
  unidadMedida = '';
  stockActual = 0;
  stockMinimo = 0;
  editandoId: string | null = null;

  constructor(private materialService: MaterialService) {}

  ngOnInit() { this.cargar(); }

  cargar() {
    this.cargando.set(true);
    this.materialService.listar().subscribe({
      next: (data) => { this.materiales.set(data); this.cargando.set(false); },
      error: (err) => { this.error.set(err.error?.error ?? 'Error al cargar'); this.cargando.set(false); }
    });
  }

  guardar() {
    if (!this.nombre.trim()) return;
    const datos = {
      nombre: this.nombre, categoria: this.categoria, unidadMedida: this.unidadMedida,
      stockActual: this.stockActual, stockMinimo: this.stockMinimo
    };
    const operacion = this.editandoId
      ? this.materialService.actualizar(this.editandoId, datos)
      : this.materialService.crear(datos);

    operacion.subscribe({
      next: () => { this.limpiar(); this.cargar(); },
      error: (err) => this.error.set(err.error?.error ?? 'No se pudo guardar')
    });
  }

  editar(m: Material) {
    this.editandoId = m.id;
    this.nombre = m.nombre; this.categoria = m.categoria; this.unidadMedida = m.unidadMedida;
    this.stockActual = m.stockActual; this.stockMinimo = m.stockMinimo;
  }

  cancelar() { this.limpiar(); }

  eliminar(id: string) {
    if (!confirm('¿Eliminar este material?')) return;
    this.materialService.eliminar(id).subscribe({
      next: () => this.cargar(),
      error: (err) => this.error.set(err.error?.error ?? 'No se pudo eliminar')
    });
  }

  private limpiar() {
    this.editandoId = null;
    this.nombre = ''; this.categoria = ''; this.unidadMedida = '';
    this.stockActual = 0; this.stockMinimo = 0;
  }
}
