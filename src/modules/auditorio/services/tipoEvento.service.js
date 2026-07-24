const { TipoEvento } = require('../../../models');
const AppError = require('../../../utils/AppError');

exports.createTipoEvento = async (data) => {
  return await TipoEvento.create(data);
};

exports.getAllTiposEvento = async () => {
  return await TipoEvento.findAll({ order: [['nombre', 'ASC']] });
};

exports.getTipoEventoById = async (id) => {
  const tipo = await TipoEvento.findByPk(id);
  if (!tipo) throw new AppError('Tipo de evento no encontrado', 404);
  return tipo;
};

exports.updateTipoEvento = async (id, data) => {
  const tipo = await TipoEvento.findByPk(id);
  if (!tipo) throw new AppError('Tipo de evento no encontrado', 404);
  return await tipo.update(data);
};

exports.deleteTipoEvento = async (id) => {
  const tipo = await TipoEvento.findByPk(id);
  if (!tipo) throw new AppError('Tipo de evento no encontrado', 404);
  return await tipo.destroy();
};

exports.findOrCreateByNombre = async (nombre) => {
  const [tipo, created] = await TipoEvento.findOrCreate({
    where: { nombre },
    defaults: { nombre, descripcion: null },
  });
  return tipo;
};
