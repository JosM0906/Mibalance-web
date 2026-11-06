import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export interface UsuarioSesion {
  idUsuario: number;
  nombre: string;
  correo: string;
}

interface LoginResponse {
  mensaje: string;
  usuario: UsuarioSesion;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);

  login(correo: string, password: string) {
    return this.http.post<LoginResponse>(
      '/api/auth/login',
      { correo, password },
      { withCredentials: true }
    );
  }

  obtenerSesion() {
    return this.http.get<UsuarioSesion>(
      '/api/auth/me',
      { withCredentials: true }
    );
  }

  logout() {
    return this.http.post<{ mensaje: string }>(
      '/api/auth/logout',
      {},
      { withCredentials: true }
    );
  }
}