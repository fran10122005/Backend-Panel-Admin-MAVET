const { Obra, Artista, TecnicaObra, EstadoObra, Entrega } = require('../../../models');
const AppError = require('../../../utils/AppError');

exports.createObra = async (data) => {
  return await Obra.create(data);
};

exports.getAllObras = async () => {
  return await Obra.findAll({
    include: [Artista, TecnicaObra, EstadoObra, Entrega]
  });
};

exports.getObraById = async (id) => {
  const obra = await Obra.findByPk(id, {
    include: [Artista, TecnicaObra, EstadoObra, Entrega]
  });
  if (!obra) throw new AppError('Obra no encontrada', 404);
  return obra;
};

exports.updateObra = async (id, data) => {
  const obra = await Obra.findByPk(id);
  if (!obra) throw new AppError('Obra no encontrada', 404);
  return await obra.update(data);
};

exports.deleteObra = async (id) => {
  const obra = await Obra.findByPk(id);
  if (!obra) throw new AppError('Obra no encontrada', 404);
  return await obra.destroy();
};
