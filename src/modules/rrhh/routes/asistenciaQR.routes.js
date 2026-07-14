const express = require('express');
const router = express.Router();
const asistenciaQRController = require('../controllers/asistenciaQR.controller');
const { verifyToken } = require('../../../middleware/authMiddleware');
const validateZod = require('../../../middleware/validateSchema');
const { registrarAsistenciaSchema } = require('../schemas/asistenciaQR.schema');

// Consultar estado actual del trabajador (sin token para uso en el kiosko de recepción)
router.get('/estado', asistenciaQRController.getEstadoAsistencia);

router.post(
  '/',
  validateZod({ body: registrarAsistenciaSchema }),
  asistenciaQRController.registrarAsistencia
);
router.get('/', verifyToken, asistenciaQRController.getAllAsistencias);
router.get('/semana/resumen', verifyToken, asistenciaQRController.getResumenSemanalTodos);
router.get('/semana', asistenciaQRController.getSemanaAsistencia);
router.post('/justificar', verifyToken, asistenciaQRController.justificarSemana);
router.patch('/:id', verifyToken, asistenciaQRController.updateAsistenciaObservaciones);

module.exports = router;
