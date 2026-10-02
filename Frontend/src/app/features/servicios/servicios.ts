import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ServicioService } from '../../core/services/servicio.service';
import { ClienteService } from '../../core/services/cliente.service';
import { TecnicoService } from '../../core/services/tecnico.service';
import { Servicio, Cliente, Tecnico, EstadoServicio } from '../../core/models/servicio.model';

@Component({
  selector: 'app-servicios',
  imports: [CommonModule, FormsModule],
  templateUrl: './servicios.html',
  styleUrl: './servicios.scss'
})
export class Servicios implements OnInit {

  servicios = signal<Servicio[]>([]);
  clientes = signal<Cliente[]>([]);
  tecnicos = signal<Tecnico[]>([]);
  cargando = signal(true);
  error = signal<string | null>(null);

  estadosSiguientes: Record<EstadoServicio, EstadoServicio | null> = {
    PENDIENTE: 'ASIGNADO',
    ASIGNADO: 'EN_RUTA',
    EN_RUTA: 'EN_SERVICIO',
    EN_SERVICIO: 'FINALIZADO',
    FINALIZADO: null
  };

  clienteId = '';
  tipo = 'INSTALACION';
  prioridad = 'MEDIA';
  descripcion = '';

  constructor(
    private servicioService: ServicioService,
    private clienteService: ClienteService,
    private tecnicoService: TecnicoService
  ) {}

  ngOnInit() {
    this.cargar();
  }

  cargar() {
    this.cargando.set(true);
    this.servicioService.listar().subscribe({
      next: (data) => {
        this.servicios.set(data);
        this.clienteService.listar().subscribe({
          next: (clientes) => {
            this.clientes.set(clientes);
            this.tecnicoService.listar().subscribe({
              next: (tecnicos) => {
                this.tecnicos.set(tecnicos);
                this.cargando.set(false);
              },
              error: () => this.cargando.set(false)
            });
          },
          error: () => this.cargando.set(false)
        });
      },
      error: (err) => {
        this.error.set(err.error?.error ?? 'Error al cargar servicios');
        this.cargando.set(false);
      }
    });
  }

  crear() {
    if (!this.clienteId || !this.descripcion.trim()) return;
    const nuevoServicio = {
      cliente: { id: this.clienteId },
      tipo: this.tipo,
      prioridad: this.prioridad,
      descripcion: this.descripcion
    };
    this.servicioService.crear(nuevoServicio).subscribe({
      next: () => {
        this.clienteId = '';
        this.descripcion = '';
        this.cargar();
      },
      error: (err) => this.error.set(err.error?.error ?? 'No se pudo crear el servicio')
    });
  }

  asignarTecnico(servicioId: string, tecnicoId: string) {
    if (!tecnicoId) return;
    this.servicioService.asignarTecnico(servicioId, tecnicoId).subscribe({
      next: () => this.cargar(),
      error: (err) => this.error.set(err.error?.error ?? 'No se pudo asignar el técnico')
    });
  }

  avanzarEstado(servicio: Servicio) {
    const siguiente = this.estadosSiguientes[servicio.estado];
    if (!siguiente) return;
    this.servicioService.cambiarEstado(servicio.id, siguiente, `Cambio a ${siguiente}`).subscribe({
      next: () => this.cargar(),
      error: (err) => this.error.set(err.error?.error ?? 'No se pudo cambiar el estado')
    });
  }
}
