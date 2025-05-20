const fs = require('fs');
const path = require('path');
const contenidoModel = require('../models/contenido');
const postModel = require('../models/post');

exports.subirContenido = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se subió ningún archivo' });
    }
    
    const { postId } = req.body;
    
    // Verificar que el post exista y pertenezca al usuario
    const post = await postModel.obtenerPorId(postId);
    if (!post) {
      // Eliminar el archivo subido
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ error: 'Post no encontrado' });
    }
    
    if (post.usuario_id !== req.usuario.id) {
      // Eliminar el archivo subido
      fs.unlinkSync(req.file.path);
      return res.status(403).json({ error: 'No tienes permiso para añadir contenido a este post' });
    }
    
    // Determinar el tipo de contenido
    const esVideo = /video/.test(req.file.mimetype);
    const tipo = esVideo ? 'video' : 'imagen';
    
    // Crear URL relativa
    const url = `/uploads/${req.file.filename}`;
    
    // Obtener el orden más alto actual
    const contenidos = await contenidoModel.obtenerPorPostId(postId);
    const orden = contenidos.length > 0 ? 
      Math.max(...contenidos.map(c => c.orden || 0)) + 1 : 1;
    
    // Guardar en la base de datos
    const nuevoContenido = await contenidoModel.crear({
      postId,
      tipo,
      url,
      orden,
      nombreArchivo: req.file.originalname,
      tamano: req.file.size
    });
    
    res.status(201).json({
      mensaje: 'Contenido subido exitosamente',
      contenido: nuevoContenido
    });
  } catch (error) {
    console.error('Error al subir contenido:', error);
    
    // Eliminar el archivo en caso de error
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ error: 'Error al subir el contenido' });
  }
};

exports.eliminarContenido = async (req, res) => {
  try {
    const contenidoId = req.params.id;
    
    // Obtener el contenido
    const query = `
      SELECT c.*, p.usuario_id 
      FROM contenidos c
      JOIN posts p ON c.post_id = p.id
      WHERE c.id = $1
    `;
    const result = await db.query(query, [contenidoId]);
    const contenido = result.rows[0];
    
    if (!contenido) {
      return res.status(404).json({ error: 'Contenido no encontrado' });
    }
    
    // Verificar que el contenido pertenezca al usuario
    if (contenido.usuario_id !== req.usuario.id) {
      return res.status(403).json({ error: 'No tienes permiso para eliminar este contenido' });
    }
    
    // Eliminar el archivo físico
    const filePath = path.join(__dirname, '..', '..', contenido.url);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    // Eliminar de la base de datos
    await contenidoModel.eliminar(contenidoId);
    
    res.json({ mensaje: 'Contenido eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar contenido:', error);
    res.status(500).json({ error: 'Error al eliminar el contenido' });
  }
};