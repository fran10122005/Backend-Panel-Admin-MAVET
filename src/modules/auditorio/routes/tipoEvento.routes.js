const express = require('express');
const router = express.Router();
const tipoEventoController = require('../controllers/tipoEvento.controller');

router.post('/', tipoEventoController.createTipoEvento);
router.get('/', tipoEventoController.getAllTiposEvento);
router.get('/:id', tipoEventoController.getTipoEventoById);
router.put('/:id', tipoEventoController.updateTipoEvento);
router.delete('/:id', tipoEventoController.deleteTipoEvento);

module.exports = router;
