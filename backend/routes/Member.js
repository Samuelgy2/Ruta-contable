const express = require('express');
const router = express.Router();
const { requireAdmin } = require('../middleware/auth');
const socioController = require('../controllers/Membercontroller');
const documentoController = require('../controllers/SocioDocumentoController');

router.use(requireAdmin);

router.get('/',       socioController.getAll);    // GET    /api/socios
router.get('/:id',    socioController.getById);   // GET    /api/socios/:id
router.post('/',      socioController.create);    // POST   /api/socios
router.put('/:id',    socioController.update);    // PUT    /api/socios/:id
router.delete('/:id', socioController.remove);    // DELETE /api/socios/:id

// Vínculo con la cuenta de acceso (socio_perfil.id_socio)
router.put('/:id/vincular',    socioController.vincular);    // PUT    /api/socios/:id/vincular  { userId }
router.delete('/:id/vincular', socioController.desvincular); // DELETE /api/socios/:id/vincular

// Documentos del socio (RF-050). Cuerpo binario; el tipo real se valida por firma en el controlador.
const cuerpoDocumento = express.raw({ type: () => true, limit: documentoController.DOC_MAX_BYTES });
router.get('/:id/documentos',                    documentoController.listar);   // GET    /api/socios/:id/documentos
router.post('/:id/documentos', cuerpoDocumento,  documentoController.subir);    // POST   /api/socios/:id/documentos?tipo=&nombre=
router.get('/:id/documentos/:docId/archivo',     documentoController.archivo);  // GET    /api/socios/:id/documentos/:docId/archivo
router.delete('/:id/documentos/:docId',          documentoController.eliminar); // DELETE /api/socios/:id/documentos/:docId

// Sin esto, un archivo de más de 5 MB recibe la página de error HTML de Express.
router.use((err, req, res, next) => {
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ success: false, message: 'El archivo supera el máximo de 5 MB.' });
  }
  next(err);
});

module.exports = router;