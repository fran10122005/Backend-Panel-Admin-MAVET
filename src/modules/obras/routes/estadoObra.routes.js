const express = require('express');
const router = express.Router();
const estadoController = require('../controllers/estadoObra.controller');

router.post('/', estadoController.createEstado);
router.get('/', estadoController.getAllEstados);
router.get('/:id', estadoController.getEstadoById);
router.put('/:id', estadoController.updateEstado);
router.delete('/:id', estadoController.deleteEstado);

module.exports = router;
