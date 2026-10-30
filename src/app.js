const express = require('express');
const path = require('node:path');
const { crearUsuariosRepo } = require('./repositories/usuariosRepo');
const { crearTareasRepo } = require('./repositories/tareasRepo');
const { crearTareasServicio } = require('./services/tareasServicio');
const { crearRutasAuth } = require('./routes/auth');
const { crearRutasTareas } = require('./routes/tareas');
const { noEncontrada, manejarErrores } = require('./middleware/errores');

function crearApp({ db, sesion, emitir = () => {}, dirSubidas = path.join(__dirname, '..', 'uploads') }) {
  const app = express();
  const usuarios = crearUsuariosRepo(db);
  const servicio = crearTareasServicio({ repo: crearTareasRepo(db), emitir, dirSubidas });

  app.use(express.json({ limit: '100kb' }));
  app.use(sesion);
  app.use(express.static(path.join(__dirname, '..', 'public')));

  app.use('/api/auth', crearRutasAuth({ usuarios }));
  app.use('/api/tareas', crearRutasTareas({ servicio, dirSubidas }));

  app.use(noEncontrada);
  app.use(manejarErrores);
  return app;
}

module.exports = { crearApp };