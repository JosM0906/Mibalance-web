import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { ActivatedRoute, provideRouter, Router } from '@angular/router';
import { Categorias, Formulario, Login, Listado } from './pantallas';
import { Api } from './api';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('Flujos de MiBalance', () => {
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: new Map() } } },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
  });
  afterEach(() => http.verify());
  it('envía credenciales mediante cookie y conserva solo datos del usuario', () => {
    const fixture = TestBed.createComponent(Login);
    const login = fixture.componentInstance;
    login.correo = ' jos@example.com ';
    login.password = 'ClavePrueba!';
    login.enviar();
    const req = http.expectOne('/api/auth/login');
    expect(req.request.body).toEqual({ correo: 'jos@example.com', password: 'ClavePrueba!' });
    expect(req.request.withCredentials).toBe(true);
    req.flush({ usuario: { idUsuario: 1, nombre: 'Jos', correo: 'jos@example.com' } });
    expect(TestBed.inject(Api).usuario()?.idUsuario).toBe(1);
    expect(login.password).toBe('');
    expect(TestBed.inject(Router).navigateByUrl).toHaveBeenCalledWith('/dashboard');
  });
  it('mantiene el formulario y muestra el conflicto de nombre duplicado', () => {
    const fixture = TestBed.createComponent(Categorias);
    const pagina = fixture.componentInstance;
    pagina.nombre = 'Comida';
    pagina.guardar();
    http
      .expectOne('/api/categorias')
      .flush({ mensaje: 'Nombre repetido.' }, { status: 409, statusText: 'Conflict' });
    expect(pagina.error()).toBe('Nombre repetido.');
    expect(pagina.nombre).toBe('Comida');
    expect(pagina.ocupado()).toBe(false);
  });
  it('rechaza montos con más de dos decimales sin enviar peticiones', () => {
    const formulario = TestBed.createComponent(Formulario).componentInstance;
    formulario.datos.monto = 12.345;
    formulario.guardar();
    expect(formulario.error()).toContain('dos decimales');
    http.expectNone('/api/transacciones');
  });
  it('filtra movimientos por categoría y tipo usando datos de la API', () => {
    const fixture = TestBed.createComponent(Listado);
    const listado = fixture.componentInstance;
    listado.cargar();
    http.expectOne('/api/transacciones').flush([
      {
        idTransaccion: 1,
        idUsuario: 1,
        idCategoria: 1,
        tipo: 'GASTO',
        monto: 20,
        fecha: '2026-11-06',
        descripcion: null,
      },
      {
        idTransaccion: 2,
        idUsuario: 1,
        idCategoria: 2,
        tipo: 'INGRESO',
        monto: 500,
        fecha: '2026-11-06',
        descripcion: 'Pago',
      },
    ]);
    http.expectOne('/api/categorias').flush([
      { idCategoria: 1, nombre: 'Comida', descripcion: null },
      { idCategoria: 2, nombre: 'Salario', descripcion: null },
    ]);
    listado.busqueda.set('comida');
    listado.tipo.set('GASTO');
    expect(listado.filtrados().map((m) => m.idTransaccion)).toEqual([1]);
    listado.tipo.set('INGRESO');
    expect(listado.filtrados()).toHaveLength(0);
  });
});
