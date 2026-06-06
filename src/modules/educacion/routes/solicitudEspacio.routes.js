const express = require('express');
const router = express.Router();
const solicitudController = require('../controllers/solicitudEspacio.controller');

router.post('/', solicitudController.createSolicitud);
router.get('/', solicitudController.getAllSolicitudes);
router.get('/:id', solicitudController.getSolicitudById);
router.put('/:id', solicitudController.updateSolicitud);
router.delete('/:id', solicitudController.deleteSolicitud);

module.exports = router;
