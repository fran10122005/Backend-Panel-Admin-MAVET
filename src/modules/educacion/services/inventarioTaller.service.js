const { InventarioTaller } = require('../../../models');

/**
 * Retrieve all inventory talleres.
 */
async function getAll(page, limit) {
  const query = { order: [['nombre', 'ASC']] };
  if (page && limit) {
    const offset = (page - 1) * limit;
    query.limit = limit;
    query.offset = offset;
    const { count, rows } = await InventarioTaller.findAndCountAll(query);
    return {
      data: rows,
      meta: { totalItems: count, totalPages: Math.ceil(count / limit), currentPage: page },
    };
  }
  return await InventarioTaller.findAll(query);
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
