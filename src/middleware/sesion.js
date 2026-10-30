const session = require('express-session');
const { ErrorApi } = require('../errores');

function crearSesion() {
  return session({
    secret: process.env.SESSION_SECRET || 'cambia-esto-en-produccion',
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, sameSite: 'lax', maxAge: 1000 * 60 * 60 },
  });
}

function requiereSesion(req, res, next) {
  if (!req.session?.usuarioId) {
    return next(new ErrorApi(401, 'NO_AUTENTICADO', 'Debes iniciar sesión'));
  }
  next();
}

module.exports = { crearSesion, requiereSesion };