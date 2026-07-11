const express = require('express');
const router = express.Router();
const reportesController = require('./reportes.controller');

router.get('/obras', reportesController.reporteObras);
router.get('/biblioteca', reportesController.reporteLibros);
router.get('/asistencia', reportesController.reporteAsistencia);
router.get('/carta-aval/:cedula', reportesController.reporteCartaAval);
router.get('/eventos', reportesController.reporteEventos);
router.get('/trabajadores', reportesController.reporteTrabajadores);
router.get('/usuarios', reportesController.reporteUsuarios);
router.get('/dashboard', reportesController.getDashboardStats);
router.get('/carnet/:id', reportesController.reporteCarnet);
router.get('/credenciales-masivas', reportesController.reporteCredencialesMasivas);
router.get('/qr', reportesController.reporteQR);
router.get('/inventario-talleres', reportesController.reporteInventarioTalleres);
router.get('/talleres', reportesController.reporteTalleres);

module.exports = router;
