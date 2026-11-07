# Endpoints de MiBalance

Base local: http://localhost:5298
Autenticación por cookie. Las rutas de categorías y transacciones exigen sesión.
Los cuerpos de POST y PUT usan JSON.

| Método | Ruta | Descripción |
|---|---|---|
| POST | /api/auth/registro | Registrar usuario; la API almacena un hash de contraseña. |
| POST | /api/auth/login | Iniciar sesión y emitir cookie. |
| GET | /api/auth/me | Consultar el usuario autenticado. |
| POST | /api/auth/logout | Cerrar sesión. |
| GET | /api/categorias | Listar el catálogo compartido almacenado en SQL Server. |
| GET | /api/categorias/{id} | Consultar categoría. |
| POST | /api/categorias | Crear categoría de nombre único. |
| PUT | /api/categorias/{id} | Actualizar categoría. |
| DELETE | /api/categorias/{id} | Eliminar categoría sin transacciones asociadas. |
| GET | /api/transacciones | Listar movimientos del usuario autenticado. |
| GET | /api/transacciones/{id} | Consultar movimiento propio. |
| POST | /api/transacciones | Crear ingreso o gasto para el usuario de la sesión. |
| PUT | /api/transacciones/{id} | Editar movimiento propio. |
| DELETE | /api/transacciones/{id} | Eliminar movimiento propio. |
| GET | /api/conexion | Diagnóstico de SQL Server, solo en desarrollo. |

## Ejemplos

Registro: `{ "nombre": "Nombre", "correo": "persona@example.com", "password": "UnaClaveDePrueba123!" }`.
Login: `{ "correo": "persona@example.com", "password": "UnaClaveDePrueba123!" }`.
Categoría: `{ "nombre": "Alimentación", "descripcion": "Compras de comida" }`.
Movimiento: `{ "idCategoria": 1, "tipo": "GASTO", "monto": 75.50, "fecha": "2026-11-06", "descripcion": "Supermercado" }`.
El identificador de categoría debe existir. No se envía IdUsuario: se obtiene de la sesión.

Respuestas: 200 consulta exitosa, 201 creación, 204 edición/eliminación sin cuerpo,
400 validación, 401 sin sesión o credenciales inválidas, 404 recurso no disponible,
409 duplicado o restricción, 503 diagnóstico de conexión fallido.
