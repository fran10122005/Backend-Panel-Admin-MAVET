const express = require('express');
const router = express.Router();
const publicoController = require('../controllers/publico.controller');

// Verificar si existe un visitante (Solo retorna nombre para bienvenida)
router.get('/check/:cedula', publicoController.checkVisitante);

// Registrar auto-ingreso
router.post('/ingreso', publicoController.registrarAutoIngreso);

module.exports = router;
