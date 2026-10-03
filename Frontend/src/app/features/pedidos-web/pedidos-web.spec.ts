import {TestBed} from '@angular/core/testing';import {of,throwError} from 'rxjs';import {PedidosWeb} from './pedidos-web';import {ComercioService} from '../../core/services/comercio.service';
describe('Pedidos web',()=>{
 let component:PedidosWeb;let accion:ReturnType<typeof vi.fn>;let api:any;
 beforeEach(()=>{accion=vi.fn(()=>of({}));api={pedidos:()=>of([]),pedido:()=>of({pedido:{id:'p1',estado:'CONFIRMADO'},stockActual:{}}),codigo:vi.fn(()=>throwError(()=>({error:{error:'Código inexistente'}}))),accionPedido:accion};TestBed.configureTestingModule({providers:[{provide:ComercioService,useValue:api}]});component=TestBed.runInInjectionContext(()=>new PedidosWeb());});
 it('muestra un código inexistente sin seleccionar un pedido',()=>{component.codigo='INVALIDO';component.buscar();expect(component.error()).toBe('Código inexistente');expect(component.seleccion()).toBeNull();});
 it('envía la transición y vuelve a consultar la disponibilidad',()=>{component.abrir('p1');component.accion('confirmar');expect(accion).toHaveBeenCalledWith('p1','confirmar');expect(component.ocupado()).toBe(false);});
});
