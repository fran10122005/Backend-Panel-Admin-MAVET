const express = require('express');
const router = express.Router();

const instructorRoutes = require('./instructor.routes');
const representanteRoutes = require('./representante.routes');
const alumnoRoutes = require('./alumno.routes');
const espacioRoutes = require('./espacioMuseo.routes');
const tallerRoutes = require('./taller.routes');
const solicitudEspacioRoutes = require('./solicitudEspacio.routes');
const inscripcionTallerRoutes = require('./inscripcionTaller.routes');
const sesionTallerRoutes = require('./sesionTaller.routes');

router.use('/instructores', instructorRoutes);
router.use('/representantes', representanteRoutes);
router.use('/alumnos', alumnoRoutes);
router.use('/espacios', espacioRoutes);
router.use('/talleres', tallerRoutes);
router.use('/solicitudes-espacio', solicitudEspacioRoutes);
router.use('/inscripciones-talleres', inscripcionTallerRoutes);
router.use('/sesiones', sesionTallerRoutes);

module.exports = router;
