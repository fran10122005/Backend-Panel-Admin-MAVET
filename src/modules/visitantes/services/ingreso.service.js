const {
  Persona,
  RegistroIngreso,
  MotivoVisita,
  Alumno,
  Representante,
  AlumnoRepresentante,
} = require('../../../models');
const AppError = require('../../../utils/AppError');
const sequelize = require('../../../config/db');

const calcularEdad = (fecha_nac) => {
  if (!fecha_nac) return null;
  const hoy = new Date();
  const nac = new Date(fecha_nac);
  let edad = hoy.getFullYear() - nac.getFullYear();
  const m = hoy.getMonth() - nac.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) {
    edad--;
  }
  return edad;
};

const buscarPersonaFlexible = async (cedulaLimpia, transaction = null) => {
  if (!cedulaLimpia) return null;
  // Si tiene guion (ej. cédula derivada de menor 12345-1), buscar exacto
  if (cedulaLimpia.includes('-')) {
    return await Persona.findOne({ where: { cedula: cedulaLimpia }, transaction });
  }
  // Buscar ignorando caracteres no numéricos en la DB (para tolerar V-12.345)
  return await Persona.findOne({
    where: sequelize.where(
      sequelize.fn('REGEXP_REPLACE', sequelize.col('cedula'), '[^0-9]', '', 'g'),
      cedulaLimpia
    ),
    transaction,
  });
};

// Verificar si una persona existe por cédula y traer sus talleres inscritos
exports.checkVisitante = async (rawCedula) => {
  const cedula = rawCedula ? rawCedula.replace(/^[VEve]-?/g, '').replace(/\D/g, '') : null;
  if (!cedula) throw new AppError('La cédula es requerida', 400);

  const persona = await buscarPersonaFlexible(cedula);
  if (!persona) return null;

  // Buscar si es alumno y traer talleres
  const { Alumno, InscripcionTaller, Taller } = require('../../../models');
  const alumno = await Alumno.findOne({
    where: { id_persona: persona.id_persona },
    include: [
      {
        model: InscripcionTaller,
        where: { estado_inscripcion: 'Inscrito' },
        required: false,
        include: [
          {
            model: Taller,
            where: { estado: 'Activo' },
            required: false,
          },
        ],
      },
    ],
  });

  const talleres_inscritos = [];
  if (alumno && alumno.InscripcionTallers) {
    alumno.InscripcionTallers.forEach((ins) => {
      if (ins.Taller) {
        talleres_inscritos.push({
          id_taller: ins.Taller.id_taller,
          nombre: ins.Taller.nombre_curso,
        });
      }
    });
  }

  return { ...persona.toJSON(), talleres_inscritos };
};

// Registrar el ingreso
exports.registrarIngreso = async (data) => {
  const t = await sequelize.transaction();
  try {
    const {
      id_representante_persona, // Obligatorio si es menor de 18
      id_motivo,
      id_taller,
      cantidad_acompanantes,
      nombres,
      apellidos,
      telefono,
      fecha_de_nac,
    } = data;

    const cedula = data.cedula ? data.cedula.replace(/^[VEve]-?/g, '').replace(/\D/g, '') : null;

    if (!id_motivo) throw new AppError('El motivo de la visita es requerido', 400);

    let persona = null;

    // Lógica para menores de 18 años
    const edad = calcularEdad(fecha_de_nac);

    if (edad !== null && edad < 18) {
      if (!id_representante_persona) {
        throw new AppError('Todo menor de 18 años debe tener un representante asociado', 400);
      }

      const representantePersona = await Persona.findByPk(id_representante_persona, {
        transaction: t,
      });
      if (!representantePersona)
        throw new AppError('El representante proporcionado no existe', 404);

      let cedulaFinal = cedula;

      // Si es < 9 años y no tiene cédula, generar derivada
      if (edad < 9 && !cedula) {
        // Buscar cuántos menores asociados tiene el representante para asignar el sufijo -X
        const repRole = await Representante.findOrCreate({
          where: { id_persona: id_representante_persona },
          defaults: { id_persona: id_representante_persona },
          transaction: t,
        });

        const numVinculos = await AlumnoRepresentante.count({
          where: { id_representante: repRole[0].id_representante },
          transaction: t,
        });

        cedulaFinal = `${representantePersona.cedula}-${numVinculos + 1}`;
      } else if (!cedula || cedula.trim() === 'V-' || cedula.trim() === 'E-') {
        throw new AppError(
          'Los mayores de 9 años deben tener cédula válida (no solo V- o E-)',
          400
        );
      }

      // Buscar o crear la persona menor
      persona = await buscarPersonaFlexible(cedulaFinal, t);
      if (!persona) {
        const datosPersona = { cedula: cedulaFinal, nombres, apellidos };
        if (telefono !== undefined) datosPersona.telefono = telefono;
        if (fecha_de_nac !== undefined) datosPersona.fecha_de_nac = fecha_de_nac;
        persona = await Persona.create(datosPersona, { transaction: t });
      }

      // Asegurar roles y vínculo
      const repRole = await Representante.findOrCreate({
        where: { id_persona: id_representante_persona },
        defaults: { id_persona: id_representante_persona },
        transaction: t,
      });

      const alumRole = await Alumno.findOrCreate({
        where: { id_persona: persona.id_persona },
        defaults: { id_persona: persona.id_persona },
        transaction: t,
      });

      await AlumnoRepresentante.findOrCreate({
        where: {
          id_alumno: alumRole[0].id_alumno,
          id_representante: repRole[0].id_representante,
        },
        defaults: {
          id_alumno: alumRole[0].id_alumno,
          id_representante: repRole[0].id_representante,
        },
        transaction: t,
      });
    } else {
      // Adulto
      if (!cedula || cedula.trim() === 'V-' || cedula.trim() === 'E-') {
        throw new AppError('La cédula es requerida para adultos y debe ser válida', 400);
      }
      persona = await buscarPersonaFlexible(cedula, t);
      if (!persona) {
        if (!nombres || !apellidos)
          throw new AppError('Faltan datos para registrar la persona', 400);
        const datosPersona = { cedula, nombres, apellidos };
        if (telefono !== undefined) datosPersona.telefono = telefono;
        if (fecha_de_nac !== undefined) datosPersona.fecha_de_nac = fecha_de_nac;
        persona = await Persona.create(datosPersona, { transaction: t });
      }
    }

    // Registrar ingreso
    const nuevoIngreso = await RegistroIngreso.create(
      {
        id_persona: persona.id_persona,
        id_motivo,
        id_taller: id_taller || null,
        cantidad_acompanantes: cantidad_acompanantes || 0,
        fecha_hora_entrada: new Date(),
      },
      { transaction: t }
    );

    await t.commit();
    return { persona, ingreso: nuevoIngreso };
  } catch (error) {
    await t.rollback();
    console.error('=== ERROR EN REGISTRAR INGRESO ===', error);
    if (error.errors) {
      console.error('Detalles de validación:', JSON.stringify(error.errors, null, 2));
    }
    if (error instanceof AppError) throw error;
    throw new AppError(
      error.errors
        ? error.errors.map((e) => e.message).join(', ')
        : error.message || JSON.stringify(error),
      500
    );
  }
};

