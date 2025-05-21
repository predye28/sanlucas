// contenidoController.js

const fs = require('fs');
const path = require('path');
const contenidoModel = require('../models/contenido');
const postModel = require('../models/post');
const firebaseService = require('../services/firebaseService');

// Función existente para subida local
exports.subirContenido = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se subió ningún archivo' });
    }
    
    const { postId } = req.body;
    
    // Verificar que el post exista y pertenezca al usuario
    const post = await postModel.obtenerPorId(postId);
    if (!post) {
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ error: 'Post no encontrado' });
    }
    
    if (post.usuario_id !== req.usuario.id) {
      fs.unlinkSync(req.file.path);
      return res.status(403).json({ error: 'No tienes permiso para añadir contenido a este post' });
    }
    
    const esVideo = /video/.test(req.file.mimetype);
    const tipo = esVideo ? 'video' : 'imagen';
    const url = `/uploads/${req.file.filename}`;
    
    const contenidos = await contenidoModel.obtenerPorPostId(postId);
    const orden = contenidos.length > 0 ? 
      Math.max(...contenidos.map(c => c.orden || 0)) + 1 : 1;
    
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
    
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ error: 'Error al subir el contenido' });
  }
};

// Nueva función para guardar contenido desde Firebase
exports.guardarContenidoFirebase = async (req, res) => {
  try {
    const { postId, tipo, url, nombreArchivo, tamano, firebase_path } = req.body;
    const usuarioId = req.usuario.id;
    
    // Validaciones básicas
    if (!postId || !tipo || !url || !nombreArchivo || !tamano || !firebase_path) {
      return res.status(400).json({ 
        error: 'Faltan campos requeridos: postId, tipo, url, nombreArchivo, tamano, firebase_path' 
      });
    }
    
    // Verificar que el post exista y pertenezca al usuario
    const post = await postModel.obtenerPorId(postId);
    if (!post) {
      return res.status(404).json({ error: 'Post no encontrado' });
    }
    
    if (post.usuario_id !== usuarioId) {
      return res.status(403).json({ 
        error: 'No tienes permiso para añadir contenido a este post' 
      });
    }
    
    // Validar que la ruta de Firebase corresponde al usuario y post
    if (!firebaseService.validateFilePath(firebase_path, usuarioId, postId)) {
      return res.status(403).json({ 
        error: 'La ruta del archivo no es válida para este usuario y post' 
      });
    }
    
    // Verificar que el archivo existe en Firebase Storage
    const fileExists = await firebaseService.fileExists(firebase_path);
    if (!fileExists) {
      return res.status(400).json({ 
        error: 'El archivo no existe en Firebase Storage' 
      });
    }
    
    // Obtener el orden para el nuevo contenido
    const contenidos = await contenidoModel.obtenerPorPostId(postId);
    const orden = contenidos.length > 0 ? 
      Math.max(...contenidos.map(c => c.orden || 0)) + 1 : 1;
    
    // Crear el registro en la base de datos
    const nuevoContenido = await contenidoModel.crearFirebase({
      postId,
      tipo,
      url,
      orden,
      nombreArchivo,
      tamano,
      firebase_path
    });
    
    res.status(201).json({
      mensaje: 'Contenido guardado exitosamente desde Firebase',
      contenido: nuevoContenido
    });
    
  } catch (error) {
    console.error('Error al guardar contenido desde Firebase:', error);
    res.status(500).json({ 
      error: 'Error al guardar el contenido: ' + error.message 
    });
  }
};

// Función actualizada para eliminar contenido (con soporte Firebase)
exports.eliminarContenido = async (req, res) => {
  try {
    const contenidoId = req.params.id;
    
    // Obtener el contenido con información del post
    const contenido = await contenidoModel.obtenerConCompleto(contenidoId);
    
    if (!contenido) {
      return res.status(404).json({ error: 'Contenido no encontrado' });
    }
    
    // Verificar que el contenido pertenezca al usuario
    if (contenido.usuario_id !== req.usuario.id) {
      return res.status(403).json({ 
        error: 'No tienes permiso para eliminar este contenido' 
      });
    }
    
    // Si el contenido está en Firebase, eliminarlo de allí
    if (contenido.firebase_path) {
      await firebaseService.deleteFile(contenido.firebase_path);
    } else {
      // Si es archivo local, eliminarlo del sistema de archivos
      const filePath = path.join(__dirname, '..', '..', contenido.url);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    
    // Eliminar de la base de datos
    await contenidoModel.eliminar(contenidoId);
    
    res.json({ mensaje: 'Contenido eliminado exitosamente' });
    
  } catch (error) {
    console.error('Error al eliminar contenido:', error);
    res.status(500).json({ error: 'Error al eliminar el contenido' });
  }
};