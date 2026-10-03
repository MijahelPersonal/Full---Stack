import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { Subject, throwError } from 'rxjs';
import { Login } from './login';
import { AuthService } from '../../core/services/auth.service';

describe('Login por username',()=>{
 let component:Login;let login:ReturnType<typeof vi.fn>;
 beforeEach(()=>{login=vi.fn();TestBed.configureTestingModule({imports:[Login],providers:[provideRouter([]),{provide:AuthService,useValue:{login}}]});component=TestBed.createComponent(Login).componentInstance;});
 it('envía username y contraseña, impide solicitudes simultáneas y navega al inicio',()=>{
   const respuesta=new Subject<any>();login.mockReturnValue(respuesta);const navigate=vi.spyOn(TestBed.inject(Router),'navigate');
   component.username='  mijahel  ';component.password='123456';component.onSubmit();component.onSubmit();
   expect(login).toHaveBeenCalledOnce();expect(login).toHaveBeenCalledWith({username:'mijahel',password:'123456'});expect(component.cargando()).toBe(true);
   respuesta.next({token:'token',username:'mijahel',rol:'ADMINISTRADOR'});expect(component.cargando()).toBe(false);expect(navigate).toHaveBeenCalledWith(['/inicio']);
 });
 it('no envía credenciales vacías',()=>{component.username=' ';component.password='123456';component.onSubmit();expect(login).not.toHaveBeenCalled();});
 it('muestra un error claro y libera el botón al rechazar credenciales',()=>{
   login.mockReturnValue(throwError(()=>({status:401})));component.username='mijahel';component.password='incorrecta';component.onSubmit();
   expect(component.cargando()).toBe(false);expect(component.error()).toContain('Usuario o contraseña incorrectos');
 });
 it('muestra Usuario, alterna la contraseña y no ofrece registro público',async()=>{
   const fixture=TestBed.createComponent(Login);fixture.detectChanges();await fixture.whenStable();const el=fixture.nativeElement as HTMLElement;
   expect(el.querySelector('label[for="username"]')?.textContent).toBe('Usuario');expect(el.querySelector('input[type="email"]')).toBeNull();expect(el.querySelector('a')).toBeNull();
   (el.querySelector('.password-toggle') as HTMLButtonElement).click();fixture.detectChanges();expect(el.querySelector('#password')?.getAttribute('type')).toBe('text');
 });
});
