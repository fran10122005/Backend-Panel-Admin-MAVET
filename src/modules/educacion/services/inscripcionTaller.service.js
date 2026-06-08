const { Persona, Alumno, Representante, AlumnoRepresentante, Taller, InscripcionTaller } = require('../../../models');
const sequelize = require('../../../config/db');

const getInscripcionesConDetalles = async () => {
  const inscripciones = await InscripcionTaller.findAll();

  const result = [];
  for (let ins of inscripciones) {
    const taller = await Taller.findByPk(ins.id_taller);
    const alumno = await Alumno.findByPk(ins.id_alumno);
    let alumnoPersona = null;
    let representante = null;
    if (alumno) {
      alumnoPersona = await Persona.findByPk(alumno.id_persona);
      const vinculo = await AlumnoRepresentante.findOne({ where: { id_alumno: alumno.id_alumno } });
      if (vinculo) {
        const repRole = await Representante.findByPk(vinculo.id_representante);
        if (repRole) {
          const repPersona = await Persona.findByPk(repRole.id_persona);
          representante = repPersona;
        }
      }
    }
    result.push({
      ...ins.toJSON(),
      Alumno: alumnoPersona,
      Taller: taller,
      Representante: representante
    });
  }
  return result;
};

const inscribirAlumno = async (data) => {
  const t = await sequelize.transaction();

  try {
    const { tallerId, alumno: alumnoData, representante: repData } = data;
    const edad = parseInt(alumnoData.edad, 10);
    const esMenor = !isNaN(edad) && edad < 18;

    // Validar representante si es menor
    if (esMenor && (!repData || !repData.nombre || !repData.cedula)) {
      throw new Error('Los menores de edad requieren un representante con nombre y cédula.');
    }

    // Calcular fecha de nacimiento aproximada desde la edad
    const hoy = new Date();
    const fechaNac = new Date(hoy.getFullYear() - edad, hoy.getMonth(), hoy.getDate());

    // 1. Crear Persona del alumno
    const namePartsAlumno = (alumnoData.nombre || '').trim().split(' ');
    const nombreAlumno = namePartsAlumno[0] || alumnoData.nombre;
    const apellidoAlumno = namePartsAlumno.slice(1).join(' ') || '';

    const alumnoPersona = await Persona.create({
      cedula: `V-INF-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      nombres: nombreAlumno,
      apellidos: apellidoAlumno,
      telefono: repData?.telefono || '',
      fecha_de_nac: fechaNac,
      fecha_registro: new Date()
    }, { transaction: t });

    // 2. Crear Alumno
    const alumnoRecord = await Alumno.create({
      id_persona: alumnoPersona.id_persona,
      nivel_experiencia: null
    }, { transaction: t });

    // 3. Si es menor, crear/traer Representante y vincular
    if (esMenor && repData) {
      let repPersona = await Persona.findOne({
        where: { cedula: repData.cedula },
        transaction: t
      });

      if (!repPersona) {
        const namePartsRep = (repData.nombre || '').trim().split(' ');
        const nombreRep = namePartsRep[0] || repData.nombre;
        const apellidoRep = namePartsRep.slice(1).join(' ') || '';

        repPersona = await Persona.create({
          cedula: repData.cedula,
          nombres: nombreRep,
          apellidos: apellidoRep,
          telefono: repData.telefono || '',
          fecha_de_nac: null,
          fecha_registro: new Date()
        }, { transaction: t });
      }

      let repRecord = await Representante.findOne({
        where: { id_persona: repPersona.id_persona },
        transaction: t
      });

      if (!repRecord) {
        repRecord = await Representante.create({
          id_persona: repPersona.id_persona,
          profesion_ocupacion: null
        }, { transaction: t });
      }

      await AlumnoRepresentante.findOrCreate({
        where: { id_alumno: alumnoRecord.id_alumno, id_representante: repRecord.id_representante },
        defaults: { parentesco: 'Representante Legal' },
        transaction: t
      });
    }

    // 4. Crear Inscripcion
    const tId = parseInt(tallerId.toString().replace(/\D/g, ''), 10) || tallerId;

    const inscripcion = await InscripcionTaller.create({
      id_taller: tId,
      id_alumno: alumnoRecord.id_alumno,
      fecha_inscripcion: new Date(),
      estado_inscripcion: 'Inscrito'
    }, { transaction: t });

    await t.commit();
    return inscripcion;
  } catch (error) {
    await t.rollback();
    throw new Error('Error en el proceso de inscripción: ' + error.message);
  }
};

module.exports = {
  getInscripcionesConDetalles,
  inscribirAlumno
};
