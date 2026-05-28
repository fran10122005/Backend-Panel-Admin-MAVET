const express = require('express');
const router = express.Router();
const espacioController = require('../controllers/espacioMuseo.controller');

router.post('/', espacioController.createEspacio);
router.get('/', espacioController.getAllEspacios);
router.get('/:id', espacioController.getEspacioById);
router.put('/:id', espacioController.updateEspacio);
router.delete('/:id', espacioController.deleteEspacio);

module.exports = router;
