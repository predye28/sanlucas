const express = require('express');
const router = express.Router();
const contenidoController = require('../controllers/contenidoController');
const autenticarToken = require('../middleware/auth');
const upload = require('../middleware/upload');

// Todas las rutas requieren autenticación
router.use(autenticarToken);

// Ruta existente para subida local
router.post('/subir', upload.single('archivo'), contenidoController.subirContenido);

// Nueva ruta para guardar contenido desde Firebase
router.post('/firebase', contenidoController.guardarContenidoFirebase);

// Ruta para eliminar contenido
router.delete('/:id', contenidoController.eliminarContenido);

module.exports = router;