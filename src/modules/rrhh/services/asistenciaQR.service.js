const { AsistenciaQR, Trabajador, CargoTrabajador } = require('../../../models');
const AppError = require('../../../utils/AppError');

const calcularHoras = (inicio, fin) => {
  if (!inicio || !fin) return null;
  return Math.round((new Date(fin) - new Date(inicio)) / (1000 * 60 * 60) * 100) / 100;
};

exports.registrarAsistencia = async (data) => {
  const { cedulaTrabajador, tipoMovimiento, timestamp } = data;
  
  const trabajador = await Trabajador.findOne({ where: { cedula: cedulaTrabajador } });
  if (!trabajador) throw new AppError('Trabajador no encontrado', 404);

  const fecha = timestamp.split('T')[0];
  let asistencia = await AsistenciaQR.findOne({ 
    where: { 
      id_trabajador: trabajador.id_trabajador, 
      fecha 
    } 
  });

  if (!asistencia) {
    asistencia = await AsistenciaQR.create({
      id_trabajador: trabajador.id_trabajador,
      fecha
    });
  }

  const dateObj = new Date(timestamp);
  switch (tipoMovimiento) {
    case 'Entrada Mañana':
      asistencia.entrada_manana = dateObj;
      break;
    case 'Salida Mañana':
      asistencia.salida_manana = dateObj;
      break;
    case 'Entrada Tarde':
      asistencia.entrada_tarde = dateObj;
      break;
    case 'Salida Tarde':
      asistencia.salida_tarde = dateObj;
      break;
    default:
      throw new AppError('Tipo de movimiento inválido', 400);
  }
  
  const horasManana = calcularHoras(asistencia.entrada_manana, asistencia.salida_manana);
  const horasTarde = calcularHoras(asistencia.entrada_tarde, asistencia.salida_tarde);
  const total = (horasManana || 0) + (horasTarde || 0);
  asistencia.horas_cumplidas_dia = total > 0 ? total : null;

  await asistencia.save();
  return asistencia;
};

exports.getAllAsistencias = async () => {
  return await AsistenciaQR.findAll({
    include: [{
      model: Trabajador,
      include: [{ model: CargoTrabajador }]
    }],
    order: [['fecha', 'DESC']]
  });
};
