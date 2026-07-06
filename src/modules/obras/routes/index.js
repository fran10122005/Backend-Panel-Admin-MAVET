const express = require('express');
const router = express.Router();

const artistaRoutes = require('./artista.routes');
const tecnicaObraRoutes = require('./tecnicaObra.routes');
const estadoObraRoutes = require('./estadoObra.routes');
const categoriaObraRoutes = require('./categoriaObra.routes');
const entregaRoutes = require('./entrega.routes');
const obraRoutes = require('./obra.routes');
const imagenWebRoutes = require('./imagenWeb.routes');

router.use('/artistas', artistaRoutes);
router.use('/tecnicas', tecnicaObraRoutes);
router.use('/estados', estadoObraRoutes);
router.use('/categorias', categoriaObraRoutes);
router.use('/entregas', entregaRoutes);
router.use('/obras', obraRoutes);
router.use('/imagenes-web', imagenWebRoutes);

module.exports = router;
