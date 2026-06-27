const express = require('express');
const router = express.Router();
const turnoController = require('../controllers/turno.controller');
const validateZod = require('../../../middleware/validateSchema');
const {
  createTurnoSchema,
  updateTurnoSchema,
  turnoIdParamSchema,
} = require('../schemas/turno.schema');

router.post('/', validateZod({ body: createTurnoSchema }), turnoController.createTurno);
router.get('/', turnoController.getAllTurnos);
router.get('/:id', validateZod({ params: turnoIdParamSchema }), turnoController.getTurnoById);
router.put(
  '/:id',
  validateZod({ params: turnoIdParamSchema, body: updateTurnoSchema }),
  turnoController.updateTurno
);
router.delete('/:id', validateZod({ params: turnoIdParamSchema }), turnoController.deleteTurno);

module.exports = router;
