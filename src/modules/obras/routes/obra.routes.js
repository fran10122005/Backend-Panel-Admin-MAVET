const express = require('express');
const router = express.Router();
const obraController = require('../controllers/obra.controller');
const upload = require('../../../middleware/uploadMiddleware');

router.post('/', upload.single('imagen'), obraController.createObra);
router.get('/', obraController.getAllObras);
router.get('/:id', obraController.getObraById);
router.put('/:id', upload.single('imagen'), obraController.updateObra);
router.delete('/:id', obraController.deleteObra);

module.exports = router;
