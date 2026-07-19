const { TrabajadorDocumento, Trabajador } = require('../../../models');
const cloudinary = require('../../../config/cloudinary');
const fs = require('fs');
const AppError = require('../../../utils/AppError');

const TIPOS_DOCUMENTO_VALIDOS = ['contrato', 'cv', 'cedula', 'certificado', 'foto', 'otro'];

const getTipoDocumentoLabel = (tipo) => {
  const labels = {
    contrato: 'Contrato',
    cv: 'Curriculum Vitae',
    cedula: 'Cédula de Identidad',
    certificado: 'Certificado',
    foto: 'Foto',
    otro: 'Otro',
  };
  return labels[tipo] || tipo;
};

exports.subirDocumento = async (id_trabajador, file, tipo_documento, notas = null) => {
  const trabajador = await Trabajador.findByPk(id_trabajador);
  if (!trabajador) throw new AppError('Trabajador no encontrado', 404);

  if (!TIPOS_DOCUMENTO_VALIDOS.includes(tipo_documento)) {
    throw new AppError('Tipo de documento inválido', 400);
  }

  if (!file) throw new AppError('No se ha subido ningún archivo', 400);

  let url = file.path;

  try {
    const result = await cloudinary.uploader.upload(file.path, {
      folder: `mavet_uploads/trabajadores/${id_trabajador}/documentos`,
      resource_type: 'auto',
    });
    url = result.secure_url;
  } catch (uploadError) {
    console.error(
      'Error subiendo a Cloudinary:',
      uploadError.message,
      uploadError.http_code,
      uploadError
    );
    throw new AppError(`Error al procesar el archivo: ${uploadError.message}`, 500);
  } finally {
    if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
  }

  const documento = await TrabajadorDocumento.create({
    id_trabajador,
    tipo_documento,
    nombre_archivo: file.originalname,
    ruta_archivo: url,
    mime_type: file.mimetype,
    tamano_archivo: file.size,
    notas,
  });

  return documento;
};

exports.obtenerDocumentos = async (id_trabajador) => {
  const trabajador = await Trabajador.findByPk(id_trabajador);
  if (!trabajador) throw new AppError('Trabajador no encontrado', 404);

  return await TrabajadorDocumento.findAll({
    where: { id_trabajador },
    order: [['fecha_subida', 'DESC']],
  });
};

exports.obtenerDocumentoPorId = async (id_documento) => {
  const documento = await TrabajadorDocumento.findByPk(id_documento);
  if (!documento) throw new AppError('Documento no encontrado', 404);
  return documento;
};

exports.eliminarDocumento = async (id_documento) => {
  const documento = await TrabajadorDocumento.findByPk(id_documento);
  if (!documento) throw new AppError('Documento no encontrado', 404);

  if (documento.ruta_archivo) {
    try {
      const cloudinary = require('../../../config/cloudinary');
      const publicId = documento.ruta_archivo.split('/').pop().split('.')[0];
      await cloudinary.uploader.destroy(
        `mavet_uploads/trabajadores/${documento.id_trabajador}/documentos/${publicId}`
      );
    } catch (err) {
      console.warn('No se pudo eliminar de Cloudinary:', err.message);
    }
  }

  await documento.destroy();
  return true;
};

exports.obtenerTiposDocumento = () => {
  return TIPOS_DOCUMENTO_VALIDOS.map((tipo) => ({
    value: tipo,
    label: getTipoDocumentoLabel(tipo),
  }));
};
