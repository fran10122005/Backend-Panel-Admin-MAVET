const express = require('express');
const router = express.Router();
const inscripcionController = require('../controllers/inscripcionTaller.controller');

router.post('/', inscripcionController.inscribirAlumno);
router.get('/', inscripcionController.getAllInscripciones);

module.exports = router;
