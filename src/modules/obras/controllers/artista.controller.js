const artistaService = require('../services/artista.service');
const catchAsync = require('../../../utils/catchAsync');

exports.createArtista = catchAsync(async (req, res) => {
  const artista = await artistaService.createArtista(req.body);
  res.status(201).json({ message: 'Artista creado correctamente', data: artista });
});

exports.getAllArtistas = catchAsync(async (req, res) => {
  const result = await artistaService.getAllArtistas();
  res.status(200).json(result);
});

exports.getArtistaById = catchAsync(async (req, res) => {
  const artista = await artistaService.getArtistaById(req.params.id);
  res.status(200).json(artista);
});

exports.buscarArtista = catchAsync(async (req, res) => {
  const query = req.query.q;
  const resultados = await artistaService.buscarArtista(query);
  res.status(200).json({ message: 'Búsqueda completada', data: resultados });
});

exports.updateArtista = catchAsync(async (req, res) => {
  const artista = await artistaService.updateArtista(req.params.id, req.body);
  res.status(200).json({ message: 'Artista actualizado correctamente', data: artista });
});

exports.deleteArtista = catchAsync(async (req, res) => {
  await artistaService.deleteArtista(req.params.id);
  res.status(200).json({ message: 'Artista eliminado de la base de datos' });
});
