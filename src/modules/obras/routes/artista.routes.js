const express = require('express');
const router = express.Router();
const artistaController = require('../controllers/artista.controller');

router.post('/', artistaController.createArtista);
router.get('/', artistaController.getAllArtistas);
router.get('/:id', artistaController.getArtistaById);
router.put('/:id', artistaController.updateArtista);
router.delete('/:id', artistaController.deleteArtista);

module.exports = router;
