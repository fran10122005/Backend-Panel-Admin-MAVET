const { Artista } = require('../../../models');
const AppError = require('../../../utils/AppError');

exports.createArtista = async (data) => {
  return await Artista.create(data);
};

exports.getAllArtistas = async () => {
  return await Artista.findAll();
};

exports.getArtistaById = async (id) => {
  const artista = await Artista.findByPk(id);
  if (!artista) throw new AppError('Artista no encontrado', 404);
  return artista;
};

exports.updateArtista = async (id, data) => {
  const artista = await Artista.findByPk(id);
  if (!artista) throw new AppError('Artista no encontrado', 404);
  return await artista.update(data);
};

exports.deleteArtista = async (id) => {
  const artista = await Artista.findByPk(id);
  if (!artista) throw new AppError('Artista no encontrado', 404);
  return await artista.destroy();
};
