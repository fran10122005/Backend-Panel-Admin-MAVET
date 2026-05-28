const express = require('express');
const router = express.Router();
const representanteController = require('../controllers/representante.controller');

router.post('/', representanteController.createRepresentante);
router.get('/', representanteController.getAllRepresentantes);
router.get('/:id', representanteController.getRepresentanteById);
router.put('/:id', representanteController.updateRepresentante);
router.delete('/:id', representanteController.deleteRepresentante);

module.exports = router;
