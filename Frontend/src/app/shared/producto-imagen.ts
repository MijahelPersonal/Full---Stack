import { Component, Input, OnChanges } from '@angular/core';

@Component({
 selector:'app-producto-imagen',
 template:`@if(src&&!fallo){<img [src]="src" [alt]="nombre" (error)="fallo=true"/>}@else{<span class="placeholder" role="img" [attr.aria-label]="'Sin imagen: '+nombre"><span aria-hidden="true">▧</span><small>Sin imagen</small></span>}`,
 styles:[`:host{display:block;width:100%;height:100%}img{display:block;width:100%;height:100%;object-fit:contain;border-radius:8px}.placeholder{display:flex;flex-direction:column;align-items:center;justify-content:center;width:100%;height:100%;color:#728095;background:#eef2f7;border-radius:8px}.placeholder>span{font-size:28px}.placeholder small{font-size:10px}`]
})
export class ProductoImagen implements OnChanges {
 @Input() src='';@Input() nombre='Producto';fallo=false;
 ngOnChanges(){this.fallo=false;}
}
