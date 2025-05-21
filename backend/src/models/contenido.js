const db = require('../config/db');

class ContenidoModel {
  
  // Función existente para crear contenido local
  async crear({ postId, tipo, url, orden, nombreArchivo, tamano }) {
    const query = `
      INSERT INTO contenidos (post_id, tipo, url, orden, nombre_archivo, tamano)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    
    const values = [postId, tipo, url, orden, nombreArchivo, tamano];
    const result = await db.query(query, values);
    return result.rows[0];
  }
  
  // Nueva función para crear contenido desde Firebase
  async crearFirebase({ postId, tipo, url, orden, nombreArchivo, tamano, firebase_path }) {
    const query = `
      INSERT INTO contenidos (post_id, tipo, url, orden, nombre_archivo, tamano, firebase_path)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    
    const values = [postId, tipo, url, orden, nombreArchivo, tamano, firebase_path];
    const result = await db.query(query, values);
    return result.rows[0];
  }
  
  // Función existente
  async obtenerPorPostId(postId) {
    const query = `
      SELECT * FROM contenidos 
      WHERE post_id = $1 
      ORDER BY orden ASC
    `;
    
    const result = await db.query(query, [postId]);
    return result.rows;
  }
  
  // Nueva función para obtener contenido con información completa del post
  async obtenerConCompleto(contenidoId) {
    const query = `
      SELECT c.*, p.usuario_id 
      FROM contenidos c
      JOIN posts p ON c.post_id = p.id
      WHERE c.id = $1
    `;
    
    const result = await db.query(query, [contenidoId]);
    return result.rows[0];
  }
  
  // Función existente para eliminar
  async eliminar(id) {
    const query = 'DELETE FROM contenidos WHERE id = $1';
    await db.query(query, [id]);
  }
  
  // Nueva función para obtener contenidos de Firebase de un usuario
  async obtenerFirebaseContenidosPorUsuario(usuarioId) {
    const query = `
      SELECT c.* 
      FROM contenidos c
      JOIN posts p ON c.post_id = p.id
      WHERE p.usuario_id = $1 AND c.firebase_path IS NOT NULL
    `;
    
    const result = await db.query(query, [usuarioId]);
    return result.rows;
  }
  
  // Nueva función para obtener estadísticas de almacenamiento
  async obtenerEstadisticasUsuario(usuarioId) {
    const query = `
      SELECT 
        COUNT(*) as total_archivos,
        SUM(tamano) as tamano_total,
        COUNT(CASE WHEN firebase_path IS NOT NULL THEN 1 END) as archivos_firebase,
        COUNT(CASE WHEN firebase_path IS NULL THEN 1 END) as archivos_locales
      FROM contenidos c
      JOIN posts p ON c.post_id = p.id
      WHERE p.usuario_id = $1
    `;
    
    const result = await db.query(query, [usuarioId]);
    return result.rows[0];
  }
}

module.exports = new ContenidoModel();