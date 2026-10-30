const express = require('express');
const multer = require('multer');
const fs = require('node:fs');
const { randomUUID } = require('node:crypto');
const { ErrorApi } = require('../errores');
const { validarFiltros, parsearId } = require('../validators');
const { requiereSesion } = require('../middleware/sesion');

const TIPOS = { 'application/pdf': '.pdf', 'image/png': '.png', 'image/jpeg': '.jpg', 'text/plain': '.txt' };

function leerId(req) {
  const id = parsearId(req.params.id);
  if (id === null) {
    throw new ErrorApi(400, 'ID_INVALIDO', 'El id debe ser un entero positivo');
  }
  return id;
}

function crearRutasTareas({ servicio, dirSubidas }) {
  fs.mkdirSync(dirSubidas, { recursive: true });

  const subir = multer({
    storage: multer.diskStorage({
      destination: dirSubidas,
      filename: (req, file, cb) => cb(null, randomUUID() + TIPOS[file.mimetype]),
    }),
    limits: { fileSize: 2 * 1024 * 1024, files: 1 },
    fileFilter: (req, file, cb) =>
      TIPOS[file.mimetype]
        ? cb(null, true)
        : cb(new ErrorApi(415, 'TIPO_NO_PERMITIDO', 'Solo se permite pdf, png, jpg o txt')),
  });

  const router = express.Router();
  router.use(requiereSesion);

  router.get('/', (req, res) => {
    const { errores, filtros } = validarFiltros(req.query);
    if (errores.length) throw new ErrorApi(422, 'VALIDACION', 'Parámetros inválidos', errores);
    res.json(servicio.listar(req.session.usuarioId, filtros));
  });

  router.post('/', (req, res) => {
    res.status(201).json(servicio.crear(req.session.usuarioId, req.body ?? {}));
  });

  router.get('/:id', (req, res) => {
    res.json(servicio.obtener(leerId(req), req.session.usuarioId));
  });

  router.put('/:id', (req, res) => {
    res.json(servicio.actualizar(leerId(req), req.session.usuarioId, req.body ?? {}, { parcial: false }));
  });

  router.patch('/:id', (req, res) => {
    res.json(servicio.actualizar(leerId(req), req.session.usuarioId, req.body ?? {}, { parcial: true }));
  });

  router.delete('/:id', (req, res) => {
    servicio.eliminar(leerId(req), req.session.usuarioId);
    res.status(204).end();
  });

  router.post('/:id/archivo', subir.single('archivo'), (req, res) => {
    if (!req.file) {
      throw new ErrorApi(422, 'VALIDACION', 'Debes enviar un archivo en el campo "archivo"');
    }
    try {
      res.json(servicio.adjuntar(leerId(req), req.session.usuarioId, req.file.filename));
    } catch (e) {
      fs.unlink(req.file.path, () => {});
      throw e;
    }
  });

  router.get('/:id/archivo', (req, res) => {
    res.download(servicio.rutaArchivo(leerId(req), req.session.usuarioId));
  });

  return router;
}

module.exports = { crearRutasTareas };