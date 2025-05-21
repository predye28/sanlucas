const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const autenticarToken = require('../middleware/auth');

// Rutas existentes
router.post('/registro', authController.registro);
router.post('/login', authController.login);

// Nueva ruta para obtener token de Firebase
router.get('/firebase-token', autenticarToken, authController.getFirebaseToken);

module.exports = router;