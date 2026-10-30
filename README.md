# API de Tareas (Unidad 2, Aplicaciones Web)

API REST para gestionar tareas, hecha con Node.js y Express. Incluye persistencia en SQLite, sesiones con cookies, subida de un archivo adjunto por tarea y eventos en tiempo real con Socket.io.

## Requisitos

- Node.js 18 o superior

## Instalación y uso

```
npm install
```

```
npm test
```

```
npm start
```

El servidor queda en `http://localhost:3000`. Esa misma dirección muestra una página de demostración del tiempo real: abre dos pestañas, entra con el mismo usuario y crea una tarea en una; en la otra aparece el evento solo.

## Estructura

```
src/
  errores.js          clase de error con código HTTP
  validators.js       validaciones (funciones puras)
  db.js               conexión y esquema de SQLite
  repositories/       consultas a la base de datos
  services/           lógica de negocio y eventos
  routes/             rutas de Express
  middleware/         sesión y manejo de errores
  app.js              arma la aplicación
  server.js           servidor HTTP y Socket.io
public/index.html     demo del tiempo real
test/api.test.js      pruebas con el test runner de Node
```

## Endpoints

| Método | Ruta | Descripción | Códigos |
|---|---|---|---|
| POST | /api/auth/registro | Crea usuario e inicia sesión | 201, 409, 422 |
| POST | /api/auth/login | Inicia sesión | 200, 401, 422 |
| GET | /api/auth/yo | Usuario de la sesión | 200, 401 |
| POST | /api/auth/logout | Cierra la sesión | 204, 401 |
| GET | /api/tareas | Lista con filtros `estado`, `q`, `limite`, `pagina` | 200, 401, 422 |
| POST | /api/tareas | Crea una tarea | 201, 401, 422 |
| GET | /api/tareas/:id | Obtiene una tarea | 200, 400, 404 |
| PUT | /api/tareas/:id | Reemplaza una tarea (exige `version`) | 200, 404, 409, 422 |
| PATCH | /api/tareas/:id | Actualiza campos (exige `version`) | 200, 404, 409, 422 |
| DELETE | /api/tareas/:id | Elimina una tarea | 204, 404 |
| POST | /api/tareas/:id/archivo | Adjunta pdf, png, jpg o txt (máx. 2 MB) | 200, 413, 415 |
| GET | /api/tareas/:id/archivo | Descarga el adjunto | 200, 404 |

## Formato de errores

Todos los errores tienen la misma forma:

```json
{
  "error": {
    "codigo": "VALIDACION",
    "mensaje": "Datos de entrada inválidos",
    "detalles": [
      { "campo": "titulo", "mensaje": "Debe ser texto de 3 a 100 caracteres" }
    ]
  }
}
```

## Ejemplos

Registro:

```
POST /api/auth/registro
{ "nombre": "rosa", "clave": "secreto1" }
```

```
201
{ "id": 1, "nombre": "rosa" }
```

Crear tarea:

```
POST /api/tareas
{ "titulo": "Entregar informe" }
```

```
201
{
  "id": 1,
  "titulo": "Entregar informe",
  "descripcion": "",
  "estado": "pendiente",
  "version": 1,
  "archivo": null,
  "usuario_id": 1,
  "creada_en": "2026-10-30 03:15:15",
  "actualizada_en": "2026-10-30 03:15:15"
}
```

Actualizar con control de versión:

```
PATCH /api/tareas/1
{ "estado": "completada", "version": 1 }
```

Si otra petición ya cambió la tarea, la versión enviada queda vieja y la respuesta es:

```
409
{ "error": { "codigo": "CONFLICTO", "mensaje": "La tarea fue modificada por otra petición", "detalles": { "versionActual": 2 } } }
```

## Tiempo real

Al iniciar sesión, el cliente se conecta con Socket.io y entra a una sala propia. Los eventos que recibe son `tarea:creada`, `tarea:actualizada`, `tarea:eliminada` y `tarea:archivo`.

## Decisiones de diseño

- Consultas parametrizadas en SQLite, sin concatenar texto.
- Conflictos resueltos con un campo `version` (control de concurrencia optimista).
- Contraseñas guardadas con `scrypt` y sal propia.
- Validaciones separadas de las operaciones de entrada y salida.
- Cada usuario solo ve y modifica sus propias tareas.
