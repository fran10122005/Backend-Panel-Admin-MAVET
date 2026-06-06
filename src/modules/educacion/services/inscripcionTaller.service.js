const InscripcionTaller = require('../models/InscripcionTaller.model');
const Alumno = require('../models/Alumno.model');
const Representante = require('../models/Representante.model');
const Taller = require('../models/Taller.model');
const sequelize = require('../../../config/db');

const getAllInscripciones = async () => {
  return await InscripcionTaller.findAll({
    include: [
      // Since associations might not be defined explicitly in index, we will do a manual join or just return raw for now.
      // But let's try to query just Inscripciones and fetch Alumnos manually if associations fail.
    ]
  });
};

const getInscripcionesConDetalles = async () => {
  // A custom query since associations might not be fully configured in index models
  const inscripciones = await InscripcionTaller.findAll();
  
  const result = [];
  for (let inscripcion of inscripciones) {
    const alumno = await Alumno.findByPk(inscripcion.id_alumno);
    const taller = await Taller.findByPk(inscripcion.id_taller);
    let representante = null;
    if (alumno && alumno.id_representante) {
      representante = await Representante.findByPk(alumno.id_representante);
    }
    
    result.push({
      ...inscripcion.toJSON(),
      Alumno: alumno,
      Taller: taller,
      Representante: representante
    });
  }
  return result;
};

const inscribirAlumno = async (data) => {
  const t = await sequelize.transaction();

  try {
    const { tallerId, alumno, representante } = data;

    // 1. Find or create Representante
    let repRecord = await Representante.findOne({ where: { cedula: representante.cedula }, transaction: t });
    if (!repRecord) {
      // Formateamos "apellido" dividiendo el nombre si no viene separado
      const nameParts = representante.nombre.split(' ');
      const nombres = nameParts[0] || '';
      const apellido = nameParts.slice(1).join(' ') || '';
      
      repRecord = await Representante.create({
        cedula: representante.cedula,
        nombres: nombres,
        apellido: apellido,
        telefono: representante.telefono,
      }, { transaction: t });
    }

    // 2. Find or create Alumno
    // Como el formulario no envía cédula del alumno, usamos un identificador temporal basado en nombre y rep
    let alumnoRecord = await Alumno.findOne({ 
      where: { nombres: alumno.nombre, id_representante: repRecord.id_representante },
      transaction: t 
    });

    if (!alumnoRecord) {
      // Generar una cedula falsa para el menor
      const dummyCedula = `V-INF-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      
      alumnoRecord = await Alumno.create({
        id_representante: repRecord.id_representante,
        cedula: dummyCedula,
        nombres: alumno.nombre,
        apellidos: '', // El form no separa apellidos del alumno
        telefono: representante.telefono // usar el del representante
      }, { transaction: t });
    }

    // 3. Crear Inscripcion
    // Parse tallerId as INT (si viene como "1" o similar)
    const tId = parseInt(tallerId.toString().replace(/\D/g, '')) || tallerId; 
    
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
  getAllInscripciones,
  getInscripcionesConDetalles,
  inscribirAlumno
};
