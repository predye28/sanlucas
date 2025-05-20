// backend/src/models/usuario.js
const db = require('../config/db');
const bcrypt = require('bcrypt');

const usuarioModel = {
  // Crear un usuario
  async crear(usuario) {
    const hashedPassword = await bcrypt.hash(usuario.password, 10);
    
    const query = `
      INSERT INTO usuarios (username, email, password)
      VALUES ($1, $2, $3)
      RETURNING id, username, email, foto_perfil_url, fecha_registro
    `;
    
    const values = [
      usuario.username,
      usuario.email,
      hashedPassword
    ];
    
    const result = await db.query(query, values);
    return result.rows[0];
  },
  
  // Buscar usuario por email
  async buscarPorEmail(email) {
    const query = 'SELECT * FROM usuarios WHERE email = $1';
    const result = await db.query(query, [email]);
    return result.rows[0];
  },
  
  // Buscar usuario por ID
  async buscarPorId(id) {
    const query = 'SELECT id, username, email, foto_perfil_url, fecha_registro FROM usuarios WHERE id = $1';
    const result = await db.query(query, [id]);
    return result.rows[0];
  },
  
  // Actualizar foto de perfil
  async actualizarFotoPerfil(id, fotoUrl) {
    const query = 'UPDATE usuarios SET foto_perfil_url = $1 WHERE id = $2 RETURNING *';
    const result = await db.query(query, [fotoUrl, id]);
    return result.rows[0];
  },
  async actualizarUltimaConexion(id) {
    const query = 'UPDATE usuarios SET ultima_conexion = NOW() WHERE id = $1';
    await db.query(query, [id]);
  },
};

module.exports = usuarioModel;