# Tareas API

Proyecto de la Unidad 2 de Aplicaciones Web. Es una API para llevar una lista de tareas, hecha con Node.js y Express. Cada usuario se registra, inicia sesión y solo ve sus propias tareas. Los datos se guardan en SQLite, se puede adjuntar un archivo a cada tarea y los cambios se avisan en tiempo real con Socket.io.

## Cómo correrlo

Necesitas Node 18 o más nuevo. Yo lo hice con Node 26.

```
npm install
npm test
npm start
```

El servidor queda en http://localhost:3000. La base de datos (`data.db`) y la carpeta `uploads` se crean solas la primera vez, no hay que configurar nada.

Si quieres cambiar el puerto o la clave de las sesiones, se hace con las variables `PORT` y `SESSION_SECRET`.

## Probar el tiempo real

Abre http://localhost:3000 en dos pestañas. En las dos registra o entra con el mismo usuario. Cuando creas una tarea en una pestaña, en la otra aparece sola una línea que empieza con `EVENTO tarea:creada`.

## Rutas

| Método | Ruta | Qué hace |
|---|---|---|
| POST | /api/auth/registro | Crea el usuario y abre la sesión |
| POST | /api/auth/login | Inicia sesión |
| GET | /api/auth/yo | Dice qué usuario tiene la sesión abierta |
| POST | /api/auth/logout | Cierra la sesión |
| GET | /api/tareas | Lista las tareas (acepta `estado`, `q`, `limite` y `pagina`) |
| POST | /api/tareas | Crea una tarea |
| GET | /api/tareas/:id | Trae una tarea |
| PUT | /api/tareas/:id | Reemplaza una tarea |
| PATCH | /api/tareas/:id | Cambia solo algunos campos |
| DELETE | /api/tareas/:id | Borra una tarea |
| POST | /api/tareas/:id/archivo | Sube un adjunto (pdf, png, jpg o txt, hasta 2 MB) |
| GET | /api/tareas/:id/archivo | Descarga el adjunto |

Todas las rutas de `/api/tareas` piden tener la sesión abierta, si no responden 401.

## Ejemplos

Crear una tarea:

```
POST /api/tareas
{ "titulo": "Entregar informe" }
```

Respuesta (201):

```
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

Los estados posibles son `pendiente`, `en_progreso` y `completada`.

## Errores

Todos los errores tienen la misma forma. Por ejemplo, al registrar un usuario que ya existe:

```
409
{ "error": { "codigo": "USUARIO_EXISTE", "mensaje": "Ese nombre de usuario ya está registrado" } }
```

Cuando falla una validación, también trae `detalles` con el campo que está mal.

## Conflictos al actualizar

Para evitar que dos peticiones se pisen, cada tarea tiene un número de `version`. Al hacer PUT o PATCH hay que mandar la versión que se leyó:

```
PATCH /api/tareas/1
{ "estado": "completada", "version": 1 }
```

Si alguien ya cambió esa tarea, la versión enviada quedó vieja y la API responde 409 con la versión actual, sin modificar nada.

## Eventos de Socket.io

Al iniciar sesión, el navegador se conecta y queda en una sala con su usuario. Los eventos son `tarea:creada`, `tarea:actualizada`, `tarea:eliminada` y `tarea:archivo`.

## Carpetas

```
src/routes         rutas de Express
src/services       lógica de las tareas y envío de eventos
src/repositories   consultas a SQLite
src/middleware     sesión y manejo de errores
src/validators.js  validaciones
public             página de prueba del tiempo real
test               pruebas
```

## Pruebas

`npm test` corre 11 pruebas con el ejecutor que trae Node. Revisan el 401 sin sesión, el registro, las validaciones, los 404, el conflicto de versión, la subida de archivos y el cierre de sesión.
