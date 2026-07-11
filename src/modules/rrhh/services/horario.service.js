const { Trabajador, AsistenciaQR, CargoTrabajador, HistorialHorario } = require('../../../models');
const { Op } = require('sequelize');
const AppError = require('../../../utils/AppError');

const inicioSemana = () => {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
};

const finSemana = () => {
  const monday = inicioSemana();
  const saturday = new Date(monday);
  saturday.setDate(monday.getDate() + 5);
  saturday.setHours(23, 59, 59, 999);
  return saturday;
};

exports.reporteSemanal = async () => {
  const inicio = inicioSemana();
  const fin = finSemana();
  const hoy = new Date();
  const semanaEnCurso = hoy <= fin;

  const trabajadores = await Trabajador.findAll({
    include: [{ model: CargoTrabajador }],
    where: { estado: true },
  });

  const asistencias = await AsistenciaQR.findAll({
    where: {
      fecha: { [Op.between]: [inicio, fin] },
    },
  });

  const asistenciasPorTrabajador = {};
  asistencias.forEach((a) => {
    if (!asistenciasPorTrabajador[a.id_trabajador]) {
      asistenciasPorTrabajador[a.id_trabajador] = [];
    }
    asistenciasPorTrabajador[a.id_trabajador].push(a);
  });

  return trabajadores.map((t) => {
    const registros = asistenciasPorTrabajador[t.id_trabajador] || [];
    const horasAcumuladas = registros.reduce(
      (sum, r) => sum + (parseFloat(r.horas_cumplidas_dia) || 0),
      0
    );
    const horasRequeridas = parseFloat(t.horas_semanales) || 0;
    const horasRestantes = Math.max(0, horasRequeridas - horasAcumuladas);

    return {
      trabajador: {
        id: t.id_trabajador,
        cedula: t.cedula,
        nombres: t.nombres,
        apellidos: t.apellidos,
        cargo: t.CargoTrabajador ? t.CargoTrabajador.nombre : null,
      },
      horas_semanales: horasRequeridas,
      horas_acumuladas: Math.round(horasAcumuladas * 100) / 100,
      horas_restantes: Math.round(horasRestantes * 100) / 100,
      estado: semanaEnCurso
        ? 'En curso'
        : horasAcumuladas >= horasRequeridas
          ? 'Completo'
          : 'Incompleto',
      dias_asistidos: registros.length,
    };
  });
};

exports.actualizarHorasSemanales = async (
  id_trabajador,
  horas_nuevas,
  motivo,
  id_usuario_modifica
) => {
  const trabajador = await Trabajador.findByPk(id_trabajador);
  if (!trabajador) throw new AppError('Trabajador no encontrado', 404);

  const horas_anteriores = trabajador.horas_semanales;

  if (horas_anteriores !== null) {
    const hoy = new Date();
    const domingo = new Date(finSemana());
    domingo.setDate(domingo.getDate() + 1);
    if (hoy <= domingo)
      throw new AppError('Solo se puede cambiar el horario al culminar la semana (domingo)', 400);
  }

  await trabajador.update({ horas_semanales: horas_nuevas });

  await HistorialHorario.create({
    id_trabajador,
    horas_anteriores,
    horas_nuevas,
    motivo,
    id_usuario_modifica,
  });

  return trabajador;
};

exports.obtenerHistorial = async (id_trabajador) => {
  return await HistorialHorario.findAll({
    where: { id_trabajador },
    order: [['fecha_cambio', 'DESC']],
  });
};
