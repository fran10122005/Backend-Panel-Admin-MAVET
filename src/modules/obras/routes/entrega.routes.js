const express = require('express');
const router = express.Router();
const entregaController = require('../controllers/entrega.controller');

router.post('/', entregaController.createEntrega);
router.get('/', entregaController.getAllEntregas);
router.get('/:id', entregaController.getEntregaById);
router.put('/:id', entregaController.updateEntrega);
router.delete('/:id', entregaController.deleteEntrega);

module.exports = router;
