const express = require('express');
const router = express.Router();
const ingresoController = require('../controllers/ingreso.controller');
const { verifyToken } = require('../../../middleware/authMiddleware');

// Obtener estadísticas del panel
router.get('/stats', verifyToken, ingresoController.getStats);

// Obtener visitantes más frecuentes
router.get('/top', verifyToken, ingresoController.getTopVisitantes);

// Verificar si existe un visitante por cédula
router.get('/check/:cedula', ingresoController.checkVisitante);

// Registrar ingreso (crea el visitante si no existe)
router.post('/', ingresoController.registrarIngreso);

// Obtener todos los registros de ingreso
router.get('/', verifyToken, ingresoController.getAllIngresos);

module.exports = router;
