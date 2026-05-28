const { Taller, Instructor, EspacioMuseo } = require('../../../models');
const AppError = require('../../../utils/AppError');

exports.createTaller = async (data) => {
  return await Taller.create(data);
};

exports.getAllTalleres = async () => {
  return await Taller.findAll({
    include: [Instructor, EspacioMuseo]
  });
};

exports.getTallerById = async (id) => {
  const taller = await Taller.findByPk(id, {
    include: [Instructor, EspacioMuseo]
  });
  if (!taller) throw new AppError('Taller no encontrado', 404);
  return taller;
};

exports.updateTaller = async (id, data) => {
  const taller = await Taller.findByPk(id);
  if (!taller) throw new AppError('Taller no encontrado', 404);
  return await taller.update(data);
};

exports.deleteTaller = async (id) => {
  const taller = await Taller.findByPk(id);
  if (!taller) throw new AppError('Taller no encontrado', 404);
  return await taller.destroy();
};
