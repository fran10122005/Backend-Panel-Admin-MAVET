const { InventarioTaller } = require('../../../models');

/**
 * Retrieve all inventory talleres.
 */
async function getAll() {
  return await InventarioTaller.findAll({ order: [['nombre', 'ASC']] });
}

/**
 * Create a new inventory taller.
 * @param {{ nombre: string, descripcion?: string }} data
 */
async function create(data) {
  return await InventarioTaller.create({ nombre: data.nombre, descripcion: data.descripcion });
}

async function update(id, data) {
  const taller = await InventarioTaller.findByPk(id);
  if (!taller) {
    const err = new Error('Taller no encontrado en el inventario');
    err.status = 404;
    throw err;
  }
  return await taller.update({ nombre: data.nombre, descripcion: data.descripcion });
}

async function remove(id) {
  const taller = await InventarioTaller.findByPk(id);
  if (!taller) {
    const err = new Error('Taller no encontrado en el inventario');
    err.status = 404;
    throw err;
  }
  return await taller.destroy();
}

module.exports = {
  getAll,
  create,
  update,
  remove,
};
