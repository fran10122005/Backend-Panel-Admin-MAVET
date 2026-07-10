const express = require('express');
const router = express.Router();
const sesionController = require('../controllers/sesionTaller.controller');

// Obtener sesiones de un taller y crear nueva sesión
const validateZod = require('../../../middleware/validateSchema');
const { createSesionSchema } = require('../schemas/sesionTaller.schema');

router.get('/taller/:id_taller', sesionController.getSesionesByTaller);
router.post('/taller/:id_taller', validateZod(createSesionSchema), sesionController.createSesion);

// Obtener métricas de asistencia de un taller
router.get('/taller/:id_taller/metricas', sesionController.getMetricasTaller);

// Obtener lista de alumnos y guardar asistencia de una sesión específica
router.get('/:id_sesion/asistencia', sesionController.getAsistenciaSesion);
router.put('/:id_sesion/asistencia', sesionController.saveAsistencia);

module.exports = router;
