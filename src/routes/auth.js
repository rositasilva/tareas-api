const express = require('express');
const { scryptSync, randomBytes, timingSafeEqual } = require('node:crypto');
const { ErrorApi } = require('../errores');
const { validarCredenciales } = require('../validators');
const { requiereSesion } = require('../middleware/sesion');

const generarHash = (clave, sal) => scryptSync(clave, sal, 64).toString('hex');

function claveCorrecta(clave, usuario) {
  const esperado = Buffer.from(usuario.hash, 'hex');
  const actual = Buffer.from(generarHash(clave, usuario.sal), 'hex');
  return esperado.length === actual.length && timingSafeEqual(esperado, actual);
}

function iniciarSesion(req, res, next, usuario, status) {
  req.session.regenerate((err) => {
    if (err) return next(err);
    req.session.usuarioId = usuario.id;
    req.session.nombre = usuario.nombre;
    res.status(status).json({ id: usuario.id, nombre: usuario.nombre });
  });
}

function crearRutasAuth({ usuarios }) {
  const router = express.Router();

  router.post('/registro', (req, res, next) => {
    const { errores, datos } = validarCredenciales(req.body ?? {});
    if (errores.length) throw new ErrorApi(422, 'VALIDACION', 'Datos de entrada inválidos', errores);
    if (usuarios.porNombre(datos.nombre)) {
      throw new ErrorApi(409, 'USUARIO_EXISTE', 'Ese nombre de usuario ya está registrado');
    }
    const sal = randomBytes(16).toString('hex');
    const usuario = usuarios.crear({ nombre: datos.nombre, hash: generarHash(datos.clave, sal), sal });
    iniciarSesion(req, res, next, usuario, 201);
  });

  router.post('/login', (req, res, next) => {
    const { errores, datos } = validarCredenciales(req.body ?? {});
    if (errores.length) throw new ErrorApi(422, 'VALIDACION', 'Datos de entrada inválidos', errores);
    const usuario = usuarios.porNombre(datos.nombre);
    if (!usuario || !claveCorrecta(datos.clave, usuario)) {
      throw new ErrorApi(401, 'CREDENCIALES_INVALIDAS', 'Usuario o clave incorrectos');
    }
    iniciarSesion(req, res, next, usuario, 200);
  });

  router.get('/yo', requiereSesion, (req, res) => {
    res.json({ id: req.session.usuarioId, nombre: req.session.nombre });
  });

  router.post('/logout', requiereSesion, (req, res, next) => {
    req.session.destroy((err) => {
      if (err) return next(err);
      res.clearCookie('connect.sid');
      res.status(204).end();
    });
  });

  return router;
}

module.exports = { crearRutasAuth };