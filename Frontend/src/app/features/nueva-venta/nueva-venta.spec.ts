import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { NuevaVenta } from './nueva-venta';
import { ComercioService } from '../../core/services/comercio.service';
import { Producto } from '../../core/models/comercio.model';
describe('POS',()=>{
 const producto:Producto={id:'p1',sku:'TEST',nombre:'Mouse',categoria:'Periféricos',marca:'Prueba',precioCompra:50,precioVenta:89,stock:2,stockMinimo:1,activo:true};
 let componente:NuevaVenta;
 let vender:ReturnType<typeof vi.fn>;
 beforeEach(()=>{
  vender=vi.fn(()=>of({venta:{id:'v1',total:178},detalles:[]}));
  TestBed.configureTestingModule({providers:[provideRouter([]),{provide:ComercioService,useValue:{productos:()=>of([producto]),clientes:()=>of([]),vender}}]});
  componente=TestBed.runInInjectionContext(()=>new NuevaVenta());
 });
 it('no permite superar el stock ni cantidades fraccionarias',()=>{
  componente.agregar(producto);componente.agregar(producto);componente.agregar(producto);
  expect(componente.carrito()[0].cantidad).toBe(2);
  componente.cantidad(producto,1.5);expect(componente.carrito()[0].cantidad).toBe(2);
 });
 it('envía solo referencias y cantidades para un cliente seleccionado',()=>{
  componente.agregar(producto);
  componente.clienteId='c1';componente.cantidad(producto,2);const clave=componente.clave;
  componente.finalizar();
  expect(vender).toHaveBeenCalledWith({clave,clienteId:'c1',lineas:[{productoId:'p1',cantidad:2}]});
  expect(componente.carrito()).toEqual([]);
 });
 it('permite público general sin cliente registrado',()=>{
  componente.agregar(producto);const clave=componente.clave;componente.finalizar();
  expect(vender).toHaveBeenCalledWith({clave,clienteId:null,lineas:[{productoId:'p1',cantidad:1}]});
 });
 it('calcula el total y permite eliminar una línea',()=>{
  componente.cantidad(producto,2);expect(componente.total()).toBe(178);
  componente.quitar(producto.id);expect(componente.total()).toBe(0);
 });
});
