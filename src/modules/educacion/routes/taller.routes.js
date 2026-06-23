const express = require('express');
const router = express.Router();
const tallerController = require('../controllers/taller.controller');
const inventarioController = require('../controllers/inventarioTaller.controller');

// ── Inventario de Talleres (must be before /:id) ──
router.get('/inventario', inventarioController.getAllInventario);
router.post('/inventario', inventarioController.createInventario);
router.put('/inventario/:id', inventarioController.updateInventario);
router.delete('/inventario/:id', inventarioController.deleteInventario);

// ── Talleres planificados ──
router.post('/', tallerController.createTaller);
router.get('/', tallerController.getAllTalleres);
router.get('/:id', tallerController.getTallerById);
router.put('/:id', tallerController.updateTaller);
router.delete('/:id', tallerController.deleteTaller);
router.post('/planificar', tallerController.planificarTaller);

module.exports = router;
