const catchAsync = require('../../../utils/catchAsync');
const Taller = require('../models/Taller.model');
const SolicitudEspacio = require('../models/SolicitudEspacio.model');
const { Op } = require('sequelize');

exports.getAgenda = catchAsync(async (req, res) => {
  // Traer talleres activos que se deban mostrar en web
  const talleres = await Taller.findAll({
    where: { mostrar_en_web: true },
    attributes: [
      'id_taller',
      'nombre_curso',
      'fecha',
      'hora_inicio',
      'hora_fin',
      'estado',
      'descripcion_web',
    ],
  });

  // Traer eventos aprobados que se deban mostrar en web
  const eventos = await SolicitudEspacio.findAll({
    where: {
      mostrar_en_web: true,
    },
    attributes: [
      'id_solicitud',
      'institucion',
      'motivo',
      'fecha_uso',
      'hora_inicio',
      'hora_fin',
      'estado',
      'descripcion_web',
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
      descripcion: t.descripcion_web,
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
      descripcion: e.descripcion_web,
    });
  });

  // Ordenar por fecha (los más próximos primero) y luego por hora
  agenda.sort((a, b) => {
    const dateA = new Date(a.fecha);
    const dateB = new Date(b.fecha);
    if (dateA - dateB !== 0) return dateA - dateB;
    return (a.hora_inicio || '').localeCompare(b.hora_inicio || '');
  });

  // Sin límite para que recepción pueda mostrar todos los de hoy
  res.status(200).json(agenda);
});
