import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './layout.html',
  styleUrl: './layout.scss'
})
export class Layout {
  plegado=false;
  enlaces=[
    {ruta:'/inicio',nombre:'Inicio',icono:'⌂'},
    {ruta:'/pedidos-web',nombre:'Pedidos web',icono:'▣'},
    {ruta:'/nueva-venta',nombre:'Venta en tienda',icono:'＋'},
    {ruta:'/productos',nombre:'Productos',icono:'▦'},
    {ruta:'/inventario',nombre:'Inventario',icono:'▤'},
    {ruta:'/clientes',nombre:'Clientes',icono:'♙'},
    {ruta:'/ventas',nombre:'Ventas',icono:'≡'},
    {ruta:'/reportes',nombre:'Reportes',icono:'◷'}
  ];
  constructor(public authService: AuthService) {}

  cerrarSesion() {
    this.authService.logout();
  }
}
