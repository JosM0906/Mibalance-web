import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Api, mensajeError } from './api';
import { finalize } from 'rxjs';
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <a class="saltar" href="#contenido">Ir al contenido</a>
    @if (api.usuario(); as usuario) {
      <header class="barra">
        <a class="marca" routerLink="/dashboard">MB <span>MiBalance</span></a>
        <nav aria-label="Menú principal">
          <a routerLink="/dashboard" routerLinkActive="activo">Resumen</a>
          <a routerLink="/transacciones" routerLinkActive="activo">Movimientos</a>
          <a routerLink="/categorias" routerLinkActive="activo">Categorías</a>
        </nav>
        <div class="acciones">
          <span>{{ usuario.nombre }}</span>
          <button class="secundario" (click)="salir()" [disabled]="ocupado()">Cerrar sesión</button>
        </div>
      </header>
    }
    <main id="contenido" class="contenedor">
      @if (error()) {
        <p class="error" role="alert">{{ error() }}</p>
      }
      <router-outlet />
    </main>
    <footer>MiBalance · Tus finanzas, en orden</footer>
  `,
})
export class App {
  api = inject(Api);
  private router = inject(Router);
  ocupado = signal(false);
  error = signal('');
  salir() {
    if (this.ocupado()) return;
    this.ocupado.set(true);
    this.error.set('');
    this.api
      .logout()
      .pipe(finalize(() => this.ocupado.set(false)))
      .subscribe({
        next: () => this.router.navigateByUrl('/login'),
        error: (e) => {
          if (e.status === 401) {
            this.api.usuario.set(null);
            void this.router.navigateByUrl('/login');
          } else this.error.set(mensajeError(e));
        },
      });
  }
}
