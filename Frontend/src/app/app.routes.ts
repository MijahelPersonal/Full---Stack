import { Routes } from '@angular/router';
import { Login } from './features/login/login';
import { Registro } from './features/registro/registro';
import { Dashboard } from './features/dashboard/dashboard';
import { Clientes } from './features/clientes/clientes';
import { Tecnicos } from './features/tecnicos/tecnicos';
import { Servicios } from './features/servicios/servicios';
import { Materiales } from './features/materiales/materiales';
import { Layout } from './core/layout/layout';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: 'login', component: Login },
  { path: 'registro', component: Registro },
  {
    path: '',
    component: Layout,
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', component: Dashboard },
      { path: 'clientes', component: Clientes },
      { path: 'tecnicos', component: Tecnicos },
      { path: 'servicios', component: Servicios },
      { path: 'materiales', component: Materiales },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ]
  },
  { path: '**', redirectTo: '/login' },
];
