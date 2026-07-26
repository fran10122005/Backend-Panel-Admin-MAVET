const express = require('express');
const router = express.Router();
const papeleraController = require('./papelera.controller');
// Rutas de la papelera
router.get('/', papeleraController.getPapeleraGlobal);
router.post('/restaurar', papeleraController.restaurarRegistro);
router.delete('/vaciar', papeleraController.vaciarPapelera);
router.delete('/eliminar', papeleraController.eliminarDefinitivo);

module.exports = router;
