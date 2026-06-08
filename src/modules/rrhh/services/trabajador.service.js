const { Trabajador, CargoTrabajador } = require('../../../models');
const AppError = require('../../../utils/AppError');

const camposPermitidosTrabajador = [
  'cedula', 'nombres', 'apellidos', 'telefono', 'correo_personal',
  'id_cargo', 'qr_uuid', 'estado'
];

exports.createTrabajador = async (data) => {
  const payload = {};
  camposPermitidosTrabajador.forEach(c => { if (data[c] !== undefined) payload[c] = data[c]; });
  if (data.horas_semanales !== undefined) payload.horas_semanales = data.horas_semanales;
  return await Trabajador.create(payload);
};

exports.getAllTrabajadores = async () => {
  return await Trabajador.findAll({
    include: [{ model: CargoTrabajador }]
  });
};

exports.getTrabajadorById = async (id) => {
  const trabajador = await Trabajador.findByPk(id, {
    include: [{ model: CargoTrabajador }]
  });
  if (!trabajador) throw new AppError('Trabajador no encontrado', 404);
  return trabajador;
};

exports.updateTrabajador = async (id, data) => {
  const trabajador = await Trabajador.findByPk(id);
  if (!trabajador) throw new AppError('Trabajador no encontrado', 404);
  const payload = {};
  camposPermitidosTrabajador.forEach(c => { if (data[c] !== undefined) payload[c] = data[c]; });
  return await trabajador.update(payload);
};

exports.deleteTrabajador = async (id) => {
  const trabajador = await Trabajador.findByPk(id);
  if (!trabajador) throw new AppError('Trabajador no encontrado', 404);
  return await trabajador.destroy();
};
