const { TrabajadorJustificacion, Trabajador, TrabajadorHorario } = require('../../../models');
const AppError = require('../../../utils/AppError');
const { Op } = require('sequelize');
const path = require('path');
const fs = require('fs');

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
  'image/jpg',
];

exports.TIPOS_JUSTIFICACION = [
  { value: 'falta_dia_completo', label: 'Falta día completo' },
  { value: 'falta_parcial', label: 'Falta parcial' },
  { value: 'llegada_tardia', label: 'Llegada tardía' },
  { value: 'salida_anticipada', label: 'Salida anticipada' },
];

exports.ESTADOS = [
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'aprobada', label: 'Aprobada' },
  { value: 'rechazada', label: 'Rechazada' },
];

exports.crearJustificacion = async (id_trabajador, datos, file = null) => {
  const trabajador = await Trabajador.findByPk(id_trabajador);
  if (!trabajador) throw new AppError('Trabajador no encontrado', 404);

  const { fecha, tipo, hora_inicio, hora_fin, motivo, descripcion } = datos;

  if (!fecha || !tipo || !motivo) {
    throw new AppError('Fecha, tipo y motivo son obligatorios', 400);
  }

  if (
    !['falta_dia_completo', 'falta_parcial', 'llegada_tardia', 'salida_anticipada'].includes(tipo)
  ) {
    throw new AppError('Tipo de justificación inválido', 400);
  }

  if (['falta_parcial', 'llegada_tardia', 'salida_anticipada'].includes(tipo) && !hora_inicio) {
    throw new AppError('La hora de inicio es obligatoria para este tipo de justificación', 400);
  }

  if (file) {
    if (file.size > MAX_FILE_SIZE)
      throw new AppError('El archivo excede el tamaño máximo de 10MB', 400);
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new AppError('Tipo de archivo no permitido. Solo PDF, DOC, DOCX, JPG, PNG', 400);
    }
  }

  let archivoRuta = null;
  let archivoNombre = null;
  let archivoMime = null;
  let archivoTamano = null;

  if (file) {
    const cloudinary = require('../../../config/cloudinary');
    const publicId = `justificacion_${id_trabajador}_${Date.now()}`;

    try {
      const result = await cloudinary.uploader.upload(file.path, {
        folder: 'mavet_uploads/justificaciones',
        public_id: publicId,
        resource_type: 'auto',
      });
      archivoRuta = result.secure_url;
      archivoNombre = file.originalname;
      archivoMime = file.mimetype;
      archivoTamano = file.size;
    } catch (err) {
      console.error('Error subiendo archivo:', err.message);
      throw new AppError('Error al procesar el archivo', 500);
    } finally {
      if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
    }
  }

  const justificacion = await TrabajadorJustificacion.create({
    id_trabajador,
    fecha,
    tipo,
    hora_inicio: hora_inicio || null,
    hora_fin: hora_fin || null,
    motivo,
    descripcion: descripcion || null,
    archivo_ruta: archivoRuta,
    archivo_nombre: archivoNombre,
    archivo_mime: archivoMime,
    archivo_tamano: archivoTamano,
    estado: 'pendiente',
  });

  return justificacion;
};

exports.obtenerJustificaciones = async (id_trabajador, filtros = {}) => {
  const trabajador = await Trabajador.findByPk(id_trabajador);
  if (!trabajador) throw new AppError('Trabajador no encontrado', 404);

  const where = { id_trabajador };
  if (filtros.estado) where.estado = filtros.estado;
  if (filtros.tipo) where.tipo = filtros.tipo;
  if (filtros.fecha_desde || filtros.fecha_hasta) {
    where.fecha = {};
    if (filtros.fecha_desde) where.fecha[Op.gte] = filtros.fecha_desde;
    if (filtros.fecha_hasta) where.fecha[Op.lte] = filtros.fecha_hasta;
  }

  return await TrabajadorJustificacion.findAll({
    where,
    order: [
      ['fecha', 'DESC'],
      ['created_at', 'DESC'],
    ],
    include: [
      {
        model: require('../../../models').Trabajador,
        as: 'Trabajador',
        attributes: ['id_trabajador', 'nombres', 'apellidos', 'cedula'],
      },
    ],
  });
};

exports.obtenerJustificacionPorId = async (id_justificacion) => {
  const justificacion = await TrabajadorJustificacion.findByPk(id_justificacion, {
    include: [
      {
        model: require('../../../models').Trabajador,
        as: 'Trabajador',
        attributes: ['id_trabajador', 'nombres', 'apellidos', 'cedula', 'correo_personal'],
      },
    ],
  });
  if (!justificacion) throw new AppError('Justificación no encontrada', 404);
  return justificacion;
};

exports.actualizarEstadoJustificacion = async (
  id_justificacion,
  estado,
  usuario_id,
  observaciones = null
) => {
  const justificacion = await TrabajadorJustificacion.findByPk(id_justificacion);
  if (!justificacion) throw new AppError('Justificación no encontrada', 404);

  if (!['pendiente', 'aprobada', 'rechazada'].includes(estado)) {
    throw new AppError('Estado inválido', 400);
  }

  justificacion.estado = estado;
  justificacion.revisada_por = usuario_id;
  justificacion.fecha_revision = new Date();
  justificacion.observaciones_revision = observaciones;

  await justificacion.save();
  return justificacion;
};

exports.eliminarJustificacion = async (id_justificacion) => {
  const justificacion = await TrabajadorJustificacion.findByPk(id_justificacion);
  if (!justificacion) throw new AppError('Justificación no encontrada', 404);

  // Eliminar archivo de Cloudinary si existe
  if (justificacion.archivo_ruta) {
    try {
      const cloudinary = require('../../../config/cloudinary');
      const publicId = justificacion.archivo_ruta.split('/').pop().split('.')[0];
      await cloudinary.uploader.destroy(`mavet_uploads/justificaciones/${publicId}`);
    } catch (err) {
      console.warn('No se pudo eliminar de Cloudinary:', err.message);
    }
  }

  await justificacion.destroy();
  return true;
};

exports.obtenerEstadisticasJustificaciones = async (id_trabajador) => {
  const trabajador = await Trabajador.findByPk(id_trabajador);
  if (!trabajador) throw new AppError('Trabajador no encontrado', 404);

  const total = await TrabajadorJustificacion.count({ where: { id_trabajador } });
  const pendientes = await TrabajadorJustificacion.count({
    where: { id_trabajador, estado: 'pendiente' },
  });
  const aprobadas = await TrabajadorJustificacion.count({
    where: { id_trabajador, estado: 'aprobada' },
  });
  const rechazadas = await TrabajadorJustificacion.count({
    where: { id_trabajador, estado: 'rechazada' },
  });

  const porTipo = await TrabajadorJustificacion.findAll({
    where: { id_trabajador },
    attributes: ['tipo', [require('sequelize').fn('COUNT', '*'), 'cantidad']],
    group: ['tipo'],
  });

  return {
    total,
    pendientes,
    aprobadas,
    rechazadas,
    por_tipo: porTipo.map((t) => ({ tipo: t.tipo, cantidad: parseInt(t.get('cantidad')) })),
  };
};
