const express = require('express');
const router = express.Router();
const tallerController = require('../controllers/taller.controller');

router.post('/', tallerController.createTaller);
router.get('/', tallerController.getAllTalleres);
router.get('/:id', tallerController.getTallerById);
router.put('/:id', tallerController.updateTaller);
router.delete('/:id', tallerController.deleteTaller);

module.exports = router;
