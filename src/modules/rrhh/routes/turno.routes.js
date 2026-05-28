const express = require('express');
const router = express.Router();
const turnoController = require('../controllers/turno.controller');

router.post('/', turnoController.createTurno);
router.get('/', turnoController.getAllTurnos);
router.get('/:id', turnoController.getTurnoById);
router.put('/:id', turnoController.updateTurno);
router.delete('/:id', turnoController.deleteTurno);

module.exports = router;
