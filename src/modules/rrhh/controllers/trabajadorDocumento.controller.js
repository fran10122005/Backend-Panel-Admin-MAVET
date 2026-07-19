const trabajadorDocumentoService = require('./trabajadorDocumento.service');
const catchAsync = require('../../../utils/catchAsync');
const AppError = require('../../../utils/AppError');

exports.subirDocumento = catchAsync(async (req, res) => {
  const { id_trabajador } = req.params;
  const { tipo_documento, notas } = req.body;
  const file = req.file;

  if (!file) throw new AppError('No se ha subido ningún archivo', 400);
  if (!tipo_documento) throw new AppError('El tipo de documento es obligatorio', 400);

  const documento = await trabajadorDocumentoService.subirDocumento(
    id_trabajador,
    file,
    tipo_documento,
    notas
  );

  res.status(201).json({
    status: 'success',
    data: documento,
  });
});

exports.obtenerDocumentos = catchAsync(async (req, res) => {
  const { id_trabajador } = req.params;
  const documentos = await trabajadorDocumentoService.obtenerDocumentos(id_trabajador);

  res.status(200).json({
    status: 'success',
    data: documentos,
  });
});

exports.obtenerDocumentoPorId = catchAsync(async (req, res) => {
  const { id_documento } = req.params;
  const documento = await trabajadorDocumentoService.obtenerDocumentoPorId(id_documento);

  res.status(200).json({
    status: 'success',
    data: documento,
  });
});

exports.eliminarDocumento = catchAsync(async (req, res) => {
  const { id_documento } = req.params;
  await trabajadorDocumentoService.eliminarDocumento(id_documento);

  res.status(200).json({
    status: 'success',
    message: 'Documento eliminado',
  });
});

exports.obtenerTiposDocumento = catchAsync(async (req, res) => {
  const tipos = trabajadorDocumentoService.obtenerTiposDocumento();
  res.status(200).json({
    status: 'success',
    data: tipos,
  });
});
