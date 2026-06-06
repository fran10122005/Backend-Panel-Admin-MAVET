const { generateTablePdf, generateCartaAvalPdf } = require('../../utils/pdfGenerator');
const { Libro, CategoriaLibro, AutorLibro } = require('../../models');
const { Obra, Artista, TecnicaObra, EstadoObra } = require('../../models');
const { AsistenciaQR, Trabajador, CargoTrabajador } = require('../../models');
const { SolicitudEspacio, Usuario, EspacioMuseo, RegistroIngreso } = require('../../models');
const AppError = require('../../utils/AppError');
const catchAsync = require('../../utils/catchAsync');
const { Op } = require('sequelize');

// ─── Reporte: Inventario de Bóveda (Obras) ────────────────────────────────
exports.reporteObras = catchAsync(async (req, res) => {
  const obras = await Obra.findAll({
    include: [Artista, TecnicaObra, EstadoObra],
    order: [['id_obra', 'ASC']]
  });

  const headers = ['Código', 'Título', 'Autor', 'Año', 'Técnica', 'Estado', 'Ubicación'];
  const rows = obras.map(o => [
    o.codigo_inventario || o.id_obra.toString(),
    o.titulo || '—',
    o.Artista ? `${o.Artista.nombres} ${o.Artista.apellidos}` : 'Desconocido',
    o.anio ? o.anio.toString() : '—',
    o.TecnicaObra?.nombre_tecnica || '—',
    o.EstadoObra?.nombre_estado || '—',
    o.ubicacion_actual || '—',
  ]);

  await generateTablePdf(
    res,
    'Inventario de Bóveda – Obras de Arte',
    headers,
    rows,
    `MAVET_Inventario_Obras_${new Date().toISOString().split('T')[0]}.pdf`
  );
});

// ─── Reporte: Catálogo de Biblioteca ──────────────────────────────────────
exports.reporteLibros = catchAsync(async (req, res) => {
  const libros = await Libro.findAll({
    include: [CategoriaLibro],
    order: [['titulo', 'ASC']]
  });

  const headers = ['Unidad', 'Título', 'Año', 'Categoría', 'Total', 'Disponibles', 'Estado', 'F. Ingreso'];
  const rows = libros.map(l => [
    l.unidad || '—',
    l.titulo || '—',
    l.ano_libro || '—',
    l.CategoriaLibro?.nombre_categoria || '—',
    l.cantidad_total?.toString() || '0',
    l.cantidad_disponible?.toString() || '0',
    l.estado || '—',
    l.fecha_ingreso || '—',
  ]);

  await generateTablePdf(
    res,
    'Catálogo de Biblioteca',
    headers,
    rows,
    `MAVET_Biblioteca_${new Date().toISOString().split('T')[0]}.pdf`
  );
});

// ─── Reporte: Consolidado de Asistencia ───────────────────────────────────
exports.reporteAsistencia = catchAsync(async (req, res) => {
  const asistencias = await AsistenciaQR.findAll({
    include: [{ model: Trabajador, include: [CargoTrabajador] }],
    order: [['fecha', 'DESC']]
  });

  const headers = ['Fecha', 'Cédula', 'Nombres y Apellidos', 'Cargo', 'Ent. Mañana', 'Sal. Mañana', 'Ent. Tarde', 'Sal. Tarde'];
  const fmt = (dt) => dt ? new Date(dt).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' }) : '—';
  const rows = asistencias.map(a => {
    const t = a.Trabajador || {};
    return [
      a.fecha || '—',
      t.cedula || '—',
      t.nombres && t.apellidos ? `${t.nombres} ${t.apellidos}` : '—',
      t.CargoTrabajador?.nombre_cargo || '—',
      fmt(a.entrada_manana),
      fmt(a.salida_manana),
      fmt(a.entrada_tarde),
      fmt(a.salida_tarde),
    ];
  });

  await generateTablePdf(
    res,
    'Consolidado de Asistencia del Personal',
    headers,
    rows,
    `MAVET_Asistencia_${new Date().toISOString().split('T')[0]}.pdf`
  );
});

// ─── Reporte: Carta de Aval (Individual) ──────────────────────────────────
exports.reporteCartaAval = catchAsync(async (req, res) => {
  const { cedula } = req.params;

  const trabajador = await Trabajador.findOne({
    where: { cedula },
    include: [CargoTrabajador]
  });

  if (!trabajador) {
    throw new AppError('Trabajador no encontrado', 404);
  }

  const asistencias = await AsistenciaQR.findAll({
    where: { id_trabajador: trabajador.id_trabajador },
    order: [['fecha', 'DESC']]
  });

  await generateCartaAvalPdf(res, trabajador, asistencias, `MAVET_CartaAval_${cedula}_${new Date().toISOString().split('T')[0]}.pdf`);
});

// ─── Reporte: Historial de Eventos (Auditorio) ────────────────────────────
exports.reporteEventos = catchAsync(async (req, res) => {
  const eventos = await SolicitudEspacio.findAll({
    include: [EspacioMuseo, Usuario], // Usuario = Aprobador
    order: [['fecha_solicitada', 'DESC']]
  });

  const headers = ['Título del Evento / Motivo', 'Organizador', 'Fecha', 'Hora Inicio', 'Hora Fin', 'Estado'];
  const rows = eventos.map(e => [
    e.motivo_uso || '—',
    e.nombre_responsable || e.institucion || '—',
    e.fecha_solicitada || '—',
    e.hora_inicio || '—',
    e.hora_fin || '—',
    e.estado_solicitud || '—'
  ]);

  await generateTablePdf(
    res,
    'HISTORIAL DE EVENTOS Y RESERVAS (AUDITORIO)',
    headers,
    rows,
    `MAVET_Historial_Eventos_${new Date().toISOString().split('T')[0]}.pdf`
  );
});

// ─── Dashboard Stats ──────────────────────────────────────────────────────
exports.getDashboardStats = catchAsync(async (req, res) => {
  const obrasCount = await Obra.count();
  const librosCount = await Libro.count();
  
  // Visitantes del mes actual
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  
  const visitantesMesCount = await RegistroIngreso.count({
    where: {
      fecha_hora_entrada: {
        [Op.gte]: firstDayOfMonth
      }
    }
  });

  // Próximos eventos (3 más cercanos en el futuro)
  const proximosEventos = await SolicitudEspacio.findAll({
    where: {
      fecha_solicitada: {
        [Op.gte]: now
      }
    },
    order: [['fecha_solicitada', 'ASC']],
    limit: 3
  });

  // Últimas obras registradas (3 más recientes)
  const ultimasObras = await Obra.findAll({
    include: [EstadoObra],
    order: [['created_at', 'DESC']],
    limit: 3
  });

  res.status(200).json({
    message: 'Estadísticas del Dashboard obtenidas',
    data: {
      totalObras: obrasCount,
      totalLibros: librosCount,
      visitantesMes: visitantesMesCount,
      totalEventosActivos: await SolicitudEspacio.count({ where: { fecha_solicitada: { [Op.gte]: now } } }),
      proximosEventos,
      ultimasObras
    }
  });
});
