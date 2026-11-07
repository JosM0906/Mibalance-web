import { inject, Injectable, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { tap } from 'rxjs';
export interface Usuario {
  idUsuario: number;
  nombre: string;
  correo: string;
}
export interface Categoria {
  idCategoria: number;
  nombre: string;
  descripcion: string | null;
}
export interface Movimiento {
  idTransaccion: number;
  idUsuario: number;
  idCategoria: number;
  tipo: 'INGRESO' | 'GASTO';
  monto: number;
  fecha: string;
  descripcion: string | null;
}
export type DatosMovimiento = Omit<Movimiento, 'idTransaccion' | 'idUsuario'>;
export function mensajeError(e: HttpErrorResponse): string {
  if (e.status === 401) return 'Tu sesión venció. Vuelve a iniciar sesión.';
  if (e.error?.mensaje) return e.error.mensaje;
  if (e.error?.errors) return Object.values(e.error.errors).flat().join(' ');
  return 'No pudimos completar la operación. Comprueba que la API esté ejecutándose e intenta otra vez.';
}
@Injectable({ providedIn: 'root' })
export class Api {
  private http = inject(HttpClient);
  private opciones = { withCredentials: true };
  usuario = signal<Usuario | null>(null);
  sesion() {
    return this.http
      .get<Usuario>('/api/auth/me', this.opciones)
      .pipe(tap((u) => this.usuario.set(u)));
  }
  login(correo: string, password: string) {
    return this.http
      .post<{ usuario: Usuario }>('/api/auth/login', { correo, password }, this.opciones)
      .pipe(tap((r) => this.usuario.set(r.usuario)));
  }
  registro(nombre: string, correo: string, password: string) {
    return this.http.post('/api/auth/registro', { nombre, correo, password }, this.opciones);
  }
  logout() {
    return this.http
      .post('/api/auth/logout', {}, this.opciones)
      .pipe(tap(() => this.usuario.set(null)));
  }
  movimientos() {
    return this.http.get<Movimiento[]>('/api/transacciones', this.opciones);
  }
  movimiento(id: number) {
    return this.http.get<Movimiento>(`/api/transacciones/${id}`, this.opciones);
  }
  guardarMovimiento(id: number | null, datos: DatosMovimiento) {
    return id === null
      ? this.http.post<Movimiento>('/api/transacciones', datos, this.opciones)
      : this.http.put<Movimiento>(`/api/transacciones/${id}`, datos, this.opciones);
  }
  eliminarMovimiento(id: number) {
    return this.http.delete(`/api/transacciones/${id}`, this.opciones);
  }
  categorias() {
    return this.http.get<Categoria[]>('/api/categorias', this.opciones);
  }
  guardarCategoria(id: number | null, nombre: string, descripcion: string) {
    const datos = { nombre: nombre.trim(), descripcion: descripcion.trim() };
    return id === null
      ? this.http.post<Categoria>('/api/categorias', datos, this.opciones)
      : this.http.put<Categoria>(`/api/categorias/${id}`, datos, this.opciones);
  }
  eliminarCategoria(id: number) {
    return this.http.delete(`/api/categorias/${id}`, this.opciones);
  }
}
