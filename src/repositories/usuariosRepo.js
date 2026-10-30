function crearUsuariosRepo(db) {
  const sqlPorNombre = db.prepare('SELECT * FROM usuarios WHERE nombre = ?');
  const sqlCrear = db.prepare('INSERT INTO usuarios (nombre, hash, sal) VALUES (@nombre, @hash, @sal)');

  return {
    porNombre: (nombre) => sqlPorNombre.get(nombre),
    crear: ({ nombre, hash, sal }) => {
      const info = sqlCrear.run({ nombre, hash, sal });
      return { id: Number(info.lastInsertRowid), nombre };
    },
  };
}

module.exports = { crearUsuariosRepo };