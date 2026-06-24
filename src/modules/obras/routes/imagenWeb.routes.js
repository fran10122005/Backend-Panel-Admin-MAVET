const express = require('express');
const router = express.Router();
const imagenWebController = require('../controllers/imagenWeb.controller');

router.get('/', imagenWebController.getAll);
router.get('/:id', imagenWebController.getById);
router.post('/', imagenWebController.create);
router.put('/:id', imagenWebController.update);
router.delete('/:id', imagenWebController.remove);

module.exports = router;
