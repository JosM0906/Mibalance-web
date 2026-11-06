import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs';
import { AuthService, UsuarioSesion } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  private auth = inject(AuthService);

  correo = '';
  password = '';

  usuario = signal<UsuarioSesion | null>(null);
  cargando = signal(false);
  comprobando = signal(true);
  error = signal('');

  ngOnInit() {
    this.auth.obtenerSesion()
      .pipe(finalize(() => this.comprobando.set(false)))
      .subscribe({
        next: usuario => this.usuario.set(usuario),
        error: (error: HttpErrorResponse) => {
          if (error.status !== 401) {
            this.error.set(
              'No pudimos comprobar tu sesión. Revisa que la API esté ejecutándose.'
            );
          }
        }
      });
  }

  iniciarSesion() {
    if (this.cargando()) return;

    this.error.set('');
    this.cargando.set(true);

    this.auth.login(this.correo.trim(), this.password)
      .pipe(finalize(() => this.cargando.set(false)))
      .subscribe({
        next: respuesta => {
          this.usuario.set(respuesta.usuario);
          this.password = '';
        },
        error: (error: HttpErrorResponse) => {
          this.error.set(
            error.status === 401
              ? 'Correo o contraseña incorrectos.'
              : 'No pudimos iniciar sesión. Revisa la conexión con la API.'
          );
        }
      });
  }

  cerrarSesion() {
    if (this.cargando()) return;

    this.error.set('');
    this.cargando.set(true);

    this.auth.logout()
      .pipe(finalize(() => this.cargando.set(false)))
      .subscribe({
        next: () => this.usuario.set(null),
        error: (error: HttpErrorResponse) => {
          if (error.status === 401) {
            this.usuario.set(null);
          } else {
            this.error.set('No pudimos cerrar la sesión. Intenta otra vez.');
          }
        }
      });
  }
}