const express = require('express');
const personaController = require('../controllers/persona.controller');

const router = express.Router();

router.get('/buscar', personaController.buscarPersona);

module.exports = router;
