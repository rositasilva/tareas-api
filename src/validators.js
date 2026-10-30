const ESTADOS = ['pendiente', 'en_progreso', 'completada'];

function validarTarea(entrada, { parcial = false } = {}) {
  const e = entrada && typeof entrada === 'object' ? entrada : {};
  const errores = [];
  const datos = {};

  if ('titulo' in e || !parcial) {
    if (typeof e.titulo !== 'string' || e.titulo.trim().length < 3 || e.titulo.trim().length > 100) {
      errores.push({ campo: 'titulo', mensaje: 'Debe ser texto de 3 a 100 caracteres' });
    } else {
      datos.titulo = e.titulo.trim();
    }
  }

  if ('descripcion' in e) {
    if (typeof e.descripcion !== 'string' || e.descripcion.length > 500) {
      errores.push({ campo: 'descripcion', mensaje: 'Debe ser texto de hasta 500 caracteres' });
    } else {
      datos.descripcion = e.descripcion.trim();
    }
  } else if (!parcial) {
    datos.descripcion = '';
  }

  if ('estado' in e) {
    if (!ESTADOS.includes(e.estado)) {
      errores.push({ campo: 'estado', mensaje: `Debe ser uno de: ${ESTADOS.join(', ')}` });
    } else {
      datos.estado = e.estado;
    }
  } else if (!parcial) {
    datos.estado = 'pendiente';
  }

  return { errores, datos };
}

function validarCredenciales(entrada) {
  const e = entrada && typeof entrada === 'object' ? entrada : {};
  const errores = [];
  if (typeof e.nombre !== 'string' || e.nombre.trim().length < 3 || e.nombre.trim().length > 30) {
    errores.push({ campo: 'nombre', mensaje: 'Debe ser texto de 3 a 30 caracteres' });
  }
  if (typeof e.clave !== 'string' || e.clave.length < 6 || e.clave.length > 100) {
    errores.push({ campo: 'clave', mensaje: 'Debe tener entre 6 y 100 caracteres' });
  }
  return { errores, datos: { nombre: String(e.nombre ?? '').trim(), clave: String(e.clave ?? '') } };
}

function validarFiltros(query) {
  const errores = [];
  const estado = query.estado ?? null;
  if (estado !== null && !ESTADOS.includes(estado)) {
    errores.push({ campo: 'estado', mensaje: `Debe ser uno de: ${ESTADOS.join(', ')}` });
  }
  const limite = query.limite === undefined ? 10 : Number(query.limite);
  if (!Number.isInteger(limite) || limite < 1 || limite > 50) {
    errores.push({ campo: 'limite', mensaje: 'Debe ser un entero entre 1 y 50' });
  }
  const pagina = query.pagina === undefined ? 1 : Number(query.pagina);
  if (!Number.isInteger(pagina) || pagina < 1) {
    errores.push({ campo: 'pagina', mensaje: 'Debe ser un entero mayor o igual a 1' });
  }
  const q = typeof query.q === 'string' && query.q.trim() ? `%${query.q.trim()}%` : null;
  return { errores, filtros: { estado, q, limite, offset: (pagina - 1) * limite } };
}

function parsearId(valor) {
  const n = Number(valor);
  return Number.isInteger(n) && n > 0 ? n : null;
}

module.exports = { ESTADOS, validarTarea, validarCredenciales, validarFiltros, parsearId };