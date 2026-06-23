const express = require('express');
const router = express.Router();
const inscripcionController = require('../controllers/inscripcionTaller.controller');

router.post('/', inscripcionController.inscribirAlumno);
router.get('/', inscripcionController.getAllInscripciones);
router.get('/taller/:id', inscripcionController.getInscripcionesByTaller);
router.get('/taller/:id/export', inscripcionController.exportPlanilla);

module.exports = router;
