const express = require('express');
const router = express.Router();
const contenidoController = require('../controllers/contenidoController');
const autenticarToken = require('../middleware/auth');
const upload = require('../middleware/upload');

// Todas las rutas requieren autenticación
router.use(autenticarToken);

router.post('/subir', upload.single('archivo'), contenidoController.subirContenido);
router.delete('/:id', contenidoController.eliminarContenido);

module.exports = router;