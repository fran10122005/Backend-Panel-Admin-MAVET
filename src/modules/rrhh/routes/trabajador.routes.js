const express = require('express');
const router = express.Router();
const trabajadorController = require('../controllers/trabajador.controller');

router.post('/', trabajadorController.createTrabajador);
router.get('/', trabajadorController.getAllTrabajadores);
router.get('/:id', trabajadorController.getTrabajadorById);
router.put('/:id', trabajadorController.updateTrabajador);
router.delete('/:id', trabajadorController.deleteTrabajador);

module.exports = router;
