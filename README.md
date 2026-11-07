# MiBalance — Fase 3

Aplicación de ingresos y gastos con Angular 21, ASP.NET Core (.NET 10) y SQL Server.

## Pantallas

1. `/login`: iniciar sesión y crear una cuenta.
2. `/dashboard`: ingresos, gastos, saldo y movimientos recientes.
3. `/transacciones`: listado, búsqueda, filtro por tipo y eliminación con confirmación.
4. `/transacciones/nueva` y `/transacciones/:id/editar`: formulario de creación y edición.
5. `/transacciones/:id`: detalle de un movimiento.
6. `/categorias`: crear, consultar, editar y eliminar categorías.

Las categorías son compartidas. Cada usuario solo administra sus propias transacciones.
La API exige autenticación y verifica el propietario. Angular verifica la sesión al entrar a rutas protegidas.

## Requisitos

- SDK .NET 10.
- Node.js compatible con Angular 21, por ejemplo 22.15.0, y npm.
- SQL Server 2019 o posterior, con acceso mediante autenticación de Windows.

## Base de datos

Si ya tienes MiBalance, conserva tu base actual y su configuración.
Para una instalación nueva, ejecuta `database/MiBalance.sql` en SQL Server Management Studio.
El script crea los objetos faltantes y no borra datos. No modifica tablas existentes con otro esquema.
No ejecutar migraciones para recrear las tablas.

En `MiBalance.Api/appsettings.json`, configura `ConnectionStrings:DefaultConnection` con tu nombre de servidor.
La configuración incluida conserva la instancia local del proyecto original y usa el usuario de Windows que ejecuta la API.
En JSON, el separador de la instancia se escribe con dos barras invertidas.

## Arranque: dos terminales

Desde la carpeta MiBalance, en la primera terminal:

```powershell
cd MiBalance.Api
dotnet restore
dotnet run --launch-profile http
```

En otra terminal desde MiBalance:

```powershell
cd mibalance-web
npm ci
npm start
```

Abrir http://localhost:4200. La API escucha en http://localhost:5298.
`npm start` incluye el proxy de desarrollo hacia la API para conservar la cookie de sesión.
No necesitas ejecutar XAMPP para estos dos procesos.
Crear una cuenta desde la interfaz o ingresar con un usuario previamente registrado por esta API.
Las sesiones del navegador y Postman son independientes.

## Compilar

```powershell
# Dentro de mibalance-web
npm run build
# Dentro de MiBalance.Api
dotnet build
```

Pruebas de frontend: `npm test -- --watch=false`.
Incluyen credenciales y cookie, conflicto de categorías, validación decimal y filtros.

## Verificar antes de entregar

- Crear una cuenta e iniciar sesión.
- Crear y editar una categoría temporal.
- Crear un ingreso y un gasto asociados a una categoría existente.
- Consultar listado y detalle; editar monto y descripción.
- Revisar los totales del dashboard.
- Comprobar que el nombre de categoría duplicado y el monto inválido sean rechazados.
- Comprobar que no se puede eliminar una categoría con transacciones.
- Eliminar los movimientos temporales y luego la categoría temporal.
- Cerrar sesión y comprobar que las rutas protegidas llevan al login.
- Entrar con otra cuenta y comprobar que no vea los movimientos de la primera.
- Probar también con pantalla estrecha.

El resumen usa todos los movimientos, sin filtro de mes. El saldo es ingresos menos gastos.
No se establece moneda porque el esquema original no contiene una columna de moneda.

## Estado de la verificación en el entorno de edición

La compilación de producción del frontend se verificó. El entorno no pudo iniciar los trabajadores del ejecutor de pruebas de Vitest, por lo que no se reportan pruebas aprobadas.
La instancia SQL Server del equipo no fue accesible desde el entorno de edición: el CRUD completo con esa base debe comprobarse con los pasos anteriores.

## Entrega

Incluir este código fuente, script SQL y documentación. No incluir node_modules, .angular, bin ni obj.
El proxy es para desarrollo. Una publicación en hosting requiere servir `/api` desde el backend y configurar HTTPS y las rutas de Angular en el servidor elegido.

El backend también compiló con 0 errores. NuGet emitió advertencias porque el entorno no pudo consultar su servicio de vulnerabilidades. Las pruebas HTTP locales no pudieron ejecutarse porque el entorno denegó el uso de sockets.
