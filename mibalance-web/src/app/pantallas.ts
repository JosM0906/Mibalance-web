import { Component, Directive, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize, forkJoin, switchMap, map } from 'rxjs';
import { Api, Categoria, DatosMovimiento, Movimiento, mensajeError } from './api';
const imports = [CommonModule, FormsModule, RouterLink];
const estado = `@if (cargando()) { <p role="status">Cargando datos...</p> }
  @if (error()) { <p class="error" role="alert">{{ error() }}</p> }`;
@Directive()
class Estado {
  api = inject(Api);
  router = inject(Router);
  error = signal('');
  cargando = signal(false);
  ocupado = signal(false);
  fallo(e: any) {
    this.error.set(mensajeError(e));
    if (e.status === 401) {
      this.api.usuario.set(null);
      void this.router.navigateByUrl('/login');
    }
  }
}
@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: ` <section class="acceso panel">
    <p class="etiqueta">TUS FINANZAS, EN ORDEN</p>
    <h1>MiBalance</h1>
    <h2>{{ registro ? 'Crea tu cuenta' : 'Bienvenida de nuevo' }}</h2>
    <p>Administra tus ingresos y gastos en un solo lugar.</p>
    <form #f="ngForm" (ngSubmit)="enviar()">
      @if (registro) {
        <label
          >Nombre<input
            name="nombre"
            [(ngModel)]="nombre"
            required
            maxlength="100"
            autocomplete="name"
        /></label>
      }
      <label
        >Correo<input
          type="email"
          name="correo"
          [(ngModel)]="correo"
          required
          email
          maxlength="150"
          autocomplete="username"
      /></label>
      <label
        >Contraseña<input
          type="password"
          name="password"
          [(ngModel)]="password"
          required
          [minlength]="registro ? 8 : 1"
          maxlength="128"
          [attr.autocomplete]="registro ? 'new-password' : 'current-password'"
      /></label>
      @if (error()) {
        <p class="error" role="alert">{{ error() }}</p>
      }
      <button [disabled]="f.invalid || ocupado() || (registro && !nombre.trim())">
        {{ ocupado() ? 'Procesando...' : registro ? 'Crear cuenta e ingresar' : 'Iniciar sesión' }}
      </button>
      <button type="button" class="secundario" [disabled]="ocupado()" (click)="alternar()">
        {{ registro ? 'Ya tengo una cuenta' : 'Crear una cuenta' }}
      </button>
    </form>
  </section>`,
})
export class Login extends Estado {
  nombre = '';
  correo = '';
  password = '';
  registro = false;
  alternar() {
    this.registro = !this.registro;
    this.password = '';
    this.error.set('');
  }
  enviar() {
    if (this.ocupado()) return;
    this.error.set('');
    this.ocupado.set(true);
    const correo = this.correo.trim();
    const solicitud = this.registro
      ? this.api
          .registro(this.nombre.trim(), correo, this.password)
          .pipe(switchMap(() => this.api.login(correo, this.password)))
      : this.api.login(correo, this.password);
    solicitud.pipe(finalize(() => this.ocupado.set(false))).subscribe({
      next: () => {
        this.password = '';
        void this.router.navigateByUrl('/dashboard');
      },
      error: (e) =>
        this.error.set(e.status === 401 ? 'Correo o contraseña incorrectos.' : mensajeError(e)),
    });
  }
}
@Directive()
class Datos extends Estado implements OnInit {
  movimientos = signal<Movimiento[]>([]);
  categorias = signal<Categoria[]>([]);
  ngOnInit() {
    this.cargar();
  }
  cargar() {
    this.cargando.set(true);
    this.error.set('');
    forkJoin({ movimientos: this.api.movimientos(), categorias: this.api.categorias() })
      .pipe(finalize(() => this.cargando.set(false)))
      .subscribe({
        next: (r) => {
          this.movimientos.set(r.movimientos);
          this.categorias.set(r.categorias);
        },
        error: (e) => this.fallo(e),
      });
  }
  categoria(id: number) {
    return (
      this.categorias().find((c) => c.idCategoria === id)?.nombre ?? 'Sin categoría disponible'
    );
  }
}
@Component({
  standalone: true,
  imports,
  template:
    `
  <div class="cabecera"><div><p class="etiqueta">VISTA GENERAL</p><h1>Tu resumen financiero</h1>
    <p>Totales de todos tus movimientos registrados.</p></div>
    <a class="boton" routerLink="/transacciones/nueva">+ Nuevo movimiento</a></div>
  ` +
    estado +
    `
  @if (!cargando() && !error()) {
    <section class="tarjetas" aria-label="Resumen">
      <article class="panel ingreso"><h2>Ingresos</h2><strong>{{ ingresos() / 100 | number:'1.2-2' }}</strong></article>
      <article class="panel gasto"><h2>Gastos</h2><strong>{{ gastos() / 100 | number:'1.2-2' }}</strong></article>
      <article class="panel saldo"><h2>Saldo</h2><strong>{{ (ingresos() - gastos()) / 100 | number:'1.2-2' }}</strong></article>
    </section>
    <section class="panel"><div class="cabecera"><h2>Últimos movimientos</h2><a routerLink="/transacciones">Ver todos</a></div>
      @for (m of movimientos().slice(0, 5); track m.idTransaccion) {
        <div class="fila"><div><a [routerLink]="['/transacciones', m.idTransaccion]">{{ m.descripcion || categoria(m.idCategoria) }}</a>
          <p>{{ m.fecha }} · {{ categoria(m.idCategoria) }}</p></div>
          <strong [class.texto-gasto]="m.tipo === 'GASTO'">{{ m.tipo === 'GASTO' ? '−' : '+' }}{{ m.monto | number:'1.2-2' }}</strong></div>
      } @empty { <p>No hay movimientos todavía. Registra el primero para comenzar.</p> }
    </section>
  }`,
})
export class Dashboard extends Datos {
  ingresos = computed(() =>
    this.movimientos()
      .filter((m) => m.tipo === 'INGRESO')
      .reduce((s, m) => s + Math.round(m.monto * 100), 0),
  );
  gastos = computed(() =>
    this.movimientos()
      .filter((m) => m.tipo === 'GASTO')
      .reduce((s, m) => s + Math.round(m.monto * 100), 0),
  );
}
@Component({
  standalone: true,
  imports,
  template:
    `
  <div class="cabecera"><div><p class="etiqueta">TU ACTIVIDAD</p><h1>Movimientos</h1></div>
    <a class="boton" routerLink="/transacciones/nueva">+ Nuevo movimiento</a></div>
  <section class="panel">
    <div class="filtros"><label>Buscar<input placeholder="Descripción o categoría" [ngModel]="busqueda()" (ngModelChange)="busqueda.set($event)"></label>
      <label>Tipo<select [ngModel]="tipo()" (ngModelChange)="tipo.set($event)">
        <option value="">Todos</option><option value="INGRESO">Ingresos</option><option value="GASTO">Gastos</option></select></label></div>
    ` +
    estado +
    `
    @if (!cargando() && !error()) {
      <div class="tabla"><table><caption>{{ filtrados().length }} movimientos encontrados</caption>
        <thead><tr><th>Fecha</th><th>Categoría</th><th>Descripción</th><th>Tipo</th><th>Monto</th><th>Acciones</th></tr></thead>
        <tbody>@for (m of filtrados(); track m.idTransaccion) {
          <tr><td>{{ m.fecha }}</td><td>{{ categoria(m.idCategoria) }}</td><td>{{ m.descripcion || '—' }}</td>
          <td><span class="insignia" [class.texto-gasto]="m.tipo === 'GASTO'">{{ m.tipo }}</span></td><td>{{ m.monto | number:'1.2-2' }}</td>
          <td><div class="acciones"><a [routerLink]="['/transacciones', m.idTransaccion]">Ver</a>
            <a [routerLink]="['/transacciones', m.idTransaccion, 'editar']">Editar</a>
            <button class="peligro" [disabled]="ocupado()" (click)="eliminar(m)">Eliminar</button></div></td></tr>
        } @empty { <tr><td colspan="6">No hay movimientos para mostrar.</td></tr> }</tbody>
      </table></div>
    }
    @if (error() && !cargando()) { <button class="secundario" (click)="cargar()">Volver a cargar</button> }
  </section>`,
})
export class Listado extends Datos {
  busqueda = signal('');
  tipo = signal('');
  filtrados = computed(() => {
    const q = this.busqueda().trim().toLowerCase();
    return this.movimientos().filter(
      (m) =>
        (!this.tipo() || m.tipo === this.tipo()) &&
        `${m.descripcion ?? ''} ${this.categoria(m.idCategoria)}`.toLowerCase().includes(q),
    );
  });
  eliminar(m: Movimiento) {
    if (
      this.ocupado() ||
      !confirm(
        `¿Eliminar el movimiento del ${m.fecha} por ${m.monto}? Esta acción no se puede deshacer.`,
      )
    )
      return;
    this.ocupado.set(true);
    this.error.set('');
    this.api
      .eliminarMovimiento(m.idTransaccion)
      .pipe(finalize(() => this.ocupado.set(false)))
      .subscribe({
        next: () =>
          this.movimientos.update((lista) =>
            lista.filter((x) => x.idTransaccion !== m.idTransaccion),
          ),
        error: (e) => this.fallo(e),
      });
  }
}
@Component({
  standalone: true,
  imports,
  template:
    `
  <a routerLink="/transacciones">← Volver a movimientos</a><h1>{{ id === null ? 'Nuevo movimiento' : 'Editar movimiento' }}</h1>
  ` +
    estado +
    `
  @if (!cargando() && listo()) {
    <form class="panel formulario" #f="ngForm" (ngSubmit)="guardar()">
      <label>Tipo<select name="tipo" [(ngModel)]="datos.tipo" required>
        <option value="GASTO">Gasto</option><option value="INGRESO">Ingreso</option></select></label>
      <label>Categoría<select name="categoria" [(ngModel)]="datos.idCategoria" required min="1">
        <option [ngValue]="0" disabled>Selecciona una categoría</option>
        @for (c of categorias(); track c.idCategoria) { <option [ngValue]="c.idCategoria">{{ c.nombre }}</option> }
      </select></label>
      @if (!categorias().length) { <p>Primero <a routerLink="/categorias">crea una categoría</a>.</p> }
      <label>Monto<input type="number" name="monto" [(ngModel)]="datos.monto" required min="0.01" max="9999999999.99" step="0.01"></label>
      <label>Fecha<input type="date" name="fecha" [(ngModel)]="datos.fecha" required></label>
      <label>Descripción<textarea name="descripcion" [(ngModel)]="datos.descripcion" maxlength="250" rows="3"></textarea></label>
      <div class="acciones"><button [disabled]="f.invalid || ocupado() || datos.idCategoria < 1">{{ ocupado() ? 'Guardando...' : 'Guardar movimiento' }}</button>
        <a routerLink="/transacciones">Cancelar</a></div>
    </form>
  }
  @if (!cargando() && !listo()) { <button (click)="ngOnInit()">Reintentar</button> }`,
})
export class Formulario extends Estado implements OnInit {
  private ruta = inject(ActivatedRoute);
  id: number | null = null;
  categorias = signal<Categoria[]>([]);
  listo = signal(false);
  datos: DatosMovimiento = {
    idCategoria: 0,
    tipo: 'GASTO',
    monto: 0,
    fecha: this.hoy(),
    descripcion: '',
  };
  private hoy() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
  ngOnInit() {
    const valor = this.ruta.snapshot.paramMap.get('id');
    this.id = valor === null ? null : Number(valor);
    if (this.id !== null && (!Number.isSafeInteger(this.id) || this.id < 1)) {
      this.error.set('Identificador inválido.');
      return;
    }
    this.cargando.set(true);
    this.error.set('');
    this.listo.set(false);
    const solicitud =
      this.id === null
        ? this.api.categorias().pipe(mapearCategorias())
        : forkJoin({ categorias: this.api.categorias(), movimiento: this.api.movimiento(this.id) });
    solicitud.pipe(finalize(() => this.cargando.set(false))).subscribe({
      next: (r) => {
        this.categorias.set(r.categorias);
        if (r.movimiento) {
          const m = r.movimiento;
          this.datos = {
            idCategoria: m.idCategoria,
            tipo: m.tipo,
            monto: m.monto,
            fecha: m.fecha,
            descripcion: m.descripcion ?? '',
          };
        }
        this.listo.set(true);
      },
      error: (e) => this.fallo(e),
    });
  }
  guardar() {
    if (this.ocupado()) return;
    if (
      !Number.isFinite(this.datos.monto) ||
      this.datos.monto <= 0 ||
      Math.abs(this.datos.monto * 100 - Math.round(this.datos.monto * 100)) > 0.0001
    ) {
      this.error.set('El monto debe ser positivo y tener como máximo dos decimales.');
      return;
    }
    this.ocupado.set(true);
    this.error.set('');
    this.api
      .guardarMovimiento(this.id, this.datos)
      .pipe(finalize(() => this.ocupado.set(false)))
      .subscribe({
        next: () => this.router.navigateByUrl('/transacciones'),
        error: (e) => this.fallo(e),
      });
  }
}
function mapearCategorias() {
  return map((categorias: Categoria[]) => ({ categorias, movimiento: null as Movimiento | null }));
}
@Component({
  standalone: true,
  imports,
  template:
    `
  <a routerLink="/transacciones">← Volver a movimientos</a><h1>Detalle del movimiento</h1>
  ` +
    estado +
    `
  @if (!cargando() && !error()) {
    @if (movimiento(); as m) {
      <section class="panel formulario"><span class="insignia">{{ m.tipo }}</span><h2>{{ m.monto | number:'1.2-2' }}</h2>
        <dl><dt>Identificador</dt><dd>{{ m.idTransaccion }}</dd><dt>Fecha</dt><dd>{{ m.fecha }}</dd>
          <dt>Categoría</dt><dd>{{ nombreCategoria() }}</dd><dt>Descripción</dt><dd>{{ m.descripcion || 'Sin descripción' }}</dd></dl>
        <a class="boton" [routerLink]="['/transacciones', m.idTransaccion, 'editar']">Editar movimiento</a>
      </section>
    }
  }`,
})
export class Detalle extends Estado implements OnInit {
  private ruta = inject(ActivatedRoute);
  movimiento = signal<Movimiento | null>(null);
  nombreCategoria = signal('');
  ngOnInit() {
    const id = Number(this.ruta.snapshot.paramMap.get('id'));
    if (!Number.isSafeInteger(id) || id < 1) {
      this.error.set('Identificador inválido.');
      return;
    }
    this.cargando.set(true);
    forkJoin({ movimiento: this.api.movimiento(id), categorias: this.api.categorias() })
      .pipe(finalize(() => this.cargando.set(false)))
      .subscribe({
        next: (r) => {
          this.movimiento.set(r.movimiento);
          this.nombreCategoria.set(
            r.categorias.find((c) => c.idCategoria === r.movimiento.idCategoria)?.nombre ??
              'No disponible',
          );
        },
        error: (e) => this.fallo(e),
      });
  }
}
@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  template:
    `
  <p class="etiqueta">CATÁLOGO COMPARTIDO</p><h1>Categorías</h1><p>Organiza los conceptos de tus ingresos y gastos.</p>
  <div class="columnas"><section class="panel">
    <h2>{{ id === null ? 'Crear categoría' : 'Editar categoría' }}</h2>
    <form #f="ngForm" (ngSubmit)="guardar()">
      <label>Nombre<input name="nombre" [(ngModel)]="nombre" required maxlength="80"></label>
      <label>Descripción<textarea name="descripcion" [(ngModel)]="descripcion" maxlength="200" rows="3"></textarea></label>
      <button [disabled]="f.invalid || !nombre.trim() || ocupado()">{{ ocupado() ? 'Procesando...' : 'Guardar categoría' }}</button>
      @if (id !== null) { <button type="button" class="secundario" [disabled]="ocupado()" (click)="limpiar()">Cancelar edición</button> }
    </form>
  </section><section class="panel"><h2>Catálogo</h2>
    ` +
    estado +
    `
    @if (aviso()) { <p class="exito" role="status">{{ aviso() }}</p> }
    @if (!cargando()) {
      @for (c of categorias(); track c.idCategoria) {
        <div class="fila"><div><strong>{{ c.nombre }}</strong><p>{{ c.descripcion || 'Sin descripción' }}</p></div>
          <div class="acciones"><button class="secundario" [disabled]="ocupado()" (click)="editar(c)">Editar</button>
            <button class="peligro" [disabled]="ocupado()" (click)="eliminar(c)">Eliminar</button></div></div>
      } @empty { <p>No hay categorías para mostrar.</p> }
    }
    <button class="secundario" (click)="cargar()" [disabled]="cargando() || ocupado()">Actualizar catálogo</button>
  </section></div>`,
})
export class Categorias extends Estado implements OnInit {
  categorias = signal<Categoria[]>([]);
  aviso = signal('');
  id: number | null = null;
  nombre = '';
  descripcion = '';
  ngOnInit() {
    this.cargar();
  }
  cargar() {
    this.cargando.set(true);
    this.error.set('');
    this.api
      .categorias()
      .pipe(finalize(() => this.cargando.set(false)))
      .subscribe({
        next: (c) => this.categorias.set(c),
        error: (e) => this.fallo(e),
      });
  }
  limpiar() {
    this.id = null;
    this.nombre = '';
    this.descripcion = '';
  }
  editar(c: Categoria) {
    this.id = c.idCategoria;
    this.nombre = c.nombre;
    this.descripcion = c.descripcion ?? '';
    this.error.set('');
    this.aviso.set('');
  }
  guardar() {
    if (this.ocupado() || !this.nombre.trim()) return;
    this.ocupado.set(true);
    this.error.set('');
    this.aviso.set('');
    this.api
      .guardarCategoria(this.id, this.nombre, this.descripcion)
      .pipe(finalize(() => this.ocupado.set(false)))
      .subscribe({
        next: () => {
          this.limpiar();
          this.aviso.set('Categoría guardada.');
          this.cargar();
        },
        error: (e) => this.fallo(e),
      });
  }
  eliminar(c: Categoria) {
    if (this.ocupado() || !confirm(`¿Eliminar la categoría "${c.nombre}"?`)) return;
    this.ocupado.set(true);
    this.error.set('');
    this.aviso.set('');
    this.api
      .eliminarCategoria(c.idCategoria)
      .pipe(finalize(() => this.ocupado.set(false)))
      .subscribe({
        next: () => {
          if (this.id === c.idCategoria) this.limpiar();
          this.aviso.set('Categoría eliminada.');
          this.cargar();
        },
        error: (e) => this.fallo(e),
      });
  }
}
