import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthResponse, LoginRequest, RegisterRequest, Rol } from '../models/usuario.model';

@Injectable({ providedIn: 'root' })
export class AuthService {

  private readonly apiUrl = `${environment.apiUrl}/auth`;
  private readonly tokenKey = 'token';
  private readonly rolKey = 'rol';
  private readonly emailKey = 'email';

  rolActual = signal<Rol | null>(this.obtenerRol());

  constructor(private http: HttpClient, private router: Router) {}

  login(credenciales: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credenciales).pipe(
      tap(res => this.guardarSesion(res))
    );
  }

  register(datos: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, datos).pipe(
      tap(res => this.guardarSesion(res))
    );
  }

  private guardarSesion(res: AuthResponse) {
    localStorage.setItem(this.tokenKey, res.token);
    localStorage.setItem(this.rolKey, res.rol);
    localStorage.setItem(this.emailKey, res.email);
    this.rolActual.set(res.rol);
  }

  logout() {
    localStorage.clear();
    this.rolActual.set(null);
    this.router.navigate(['/login']);
  }

  obtenerToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  obtenerRol(): Rol | null {
    return localStorage.getItem(this.rolKey) as Rol | null;
  }

  estaAutenticado(): boolean {
    return !!this.obtenerToken();
  }
}
