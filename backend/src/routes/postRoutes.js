const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const autenticarToken = require('../middleware/auth');

// Todas las rutas requieren autenticación
router.use(autenticarToken);

router.post('/', postController.crearPost);
router.get('/usuario/:usuarioId?', postController.obtenerPostsUsuario);
router.get('/:id', postController.obtenerPost);
router.delete('/:id', postController.eliminarPost);

module.exports = router;