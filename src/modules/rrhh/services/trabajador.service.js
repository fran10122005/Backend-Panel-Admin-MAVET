const { Trabajador, CargoTrabajador } = require('../../../models');
const AppError = require('../../../utils/AppError');

const camposPermitidosTrabajador = [
  'cedula',
  'nombres',
  'apellidos',
  'telefono',
  'correo_personal',
  'id_cargo',
  'qr_uuid',
  'estado',
];

exports.createTrabajador = async (data) => {
  const payload = {};
  camposPermitidosTrabajador.forEach((c) => {
    if (data[c] !== undefined) payload[c] = data[c];
  });
  if (data.horas_semanales !== undefined) payload.horas_semanales = data.horas_semanales;
  return await Trabajador.create(payload);
};

exports.getAllTrabajadores = async (page, limit) => {
  const query = {
    include: [{ model: CargoTrabajador }],
  };
  if (page && limit) {
    const offset = (page - 1) * limit;
    query.limit = limit;
    query.offset = offset;
    const { count, rows } = await Trabajador.findAndCountAll(query);
    return {
      data: rows,
      meta: { totalItems: count, totalPages: Math.ceil(count / limit), currentPage: page },
    };
  }
  return await Trabajador.findAll(query);
};

exports.getTrabajadorById = async (id) => {
  const trabajador = await Trabajador.findByPk(id, {
    include: [{ model: CargoTrabajador }],
  });
  if (!trabajador) throw new AppError('Trabajador no encontrado', 404);
  return trabajador;
};

exports.updateTrabajador = async (id, data) => {
  const trabajador = await Trabajador.findByPk(id);
  if (!trabajador) throw new AppError('Trabajador no encontrado', 404);
  const payload = {};
  camposPermitidosTrabajador.forEach((c) => {
    if (data[c] !== undefined) payload[c] = data[c];
  });
  return await trabajador.update(payload);
};

exports.deleteTrabajador = async (id) => {
  const trabajador = await Trabajador.findByPk(id);
  if (!trabajador) throw new AppError('Trabajador no encontrado', 404);
  return await trabajador.destroy();
};

exports.subirFotoTrabajador = async (id_trabajador, filePath) => {
  const trabajador = await Trabajador.findByPk(id_trabajador);
  if (!trabajador) throw new AppError('Trabajador no encontrado', 404);

  const cloudinary = require('../../../config/cloudinary');
  const fs = require('fs');
  let url = filePath;

  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: 'mavet_trabajadores',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'avif'],
    });
    url = result.secure_url;
  } catch (uploadError) {
    // eslint-disable-next-line no-console
    console.error('Error al subir a Cloudinary:', uploadError.message);
    throw new AppError('Error al procesar la imagen. Intente nuevamente.', 500);
  } finally {
    try {
      fs.unlinkSync(filePath);
    } catch (e) {
      // Ignorar error de eliminación
    }
  }

  trabajador.foto_url = url;
  await trabajador.save();

  // Si tiene usuario vinculado, actualizar su foto_url también
  if (trabajador.id_usuario) {
    const { Usuario } = require('../../../models');
    await Usuario.update({ foto_url: url }, { where: { id_usuario: trabajador.id_usuario } });
  }

  return url;
};
