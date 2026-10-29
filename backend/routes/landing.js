const express = require('express');
const router = express.Router();
const landingController = require('../controllers/LandingController');

// Landing pública: sólo lectura de la versión publicada, sin sesión (RF-097).
router.get('/',             landingController.getPublicada);         // GET /api/landing
router.get('/imagenes/:id', landingController.archivoImagenPublica); // GET /api/landing/imagenes/:id

module.exports = router;
