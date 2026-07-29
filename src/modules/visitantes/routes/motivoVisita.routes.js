const express = require('express');
const router = express.Router();
const motivoController = require('../controllers/motivoVisita.controller');
const { verifyToken } = require('../../../middleware/authMiddleware');

router.use(verifyToken);

router.post('/', motivoController.createMotivo);
router.get('/', motivoController.getAllMotivos);
router.get('/:id', motivoController.getMotivoById);
router.put('/:id', motivoController.updateMotivo);
router.delete('/:id', motivoController.deleteMotivo);

module.exports = router;
