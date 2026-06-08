const express = require('express');
const router = express.Router();
const consultaController = require('../controllers/consultaSala.controller');

router.post('/', consultaController.createConsulta);
router.get('/', consultaController.getAllConsultas);
router.put('/:id', consultaController.updateConsulta);

module.exports = router;
