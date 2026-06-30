const catchAsync = require('../../../utils/catchAsync');
const Taller = require('../models/Taller.model');
const SolicitudEspacio = require('../models/SolicitudEspacio.model');
const { Op } = require('sequelize');

exports.getAgenda = catchAsync(async (req, res) => {
  // Traer talleres activos (todos)
  const talleres = await Taller.findAll({
    attributes: ['id_taller', 'nombre_curso', 'fecha', 'hora_inicio', 'hora_fin', 'estado'],
  });

  // Traer eventos del auditorio (todos)
  const eventos = await SolicitudEspacio.findAll({
    attributes: [
      'id_solicitud',
      'institucion',
      'motivo',
      'fecha_uso',
      'hora_inicio',
      'hora_fin',
      'estado',
    ],
  });

  // Unificar ambos en un arreglo de Agenda
  const agenda = [];

  talleres.forEach((t) => {
    agenda.push({
      id: `taller-${t.id_taller}`,
      tipo: 'Taller',
      titulo: t.nombre_curso,
      fecha: t.fecha,
      hora_inicio: t.hora_inicio,
      hora_fin: t.hora_fin,
    });
  });

  eventos.forEach((e) => {
    agenda.push({
      id: `evento-${e.id_solicitud}`,
      tipo: 'Evento',
      titulo: e.motivo,
      institucion: e.institucion,
      fecha: e.fecha_uso,
      hora_inicio: e.hora_inicio,
      hora_fin: e.hora_fin,
    });
  });

  // Ordenar por fecha (los más próximos primero)
  agenda.sort((a, b) => {
    const dateA = new Date(a.fecha);
    const dateB = new Date(b.fecha);
    return dateA - dateB;
  });

  const limit = req.query.limit ? parseInt(req.query.limit, 10) : 20;
  const limitedAgenda = agenda.slice(0, limit);

  res.status(200).json(limitedAgenda);
});
