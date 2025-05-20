const db = require('../config/db');

const contenidoModel = {
  async crear({ postId, tipo, url, orden, nombreArchivo, tamano }) {
    const query = `
      INSERT INTO contenidos (post_id, tipo, url, orden, nombre_archivo, tamano)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    
    const values = [postId, tipo, url, orden, nombreArchivo, tamano];
    const result = await db.query(query, values);
    return result.rows[0];
  },
  
  async obtenerPorPostId(postId) {
    const query = `
      SELECT * FROM contenidos
      WHERE post_id = $1
      ORDER BY orden ASC
    `;
    
    const result = await db.query(query, [postId]);
    return result.rows;
  },
  
  async eliminar(id) {
    const query = 'DELETE FROM contenidos WHERE id = $1 RETURNING *';
    const result = await db.query(query, [id]);
    return result.rows[0];
  }
};

module.exports = contenidoModel;