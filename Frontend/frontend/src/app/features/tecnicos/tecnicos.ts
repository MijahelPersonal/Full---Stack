import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TecnicoService } from '../../core/services/tecnico.service';
import { UsuarioService } from '../../core/services/usuario.service';
import { Tecnico } from '../../core/models/servicio.model';
import { Usuario } from '../../core/models/usuario.model';

@Component({
  selector: 'app-tecnicos',
  imports: [CommonModule, FormsModule],
  templateUrl: './tecnicos.html',
  styleUrl: './tecnicos.scss'
})
export class Tecnicos implements OnInit {

  tecnicos = signal<Tecnico[]>([]);
  usuarios = signal<Usuario[]>([]);
  cargando = signal(true);
  error = signal<string | null>(null);

  usuarioSeleccionado = '';
  especialidad = '';
  editandoId: string | null = null;

  usuariosDisponibles = computed(() => {
    const idsYaTecnicos = new Set(this.tecnicos().map(t => t.usuario.id));
    return this.usuarios().filter(u => u.rol === 'TECNICO' && !idsYaTecnicos.has(u.id));
  });

  constructor(private tecnicoService: TecnicoService, private usuarioService: UsuarioService) {}

  ngOnInit() { this.cargar(); }

  cargar() {
    this.cargando.set(true);
    this.tecnicoService.listar().subscribe({
      next: (data) => {
        this.tecnicos.set(data);
        this.usuarioService.listar().subscribe({
          next: (usuarios) => { this.usuarios.set(usuarios); this.cargando.set(false); },
          error: () => this.cargando.set(false)
        });
      },
      error: (err) => { this.error.set(err.error?.error ?? 'Error al cargar'); this.cargando.set(false); }
    });
  }

  guardar() {
    if (this.editandoId) {
      if (!this.especialidad.trim()) return;
      this.tecnicoService.actualizar(this.editandoId, this.especialidad).subscribe({
        next: () => { this.limpiar(); this.cargar(); },
        error: (err) => this.error.set(err.error?.error ?? 'No se pudo actualizar')
      });
    } else {
      if (!this.usuarioSeleccionado || !this.especialidad.trim()) return;
      this.tecnicoService.crear(this.usuarioSeleccionado, this.especialidad).subscribe({
        next: () => { this.limpiar(); this.cargar(); },
        error: (err) => this.error.set(err.error?.error ?? 'No se pudo crear')
      });
    }
  }

  editar(t: Tecnico) {
    this.editandoId = t.id;
    this.especialidad = t.especialidad;
  }

  cancelar() { this.limpiar(); }

  eliminar(id: string) {
    if (!confirm('¿Eliminar este técnico?')) return;
    this.tecnicoService.eliminar(id).subscribe({
      next: () => this.cargar(),
      error: (err) => this.error.set(err.error?.error ?? 'No se pudo eliminar')
    });
  }

  private limpiar() {
    this.editandoId = null;
    this.usuarioSeleccionado = ''; this.especialidad = '';
  }
}
