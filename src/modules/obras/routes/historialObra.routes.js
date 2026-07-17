const express = require('express');
const router = express.Router();
const historialController = require('../controllers/historialObra.controller');
const validateZod = require('../../../middleware/validateSchema');
const { obraIdParamSchema } = require('../schemas/obra.schema');

router.get(
  '/:id/historial',
  validateZod({ params: obraIdParamSchema }),
  historialController.obtenerHistorial
);
router.post(
  '/:id/historial',
  validateZod({ params: obraIdParamSchema }),
  historialController.registrarMovimiento
);
router.get('/:id/historial/:idMov', historialController.obtenerMovimientoPorId);

module.exports = router;
