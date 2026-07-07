const {
  Obra,
  Libro,
  Trabajador,
  Taller,
  Artista,
  InscripcionTaller,
  InventarioTaller,
  EspacioMuseo,
  SolicitudEspacio,
  Usuario,
} = require('../../models');
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
    case 'InventarioTaller':
      return InventarioTaller;
    case 'EspacioMuseo':
      return EspacioMuseo;
    case 'SolicitudEspacio':
      return SolicitudEspacio;
    case 'Usuario':
      return Usuario;
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
    case 'InventarioTaller':
      return 'id';
    case 'EspacioMuseo':
      return 'id_espacio';
    case 'SolicitudEspacio':
      return 'id_solicitud';
    case 'Usuario':
      return 'id_usuario';
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
    case 'InventarioTaller':
      return item.nombre || 'Taller de inventario sin nombre';
    case 'EspacioMuseo':
      return item.nombre || 'Espacio sin nombre';
    case 'SolicitudEspacio':
      return item.codigo_reserva
        ? `Reserva ${item.codigo_reserva}`
        : item.motivo
          ? item.motivo.substring(0, 40)
          : 'Reserva sin nombre';
    case 'Usuario':
      return item.correo || 'Usuario sin correo';
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

    const invTalleres = await InventarioTaller.findAll(query);
    invTalleres.forEach((it) =>
      items.push({
        id: it.id,
        tipo: 'InventarioTaller',
        titulo: formatTitle('InventarioTaller', it),
        fecha_eliminacion: it.deleted_at,
        detalle: it.descripcion ? it.descripcion.substring(0, 50) : '',
      })
    );

    const espacios = await EspacioMuseo.findAll(query);
    espacios.forEach((e) =>
      items.push({
        id: e.id_espacio,
        tipo: 'EspacioMuseo',
        titulo: formatTitle('EspacioMuseo', e),
        fecha_eliminacion: e.deleted_at,
        detalle: e.codigo_espacio || `Capacidad: ${e.capacidad || 'N/A'}`,
      })
    );

    const solicitudes = await SolicitudEspacio.findAll(query);
    solicitudes.forEach((s) =>
      items.push({
        id: s.id_solicitud,
        tipo: 'SolicitudEspacio',
        titulo: formatTitle('SolicitudEspacio', s),
        fecha_eliminacion: s.deleted_at,
        detalle: s.estado,
      })
    );

    const usuarios = await Usuario.findAll(query);
    usuarios.forEach((u) =>
      items.push({
        id: u.id_usuario,
        tipo: 'Usuario',
        titulo: formatTitle('Usuario', u),
        fecha_eliminacion: u.deleted_at,
        detalle: u.id_rol,
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
