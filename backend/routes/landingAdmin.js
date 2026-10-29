const express = require('express');
const router = express.Router();
const { requireAdmin } = require('../middleware/auth');
const landingController = require('../controllers/LandingController');

// Editor de la landing (RF-088 a RF-096). La lectura pública vive en routes/landing.js.
router.use(requireAdmin);

// Cuerpo binario con el tipo real de la imagen; express corta en 2 MB.
const cuerpoImagen = express.raw({ type: landingController.TIPOS_IMAGEN, limit: landingController.IMAGEN_MAX_BYTES });

router.get('/',                             landingController.getEstado);          // GET    /api/admin/landing (borrador + publicada)
router.get('/borrador',                     landingController.getEstado);          // GET    /api/admin/landing/borrador (alias)
router.put('/borrador',                     landingController.guardarBorrador);    // PUT    /api/admin/landing/borrador
router.post('/publicar',                    landingController.publicar);           // POST   /api/admin/landing/publicar
router.get('/versiones',                    landingController.listarVersiones);    // GET    /api/admin/landing/versiones
router.post('/versiones/:numero/restaurar', landingController.restaurarVersion);   // POST   /api/admin/landing/versiones/:numero/restaurar
router.get('/imagenes',                     landingController.listarImagenes);     // GET    /api/admin/landing/imagenes
router.post('/imagenes', cuerpoImagen,      landingController.subirImagen);        // POST   /api/admin/landing/imagenes?alt=
router.get('/imagenes/:id/archivo',         landingController.archivoImagenAdmin); // GET    /api/admin/landing/imagenes/:id/archivo
router.delete('/imagenes/:id',              landingController.eliminarImagen);     // DELETE /api/admin/landing/imagenes/:id

// Sin esto, una imagen de más de 2 MB recibe la página de error HTML de Express.
router.use((err, req, res, next) => {
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ success: false, message: 'La imagen supera el máximo de 2 MB.' });
  }
  next(err);
});

module.exports = router;
