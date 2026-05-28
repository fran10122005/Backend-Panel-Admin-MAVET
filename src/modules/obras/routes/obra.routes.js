const express = require('express');
const router = express.Router();
const obraController = require('../controllers/obra.controller');

router.post('/', obraController.createObra);
router.get('/', obraController.getAllObras);
router.get('/:id', obraController.getObraById);
router.put('/:id', obraController.updateObra);
router.delete('/:id', obraController.deleteObra);

module.exports = router;
