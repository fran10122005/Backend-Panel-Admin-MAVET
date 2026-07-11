const { ConsultaSala, Persona, Libro, Trabajador } = require('../../../models');
const AppError = require('../../../utils/AppError');
const { normalizeCedula } = require('../../../utils/cedula');

exports.createConsulta = async (data) => {
  const { id_libro, id_persona, id_trabajador, mesa, estado, cedula, nombre } = data;

  if (!id_libro) throw new AppError('El ID del libro es requerido', 400);

  let finalIdPersona = id_persona;

  if (!finalIdPersona && cedula) {
    try {
      const normalizedCed = normalizeCedula(cedula);
      let persona = await Persona.findOne({ where: { cedula: normalizedCed } });
      if (!persona) {
        if (!nombre)
          throw new AppError(
            'Se requiere el nombre para crear una nueva persona asociada a la cédula',
            400
          );
        let nombres = nombre;
        let apellidos = '';
        const parts = nombre.split(' ');
        if (parts.length > 1) {
          nombres = parts[0];
          apellidos = parts.slice(1).join(' ');
        }
        persona = await Persona.create({ cedula: normalizedCed, nombres, apellidos });
      }
      finalIdPersona = persona.id_persona;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Error al buscar o crear la persona: ' + error.message, 500);
    }
  }

  if (!finalIdPersona && !id_trabajador)
    throw new AppError('Debe asociarse a una persona (o proveer cédula) o un trabajador', 400);

  const consulta = await ConsultaSala.create({
    id_libro,
    id_persona: finalIdPersona || null,
    id_trabajador: id_trabajador || null,
    mesa: mesa || null,
    hora_entrega: new Date(),
    estado: estado || 'ACTIVO',
  });

  // Decrease stock available
  const libro = await Libro.findByPk(id_libro);
  if (libro && parseInt(libro.cantidad_disponible, 10) > 0) {
    const nueva = String(parseInt(libro.cantidad_disponible, 10) - 1);
    await Libro.update({ cantidad_disponible: nueva }, { where: { id_libro } });
  }

  // Devolver con relaciones para que el frontend tenga los datos
  return await ConsultaSala.findByPk(consulta.id_consulta, {
    include: [Persona, Libro, Trabajador],
  });
};

exports.updateConsulta = async (id_consulta, data) => {
  const { estado } = data;
  const consulta = await ConsultaSala.findByPk(id_consulta);
  if (!consulta) throw new AppError('Consulta no encontrada', 404);

  // La actualización del stock y la hora_devolucion ocurrirá en la DB mediante un trigger
  // cuando el estado cambie a "Devuelto" o similar. Solo mandamos el update del estado.
  await consulta.update({ estado });

  return consulta;
};

exports.getAllConsultas = async () => {
  const consultas = await ConsultaSala.findAll({
    include: [Persona, Libro, Trabajador],
  });
  return consultas.map((c) => {
    const json = c.toJSON();
    json.hora_entrega = json.hora_entrega || null;
    json.hora_devolucion = json.hora_devolucion || null;
    return json;
  });
};
