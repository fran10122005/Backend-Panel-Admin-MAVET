const express = require('express');
const router = express.Router();
const espacioController = require('../controllers/espacioMuseo.controller');

const upload = require('../../../middleware/uploadMiddleware');

router.post('/', espacioController.createEspacio);
router.get('/', espacioController.getAllEspacios);
router.get('/:id/detalles', espacioController.getEspacioDetalles);
router.get('/:id', espacioController.getEspacioById);
router.put('/:id', espacioController.updateEspacio);
router.post('/:id/imagen', upload.single('imagen'), espacioController.subirImagen);
router.delete('/:id', espacioController.deleteEspacio);

module.exports = router;
