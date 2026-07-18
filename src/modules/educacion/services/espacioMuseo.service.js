const { EspacioMuseo, BitacoraAuditoria, SolicitudEspacio, Obra } = require('../../../models');
const AppError = require('../../../utils/AppError');
const { Op, Sequelize } = require('sequelize');

exports.createEspacio = async (data, user) => {
  if (data.capacidad !== undefined && data.capacidad !== null) {
    const cap = Number(data.capacidad);
    if (isNaN(cap) || cap < 1 || cap > 80) {
      throw new AppError('La capacidad debe estar entre 1 y 80 personas', 400);
    }
  }

  if (data.nombre) {
    const existing = await EspacioMuseo.findOne({
      where: Sequelize.where(
        Sequelize.fn('LOWER', Sequelize.col('nombre')),
        data.nombre.toLowerCase()
      ),
    });
    if (existing) throw new AppError('Ya existe un espacio con ese nombre', 409);
  }

  const nuevoEspacio = await EspacioMuseo.create(data);

  if (user) {
    await BitacoraAuditoria.create({
      id_usuario: user.id_usuario,
      correo: user.correo,
      tipo: 'create',
      detalle: `Se creó el espacio [${nuevoEspacio.id_espacio}]: ${nuevoEspacio.nombre}`,
    });
  }

  return nuevoEspacio;
};

exports.getAllEspacios = async () => {
  return await EspacioMuseo.findAll();
};

exports.getEspacioById = async (id) => {
  const espacio = await EspacioMuseo.findByPk(id);
  if (!espacio) throw new AppError('Espacio no encontrado', 404);
  return espacio;
};

exports.updateEspacio = async (id, data, user) => {
  const espacio = await EspacioMuseo.findByPk(id);
  if (!espacio) throw new AppError('Espacio no encontrado', 404);

  if (data.capacidad !== undefined && data.capacidad !== null) {
    const cap = Number(data.capacidad);
    if (isNaN(cap) || cap < 1 || cap > 80) {
      throw new AppError('La capacidad debe estar entre 1 y 80 personas', 400);
    }
  }

  const nombreAnterior = espacio.nombre;
  const fueCambiadoNombre = data.nombre && data.nombre !== nombreAnterior;

  if (fueCambiadoNombre) {
    const existing = await EspacioMuseo.findOne({
      where: Sequelize.where(
        Sequelize.fn('LOWER', Sequelize.col('nombre')),
        data.nombre.toLowerCase()
      ),
    });
    if (existing) throw new AppError('Ya existe un espacio con ese nombre', 409);
  }

  await espacio.update(data);

  if (user && fueCambiadoNombre) {
    await BitacoraAuditoria.create({
      id_usuario: user.id_usuario,
      correo: user.correo,
      tipo: 'update',
      detalle: `Cambio de nombre de sala [${espacio.id_espacio}]: ${nombreAnterior} -> ${data.nombre}`,
    });
  }

  return espacio;
};

exports.deleteEspacio = async (id, user) => {
  const espacio = await EspacioMuseo.findByPk(id);
  if (!espacio) throw new AppError('Espacio no encontrado', 404);

  const todayStr = new Date().toISOString().split('T')[0];

  const reservasFuturas = await SolicitudEspacio.count({
    where: {
      id_espacio: id,
      fecha_uso: {
        [Op.gte]: todayStr,
      },
    },
  });

  if (reservasFuturas > 0) {
    throw new AppError('No se puede eliminar la sala porque tiene reservas en fechas futuras', 400);
  }

  await espacio.destroy();

  if (user) {
    await BitacoraAuditoria.create({
      id_usuario: user.id_usuario,
      correo: user.correo,
      tipo: 'delete',
      detalle: `Se eliminó lógicamente el espacio [${espacio.id_espacio}]: ${espacio.nombre}`,
    });
  }

  return true;
};

exports.getEspacioDetalles = async (id) => {
  const espacio = await EspacioMuseo.findByPk(id);
  if (!espacio) throw new AppError('Espacio no encontrado', 404);

  // 1. Contar obras que están en este espacio
  // Asumiendo que Obras tiene un campo ubicacion o relacion con EspacioMuseo
  // Si no tiene relacion directa pero usa ubicacion_actual, buscamos por texto
  // Verificaremos esto. Por ahora usaremos un like si ubicacion_actual es texto.
  let cantidadObras = 0;
  if (Obra) {
    cantidadObras = await Obra.count({
      where: {
        ubicacion_actual: {
          [Op.iLike]: `%${espacio.nombre}%`,
        },
      },
    });
  }

  // 2. Historial de Auditoria
  const historial = await BitacoraAuditoria.findAll({
    where: {
      detalle: {
        [Op.like]: `%[${id}]%`,
      },
    },
    order: [['fecha', 'DESC']],
  });

  return {
    espacio,
    cantidadObras,
    historial,
  };
};
