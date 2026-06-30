const papeleraService = require('./papelera.service');
const catchAsync = require('../../utils/catchAsync');

exports.getPapeleraGlobal = catchAsync(async (req, res) => {
  const data = await papeleraService.getPapeleraGlobal();
  res.status(200).json({ status: 'success', data });
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
