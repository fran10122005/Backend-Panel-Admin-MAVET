const {
  Persona,
  Alumno,
  Representante,
  AlumnoRepresentante,
  sequelize,
} = require('../../../models');
const { Op } = require('sequelize');
const AppError = require('../../../utils/AppError');

// Calcular edad basada en fecha_de_nac
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

exports.buscarPersona = async (query) => {
  if (!query) throw new AppError('Debe proporcionar un parámetro de búsqueda', 400);

  const dialect = sequelize.getDialect();
  const isPostgres = dialect === 'postgres';
  const likeOp = isPostgres ? Op.iLike : Op.like;

  // Limpiar la query para la cédula (remover V-, E- y puntos)
  const cleanCedulaQuery = query
    .replace(/^[VEve]-?/, '')
    .replace(/\./g, '')
    .trim();
  const cleanTextQuery = query.trim();

  // Para Postgres, usamos una expresión regular que ignora acentos
  // Para SQLite (tests), usamos like estándar
  const regexTextQuery = cleanTextQuery
    .replace(/[aá]/gi, '[aá]')
    .replace(/[eé]/gi, '[eé]')
    .replace(/[ií]/gi, '[ií]')
    .replace(/[oó]/gi, '[oó]')
    .replace(/[uúü]/gi, '[uúü]');

  const textCondition = isPostgres
    ? { [Op.iRegexp]: regexTextQuery }
    : { [likeOp]: `%${cleanTextQuery}%` };

  const personas = await Persona.findAll({
    where: {
      [Op.or]: [
        // Reemplazar V-, E- y . en la columna cedula antes de comparar
        sequelize.where(
          sequelize.fn(
            'REPLACE',
            sequelize.fn(
              'REPLACE',
              sequelize.fn('REPLACE', sequelize.col('cedula'), 'V-', ''),
              'E-',
              ''
            ),
            '.',
            ''
          ),
          { [likeOp]: `%${cleanCedulaQuery}%` }
        ),
        { nombres: textCondition },
        { apellidos: textCondition },
        { telefono: { [likeOp]: `%${cleanCedulaQuery}%` } },
      ],
    },
  });

  const resultados = await Promise.all(
    personas.map(async (persona) => {
      let data = persona.toJSON();
      const edad = calcularEdad(persona.fecha_de_nac);
      data.edad = edad;

      // Detectar si requiere actualización de cédula (entre 9 y 15 años, sin cédula válida)
      const hasValidCedula =
        persona.cedula &&
        persona.cedula.trim() !== '' &&
        persona.cedula.trim() !== 'V-' &&
        persona.cedula.trim() !== 'E-';
      if (edad !== null && edad >= 9 && edad <= 15 && !hasValidCedula) {
        data.require_cedula_update = true;
      } else {
        data.require_cedula_update = false;
      }

      // Buscar representante si es menor de 18
      if (edad !== null && edad < 18) {
        const alumno = await Alumno.findOne({ where: { id_persona: persona.id_persona } });
        if (alumno) {
          const vinculo = await AlumnoRepresentante.findOne({
            where: { id_alumno: alumno.id_alumno },
          });
          if (vinculo) {
            const representanteRole = await Representante.findByPk(vinculo.id_representante);
            if (representanteRole) {
              const representanteData = await Persona.findByPk(representanteRole.id_persona);
              data.representante = representanteData;
            }
          }
        }
      }

      // Buscar si es un adulto que tiene menores asociados
      if (edad === null || edad >= 18) {
        const representanteRole = await Representante.findOne({
          where: { id_persona: persona.id_persona },
        });
        if (representanteRole) {
          const vinculos = await AlumnoRepresentante.findAll({
            where: { id_representante: representanteRole.id_representante },
          });
          const ids_alumnos = vinculos.map((v) => v.id_alumno);
          const alumnosRoles = await Alumno.findAll({ where: { id_alumno: ids_alumnos } });
          const ids_personas_menores = alumnosRoles.map((a) => a.id_persona);
          const menoresAsociados = await Persona.findAll({
            where: { id_persona: ids_personas_menores },
          });
          data.menores_asociados = menoresAsociados;
        }
      }

      return data;
    })
  );

  return resultados;
};
