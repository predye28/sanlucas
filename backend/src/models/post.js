const db = require('../config/db');

const postModel = {
  async crear({ titulo, descripcion, usuarioId }) {
    const query = `
      INSERT INTO posts (usuario_id, titulo, descripcion)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    
    const values = [usuarioId, titulo, descripcion];
    const result = await db.query(query, values);
    return result.rows[0];
  },
  
  async obtenerPorId(id) {
    const query = `
      SELECT p.*, u.username 
      FROM posts p
      JOIN usuarios u ON p.usuario_id = u.id
      WHERE p.id = $1 AND p.estado = 'activo'
    `;
    
    const result = await db.query(query, [id]);
    return result.rows[0];
  },
  
  async obtenerPorUsuario(usuarioId) {
    const query = `
      SELECT p.*, 
        (SELECT COUNT(*) FROM contenidos WHERE post_id = p.id) AS contenido_count
      FROM posts p
      WHERE p.usuario_id = $1 AND p.estado = 'activo'
      ORDER BY p.fecha_creacion DESC
    `;
    
    const result = await db.query(query, [usuarioId]);
    return result.rows;
  },
  
  async eliminar(id) {
    // Soft delete (cambiar estado)
    const query = `
      UPDATE posts 
      SET estado = 'eliminado' 
      WHERE id = $1
      RETURNING *
    `;
    
    const result = await db.query(query, [id]);
    return result.rows[0];
  }
};

module.exports = postModel;