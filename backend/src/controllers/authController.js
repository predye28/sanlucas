const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const usuarioModel = require('../models/usuario');
require('dotenv').config();

exports.registro = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    // Verificar si el usuario ya existe
    const usuarioExistente = await usuarioModel.buscarPorEmail(email);
    if (usuarioExistente) {
      return res.status(400).json({ error: 'El correo ya está registrado' });
    }
    
    // Crear usuario
    const nuevoUsuario = await usuarioModel.crear({ username, email, password });
    
    // Generar token
    const token = jwt.sign(
      { id: nuevoUsuario.id, username: nuevoUsuario.username },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.status(201).json({ 
      mensaje: 'Usuario registrado exitosamente',
      token,
      usuario: nuevoUsuario
    });
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ error: 'Error al registrar usuario' });
  }
};

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    // Buscar usuario
    const usuario = await usuarioModel.buscarPorUsername(username);
    if (!usuario) {
      return res.status(400).json({ error: 'Credenciales inválidas' });
    }
    
    // Verificar contraseña
    const passwordValida = await bcrypt.compare(password, usuario.password);
    if (!passwordValida) {
      return res.status(400).json({ error: 'Credenciales inválidas' });
    }
    
    // Actualizar última conexión
    await usuarioModel.actualizarUltimaConexion(usuario.id);
    
    // Generar token
    const token = jwt.sign(
      { id: usuario.id, username: usuario.username },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({
      mensaje: 'Login exitoso',
      token,
      usuario: {
        id: usuario.id,
        username: usuario.username,
        email: usuario.email,
        foto_perfil_url: usuario.foto_perfil_url
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
};