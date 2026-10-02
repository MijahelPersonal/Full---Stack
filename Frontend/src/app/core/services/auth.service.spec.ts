import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from './auth.service';
import { RuntimeConfigService } from './runtime-config.service';
import { afterEach, beforeEach, expect, it } from 'vitest';

beforeEach(() => {
 localStorage.clear();
 TestBed.configureTestingModule({providers:[provideHttpClient(),provideHttpClientTesting(),provideRouter([]),{provide:RuntimeConfigService,useValue:{apiUrl:'http://localhost:8080/api'}}]});
});
afterEach(() => {TestBed.inject(HttpTestingController).verify();localStorage.clear();});
it('descarta la sesión antigua por correo para pedir un nuevo login',()=>{
 localStorage.setItem('token','jwt-anterior');localStorage.setItem('email','contacto@local.test');localStorage.setItem('rol','ADMINISTRADOR');
 const auth=TestBed.inject(AuthService);expect(auth.estaAutenticado()).toBe(false);expect(auth.rolActual()).toBeNull();expect(localStorage.getItem('email')).toBeNull();
});
it('envía username y conserva la nueva sesión',()=>{
 const auth=TestBed.inject(AuthService);
 auth.login({username:'vendedor',password:'prueba'}).subscribe();
 const req=TestBed.inject(HttpTestingController).expectOne('http://localhost:8080/api/auth/login');
 expect(req.request.body).toEqual({username:'vendedor',password:'prueba'});
 req.flush({token:'jwt-nuevo',username:'vendedor',rol:'VENDEDOR'});
 expect(auth.obtenerUsername()).toBe('vendedor');expect(auth.obtenerRol()).toBe('VENDEDOR');expect(auth.estaAutenticado()).toBe(true);
});
