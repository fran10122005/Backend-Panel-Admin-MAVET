const { Obra, Libro, Trabajador, Taller, Artista, InscripcionTaller } = require('../../models');
const { Op } = require('sequelize');

const getModelByName = (modelName) => {
  switch (modelName) {
    case 'Obra':
      return Obra;
    case 'Libro':
      return Libro;
    case 'Trabajador':
      return Trabajador;
    case 'Taller':
      return Taller;
    case 'Artista':
      return Artista;
    case 'InscripcionTaller':
      return InscripcionTaller;
    default:
      throw new Error('Modelo no soportado en papelera');
  }
};

const getIdField = (modelName) => {
  switch (modelName) {
    case 'Obra':
      return 'id_obra';
    case 'Libro':
      return 'id_libro';
    case 'Trabajador':
      return 'id_trabajador';
    case 'Taller':
      return 'id_taller';
    case 'Artista':
      return 'id_artista';
    case 'InscripcionTaller':
      return 'id_inscripcion';
    default:
      return 'id';
  }
};

const formatTitle = (modelName, item) => {
  switch (modelName) {
    case 'Obra':
      return item.titulo || 'Obra sin título';
    case 'Libro':
      return item.titulo || 'Libro sin título';
    case 'Trabajador':
      return `${item.nombres || ''} ${item.apellidos || ''}`.trim();
    case 'Taller':
      return item.nombre_curso || 'Taller sin nombre';
    case 'Artista':
      return `${item.nombres || ''} ${item.apellidos || ''}`.trim();
    case 'InscripcionTaller':
      return `Inscripción #${item.id_inscripcion || ''}`;
    default:
      return 'Item eliminado';
  }
};

exports.getPapeleraGlobal = async () => {
  const items = [];
  const query = { where: { deleted_at: { [Op.ne]: null } }, paranoid: false };

  try {
    const obras = await Obra.findAll(query);
    obras.forEach((o) =>
      items.push({
        id: o.id_obra,
        tipo: 'Obra',
        titulo: formatTitle('Obra', o),
        fecha_eliminacion: o.deleted_at,
        detalle: o.codigo_inventario,
      })
    );

    const libros = await Libro.findAll(query);
    libros.forEach((l) =>
      items.push({
        id: l.id_libro,
        tipo: 'Libro',
        titulo: formatTitle('Libro', l),
        fecha_eliminacion: l.deleted_at,
        detalle: l.unidad,
      })
    );

    const trabajadores = await Trabajador.findAll(query);
    trabajadores.forEach((t) =>
      items.push({
        id: t.id_trabajador,
        tipo: 'Trabajador',
        titulo: formatTitle('Trabajador', t),
        fecha_eliminacion: t.deleted_at,
        detalle: t.cedula,
      })
    );

    const talleres = await Taller.findAll(query);
    talleres.forEach((t) =>
      items.push({
        id: t.id_taller,
        tipo: 'Taller',
        titulo: formatTitle('Taller', t),
        fecha_eliminacion: t.deleted_at,
        detalle: t.estado,
      })
    );

    const artistas = await Artista.findAll(query);
    artistas.forEach((a) =>
      items.push({
        id: a.id_artista,
        tipo: 'Artista',
        titulo: formatTitle('Artista', a),
        fecha_eliminacion: a.deleted_at,
        detalle: a.ci,
      })
    );

    const inscripciones = await InscripcionTaller.findAll(query);
    inscripciones.forEach((ins) =>
      items.push({
        id: ins.id_inscripcion,
        tipo: 'InscripcionTaller',
        titulo: formatTitle('InscripcionTaller', ins),
        fecha_eliminacion: ins.deleted_at,
        detalle: ins.estado_inscripcion,
      })
    );
  } catch (error) {
    console.error('Error obteniendo papelera', error);
  }

  // Ordenar del más recientemente eliminado al más antiguo
  items.sort((a, b) => new Date(b.fecha_eliminacion) - new Date(a.fecha_eliminacion));
  return items;
};

exports.restaurarRegistro = async (tipo, id) => {
  const model = getModelByName(tipo);
  const idField = getIdField(tipo);

  const record = await model.findOne({ where: { [idField]: id }, paranoid: false });
  if (!record) {
    throw new Error('Registro no encontrado en la papelera');
  }
  await record.restore();
  return record;
};

exports.eliminarDefinitivo = async (tipo, id) => {
  const model = getModelByName(tipo);
  const idField = getIdField(tipo);

  const record = await model.findOne({ where: { [idField]: id }, paranoid: false });
  if (!record) {
    throw new Error('Registro no encontrado en la papelera');
  }
  await record.destroy({ force: true });
  return true;
};
