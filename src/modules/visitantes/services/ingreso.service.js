const { Persona, RegistroIngreso, MotivoVisita, Alumno, Representante, AlumnoRepresentante } = require('../../../models');
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

// Verificar si una persona existe por cédula
exports.checkVisitante = async (cedula) => {
  if (!cedula) throw new AppError('La cédula es requerida', 400);
  const persona = await Persona.findOne({ where: { cedula } });
  return persona;
};

// Registrar el ingreso
exports.registrarIngreso = async (data) => {
  const t = await sequelize.transaction();
  try {
    const { 
      cedula, // Opcional si es < 9 años y viene con id_representante_persona
      id_representante_persona, // Obligatorio si es menor de 18
      id_motivo, 
      id_taller, 
      nombres, 
      apellidos, 
      telefono, 
      fecha_de_nac,
      correo
    } = data;

    if (!id_motivo) throw new AppError('El motivo de la visita es requerido', 400);

    let persona = null;

    // Lógica para menores de 18 años
    const edad = calcularEdad(fecha_de_nac);
    
    if (edad !== null && edad < 18) {
      if (!id_representante_persona) {
        throw new AppError('Todo menor de 18 años debe tener un representante asociado', 400);
      }

      const representantePersona = await Persona.findByPk(id_representante_persona, { transaction: t });
      if (!representantePersona) throw new AppError('El representante proporcionado no existe', 404);

      let cedulaFinal = cedula;

      // Si es < 9 años y no tiene cédula, generar derivada
      if (edad < 9 && !cedula) {
        // Buscar cuántos menores asociados tiene el representante para asignar el sufijo -X
        const repRole = await Representante.findOrCreate({
          where: { id_persona: id_representante_persona },
          defaults: { id_persona: id_representante_persona },
          transaction: t
        });

        const numVinculos = await AlumnoRepresentante.count({
          where: { id_representante: repRole[0].id_representante },
          transaction: t
        });

        cedulaFinal = `${representantePersona.cedula}-${numVinculos + 1}`;
      } else if (!cedula) {
        throw new AppError('Los mayores de 9 años deben tener cédula', 400);
      }

      // Buscar o crear la persona menor
      persona = await Persona.findOne({ where: { cedula: cedulaFinal }, transaction: t });
      if (!persona) {
        persona = await Persona.create({
          cedula: cedulaFinal,
          nombres,
          apellidos,
          telefono,
          fecha_de_nac,
          correo
        }, { transaction: t });
      }

      // Asegurar roles y vínculo
      const repRole = await Representante.findOrCreate({
        where: { id_persona: id_representante_persona },
        defaults: { id_persona: id_representante_persona },
        transaction: t
      });

      const alumRole = await Alumno.findOrCreate({
        where: { id_persona: persona.id_persona },
        defaults: { id_persona: persona.id_persona },
        transaction: t
      });

      await AlumnoRepresentante.findOrCreate({
        where: {
          id_alumno: alumRole[0].id_alumno,
          id_representante: repRole[0].id_representante
        },
        defaults: {
          id_alumno: alumRole[0].id_alumno,
          id_representante: repRole[0].id_representante
        },
        transaction: t
      });

    } else {
      // Adulto
      if (!cedula) throw new AppError('La cédula es requerida', 400);
      persona = await Persona.findOne({ where: { cedula }, transaction: t });
      if (!persona) {
        if (!nombres || !apellidos) throw new AppError('Faltan datos para registrar la persona', 400);
        persona = await Persona.create({
          cedula, nombres, apellidos, telefono, fecha_de_nac, correo
        }, { transaction: t });
      }
    }

    // Registrar ingreso
    const nuevoIngreso = await RegistroIngreso.create({
      id_persona: persona.id_persona,
      id_motivo,
      id_taller: id_taller || null,
      fecha_hora_entrada: new Date()
    }, { transaction: t });

    await t.commit();
    return { persona, ingreso: nuevoIngreso };
  } catch (error) {
    await t.rollback();
    throw new AppError(error.message, error.statusCode || 500);
  }
};

exports.getAllIngresos = async () => {
  return await RegistroIngreso.findAll({
    include: [
      { model: Persona },
      { model: MotivoVisita }
    ],
    order: [['fecha_hora_entrada', 'DESC']]
  });
};

exports.getIngresosStats = async () => {
  const { Op, fn, col } = require('sequelize');
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const visitasHoy = await RegistroIngreso.count({
    where: { fecha_hora_entrada: { [Op.gte]: hoy } }
  });

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

  const totalVisitantesUnicos = await Persona.count();
  const totalVisitasHistoricas = await RegistroIngreso.count();

  return { visitasHoy, totalVisitantesUnicos, totalVisitasHistoricas, porMotivo };
};

exports.getTopVisitantes = async () => {
  const { fn, col } = require('sequelize');
  const topRaw = await RegistroIngreso.findAll({
    attributes: [
      'id_persona',
      [fn('COUNT', col('id_persona')), 'total_visitas'],
      [fn('MAX', col('fecha_hora_entrada')), 'ultima_visita']
    ],
    include: [{ model: Persona, attributes: ['cedula', 'nombres', 'apellidos'] }],
    group: ['id_persona', 'Persona.id_persona', 'Persona.cedula', 'Persona.nombres', 'Persona.apellidos'],
    order: [[fn('COUNT', col('id_persona')), 'DESC']],
    limit: 10
  });

  return topRaw.map(t => ({
    cedula: t.Persona ? t.Persona.cedula : '',
    nombre: t.Persona ? `${t.Persona.nombres || ''} ${t.Persona.apellidos || ''}`.trim() : 'Desconocido',
    total_visitas: parseInt(t.getDataValue('total_visitas')),
    ultima_visita: t.getDataValue('ultima_visita')
  }));
};
