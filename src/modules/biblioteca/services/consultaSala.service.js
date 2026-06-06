const { ConsultaSala, Visitante, Libro } = require('../../../models');
const AppError = require('../../../utils/AppError');
const sequelize = require('../../../config/db');

exports.createConsulta = async (data) => {
  const t = await sequelize.transaction();
  try {
    const { libroId, cedulaSolicitante, nombreSolicitante, estado } = data;

    // Buscar o crear Visitante
    let visitante = await Visitante.findOne({ where: { cedula: cedulaSolicitante }, transaction: t });
    if (!visitante) {
      visitante = await Visitante.create({
        cedula: cedulaSolicitante,
        nombres: nombreSolicitante,
        apellidos: '', // Simplificado
        edad: 0
      }, { transaction: t });
    }

    // Identificar el ID del libro. Si el frontend envía un texto como título o un string 'LIB-XXX', intentamos buscarlo.
    // Si libroId es un ID numérico, lo usamos directo.
    let id_libro_real = null;
    const isNumeric = !isNaN(parseInt(libroId, 10)) && isFinite(libroId);
    
    if (isNumeric) {
      id_libro_real = parseInt(libroId, 10);
    } else {
      const libro = await Libro.findOne({ where: { titulo: libroId }, transaction: t });
      if (libro) {
        id_libro_real = libro.id_libro;
      }
    }

    if (!id_libro_real) {
      throw new AppError('El libro especificado no existe o no pudo ser identificado', 404);
    }

    const consulta = await ConsultaSala.create({
      id_libro: id_libro_real,
      id_visitante: visitante.id_visitante,
      fecha_hora_inicio: new Date(),
      estado_entrega: 'Entregado',
      estado_devolucion: estado || 'Pendiente'
    }, { transaction: t });

    // Restar cuota (cantidad disponible)
    const libroToUpdate = await Libro.findByPk(id_libro_real, { transaction: t });
    if (libroToUpdate && libroToUpdate.cantidad_disponible > 0) {
      await libroToUpdate.update({ cantidad_disponible: libroToUpdate.cantidad_disponible - 1 }, { transaction: t });
    }

    await t.commit();
    return consulta;
  } catch (error) {
    await t.rollback();
    throw new AppError('Error al registrar préstamo en sala: ' + error.message, 500);
  }
};

exports.getAllConsultas = async () => {
  return await ConsultaSala.findAll({
    include: [Visitante, Libro]
  });
};
