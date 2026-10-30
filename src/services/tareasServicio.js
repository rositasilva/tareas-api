const fs = require('node:fs');
const path = require('node:path');
const { ErrorApi } = require('../errores');
const { validarTarea } = require('../validators');

const sala = (usuarioId) => `usuario:${usuarioId}`;

function crearTareasServicio({ repo, emitir, dirSubidas }) {
  function obtenerOFallar(id, usuarioId) {
    const tarea = repo.obtener(id, usuarioId);
    if (!tarea) throw new ErrorApi(404, 'NO_ENCONTRADO', `No existe la tarea ${id}`);
    return tarea;
  }

  function exigirValida(entrada, opciones) {
    const { errores, datos } = validarTarea(entrada, opciones);
    if (errores.length) throw new ErrorApi(422, 'VALIDACION', 'Datos de entrada inválidos', errores);
    return datos;
  }

  return {
    listar: (usuarioId, filtros) => repo.listar(usuarioId, filtros),

    obtener: obtenerOFallar,

    crear(usuarioId, entrada) {
      const datos = exigirValida(entrada);
      const tarea = repo.crear({ ...datos, usuarioId });
      emitir(sala(usuarioId), 'tarea:creada', tarea);
      return tarea;
    },

    actualizar(id, usuarioId, entrada, { parcial }) {
      const version = entrada?.version;
      if (!Number.isInteger(version)) {
        throw new ErrorApi(422, 'VALIDACION', 'Datos de entrada inválidos', [
          { campo: 'version', mensaje: 'Debes enviar la versión que leíste (entero)' },
        ]);
      }
      const existente = obtenerOFallar(id, usuarioId);
      const datos = exigirValida(entrada, { parcial });
      const nueva = { ...existente, ...datos };
      const ok = repo.actualizar({ ...nueva, id, usuarioId, version });
      if (!ok) {
        throw new ErrorApi(409, 'CONFLICTO', 'La tarea fue modificada por otra petición', {
          versionActual: existente.version,
        });
      }
      const tarea = repo.obtener(id, usuarioId);
      emitir(sala(usuarioId), 'tarea:actualizada', tarea);
      return tarea;
    },

    eliminar(id, usuarioId) {
      const existente = obtenerOFallar(id, usuarioId);
      repo.borrar(id, usuarioId);
      if (existente.archivo) fs.unlink(path.join(dirSubidas, existente.archivo), () => {});
      emitir(sala(usuarioId), 'tarea:eliminada', { id });
    },

    adjuntar(id, usuarioId, nombreArchivo) {
      const existente = obtenerOFallar(id, usuarioId);
      if (existente.archivo) fs.unlink(path.join(dirSubidas, existente.archivo), () => {});
      const tarea = repo.asignarArchivo(id, usuarioId, nombreArchivo);
      emitir(sala(usuarioId), 'tarea:archivo', tarea);
      return tarea;
    },

    rutaArchivo(id, usuarioId) {
      const tarea = obtenerOFallar(id, usuarioId);
      if (!tarea.archivo) throw new ErrorApi(404, 'NO_ENCONTRADO', 'La tarea no tiene archivo adjunto');
      return path.join(dirSubidas, tarea.archivo);
    },
  };
}

module.exports = { crearTareasServicio };