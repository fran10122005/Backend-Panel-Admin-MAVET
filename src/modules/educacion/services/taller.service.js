const { Op } = require('sequelize');
const { Taller, Instructor, EspacioMuseo, InventarioTaller, Persona } = require('../../../models');
const AppError = require('../../../utils/AppError');
const cacheService = require('../../../services/cache.service');

const normalizeNombre = (nombre) => nombre.toLowerCase().replace(/\s+/g, '');

const checkNombreCursoUnico = async (nombre_curso, excludeId = null) => {
  const normalized = normalizeNombre(nombre_curso);
  const where = excludeId ? { id_taller: { [Op.ne]: excludeId } } : {};
  const talleres = await Taller.findAll({ attributes: ['id_taller', 'nombre_curso'], where });

  for (const t of talleres) {
    if (normalizeNombre(t.nombre_curso) === normalized) {
      throw new AppError(
        `El nombre del taller "${t.nombre_curso}" ya está registrado. Por favor, utiliza un nombre diferente.`,
        400
      );
    }
  }
};

const calcularHorasTotales = (horaInicio, horaFin, numSesiones) => {
  if (!horaInicio || !horaFin || !numSesiones) return null;
  const [hI, mI] = horaInicio.split(':').map(Number);
  const [hF, mF] = horaFin.split(':').map(Number);

  const inicioMinutos = hI * 60 + mI;
  const finMinutos = hF * 60 + mF;

  if (finMinutos > inicioMinutos) {
    const diffHours = (finMinutos - inicioMinutos) / 60;
    return diffHours * parseInt(numSesiones, 10);
  }
  return null;
};

exports.createTaller = async (data) => {
  if (data.nombre_curso) {
    await checkNombreCursoUnico(data.nombre_curso);
  }
  if (data.hora_inicio && data.hora_fin && data.sesiones) {
    const calc = calcularHorasTotales(data.hora_inicio, data.hora_fin, data.sesiones);
    if (calc !== null) data.horas_totales = String(calc);
  }
  if (data.fecha && !data.fecha_fin) {
    data.fecha_fin = data.fecha;
  }
  const result = await Taller.create(data);
  await cacheService.eliminarPatron('mavet:resp:/api/public/agenda*');
  return result;
};

/**
 * Planificar un taller a partir de un inventario existente.
 * @param {{ inventarioId: number, fecha: string, hora_inicio: string, hora_fin: string, sesiones?: number, cupo_minimo?: number, cupo_maximo?: number, horas_totales?: number, id_instructor?: number, id_espacio?: number }} data
 */
exports.planificarTaller = async (data) => {
  const { inventarioId, ...rest } = data;
  const inventario = await InventarioTaller.findByPk(inventarioId);
  if (!inventario) {
    throw new AppError('Inventario de taller no encontrado', 404);
  }

  if (rest.hora_inicio && rest.hora_fin && rest.sesiones) {
    const calc = calcularHorasTotales(rest.hora_inicio, rest.hora_fin, rest.sesiones);
    if (calc !== null) rest.horas_totales = String(calc);
  }

  // Map inventory name to taller's nombre_curso field.
  const tallerData = {
    nombre_curso: inventario.nombre,
    ...rest,
  };

  await checkNombreCursoUnico(tallerData.nombre_curso);
  if (tallerData.fecha && !tallerData.fecha_fin) {
    tallerData.fecha_fin = tallerData.fecha;
  }
  const result = await Taller.create(tallerData);
  await cacheService.eliminarPatron('mavet:resp:/api/public/agenda*');
  return result;
};

exports.getAllTalleres = async (page, limit) => {
  const query = {
    include: [
      {
        model: Instructor,
        include: [Persona],
      },
      EspacioMuseo,
    ],
    order: [['id_taller', 'DESC']],
  };

  if (page && limit) {
    const offset = (page - 1) * limit;
    query.limit = limit;
    query.offset = offset;
    const { count, rows } = await Taller.findAndCountAll(query);
    return {
      data: rows,
      meta: { totalItems: count, totalPages: Math.ceil(count / limit), currentPage: page },
    };
  }

  return await Taller.findAll(query);
};

exports.getTallerById = async (id) => {
  const taller = await Taller.findByPk(id, {
    include: [
      {
        model: Instructor,
        include: [Persona],
      },
      EspacioMuseo,
    ],
  });
  if (!taller) throw new AppError('Taller no encontrado', 404);
  return taller;
};

exports.updateTaller = async (id, data) => {
  const taller = await Taller.findByPk(id);
  if (!taller) throw new AppError('Taller no encontrado', 404);
  if (data.nombre_curso) {
    await checkNombreCursoUnico(data.nombre_curso, id);
  }
  const result = await taller.update(data);
  await cacheService.eliminarPatron('mavet:resp:/api/public/agenda*');
  return result;
};

exports.deleteTaller = async (id) => {
  const taller = await Taller.findByPk(id);
  if (!taller) throw new AppError('Taller no encontrado', 404);
  const result = await taller.destroy();
  await cacheService.eliminarPatron('mavet:resp:/api/public/agenda*');
  return result;
};
