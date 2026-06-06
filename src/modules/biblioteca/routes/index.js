const express = require('express');
const router = express.Router();

const libroRoutes = require('./libro.routes');
const autorLibroRoutes = require('./autorLibro.routes');
const categoriaLibroRoutes = require('./categoriaLibro.routes');
const consultaSalaRoutes = require('./consultaSala.routes');

router.use('/libros', libroRoutes);
router.use('/autores', autorLibroRoutes);
router.use('/categorias', categoriaLibroRoutes);
router.use('/consultas-sala', consultaSalaRoutes);

module.exports = router;
