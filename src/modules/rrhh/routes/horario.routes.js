const express = require('express');
const router = express.Router();
const horarioController = require('../controllers/horario.controller');
const { verifyToken } = require('../../../middleware/authMiddleware');
const validateZod = require('../../../middleware/validateSchema');
const { updateHorasSchema, historialIdParamSchema } = require('../schemas/horario.schema');

router.get('/reporte-semanal', verifyToken, horarioController.reporteSemanal);
router.put(
  '/trabajador/:id',
  verifyToken,
  validateZod({ params: historialIdParamSchema, body: updateHorasSchema }),
  horarioController.actualizarHorasSemanales
);
router.get(
  '/trabajador/:id/historial',
  verifyToken,
  validateZod({ params: historialIdParamSchema }),
  horarioController.obtenerHistorial
);

module.exports = router;
