import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClienteService } from '../../core/services/cliente.service';
import { Cliente } from '../../core/models/servicio.model';

@Component({
  selector: 'app-clientes',
  imports: [CommonModule, FormsModule],
  templateUrl: './clientes.html',
  styleUrl: './clientes.scss'
})
export class Clientes implements OnInit {

  clientes = signal<Cliente[]>([]);
  cargando = signal(true);
  error = signal<string | null>(null);

  nombre = '';
  direccion = '';
  telefono = '';
  editandoId: string | null = null;

  constructor(private clienteService: ClienteService) {}

  ngOnInit() { this.cargar(); }

  cargar() {
    this.cargando.set(true);
    this.clienteService.listar().subscribe({
      next: (data) => { this.clientes.set(data); this.cargando.set(false); },
      error: (err) => { this.error.set(err.error?.error ?? 'Error al cargar'); this.cargando.set(false); }
    });
  }

  guardar() {
    if (!this.nombre.trim()) return;
    const datos = { nombre: this.nombre, direccion: this.direccion, telefono: this.telefono };
    const operacion = this.editandoId
      ? this.clienteService.actualizar(this.editandoId, datos)
      : this.clienteService.crear(datos);

    operacion.subscribe({
      next: () => { this.limpiar(); this.cargar(); },
      error: (err) => this.error.set(err.error?.error ?? 'No se pudo guardar')
    });
  }

  editar(cliente: Cliente) {
    this.editandoId = cliente.id;
    this.nombre = cliente.nombre;
    this.direccion = cliente.direccion;
    this.telefono = cliente.telefono;
  }

  cancelar() { this.limpiar(); }

  eliminar(id: string) {
    if (!confirm('¿Eliminar este cliente?')) return;
    this.clienteService.eliminar(id).subscribe({
      next: () => this.cargar(),
      error: (err) => this.error.set(err.error?.error ?? 'No se pudo eliminar')
    });
  }

  private limpiar() {
    this.editandoId = null;
    this.nombre = ''; this.direccion = ''; this.telefono = '';
  }
}
