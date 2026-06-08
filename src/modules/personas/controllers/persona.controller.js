const personaService = require('../services/persona.service');
const catchAsync = require('../../../utils/catchAsync');

exports.buscarPersona = catchAsync(async (req, res) => {
  const query = req.query.q;
  const resultados = await personaService.buscarPersona(query);
  res.status(200).json({
    message: 'Búsqueda completada',
    data: resultados
  });
});
