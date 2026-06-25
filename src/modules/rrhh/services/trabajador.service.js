const { Trabajador, CargoTrabajador } = require('../../../models');
const AppError = require('../../../utils/AppError');

const camposPermitidosTrabajador = [
  'cedula',
  'nombres',
  'apellidos',
  'telefono',
  'correo_personal',
  'id_cargo',
  'qr_uuid',
  'estado',
];

exports.createTrabajador = async (data) => {
  const payload = {};
  camposPermitidosTrabajador.forEach((c) => {
    if (data[c] !== undefined) payload[c] = data[c];
  });
  if (data.horas_semanales !== undefined) payload.horas_semanales = data.horas_semanales;
  return await Trabajador.create(payload);
};

exports.getAllTrabajadores = async (page, limit) => {
  const query = {
    include: [{ model: CargoTrabajador }],
  };
  if (page && limit) {
    const offset = (page - 1) * limit;
    query.limit = limit;
    query.offset = offset;
    const { count, rows } = await Trabajador.findAndCountAll(query);
    return {
      data: rows,
      meta: { totalItems: count, totalPages: Math.ceil(count / limit), currentPage: page },
    };
  }
  return await Trabajador.findAll(query);
};

exports.getTrabajadorById = async (id) => {
  const trabajador = await Trabajador.findByPk(id, {
    include: [{ model: CargoTrabajador }],
  });
  if (!trabajador) throw new AppError('Trabajador no encontrado', 404);
  return trabajador;
};

exports.updateTrabajador = async (id, data) => {
  const trabajador = await Trabajador.findByPk(id);
  if (!trabajador) throw new AppError('Trabajador no encontrado', 404);
  const payload = {};
  camposPermitidosTrabajador.forEach((c) => {
    if (data[c] !== undefined) payload[c] = data[c];
  });
  return await trabajador.update(payload);
};

exports.deleteTrabajador = async (id) => {
  const trabajador = await Trabajador.findByPk(id);
  if (!trabajador) throw new AppError('Trabajador no encontrado', 404);
  return await trabajador.destroy();
};
