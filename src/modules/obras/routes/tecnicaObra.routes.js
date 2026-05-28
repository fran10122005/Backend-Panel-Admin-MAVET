const express = require('express');
const router = express.Router();
const tecnicaController = require('../controllers/tecnicaObra.controller');

router.post('/', tecnicaController.createTecnica);
router.get('/', tecnicaController.getAllTecnicas);
router.get('/:id', tecnicaController.getTecnicaById);
router.put('/:id', tecnicaController.updateTecnica);
router.delete('/:id', tecnicaController.deleteTecnica);

module.exports = router;
