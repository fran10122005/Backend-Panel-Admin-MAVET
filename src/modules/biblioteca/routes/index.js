const express = require('express');
const router = express.Router();

const categoriaRoutes = require('./categoriaLibro.routes');
const autorRoutes = require('./autorLibro.routes');
const libroRoutes = require('./libro.routes');

router.use('/categorias', categoriaRoutes);
router.use('/autores', autorRoutes);
router.use('/libros', libroRoutes);

module.exports = router;
