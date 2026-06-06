const { Visitante, RegistroIngreso, MotivoVisita } = require('../../../models');
const AppError = require('../../../utils/AppError');

// Verificar si un visitante existe por cédula
exports.checkVisitante = async (cedula) => {
  if (!cedula) throw new AppError('La cédula es requerida', 400);
  const visitante = await Visitante.findOne({ where: { cedula } });
  return visitante; // retorna el visitante o null
};

// Registrar el ingreso (crea el visitante si es nuevo)
exports.registrarIngreso = async (data) => {
  const { 
    cedula, 
    id_motivo, 
    id_taller, 
    nombres, 
    apellidos, 
    telefono, 
    fecha_nacimiento, 
    institucion_profesion 
  } = data;

  if (!cedula) throw new AppError('La cédula es requerida para el registro', 400);
  if (!id_motivo) throw new AppError('El motivo de la visita es requerido', 400);

  // Verificar motivo
  const motivo = await MotivoVisita.findByPk(id_motivo);
  if (!motivo) throw new AppError('El motivo de la visita no es válido', 400);

  let visitante = await Visitante.findOne({ where: { cedula } });

  if (!visitante) {
    // Es primera vez, requiere los demás datos
    if (!nombres || !apellidos) {
      throw new AppError('Nombres y apellidos son requeridos para un nuevo visitante', 400);
    }

    visitante = await Visitante.create({
      cedula,
      nombres,
      apellidos,
      telefono,
      fecha_nacimiento,
      institucion_profesion
    });
  } else {
    // Si ya existe, opcionalmente se podrían actualizar sus datos si los envió
    // pero por simplicidad de un "flujo rápido" solo lo usamos
  }

  // Crear el registro de ingreso
  const nuevoIngreso = await RegistroIngreso.create({
    id_visitante: visitante.id_visitante,
    id_motivo,
    id_taller: id_taller || null,
    fecha_hora_entrada: new Date()
  });

  return {
    visitante,
    ingreso: nuevoIngreso
  };
};

exports.getAllIngresos = async () => {
  return await RegistroIngreso.findAll({
    include: [
      { model: Visitante },
      { model: MotivoVisita }
    ],
    order: [['fecha_hora_entrada', 'DESC']]
  });
};

exports.getIngresosStats = async () => {
  const { Op, fn, col } = require('sequelize');
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  // Visitas hoy
  const visitasHoy = await RegistroIngreso.count({
    where: {
      fecha_hora_entrada: { [Op.gte]: hoy }
    }
  });

  // Agrupación por motivos
  const motivosRaw = await RegistroIngreso.findAll({
    attributes: [
      'id_motivo',
      [fn('COUNT', col('id_motivo')), 'cantidad']
    ],
    include: [{ model: MotivoVisita, attributes: ['descripcion'] }],
    group: ['id_motivo', 'MotivoVisita.id_motivo', 'MotivoVisita.descripcion']
  });

  const porMotivo = motivosRaw.map(m => ({
    motivo: m.MotivoVisita ? m.MotivoVisita.descripcion : 'Desconocido',
    cantidad: parseInt(m.getDataValue('cantidad'))
  }));

  // Visitantes únicos en la base de datos vs total de visitas (una forma de ver nuevos vs recurrentes general)
  const totalVisitantesUnicos = await Visitante.count();
  const totalVisitasHistoricas = await RegistroIngreso.count();

  return {
    visitasHoy,
    totalVisitantesUnicos,
    totalVisitasHistoricas,
    porMotivo
  };
};
