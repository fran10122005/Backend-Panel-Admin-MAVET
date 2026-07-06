const express = require('express');
const router = express.Router();
const categoriaController = require('../controllers/categoriaObra.controller');

router.post('/', categoriaController.createCategoria);
router.get('/', categoriaController.getAllCategorias);
router.get('/:id', categoriaController.getCategoriaById);
router.put('/:id', categoriaController.updateCategoria);
router.delete('/:id', categoriaController.deleteCategoria);

module.exports = router;
