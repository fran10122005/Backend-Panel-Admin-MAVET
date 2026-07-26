const papeleraService = require('./papelera.service');
const catchAsync = require('../../utils/catchAsync');

exports.getPapeleraGlobal = catchAsync(async (req, res) => {
  const { page, limit, tipo, search } = req.query;
  const result = await papeleraService.getPapeleraGlobal({
    page: page ? parseInt(page, 10) : 1,
    limit: limit ? parseInt(limit, 10) : 20,
    tipo,
    search,
  });
  res.status(200).json({ status: 'success', ...result });
});

exports.restaurarRegistro = catchAsync(async (req, res) => {
  const { tipo, id } = req.body;
  if (!tipo || !id) {
    return res
      .status(400)
      .json({ status: 'fail', message: 'Se requiere el tipo y el id del registro' });
  }
  const record = await papeleraService.restaurarRegistro(tipo, id);
  res
    .status(200)
    .json({ status: 'success', message: 'Registro restaurado exitosamente', data: record });
});

exports.eliminarDefinitivo = catchAsync(async (req, res) => {
  const { tipo, id } = req.body; // Se asume que viene por body o query. Lo estandarizamos por body
  if (!tipo || !id) {
    return res
      .status(400)
      .json({ status: 'fail', message: 'Se requiere el tipo y el id del registro' });
  }
  await papeleraService.eliminarDefinitivo(tipo, id);
  res.status(200).json({ status: 'success', message: 'Registro eliminado permanentemente' });
});

exports.vaciarPapelera = catchAsync(async (req, res) => {
  const { tipo } = req.query;
  const { eliminados } = await papeleraService.vaciarPapelera(tipo);
  res.status(200).json({
    status: 'success',
    message: `Papelera vaciada: ${eliminados} registro(s) eliminado(s) permanentemente`,
    eliminados,
  });
});
