const express = require('express');
const router = express.Router();
const inscripcionController = require('../controllers/inscripcionTaller.controller');
const validateZod = require('../../../middleware/validateSchema');
const { inscribirAlumnoSchema } = require('../schemas/inscripcionTaller.schema');

router.post(
  '/',
  validateZod({ body: inscribirAlumnoSchema }),
  inscripcionController.inscribirAlumno
);
router.get('/', inscripcionController.getAllInscripciones);
router.get('/taller/:id', inscripcionController.getInscripcionesByTaller);
router.get('/taller/:id/export', inscripcionController.exportPlanilla);
router.put('/:id', inscripcionController.actualizarInscripcion);
router.delete('/:id', inscripcionController.eliminarInscripcion);

module.exports = router;
