import { inject } from '@angular/core';
import { CanActivateFn, Router, Routes } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { Api } from './api';
import { Login, Dashboard, Listado, Formulario, Detalle, Categorias } from './pantallas';
const sesion: CanActivateFn = () => {
  const api = inject(Api);
  const router = inject(Router);
  return api.sesion().pipe(
    map(() => true),
    catchError(() => {
      api.usuario.set(null);
      return of(router.parseUrl('/login'));
    }),
  );
};
export const routes: Routes = [
  { path: 'login', component: Login, title: 'Acceso | MiBalance' },
  { path: 'dashboard', component: Dashboard, canActivate: [sesion], title: 'Resumen | MiBalance' },
  {
    path: 'transacciones',
    component: Listado,
    canActivate: [sesion],
    title: 'Movimientos | MiBalance',
  },
  {
    path: 'transacciones/nueva',
    component: Formulario,
    canActivate: [sesion],
    title: 'Nuevo movimiento | MiBalance',
  },
  {
    path: 'transacciones/:id/editar',
    component: Formulario,
    canActivate: [sesion],
    title: 'Editar movimiento | MiBalance',
  },
  {
    path: 'transacciones/:id',
    component: Detalle,
    canActivate: [sesion],
    title: 'Detalle | MiBalance',
  },
  {
    path: 'categorias',
    component: Categorias,
    canActivate: [sesion],
    title: 'Categorías | MiBalance',
  },
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: '**', redirectTo: 'dashboard' },
];
