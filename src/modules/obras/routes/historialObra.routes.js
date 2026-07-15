const express = require('express');
const router = express.Router();
const historialController = require('../controllers/historialObra.controller');

router.get('/:id/historial', historialController.obtenerHistorial);
router.post('/:id/historial', historialController.registrarMovimiento);
router.get('/:id/historial/:idMov', historialController.obtenerMovimientoPorId);

module.exports = router;
