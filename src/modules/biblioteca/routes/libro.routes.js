const express = require('express');
const router = express.Router();
const libroController = require('../controllers/libro.controller');

router.post('/', libroController.createLibro);
router.get('/', libroController.getAllLibros);
router.get('/:id', libroController.getLibroById);
router.put('/:id', libroController.updateLibro);
router.delete('/:id', libroController.deleteLibro);
router.put('/:id/devolver', libroController.devolverLibro);

module.exports = router;
