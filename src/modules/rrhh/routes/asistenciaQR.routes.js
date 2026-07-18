const express = require('express');
const router = express.Router();
const asistenciaQRController = require('../controllers/asistenciaQR.controller');
const { verifyToken, requireRoles } = require('../../../middleware/authMiddleware');
const validateZod = require('../../../middleware/validateSchema');
const {
  registrarAsistenciaSchema,
  verificarPinSchema,
  confirmarAsistenciaSchema,
  cambiarPinSchema,
} = require('../schemas/asistenciaQR.schema');

// Consultar estado actual del trabajador (sin token para uso en el kiosko de recepción)
router.get('/estado', asistenciaQRController.getEstadoAsistencia);

router.post(
  '/',
  validateZod({ body: registrarAsistenciaSchema }),
  asistenciaQRController.registrarAsistencia
);

// Nuevas rutas para flujo seguro con PIN (públicas para el kiosko)
router.post(
  '/verificar-pin',
  validateZod({ body: verificarPinSchema }),
  asistenciaQRController.verificarPin
);

router.post(
  '/confirmar',
  validateZod({ body: confirmarAsistenciaSchema }),
  asistenciaQRController.confirmarAsistencia
);

router.post(
  '/cambiar-pin',
  validateZod({ body: cambiarPinSchema }),
  asistenciaQRController.cambiarPin
);

// Verificación facial (pública para el kiosko)
router.post('/verificar-facial', asistenciaQRController.verificarFacial);
router.post('/facial-fallido', asistenciaQRController.registrarFacialFallido);

// Ruta para restablecer PIN (solo administradores)
router.post(
  '/:id/reset-pin',
  verifyToken,
  requireRoles('Administrador'),
  asistenciaQRController.resetPinTrabajador
);

router.get('/', verifyToken, asistenciaQRController.getAllAsistencias);
router.get('/semana/resumen', verifyToken, asistenciaQRController.getResumenSemanalTodos);
router.get('/semana', asistenciaQRController.getSemanaAsistencia);
router.post('/justificar', verifyToken, asistenciaQRController.justificarSemana);
router.patch('/:id', verifyToken, asistenciaQRController.updateAsistenciaObservaciones);

module.exports = router;
