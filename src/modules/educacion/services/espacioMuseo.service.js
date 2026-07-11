const { EspacioMuseo } = require('../../../models');
const AppError = require('../../../utils/AppError');
const { Op, Sequelize } = require('sequelize');

exports.createEspacio = async (data) => {
  if (data.nombre) {
    const existing = await EspacioMuseo.findOne({
      where: Sequelize.where(
        Sequelize.fn('LOWER', Sequelize.col('nombre')),
        data.nombre.toLowerCase()
      ),
    });
    if (existing) throw new AppError('Ya existe un espacio con ese nombre', 409);
  }
  return await EspacioMuseo.create(data);
};

exports.getAllEspacios = async () => {
  return await EspacioMuseo.findAll();
};

exports.getEspacioById = async (id) => {
  const espacio = await EspacioMuseo.findByPk(id);
  if (!espacio) throw new AppError('Espacio no encontrado', 404);
  return espacio;
};

exports.updateEspacio = async (id, data) => {
  const espacio = await EspacioMuseo.findByPk(id);
  if (!espacio) throw new AppError('Espacio no encontrado', 404);

  if (data.nombre && data.nombre !== espacio.nombre) {
    const existing = await EspacioMuseo.findOne({
      where: Sequelize.where(
        Sequelize.fn('LOWER', Sequelize.col('nombre')),
        data.nombre.toLowerCase()
      ),
    });
    if (existing) throw new AppError('Ya existe un espacio con ese nombre', 409);
  }

  return await espacio.update(data);
};

exports.deleteEspacio = async (id) => {
  const espacio = await EspacioMuseo.findByPk(id);
  if (!espacio) throw new AppError('Espacio no encontrado', 404);
  return await espacio.destroy();
};
