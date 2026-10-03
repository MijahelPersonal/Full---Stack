import { Routes } from '@angular/router';
import { Login } from './features/login/login';
import { Layout } from './core/layout/layout';
import { authGuard } from './core/guards/auth.guard';
export const routes: Routes = [
 {path:'login',component:Login},
 {path:'',component:Layout,canActivate:[authGuard],children:[
  {path:'acerca-de',loadComponent:()=>import('./features/acerca-de/acerca-de').then(m=>m.AcercaDe)},
  {path:'inicio',loadComponent:()=>import('./features/inicio/inicio').then(m=>m.Inicio)},
  {path:'pedidos-web',loadComponent:()=>import('./features/pedidos-web/pedidos-web').then(m=>m.PedidosWeb)},
  {path:'nueva-venta',loadComponent:()=>import('./features/nueva-venta/nueva-venta').then(m=>m.NuevaVenta)},
  {path:'productos',loadComponent:()=>import('./features/productos/productos').then(m=>m.Productos)},
  {path:'inventario',loadComponent:()=>import('./features/inventario/inventario').then(m=>m.Inventario)},
  {path:'clientes',loadComponent:()=>import('./features/clientes-comerciales/clientes-comerciales').then(m=>m.ClientesComerciales)},
  {path:'ventas',loadComponent:()=>import('./features/ventas/ventas').then(m=>m.Ventas)},
  {path:'reportes',loadComponent:()=>import('./features/reportes/reportes').then(m=>m.Reportes)},
  {path:'dashboard',redirectTo:'inicio',pathMatch:'full'},
  {path:'',redirectTo:'inicio',pathMatch:'full'}
 ]},
 {path:'**',redirectTo:'inicio'}
];
