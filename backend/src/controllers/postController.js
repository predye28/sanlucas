const postModel = require('../models/post');
const contenidoModel = require('../models/contenido');

exports.crearPost = async (req, res) => {
  try {
    const { titulo, descripcion } = req.body;
    const usuarioId = req.usuario.id;
    
    const nuevoPost = await postModel.crear({ 
      titulo, 
      descripcion, 
      usuarioId 
    });
    
    res.status(201).json({
      mensaje: 'Post creado exitosamente',
      post: nuevoPost
    });
  } catch (error) {
    console.error('Error al crear post:', error);
    res.status(500).json({ error: 'Error al crear el post' });
  }
};

exports.obtenerPostsUsuario = async (req, res) => {
  try {
    const usuarioId = req.params.usuarioId || req.usuario.id;
    const posts = await postModel.obtenerPorUsuario(usuarioId);
    res.json({ posts });
  } catch (error) {
    console.error('Error al obtener posts:', error);
    res.status(500).json({ error: 'Error al obtener los posts' });
  }
};

exports.obtenerPost = async (req, res) => {
  try {
    const postId = req.params.id;
    const post = await postModel.obtenerPorId(postId);
    
    if (!post) {
      return res.status(404).json({ error: 'Post no encontrado' });
    }
    
    const contenidos = await contenidoModel.obtenerPorPostId(postId);
    
    res.json({
      post,
      contenidos
    });
  } catch (error) {
    console.error('Error al obtener post:', error);
    res.status(500).json({ error: 'Error al obtener el post' });
  }
};

exports.eliminarPost = async (req, res) => {
  try {
    const postId = req.params.id;
    const usuarioId = req.usuario.id;
    
    // Verificar que el post pertenezca al usuario
    const post = await postModel.obtenerPorId(postId);
    if (!post) {
      return res.status(404).json({ error: 'Post no encontrado' });
    }
    
    if (post.usuario_id !== usuarioId) {
      return res.status(403).json({ error: 'No tienes permiso para eliminar este post' });
    }
    
    await postModel.eliminar(postId);
    
    res.json({ mensaje: 'Post eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar post:', error);
    res.status(500).json({ error: 'Error al eliminar el post' });
  }
};