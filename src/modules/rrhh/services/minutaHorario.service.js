const { Trabajador } = require('../../../models');
const cloudinary = require('../../../config/cloudinary');
const fs = require('fs');
const AppError = require('../../../utils/AppError');

exports.subirMinuta = async (id_trabajador, file) => {
  const trabajador = await Trabajador.findByPk(id_trabajador);
  if (!trabajador) throw new AppError('Trabajador no encontrado', 404);
  if (!file) throw new AppError('No se ha subido ningún archivo', 400);

  let url = file.path;

  try {
    const result = await cloudinary.uploader.upload(file.path, {
      folder: `mavet_uploads/trabajadores/${id_trabajador}/minuta_horario`,
      resource_type: 'auto',
    });
    url = result.secure_url;
  } catch (uploadError) {
    console.error('Error subiendo minuta a Cloudinary:', uploadError.message);
    throw new AppError('Error al procesar el archivo. Intente nuevamente.', 500);
  } finally {
    if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
  }

  trabajador.documento_minuta_url = url;
  trabajador.documento_minuta_nombre = file.originalname;
  await trabajador.save();

  return { url, nombre: file.originalname };
};

exports.obtenerMinuta = async (id_trabajador) => {
  const trabajador = await Trabajador.findByPk(id_trabajador);
  if (!trabajador) throw new AppError('Trabajador no encontrado', 404);

  if (!trabajador.documento_minuta_url) return null;

  return {
    url: trabajador.documento_minuta_url,
    nombre: trabajador.documento_minuta_nombre,
  };
};

exports.eliminarMinuta = async (id_trabajador) => {
  const trabajador = await Trabajador.findByPk(id_trabajador);
  if (!trabajador) throw new AppError('Trabajador no encontrado', 404);
  if (!trabajador.documento_minuta_url)
    throw new AppError('No hay minuta de horario para eliminar', 404);

  try {
    const publicId = `mavet_uploads/trabajadores/${id_trabajador}/minuta_horario/${trabajador.documento_minuta_url.split('/').pop().split('.')[0]}`;
    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    console.warn('No se pudo eliminar de Cloudinary:', err.message);
  }

  trabajador.documento_minuta_url = null;
  trabajador.documento_minuta_nombre = null;
  await trabajador.save();

  return true;
};