exports.getAllIngresos = async (page, limit) => {
  const query = {
    include: [{ model: Persona }, { model: MotivoVisita }],
    order: [['fecha_hora_entrada', 'DESC']],
  };
  if (page && limit) {
    const offset = (page - 1) * limit;
    query.limit = limit;
    query.offset = offset;
    const { count, rows } = await RegistroIngreso.findAndCountAll(query);
    return {
      data: rows,
      meta: { totalItems: count, totalPages: Math.ceil(count / limit), currentPage: page },
    };
  }
  return await RegistroIngreso.findAll(query);
};

exports.getIngresosStats = async () => {
  const { Op, fn, col } = require('sequelize');
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const visitasHoyRaw = await RegistroIngreso.findAll({
    where: { fecha_hora_entrada: { [Op.gte]: hoy } },
    attributes: [
      [fn('COUNT', col('id_ingreso')), 'total_ingresos'],
      [fn('SUM', col('cantidad_acompanantes')), 'total_acompanantes'],
    ],
  });
  const vData = visitasHoyRaw[0]?.dataValues || {};
  const visitasHoy = parseInt(vData.total_ingresos || 0) + parseInt(vData.total_acompanantes || 0);

  const motivosRaw = await RegistroIngreso.findAll({
    attributes: [
      [col('RegistroIngreso.id_motivo'), 'id_motivo'],
      [fn('COUNT', col('RegistroIngreso.id_ingreso')), 'base_count'],
      [fn('SUM', col('RegistroIngreso.cantidad_acompanantes')), 'extra_count'],
    ],
    include: [{ model: MotivoVisita, attributes: ['descripcion'] }],
    group: [
      col('RegistroIngreso.id_motivo'),
      col('MotivoVisitum.id_motivo'),
      col('MotivoVisitum.descripcion'),
    ],
  });

  const porMotivo = motivosRaw.map((m) => {
    const base = parseInt(m.getDataValue('base_count') || 0);
    const extra = parseInt(m.getDataValue('extra_count') || 0);
    return {
      motivo: m.MotivoVisita ? m.MotivoVisita.descripcion : 'Desconocido',
      cantidad: base + extra,
    };
  });

  const totalVisitantesUnicos = await Persona.count();

  const totalVisitasRaw = await RegistroIngreso.findAll({
    attributes: [
      [fn('COUNT', col('id_ingreso')), 'total_ingresos'],
      [fn('SUM', col('cantidad_acompanantes')), 'total_acompanantes'],
    ],
  });
  const tData = totalVisitasRaw[0]?.dataValues || {};
  const totalVisitasHistoricas =
    parseInt(tData.total_ingresos || 0) + parseInt(tData.total_acompanantes || 0);

  return { visitasHoy, totalVisitantesUnicos, totalVisitasHistoricas, porMotivo };
};

exports.getTopVisitantes = async (limit = 3) => {
  const { fn, col } = require('sequelize');
  const Sequelize = require('sequelize');

  const topRaw = await RegistroIngreso.findAll({
    attributes: [
      [col('id_persona'), 'id_persona'],
      [fn('COUNT', col('id_persona')), 'total_visitas'],
      [fn('MAX', col('fecha_hora_entrada')), 'ultima_visita'],
    ],
    group: ['id_persona'],
    order: [[fn('COUNT', col('id_persona')), 'DESC']],
    limit,
    raw: true,
  });

  const ids = topRaw.map((r) => r.id_persona);
  const personas = ids.length
    ? await Persona.findAll({
        where: { id_persona: ids },
        attributes: ['id_persona', 'cedula', 'nombres', 'apellidos'],
        raw: true,
      })
    : [];
  const personaMap = Object.fromEntries(personas.map((p) => [p.id_persona, p]));

  return topRaw.map((t) => ({
    cedula: personaMap[t.id_persona]?.cedula || '',
    nombre:
      `${personaMap[t.id_persona]?.nombres || ''} ${personaMap[t.id_persona]?.apellidos || ''}`.trim() ||
      'Desconocido',
    total_visitas: parseInt(t.total_visitas),
    ultima_visita: t.ultima_visita,
  }));
};
