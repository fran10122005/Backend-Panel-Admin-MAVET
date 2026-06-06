const express = require('express');
const router = express.Router();
const reportesController = require('./reportes.controller');

router.get('/obras', reportesController.reporteObras);
router.get('/biblioteca', reportesController.reporteLibros);
router.get('/asistencia', reportesController.reporteAsistencia);
router.get('/carta-aval/:cedula', reportesController.reporteCartaAval);
router.get('/eventos', reportesController.reporteEventos);
router.get('/dashboard', reportesController.getDashboardStats);

module.exports = router;
