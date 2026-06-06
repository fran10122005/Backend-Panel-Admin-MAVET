const express = require('express');
const router = express.Router();
const asistenciaQRController = require('../controllers/asistenciaQR.controller');
const { verifyToken } = require('../../../middleware/authMiddleware');

router.post('/', asistenciaQRController.registrarAsistencia);
router.get('/', verifyToken, asistenciaQRController.getAllAsistencias);

module.exports = router;
