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

const MODELOS = [
  {
    model: Obra,
    tipo: 'Obra',
    idField: 'id_obra',
    extract: (o) => ({
      id: o.id_obra,
      titulo: formatTitle('Obra', o),
      detalle: o.codigo_inventario,
    }),
  },
  {
    model: Libro,
    tipo: 'Libro',
    idField: 'id_libro',
    extract: (l) => ({ id: l.id_libro, titulo: formatTitle('Libro', l), detalle: l.unidad }),
  },
  {
    model: Trabajador,
    tipo: 'Trabajador',
    idField: 'id_trabajador',
    extract: (t) => ({
      id: t.id_trabajador,
      titulo: formatTitle('Trabajador', t),
      detalle: t.cedula,
    }),
  },
  {
    model: Taller,
    tipo: 'Taller',
    idField: 'id_taller',
    extract: (t) => ({ id: t.id_taller, titulo: formatTitle('Taller', t), detalle: t.estado }),
  },
  {
    model: Artista,
    tipo: 'Artista',
    idField: 'id_artista',
    extract: (a) => ({ id: a.id_artista, titulo: formatTitle('Artista', a), detalle: a.ci }),
  },
  {
    model: InscripcionTaller,
    tipo: 'InscripcionTaller',
    idField: 'id_inscripcion',
    extract: (ins) => ({
      id: ins.id_inscripcion,
      titulo: formatTitle('InscripcionTaller', ins),
      detalle: ins.estado_inscripcion,
    }),
  },
  {
    model: InventarioTaller,
    tipo: 'InventarioTaller',
    idField: 'id',
    extract: (it) => ({
      id: it.id,
      titulo: formatTitle('InventarioTaller', it),
      detalle: it.descripcion ? it.descripcion.substring(0, 50) : '',
    }),
  },
  {
    model: EspacioMuseo,
    tipo: 'EspacioMuseo',
    idField: 'id_espacio',
    extract: (e) => ({
      id: e.id_espacio,
      titulo: formatTitle('EspacioMuseo', e),
      detalle: e.codigo_espacio || `Capacidad: ${e.capacidad || 'N/A'}`,
    }),
  },
  {
    model: SolicitudEspacio,
    tipo: 'SolicitudEspacio',
    idField: 'id_solicitud',
    extract: (s) => ({
      id: s.id_solicitud,
      titulo: formatTitle('SolicitudEspacio', s),
      detalle: s.estado,
    }),
  },
  {
    model: Usuario,
    tipo: 'Usuario',
    idField: 'id_usuario',
    extract: (u) => ({ id: u.id_usuario, titulo: formatTitle('Usuario', u), detalle: u.id_rol }),
  },
];

exports.getPapeleraGlobal = async ({ page = 1, limit = 20, tipo, search } = {}) => {
  const items = [];
  const query = { where: { deleted_at: { [Op.ne]: null } }, paranoid: false };

  const modelosAConsultar = tipo ? MODELOS.filter((m) => m.tipo === tipo) : MODELOS;

  if (modelosAConsultar.length === 0) {
    return { items: [], total: 0, page, limit, totalPages: 0 };
  }

  try {
    for (const entry of modelosAConsultar) {
      const records = await entry.model.findAll(query);
      for (const r of records) {
        const { id, titulo, detalle } = entry.extract(r);
        items.push({
          id,
          tipo: entry.tipo,
          titulo,
          fecha_eliminacion: r.deleted_at,
          detalle,
        });
      }
    }
  } catch (error) {
    console.error('Error obteniendo papelera', error);
  }

  items.sort((a, b) => new Date(b.fecha_eliminacion) - new Date(a.fecha_eliminacion));

  const filtered = search
    ? items.filter((i) => i.titulo.toLowerCase().includes(search.toLowerCase()))
    : items;

  const total = filtered.length;
  const totalPages = Math.ceil(total / limit) || 1;
  const start = (page - 1) * limit;
  const paginated = filtered.slice(start, start + limit);

  return { items: paginated, total, page, limit, totalPages };
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

exports.vaciarPapelera = async (tipo) => {
  const modelosAVaciar = tipo ? MODELOS.filter((m) => m.tipo === tipo) : MODELOS;

  let eliminados = 0;
  for (const entry of modelosAVaciar) {
    // Sólo modelos que soporten paranoid (deleted_at)
    try {
      const { Op } = require('sequelize');
      const records = await entry.model.findAll({
        where: { deleted_at: { [Op.ne]: null } },
        paranoid: false,
      });
      for (const record of records) {
        await record.destroy({ force: true });
        eliminados++;
      }
    } catch (e) {
      // Si el modelo no tiene deleted_at, ignorar
    }
  }

  return { eliminados };
};
