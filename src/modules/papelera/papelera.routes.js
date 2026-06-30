const express = require('express');
const router = express.Router();
const papeleraController = require('./papelera.controller');
const { requireRoles } = require('../../middleware/authMiddleware'); // Asumiendo que existe

// Rutas de la papelera
router.get('/', papeleraController.getPapeleraGlobal);
router.post('/restaurar', papeleraController.restaurarRegistro);
router.delete('/eliminar', papeleraController.eliminarDefinitivo);

module.exports = router;
