const express = require('express');
const router = express.Router();
const horarioController = require('../controllers/horario.controller');
const { verifyToken } = require('../../../middleware/authMiddleware');

router.get('/reporte-semanal', verifyToken, horarioController.reporteSemanal);
router.put('/trabajador/:id', verifyToken, horarioController.actualizarHorasSemanales);
router.get('/trabajador/:id/historial', verifyToken, horarioController.obtenerHistorial);

module.exports = router;
