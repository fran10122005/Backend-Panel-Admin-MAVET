const {
  SesionTaller,
  AsistenciaAlumno,
  InscripcionTaller,
  Alumno,
  Taller,
  Persona,
} = require('../../../models');

exports.createSesion = async (id_taller, fecha, tema_impartido) => {
  const taller = await Taller.findByPk(id_taller);
  if (!taller) throw new Error('Taller no encontrado');

  const sesion = await SesionTaller.create({ id_taller, fecha, tema_impartido });
  return sesion;
};

exports.getSesionesByTaller = async (id_taller) => {
  const sesiones = await SesionTaller.findAll({
    where: { id_taller },
    order: [['fecha', 'DESC']],
    include: [
      {
        model: AsistenciaAlumno,
        required: false,
      },
    ],
  });

  return sesiones.map((s) => {
    const sJson = s.toJSON();
    sJson.asistentes = sJson.AsistenciaAlumnos
      ? sJson.AsistenciaAlumnos.filter((a) => a.asistio).length
      : 0;
    delete sJson.AsistenciaAlumnos;
    return sJson;
  });
};

exports.getAsistenciaSesion = async (id_sesion) => {
  const sesion = await SesionTaller.findByPk(id_sesion);
  if (!sesion) throw new Error('Sesión no encontrada');

  const { RegistroIngreso, Persona } = require('../../../models');
  const { Op } = require('sequelize');

  // Obtener inscritos
  const inscripciones = await InscripcionTaller.findAll({
    where: { id_taller: sesion.id_taller },
    include: [
      {
        model: Alumno,
        include: [{ model: Persona }],
      },
    ],
  });

  // Obtener asistencias ya guardadas para esta sesión
  const asistenciasGuardadas = await AsistenciaAlumno.findAll({
    where: { id_sesion },
  });
  const asistenciaMap = {};
  asistenciasGuardadas.forEach((a) => {
    asistenciaMap[a.id_alumno] = a.asistio;
  });

  // Obtener registros de puerta (Recepción) para este taller en la fecha de la sesión
  const inicioDia = new Date(sesion.fecha);
  inicioDia.setHours(0, 0, 0, 0);
  const finDia = new Date(sesion.fecha);
  finDia.setHours(23, 59, 59, 999);

  const ingresosPuerta = await RegistroIngreso.findAll({
    where: {
      id_taller: sesion.id_taller,
      fecha_hora_entrada: {
        [Op.between]: [inicioDia, finDia],
      },
    },
  });

  const personasIngresadasMap = {};
  ingresosPuerta.forEach((ing) => {
    personasIngresadasMap[ing.id_persona] = true;
  });

  // Combinar (si no está guardado, revisamos si entró por la puerta. Si entró, por defecto es true)
  const listaAsistencia = inscripciones.map((ins) => {
    let asistio = false;
    if (asistenciaMap[ins.id_alumno] !== undefined) {
      // Si el instructor ya guardó explícitamente un valor (true/false) para esta sesión
      asistio = asistenciaMap[ins.id_alumno];
    } else {
      // Si el instructor aún no ha guardado, vemos si entró por recepción
      asistio = personasIngresadasMap[ins.Alumno?.id_persona] === true;
    }

    const persona = ins.Alumno?.Persona || {};
    return {
      id_alumno: ins.id_alumno,
      nombres: persona.nombres || ins.Alumno?.nombres || '', // Fallback por compatibilidad
      apellidos: persona.apellidos || ins.Alumno?.apellidos || '',
      cedula_estudiantil: persona.cedula || ins.Alumno?.cedula_estudiantil || '',
      asistio,
    };
  });

  // Ordenar alfabéticamente
  listaAsistencia.sort((a, b) => a.nombres.localeCompare(b.nombres));

  return listaAsistencia;
};

exports.saveAsistencia = async (id_sesion, asistencias) => {
  const sesion = await SesionTaller.findByPk(id_sesion);
  if (!sesion) throw new Error('Sesión no encontrada');

  // asistencias = [{ id_alumno: 1, asistio: true }, ...]
  for (const asis of asistencias) {
    const existing = await AsistenciaAlumno.findOne({
      where: { id_sesion, id_alumno: asis.id_alumno },
    });
    if (existing) {
      await existing.update({ asistio: asis.asistio });
    } else {
      await AsistenciaAlumno.create({
        id_sesion,
        id_alumno: asis.id_alumno,
        asistio: asis.asistio,
      });
    }
  }
  return true;
};

exports.getMetricasTaller = async (id_taller) => {
  const taller = await Taller.findByPk(id_taller);
  if (!taller) throw new Error('Taller no encontrado');

  const sesiones = await SesionTaller.findAll({ where: { id_taller } });
  const totalSesiones = sesiones.length;

  const inscripciones = await InscripcionTaller.findAll({
    where: { id_taller },
    include: [{ model: Alumno, include: [{ model: Persona }] }],
  });

  const metricas = await Promise.all(
    inscripciones.map(async (ins) => {
      let asistidas = 0;
      if (totalSesiones > 0) {
        const idsSesiones = sesiones.map((s) => s.id_sesion);
        const asistencias = await AsistenciaAlumno.findAll({
          where: { id_alumno: ins.id_alumno, id_sesion: idsSesiones, asistio: true },
        });
        asistidas = asistencias.length;
      }
      const porcentaje = totalSesiones === 0 ? 0 : Math.round((asistidas / totalSesiones) * 100);

      const persona = ins.Alumno?.Persona || {};
      return {
        id_alumno: ins.id_alumno,
        nombres: persona.nombres || ins.Alumno?.nombres || '',
        apellidos: persona.apellidos || ins.Alumno?.apellidos || '',
        asistidas,
        totalSesiones,
        porcentaje,
      };
    })
  );

  metricas.sort((a, b) => b.porcentaje - a.porcentaje); // Mayor asistencia primero

  return {
    totalSesiones,
    totalAlumnos: inscripciones.length,
    alumnos: metricas,
  };
};
