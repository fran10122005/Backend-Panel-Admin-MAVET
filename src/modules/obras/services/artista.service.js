const { Op } = require('sequelize');
const { Artista, sequelize } = require('../../../models');
const AppError = require('../../../utils/AppError');
const cacheService = require('../../../services/cache.service');

exports.createArtista = async (data) => {
  const result = await Artista.create(data);
  await cacheService.eliminarPatron('mavet:resp:/api/obras/artistas*');
  await cacheService.eliminarPatron('mavet:resp:/api/public/obras*');
  return result;
};

exports.getAllArtistas = async () => {
  return await Artista.findAll();
};

exports.getArtistaById = async (id) => {
  const artista = await Artista.findByPk(id);
  if (!artista) throw new AppError('Artista no encontrado', 404);
  return artista;
};

exports.buscarArtista = async (query) => {
  if (!query) throw new AppError('Debe proporcionar un término de búsqueda', 400);

  const likeOp = sequelize.getDialect() === 'postgres' ? Op.iLike : Op.like;

  const artistas = await Artista.findAll({
    where: {
      [Op.or]: [
        { ci: { [likeOp]: `%${query}%` } },
        { nombres: { [likeOp]: `%${query}%` } },
        { apellidos: { [likeOp]: `%${query}%` } },
      ],
    },
  });

  return artistas;
};

exports.updateArtista = async (id, data) => {
  const artista = await Artista.findByPk(id);
  if (!artista) throw new AppError('Artista no encontrado', 404);
  const result = await artista.update(data);
  await cacheService.eliminarPatron('mavet:resp:/api/obras/artistas*');
  await cacheService.eliminarPatron('mavet:resp:/api/public/obras*');
  return result;
};

exports.deleteArtista = async (id) => {
  const artista = await Artista.findByPk(id);
  if (!artista) throw new AppError('Artista no encontrado', 404);
  const result = await artista.destroy();
  await cacheService.eliminarPatron('mavet:resp:/api/obras/artistas*');
  await cacheService.eliminarPatron('mavet:resp:/api/public/obras*');
  return result;
};
