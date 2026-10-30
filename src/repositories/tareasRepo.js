function crearTareasRepo(db) {
  const sqlListar = db.prepare(`
    SELECT * FROM tareas
    WHERE usuario_id = @usuarioId
      AND (@estado IS NULL OR estado = @estado)
      AND (@q IS NULL OR titulo LIKE @q)
    ORDER BY id DESC
    LIMIT @limite OFFSET @offset
  `);
  const sqlObtener = db.prepare('SELECT * FROM tareas WHERE id = ? AND usuario_id = ?');
  const sqlCrear = db.prepare(`
    INSERT INTO tareas (titulo, descripcion, estado, usuario_id)
    VALUES (@titulo, @descripcion, @estado, @usuarioId)
  `);
  const sqlActualizar = db.prepare(`
    UPDATE tareas
    SET titulo = @titulo, descripcion = @descripcion, estado = @estado,
        version = version + 1, actualizada_en = datetime('now')
    WHERE id = @id AND usuario_id = @usuarioId AND version = @version
  `);
  const sqlArchivo = db.prepare(`
    UPDATE tareas
    SET archivo = @archivo, version = version + 1, actualizada_en = datetime('now')
    WHERE id = @id AND usuario_id = @usuarioId
  `);
  const sqlBorrar = db.prepare('DELETE FROM tareas WHERE id = ? AND usuario_id = ?');

  const obtener = (id, usuarioId) => sqlObtener.get(id, usuarioId);

  return {
    listar: (usuarioId, { estado, q, limite, offset }) =>
      sqlListar.all({ usuarioId, estado, q, limite, offset }),
    obtener,
    crear: ({ titulo, descripcion, estado, usuarioId }) => {
      const info = sqlCrear.run({ titulo, descripcion, estado, usuarioId });
      return obtener(Number(info.lastInsertRowid), usuarioId);
    },
    // devuelve true si actualizó; false si la versión ya no coincide
    actualizar: ({ id, usuarioId, version, titulo, descripcion, estado }) =>
      sqlActualizar.run({ id, usuarioId, version, titulo, descripcion, estado }).changes === 1,
    asignarArchivo: (id, usuarioId, archivo) => {
      sqlArchivo.run({ id, usuarioId, archivo });
      return obtener(id, usuarioId);
    },
    borrar: (id, usuarioId) => sqlBorrar.run(id, usuarioId).changes === 1,
  };
}

module.exports = { crearTareasRepo };