import { Component, inject, OnInit, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize, forkJoin } from 'rxjs';
import { Api, Categoria, Presupuesto, mensajeError } from './api';

@Component({
  standalone: true,
  imports: [DecimalPipe, FormsModule, RouterLink],
  templateUrl: './presupuestos.html',
})
export class Presupuestos implements OnInit {
  private api = inject(Api);
  private router = inject(Router);

  presupuestos = signal<Presupuesto[]>([]);
  categorias = signal<Categoria[]>([]);
  cargando = signal(false);
  ocupado = signal(false);
  listo = signal(false);
  error = signal('');
  aviso = signal('');

  id: number | null = null;
  nombre = '';
  idCategoria = 0;
  montoLimite: number | null = null;
  mes = this.mesActual();

  ngOnInit() {
    this.cargar();
  }

  cargar() {
    if (this.cargando()) return;
    this.cargando.set(true);
    this.listo.set(false);
    this.error.set('');
    forkJoin({ presupuestos: this.api.presupuestos(), categorias: this.api.categorias() })
      .pipe(finalize(() => this.cargando.set(false)))
      .subscribe({
        next: (datos) => {
          this.presupuestos.set(datos.presupuestos);
          this.categorias.set(datos.categorias);
          this.listo.set(true);
        },
        error: (error) => this.mostrarError(error),
      });
  }

  categoria(idCategoria: number) {
    return (
      this.categorias().find((c) => c.idCategoria === idCategoria)?.nombre ??
      'Categoría no disponible'
    );
  }

  editar(presupuesto: Presupuesto) {
    this.id = presupuesto.idPresupuesto;
    this.nombre = presupuesto.nombre;
    this.idCategoria = presupuesto.idCategoria;
    this.montoLimite = presupuesto.montoLimite;
    this.mes = presupuesto.mes.slice(0, 7);
    this.error.set('');
    this.aviso.set('');
  }

  limpiar() {
    this.id = null;
    this.nombre = '';
    this.idCategoria = 0;
    this.montoLimite = null;
    this.mes = this.mesActual();
  }

  guardar() {
    if (this.ocupado() || !this.listo()) return;
    this.error.set('');
    this.aviso.set('');

    const nombre = this.nombre.trim();
    const monto = this.montoLimite;
    if (
      !nombre ||
      nombre.length > 100 ||
      !this.categorias().some((c) => c.idCategoria === this.idCategoria)
    ) {
      this.error.set(
        'Escribe un nombre de hasta 100 caracteres y selecciona una categoría del catálogo.',
      );
      return;
    }
    if (
      monto === null ||
      !Number.isFinite(monto) ||
      monto < 0.01 ||
      monto > 9999999999.99 ||
      Math.abs(monto * 100 - Math.round(monto * 100)) > 0.0001
    ) {
      this.error.set(
        'El límite debe ser positivo, no superar 9999999999.99 y tener hasta dos decimales.',
      );
      return;
    }
    if (!/^[0-9]{4}-(0[1-9]|1[0-2])$/.test(this.mes) || Number(this.mes.slice(0, 4)) < 1) {
      this.error.set('Selecciona un mes válido.');
      return;
    }

    this.ocupado.set(true);
    this.api
      .guardarPresupuesto(this.id, {
        nombre,
        idCategoria: this.idCategoria,
        montoLimite: monto,
        mes: `${this.mes}-01`,
      })
      .pipe(finalize(() => this.ocupado.set(false)))
      .subscribe({
        next: () => {
          this.limpiar();
          this.aviso.set('Presupuesto guardado correctamente.');
          this.cargar();
        },
        error: (error) => this.mostrarError(error),
      });
  }

  eliminar(presupuesto: Presupuesto) {
    if (this.ocupado() || !confirm(`¿Eliminar el presupuesto "${presupuesto.nombre}"?`)) return;
    this.ocupado.set(true);
    this.error.set('');
    this.aviso.set('');
    this.api
      .eliminarPresupuesto(presupuesto.idPresupuesto)
      .pipe(finalize(() => this.ocupado.set(false)))
      .subscribe({
        next: () => {
          if (this.id === presupuesto.idPresupuesto) this.limpiar();
          this.aviso.set('Presupuesto eliminado correctamente.');
          this.cargar();
        },
        error: (error) => this.mostrarError(error),
      });
  }

  private mostrarError(error: HttpErrorResponse) {
    this.error.set(mensajeError(error));
    if (error.status === 401) {
      this.api.usuario.set(null);
      void this.router.navigateByUrl('/login');
    }
  }

  private mesActual() {
    const fecha = new Date();
    return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
  }
}
