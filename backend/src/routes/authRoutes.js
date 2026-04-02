const express = require('express');
const { login, register, verifyToken } = require('../controllers/authController');

const router = express.Router();

// Ruta para iniciar sesión
router.post('/login', login);

// Ruta para registrar nuevo usuario
router.post('/register', register);

// Ruta para verificar token (mantener sesión)
router.get('/verify', verifyToken);

module.exports = router;