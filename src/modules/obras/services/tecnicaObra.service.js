const { TecnicaObra } = require('../../../models');
const AppError = require('../../../utils/AppError');

exports.createTecnica = async (data) => {
  return await TecnicaObra.create(data);
};

exports.getAllTecnicas = async () => {
  return await TecnicaObra.findAll();
};

exports.getTecnicaById = async (id) => {
  const tecnica = await TecnicaObra.findByPk(id);
  if (!tecnica) throw new AppError('Tecnica no encontrada', 404);
  return tecnica;
};

exports.updateTecnica = async (id, data) => {
  const tecnica = await TecnicaObra.findByPk(id);
  if (!tecnica) throw new AppError('Tecnica no encontrada', 404);
  return await tecnica.update(data);
};

exports.deleteTecnica = async (id) => {
  const tecnica = await TecnicaObra.findByPk(id);
  if (!tecnica) throw new AppError('Tecnica no encontrada', 404);
  return await tecnica.destroy();
};
