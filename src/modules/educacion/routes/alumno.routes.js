const express = require('express');
const router = express.Router();
const alumnoController = require('../controllers/alumno.controller');

router.post('/', alumnoController.createAlumno);
router.get('/', alumnoController.getAllAlumnos);
router.get('/:id', alumnoController.getAlumnoById);
router.put('/:id', alumnoController.updateAlumno);
router.delete('/:id', alumnoController.deleteAlumno);

module.exports = router;
