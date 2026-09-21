import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { Rol } from '../../core/models/usuario.model';

@Component({
  selector: 'app-registro',
  imports: [CommonModule, FormsModule],
  templateUrl: './registro.html',
  styleUrl: './registro.scss'
})
export class Registro {

  nombre = '';
  email = '';
  password = '';
  rol: Rol = 'ADMINISTRADOR';

  cargando = signal(false);
  error = signal<string | null>(null);

  constructor(private authService: AuthService, private router: Router) {}

  onSubmit() {
    this.error.set(null);
    this.cargando.set(true);

    this.authService.register({
      nombre: this.nombre,
      email: this.email,
      password: this.password,
      rol: this.rol
    }).subscribe({
      next: () => {
        this.cargando.set(false);
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.cargando.set(false);
        this.error.set(err.error?.error ?? 'No se pudo registrar');
      }
    });
  }
}
