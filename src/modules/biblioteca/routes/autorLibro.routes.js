const express = require('express');
const router = express.Router();
const autorController = require('../controllers/autorLibro.controller');

router.post('/', autorController.createAutor);
router.get('/', autorController.getAllAutores);
router.get('/:id', autorController.getAutorById);
router.put('/:id', autorController.updateAutor);
router.delete('/:id', autorController.deleteAutor);

module.exports = router;
