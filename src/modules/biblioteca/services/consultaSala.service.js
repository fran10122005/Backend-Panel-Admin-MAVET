const { Op } = require('sequelize');
const { ConsultaSala, Persona, Libro, Trabajador } = require('../../../models');
const AppError = require('../../../utils/AppError');
const { normalizeCedula } = require('../../../utils/cedula');
const sequelize = require('../../../config/db');

exports.createConsulta = async (data) => {
  const { id_libro, id_persona, id_trabajador, estado, cedula, nombre, observaciones } = data;

  if (!id_libro) throw new AppError('El ID del libro es requerido', 400);

  let finalIdPersona = id_persona;

  if (!finalIdPersona && cedula) {
    try {
      const normalizedCed = normalizeCedula(cedula);
      let persona = await Persona.findOne({ where: { cedula: normalizedCed } });
      if (!persona) {
        if (!nombre)
          throw new AppError(
            'Se requiere el nombre para crear una nueva persona asociada a la cédula',
            400
          );
        let nombres = nombre;
        let apellidos = '';
        const parts = nombre.split(' ');
        if (parts.length > 1) {
          nombres = parts[0];
          apellidos = parts.slice(1).join(' ');
        }
        persona = await Persona.create({ cedula: normalizedCed, nombres, apellidos });
      }
      finalIdPersona = persona.id_persona;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Error al buscar o crear la persona: ' + error.message, 500);
    }
  }

  if (!finalIdPersona && !id_trabajador)
    throw new AppError('Debe asociarse a una persona (o proveer cédula) o un trabajador', 400);

  const consulta = await ConsultaSala.create({
    id_libro,
    id_persona: finalIdPersona || null,
    id_trabajador: id_trabajador || null,
    hora_entrega: new Date(),
    estado: estado || 'ACTIVO',
    observaciones: observaciones || null,
  });

  // Decrease stock available
  const libro = await Libro.findByPk(id_libro);
  if (libro && parseInt(libro.cantidad_disponible, 10) > 0) {
    const nueva = String(parseInt(libro.cantidad_disponible, 10) - 1);
    await Libro.update({ cantidad_disponible: nueva }, { where: { id_libro } });
  }

  // Devolver con relaciones para que el frontend tenga los datos
  return await ConsultaSala.findByPk(consulta.id_consulta, {
    include: [Persona, Libro, Trabajador],
  });
};

exports.updateConsulta = async (id_consulta, data) => {
  const { estado, observaciones } = data;
  const consulta = await ConsultaSala.findByPk(id_consulta);
  if (!consulta) throw new AppError('Consulta no encontrada', 404);

  const updateData = {};
  if (estado !== undefined) updateData.estado = estado;
  if (observaciones !== undefined) updateData.observaciones = observaciones;

  await consulta.update(updateData);

  return consulta;
};

exports.getAllConsultas = async () => {
  const consultas = await ConsultaSala.findAll({
    include: [Persona, Libro, Trabajador],
  });
  return consultas.map((c) => {
    const json = c.toJSON();
    json.hora_entrega = json.hora_entrega || null;
    json.hora_devolucion = json.hora_devolucion || null;
    return json;
  });
};

function calcularRangoFechas(periodo) {
  const ahora = new Date();
  const inicioHoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate(), 0, 0, 0);
  const finHoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate(), 23, 59, 59);

  if (periodo === 'hoy') {
    return { desde: inicioHoy, hasta: finHoy };
  }

  if (periodo === 'semana') {
    const diaSemana = ahora.getDay();
    const lunes = new Date(inicioHoy);
    lunes.setDate(lunes.getDate() - ((diaSemana + 6) % 7));
    const domingo = new Date(lunes);
    domingo.setDate(domingo.getDate() + 6);
    domingo.setHours(23, 59, 59);
    return { desde: lunes, hasta: domingo };
  }

  if (periodo === 'mes') {
    const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1, 0, 0, 0);
    const finMes = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0, 23, 59, 59);
    return { desde: inicioMes, hasta: finMes };
  }

  return { desde: null, hasta: null };
}

exports.getConsultasFiltradas = async (filtros) => {
  const { periodo, fecha_desde, fecha_hasta, id_libro, id_persona, estado, page, limit } = filtros;

  const where = {};

  if (periodo && periodo !== 'personalizado') {
    const rango = calcularRangoFechas(periodo);
    if (rango.desde && rango.hasta) {
      where.hora_entrega = { [Op.between]: [rango.desde, rango.hasta] };
    }
  } else if (fecha_desde || fecha_hasta) {
    where.hora_entrega = {};
    if (fecha_desde) where.hora_entrega[Op.gte] = new Date(fecha_desde);
    if (fecha_hasta) {
      const hasta = new Date(fecha_hasta);
      hasta.setHours(23, 59, 59);
      where.hora_entrega[Op.lte] = hasta;
    }
  }

  if (id_libro) where.id_libro = id_libro;
  if (id_persona) where.id_persona = id_persona;
  if (estado) where.estado = estado;

  const offset = (page - 1) * limit;

  const { count, rows } = await ConsultaSala.findAndCountAll({
    where,
    include: [
      { model: Persona, attributes: ['id_persona', 'nombres', 'apellidos', 'cedula'] },
      { model: Libro, attributes: ['id_libro', 'titulo', 'estante'] },
      { model: Trabajador, attributes: ['id_trabajador'] },
    ],
    order: [['hora_entrega', 'DESC']],
    limit,
    offset,
  });

  return {
    data: rows,
    meta: {
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
    },
  };
};

exports.getEstadisticas = async (top) => {
  const ahora = new Date();
  const inicioHoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate(), 0, 0, 0);
  const finHoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate(), 23, 59, 59);

  const lunes = new Date(inicioHoy);
  lunes.setDate(lunes.getDate() - ((ahora.getDay() + 6) % 7));

  const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1, 0, 0, 0);
  const finMes = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0, 23, 59, 59);

  const totales = {
    hoy: await ConsultaSala.count({
      where: { hora_entrega: { [Op.between]: [inicioHoy, finHoy] } },
    }),
    semana: await ConsultaSala.count({ where: { hora_entrega: { [Op.gte]: lunes } } }),
    mes: await ConsultaSala.count({
      where: { hora_entrega: { [Op.between]: [inicioMes, finMes] } },
    }),
    activas: await ConsultaSala.count({ where: { estado: 'ACTIVO' } }),
    devueltas: await ConsultaSala.count({ where: { estado: 'Devuelto' } }),
  };

  const topLibrosRaw = await ConsultaSala.findAll({
    attributes: [
      'id_libro',
      [sequelize.fn('COUNT', sequelize.col('id_consulta')), 'total_consultas'],
    ],
    group: ['id_libro', 'Libro.id_libro', 'Libro.titulo'],
    include: [{ model: Libro, attributes: ['id_libro', 'titulo'], required: true }],
    order: [[sequelize.literal('total_consultas'), 'DESC']],
    limit: top,
  });

  const topLibros = topLibrosRaw.map((c) => ({
    id_libro: c.id_libro,
    titulo: c.Libro?.titulo || 'Desconocido',
    total_consultas: parseInt(c.get('total_consultas'), 10),
  }));

  return { topLibros, totales };
};
