const { ErrorApi } = require('../errores');

function noEncontrada(req, res, next) {
  next(new ErrorApi(404, 'RUTA_NO_ENCONTRADA', `No existe ${req.method} ${req.originalUrl}`));
}

function manejarErrores(err, req, res, next) {
  let e = err;
  if (!(e instanceof ErrorApi)) {
    if (err.type === 'entity.parse.failed') {
      e = new ErrorApi(400, 'JSON_INVALIDO', 'El cuerpo no es un JSON válido');
    } else if (err.code === 'LIMIT_FILE_SIZE') {
      e = new ErrorApi(413, 'ARCHIVO_GRANDE', 'El archivo supera los 2 MB');
    } else if (err.name === 'MulterError') {
      e = new ErrorApi(400, 'ARCHIVO_INVALIDO', err.message);
    } else {
      console.error(err);
      e = new ErrorApi(500, 'ERROR_INTERNO', 'Error interno del servidor');
    }
  }
  const error = { codigo: e.codigo, mensaje: e.message };
  if (e.detalles !== undefined) error.detalles = e.detalles;
  res.status(e.status).json({ error });
}

module.exports = { noEncontrada, manejarErrores };