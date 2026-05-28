const express = require('express');
const router = express.Router();
const visitanteController = require('../controllers/visitante.controller');

router.post('/', visitanteController.createVisitante);
router.get('/', visitanteController.getAllVisitantes);
router.get('/:id', visitanteController.getVisitanteById);
router.put('/:id', visitanteController.updateVisitante);
router.delete('/:id', visitanteController.deleteVisitante);

module.exports = router;
