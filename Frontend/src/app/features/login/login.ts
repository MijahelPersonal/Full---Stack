import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class Login {

  username = '';
  mostrarPassword = signal(false);
  password = '';
  cargando = signal(false);
  error = signal<string | null>(null);

  constructor(private authService: AuthService, private router: Router) {}

  onSubmit() {
    if(this.cargando())return;
    if(!this.username.trim()||!this.password){this.error.set('Ingresa tu usuario y contraseña.');return;}
    this.error.set(null);
    this.cargando.set(true);

    this.authService.login({ username: this.username.trim(), password: this.password }).subscribe({
      next: () => {
        this.cargando.set(false);
        this.router.navigate(['/inicio']);
      },
      error: (err) => {
        this.cargando.set(false);
        this.error.set(err.status===401?'Usuario o contraseña incorrectos, o cuenta desactivada.':err.status===0?'No se pudo conectar con el servidor. Inténtalo nuevamente.':err.error?.error??'No se pudo iniciar sesión. Inténtalo nuevamente.');
      }
    });
  }
}
