const db = require('./db');

async function initDB() {
  try {
    // Crear tabla usuarios
    await db.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(100) NOT NULL,
        foto_perfil_url VARCHAR(255),
        fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      );
    `);

    // Crear tabla posts
    await db.query(`
      CREATE TABLE IF NOT EXISTS posts (
        id SERIAL PRIMARY KEY,
        usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
        titulo VARCHAR(100),
        descripcion TEXT,
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        estado VARCHAR(20) DEFAULT 'activo'
      );
    `);

    // Crear tabla contenidos
    await db.query(`
      CREATE TABLE IF NOT EXISTS contenidos (
        id SERIAL PRIMARY KEY,
        post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
        tipo VARCHAR(20) NOT NULL,
        url VARCHAR(255) NOT NULL,
        orden INTEGER,
        nombre_archivo VARCHAR(255),
        tamano INTEGER
      );
    `);

    console.log('Base de datos inicializada correctamente');
  } catch (error) {
    console.error('Error inicializando la base de datos:', error);
  }
}

initDB();