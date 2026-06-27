const express = require('express');
const router = express.Router();
const asistenciaQRController = require('../controllers/asistenciaQR.controller');
const { verifyToken } = require('../../../middleware/authMiddleware');
const validateZod = require('../../../middleware/validateSchema');
const { registrarAsistenciaSchema } = require('../schemas/asistenciaQR.schema');

router.post(
  '/',
  validateZod({ body: registrarAsistenciaSchema }),
  asistenciaQRController.registrarAsistencia
);
router.get('/', verifyToken, asistenciaQRController.getAllAsistencias);

module.exports = router;
