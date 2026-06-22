const { generateTablePdf, generateCartaAvalPdf } = require('../../utils/pdfGenerator');
const { Libro, CategoriaLibro, AutorLibro } = require('../../models');
const { Obra, Artista, TecnicaObra, EstadoObra } = require('../../models');
const { AsistenciaQR, Trabajador, CargoTrabajador } = require('../../models');
const { SolicitudEspacio, Usuario, EspacioMuseo, RegistroIngreso, Persona } = require('../../models');
const AppError = require('../../utils/AppError');
const catchAsync = require('../../utils/catchAsync');
const { Op } = require('sequelize');

// ─── Reporte: Inventario de Bóveda (Obras) ────────────────────────────────
exports.reporteObras = catchAsync(async (req, res) => {
  const obras = await Obra.findAll({
    include: [{ model: Artista, as: 'Artista' }, TecnicaObra, EstadoObra],
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

  const filename = `MAVET_Inventario_Obras_${new Date().toISOString().split('T')[0]}.pdf`;
  const pdfBuffer = await generateTablePdf(
    'Inventario de Bóveda – Obras de Arte',
    headers,
    rows
  );

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
  res.send(pdfBuffer);
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

  const filename = `MAVET_Biblioteca_${new Date().toISOString().split('T')[0]}.pdf`;
  const pdfBuffer = await generateTablePdf(
    'Catálogo de Biblioteca',
    headers,
    rows
  );

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
  res.send(pdfBuffer);
});

// ─── Reporte: Consolidado de Asistencia ───────────────────────────────────
exports.reporteAsistencia = catchAsync(async (req, res) => {
  const asistencias = await AsistenciaQR.findAll({
    include: [{ model: Trabajador, include: [CargoTrabajador] }],
    order: [['fecha', 'DESC']]
  });

  const headers = ['Fecha', 'Cédula', 'Nombres y Apellidos', 'Cargo', 'Ent. Mañana', 'Sal. Mañana', 'Ent. Tarde', 'Sal. Tarde'];
  const fmt = (dt) => {
    if (!dt) return '—';
    if (typeof dt === 'string' && dt.includes(':')) {
      // Si es formato '08:00:00'
      const parts = dt.split(':');
      if (parts.length >= 2) return `${parts[0]}:${parts[1]}`;
    }
    // Si por alguna razón es un Date válido
    const d = new Date(dt);
    if (!isNaN(d.getTime())) return d.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' });
    return '—';
  };
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

  const filename = `MAVET_Asistencia_${new Date().toISOString().split('T')[0]}.pdf`;
  const pdfBuffer = await generateTablePdf(
    'Consolidado de Asistencia del Personal',
    headers,
    rows
  );

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
  res.send(pdfBuffer);
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

  const filename = `MAVET_CartaAval_${cedula}_${new Date().toISOString().split('T')[0]}.pdf`;
  const pdfBuffer = await generateCartaAvalPdf(trabajador, asistencias);
  
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
  res.send(pdfBuffer);
});

// ─── Reporte: Historial de Eventos (Auditorio) ────────────────────────────
exports.reporteEventos = catchAsync(async (req, res) => {
  const eventos = await SolicitudEspacio.findAll({
    include: [EspacioMuseo, Persona],
    order: [['fecha_uso', 'DESC']]
  });

  const headers = ['Título del Evento / Motivo', 'Organizador', 'Fecha', 'Hora Inicio', 'Hora Fin', 'Estado'];
  const rows = eventos.map(e => {
    const p = e.Persona || {};
    const orgName = [p.nombres, p.apellidos].filter(Boolean).join(' ') || e.institucion || '—';
    return [
      e.motivo || '—',
      orgName,
      e.fecha_uso || '—',
      e.hora_inicio || '—',
      e.hora_fin || '—',
      e.estado || '—'
    ];
  });

  const filename = `MAVET_Historial_Eventos_${new Date().toISOString().split('T')[0]}.pdf`;
  const pdfBuffer = await generateTablePdf(
    'HISTORIAL DE EVENTOS Y RESERVAS (AUDITORIO)',
    headers,
    rows
  );

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
  res.send(pdfBuffer);
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
      fecha_uso: {
        [Op.gte]: now
      }
    },
    order: [['fecha_uso', 'ASC']],
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
      totalEventosActivos: await SolicitudEspacio.count({ where: { fecha_uso: { [Op.gte]: now } } }),
      proximosEventos,
      ultimasObras
    }
  });
});
