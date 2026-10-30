const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { abrirDb } = require('../src/db');
const { crearApp } = require('../src/app');
const { crearSesion } = require('../src/middleware/sesion');

let servidor, db, base, cookie = '';
const eventos = [];

async function api(metodo, ruta, cuerpo) {
  const opciones = { method: metodo, headers: { cookie } };
  if (cuerpo instanceof FormData) {
    opciones.body = cuerpo;
  } else if (cuerpo !== undefined) {
    opciones.headers['Content-Type'] = 'application/json';
    opciones.body = JSON.stringify(cuerpo);
  }
  const res = await fetch(base + ruta, opciones);
  const nuevaCookie = res.headers.get('set-cookie');
  if (nuevaCookie) cookie = nuevaCookie.split(';')[0];
  const texto = await res.text();
  return { status: res.status, cuerpo: texto ? JSON.parse(texto) : null };
}

before(async () => {
  db = abrirDb(':memory:');
  const app = crearApp({
    db,
    sesion: crearSesion(),
    emitir: (sala, evento, datos) => eventos.push({ sala, evento, datos }),
    dirSubidas: fs.mkdtempSync(path.join(os.tmpdir(), 'subidas-')),
  });
  await new Promise((resolver) => { servidor = app.listen(0, resolver); });
  base = `http://127.0.0.1:${servidor.address().port}`;
});

after(() => {
  servidor.closeAllConnections?.();
  servidor.close();
  db.close();
});

test('sin sesión devuelve 401 con formato uniforme de error', async () => {
  const r = await api('GET', '/api/tareas');
  assert.equal(r.status, 401);
  assert.equal(r.cuerpo.error.codigo, 'NO_AUTENTICADO');
});

test('registro valida los datos y crea la sesión', async () => {
  const mala = await api('POST', '/api/auth/registro', { nombre: 'ab', clave: '123' });
  assert.equal(mala.status, 422);
  const buena = await api('POST', '/api/auth/registro', { nombre: 'rosa', clave: 'secreto1' });
  assert.equal(buena.status, 201);
  const yo = await api('GET', '/api/auth/yo');
  assert.equal(yo.cuerpo.nombre, 'rosa');
});

test('crear tarea válida: 201 y evento en tiempo real', async () => {
  const r = await api('POST', '/api/tareas', { titulo: 'Entregar informe' });
  assert.equal(r.status, 201);
  assert.equal(r.cuerpo.estado, 'pendiente');
  assert.equal(r.cuerpo.version, 1);
  assert.equal(eventos.at(-1).evento, 'tarea:creada');
});

test('crear tarea inválida: 422 con detalles por campo', async () => {
  const r = await api('POST', '/api/tareas', { titulo: 'a', estado: 'otro' });
  assert.equal(r.status, 422);
  assert.equal(r.cuerpo.error.codigo, 'VALIDACION');
  assert.equal(r.cuerpo.error.detalles.length, 2);
});

test('obtener inexistente: 404 y id inválido: 400', async () => {
  assert.equal((await api('GET', '/api/tareas/999')).status, 404);
  assert.equal((await api('GET', '/api/tareas/abc')).status, 400);
});

test('listar con filtros', async () => {
  const r = await api('GET', '/api/tareas?estado=pendiente&q=informe');
  assert.equal(r.status, 200);
  assert.equal(r.cuerpo.length, 1);
  assert.equal((await api('GET', '/api/tareas?limite=500')).status, 422);
});

test('actualizar con versión correcta y conflicto con versión vieja', async () => {
  const ok = await api('PATCH', '/api/tareas/1', { estado: 'completada', version: 1 });
  assert.equal(ok.status, 200);
  assert.equal(ok.cuerpo.version, 2);
  const conflicto = await api('PATCH', '/api/tareas/1', { estado: 'pendiente', version: 1 });
  assert.equal(conflicto.status, 409);
  assert.equal(conflicto.cuerpo.error.codigo, 'CONFLICTO');
});

test('subir y descargar archivo adjunto', async () => {
  const form = new FormData();
  form.append('archivo', new Blob(['hola mundo'], { type: 'text/plain' }), 'nota.txt');
  const subida = await api('POST', '/api/tareas/1/archivo', form);
  assert.equal(subida.status, 200);
  assert.ok(subida.cuerpo.archivo.endsWith('.txt'));
  const descarga = await fetch(`${base}/api/tareas/1/archivo`, { headers: { cookie } });
  assert.equal(await descarga.text(), 'hola mundo');
});

test('rechaza tipos de archivo no permitidos', async () => {
  const form = new FormData();
  form.append('archivo', new Blob(['x'], { type: 'application/zip' }), 'a.zip');
  const r = await api('POST', '/api/tareas/1/archivo', form);
  assert.equal(r.status, 415);
});

test('eliminar: 204, luego 404, y evento emitido', async () => {
  assert.equal((await api('DELETE', '/api/tareas/1')).status, 204);
  assert.equal(eventos.at(-1).evento, 'tarea:eliminada');
  assert.equal((await api('GET', '/api/tareas/1')).status, 404);
});

test('logout cierra la sesión', async () => {
  assert.equal((await api('POST', '/api/auth/logout')).status, 204);
  assert.equal((await api('GET', '/api/tareas')).status, 401);
});