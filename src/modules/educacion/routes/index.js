const express = require('express');
const router = express.Router();

const instructorRoutes = require('./instructor.routes');
const representanteRoutes = require('./representante.routes');
const alumnoRoutes = require('./alumno.routes');
const espacioRoutes = require('./espacioMuseo.routes');
const tallerRoutes = require('./taller.routes');

router.use('/instructores', instructorRoutes);
router.use('/representantes', representanteRoutes);
router.use('/alumnos', alumnoRoutes);
router.use('/espacios', espacioRoutes);
router.use('/talleres', tallerRoutes);

module.exports = router;
