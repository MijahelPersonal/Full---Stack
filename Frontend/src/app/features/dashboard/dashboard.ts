import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';

interface ResumenDashboard {
  pendientes: number;
  enRuta: number;
  enServicio: number;
  finalizados: number;
  totalServicios: number;
  tecnicosActivos: number;
  materialesStockBajo: number;
}

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class Dashboard implements OnInit {

  resumen = signal<ResumenDashboard | null>(null);
  cargando = signal(true);
  error = signal<string | null>(null);

  constructor(private api: ApiService, public authService: AuthService) {}

  ngOnInit() {
    this.api.get<ResumenDashboard>('/dashboard/resumen').subscribe({
      next: (data) => {
        this.resumen.set(data);
        this.cargando.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.error ?? 'No se pudo cargar el dashboard');
        this.cargando.set(false);
      }
    });
  }

  cerrarSesion() {
    this.authService.logout();
  }
}
