const express = require('express');
const router = express.Router();
const { verifyToken } = require('../../../middleware/authMiddleware');
const upload = require('../../../middleware/uploadMiddleware');
const trabajadorDocumentoController = require('../controllers/trabajadorDocumento.controller');
const trabajadorHorarioController = require('../controllers/trabajadorHorario.controller');
const trabajadorJustificacionController = require('../controllers/trabajadorJustificacion.controller');

// Proteger todas las rutas
router.use(verifyToken);

// ==========================================
// TRABAJADOR - DOCUMENTOS
// ==========================================
router.post(
  '/trabajadores/:id_trabajador/documentos',
  upload.single('archivo'),
  trabajadorDocumentoController.subirDocumento
);
router.get(
  '/trabajadores/:id_trabajador/documentos',
  trabajadorDocumentoController.obtenerDocumentos
);
router.get(
  '/trabajadores/:id_trabajador/documentos/tipos',
  trabajadorDocumentoController.obtenerTiposDocumento
);
router.get(
  '/trabajadores/:id_trabajador/documentos/:id_documento',
  trabajadorDocumentoController.obtenerDocumentoPorId
);
router.delete(
  '/trabajadores/:id_trabajador/documentos/:id_documento',
  trabajadorDocumentoController.eliminarDocumento
);

// ==========================================
// TRABAJADOR - HORARIOS
// ==========================================
router.post('/trabajadores/:id_trabajador/horarios', trabajadorHorarioController.crearHorario);
router.post(
  '/trabajadores/:id_trabajador/horarios/completos',
  trabajadorHorarioController.crearHorariosCompletos
);
router.get('/trabajadores/:id_trabajador/horarios', trabajadorHorarioController.obtenerHorarios);
router.get(
  '/trabajadores/:id_trabajador/horarios/completos',
  trabajadorHorarioController.obtenerHorariosCompletos
);
router.get('/trabajadores/horarios/dias-semana', trabajadorHorarioController.obtenerDiasSemana);
router.put(
  '/trabajadores/:id_trabajador/horarios/:dia_semana',
  trabajadorHorarioController.actualizarHorario
);
router.delete(
  '/trabajadores/:id_trabajador/horarios/:dia_semana',
  trabajadorHorarioController.eliminarHorario
);

// ==========================================
// TRABAJADOR - JUSTIFICACIONES
// ==========================================
router.post(
  '/trabajadores/:id_trabajador/justificaciones',
  upload.single('archivo'),
  trabajadorJustificacionController.crearJustificacion
);
router.get(
  '/trabajadores/:id_trabajador/justificaciones',
  trabajadorJustificacionController.obtenerJustificaciones
);
router.get(
  '/trabajadores/:id_trabajador/justificaciones/tipos',
  trabajadorJustificacionController.obtenerTipos
);
router.get(
  '/trabajadores/:id_trabajador/justificaciones/estados',
  trabajadorJustificacionController.obtenerEstados
);
router.get(
  '/trabajadores/:id_trabajador/justificaciones/estadisticas',
  trabajadorJustificacionController.obtenerEstadisticas
);
router.get(
  '/trabajadores/:id_trabajador/justificaciones/:id_justificacion',
  trabajadorJustificacionController.obtenerJustificacionPorId
);
router.put(
  '/trabajadores/:id_trabajador/justificaciones/:id_justificacion/estado',
  trabajadorJustificacionController.actualizarEstado
);
router.delete(
  '/trabajadores/:id_trabajador/justificaciones/:id_justificacion',
  trabajadorJustificacionController.eliminarJustificacion
);

module.exports = router;
