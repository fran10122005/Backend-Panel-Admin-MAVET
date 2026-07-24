const express = require('express');
const router = express.Router();
const catchAsync = require('../../utils/catchAsync');
const { Taller, SolicitudEspacio, Obra, ImagenWeb } = require('../../models');
const cacheService = require('../../services/cache.service');

// ========================
// ENDPOINTS GET (Listados)
// ========================

// GET /api/cms/talleres
router.get(
  '/talleres',
  catchAsync(async (req, res) => {
    const talleres = await Taller.findAll({
      attributes: ['id_taller', 'nombre_curso', 'estado', 'mostrar_en_web', 'descripcion_web'],
      order: [['created_at', 'DESC']],
    });
    res.json({ data: talleres });
  })
);

// GET /api/cms/eventos
router.get(
  '/eventos',
  catchAsync(async (req, res) => {
    const eventos = await SolicitudEspacio.findAll({
      where: { estatus_aprobacion: 'aprobado' },
      attributes: ['id_solicitud', 'motivo', 'estado', 'mostrar_en_web', 'descripcion_web'],
      order: [['fecha_creacion', 'DESC']],
    });
    res.json({ data: eventos });
  })
);

// GET /api/cms/obras
router.get(
  '/obras',
  catchAsync(async (req, res) => {
    const obras = await Obra.findAll({
      attributes: ['id_obra', 'titulo', 'imagen_url', 'mostrar_en_web', 'descripcion'],
      include: [{ model: ImagenWeb, required: false, attributes: ['activo', 'descripcion'] }],
      order: [['created_at', 'DESC']],
    });
    res.json({ data: obras });
  })
);

// ========================
// ENDPOINTS PUT (Actualizar)
// ========================

// PUT /api/cms/talleres/:id
router.put(
  '/talleres/:id',
  catchAsync(async (req, res) => {
    const { id } = req.params;
    const { mostrar_en_web, descripcion_web } = req.body;
    const taller = await Taller.findByPk(id);
    if (!taller) return res.status(404).json({ error: 'Taller no encontrado' });

    if (mostrar_en_web !== undefined) taller.mostrar_en_web = mostrar_en_web;
    if (descripcion_web !== undefined) taller.descripcion_web = descripcion_web;

    await taller.save();
    await cacheService.eliminarPatron('mavet:resp:/api/public/agenda*');
    res.json({ message: 'Taller actualizado exitosamente', taller });
  })
);

// PUT /api/cms/eventos/:id
router.put(
  '/eventos/:id',
  catchAsync(async (req, res) => {
    const { id } = req.params;
    const { mostrar_en_web, descripcion_web } = req.body;
    const evento = await SolicitudEspacio.findByPk(id);
    if (!evento) return res.status(404).json({ error: 'Evento no encontrado' });

    if (mostrar_en_web !== undefined) evento.mostrar_en_web = mostrar_en_web;
    if (descripcion_web !== undefined) evento.descripcion_web = descripcion_web;

    await evento.save();
    await cacheService.eliminarPatron('mavet:resp:/api/public/agenda*');
    res.json({ message: 'Evento actualizado exitosamente', evento });
  })
);

// PUT /api/cms/obras/:id
router.put(
  '/obras/:id',
  catchAsync(async (req, res) => {
    const { id } = req.params;
    const { mostrar_en_web, descripcion_web } = req.body;

    const obra = await Obra.findByPk(id);
    if (!obra) return res.status(404).json({ error: 'Obra no encontrada' });

    if (mostrar_en_web !== undefined) obra.mostrar_en_web = mostrar_en_web;
    if (descripcion_web !== undefined) obra.descripcion = descripcion_web;

    await obra.save();
    await cacheService.eliminarPatron('mavet:resp:/api/public/obras*');
    res.json({ message: 'Obra actualizada exitosamente', obra });
  })
);

module.exports = router;
