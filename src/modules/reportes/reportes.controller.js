/* global fetch */
const {
  generateTablePdf,
  generateCartaAvalPdf,
  generateCarnetPdf,
  generateCredencialesMasivasPdf,
  generateQRPdf,
} = require('../../utils/pdfGenerator');
const { Libro, CategoriaLibro, AutorLibro } = require('../../models');
const { Obra, Artista, TecnicaObra, EstadoObra } = require('../../models');
const { AsistenciaQR, Trabajador, CargoTrabajador } = require('../../models');
const {
  SolicitudEspacio,
  Usuario,
  Role,
  EspacioMuseo,
  RegistroIngreso,
  Persona,
  Taller,
  InventarioTaller,
  Instructor,
} = require('../../models');
const AppError = require('../../utils/AppError');
const catchAsync = require('../../utils/catchAsync');
const { Op } = require('sequelize');

// ─── Reporte: Inventario de Bóveda (Obras) ────────────────────────────────
exports.reporteObras = catchAsync(async (req, res) => {
  const obras = await Obra.findAll({
    include: [{ model: Artista, as: 'Artista' }, TecnicaObra, EstadoObra],
    order: [['id_obra', 'ASC']],
  });

  const headers = [
    { label: 'Código', width: 55, align: 'center' },
    { label: 'Título', width: 140 },
    { label: 'Autor', width: 120 },
    { label: 'Año', width: 40, align: 'center' },
    { label: 'Técnica', width: 90 },
    { label: 'Estado', width: 80, align: 'center' },
    { label: 'Ubicación', width: 100 },
  ];
  const rows = obras.map((o) => [
    o.codigo_inventario || o.id_obra.toString(),
    o.titulo || '—',
    o.Artista ? `${o.Artista.nombres} ${o.Artista.apellidos}` : 'Desconocido',
    o.anio ? o.anio.toString() : '—',
    o.TecnicaObra?.nombre_tecnica || '—',
    o.EstadoObra?.nombre_estado || '—',
    o.ubicacion_actual || '—',
  ]);

  const filename = `MAVET_Inventario_Obras_${new Date().toISOString().split('T')[0]}.pdf`;
  const pdfBuffer = await generateTablePdf('Inventario de Bóveda – Obras de Arte', headers, rows);

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
  res.send(pdfBuffer);
});

// ─── Reporte: Catálogo de Biblioteca ──────────────────────────────────────
exports.reporteLibros = catchAsync(async (req, res) => {
  const libros = await Libro.findAll({
    include: [CategoriaLibro],
    order: [['titulo', 'ASC']],
  });

  const headers = [
    { label: 'Unidad', width: 50, align: 'center' },
    { label: 'Título', width: 150 },
    { label: 'Año', width: 40, align: 'center' },
    { label: 'Categoría', width: 100 },
    { label: 'Total', width: 45, align: 'right' },
    { label: 'Disp.', width: 45, align: 'right' },
    { label: 'Estado', width: 70, align: 'center' },
    { label: 'F. Ingreso', width: 65, align: 'center' },
  ];
  const rows = libros.map((l) => [
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
  const pdfBuffer = await generateTablePdf('Catálogo de Biblioteca', headers, rows);

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
  res.send(pdfBuffer);
});

// ─── Reporte: Consolidado de Asistencia ───────────────────────────────────
exports.reporteAsistencia = catchAsync(async (req, res) => {
  const asistencias = await AsistenciaQR.findAll({
    include: [{ model: Trabajador, include: [CargoTrabajador] }],
    order: [['fecha', 'DESC']],
  });

  const headers = [
    { label: 'Fecha', width: 70, align: 'center' },
    { label: 'Cédula', width: 65, align: 'center' },
    { label: 'Nombres y Apellidos', width: 140 },
    { label: 'Cargo', width: 100 },
    { label: 'Entrada', width: 70, align: 'center' },
    { label: 'Salida', width: 70, align: 'center' },
  ];
  const fmt = (dt) => {
    if (!dt) return '—';
    if (typeof dt === 'string' && dt.includes(':')) {
      // Si es formato '08:00:00'
      const parts = dt.split(':');
      if (parts.length >= 2) return `${parts[0]}:${parts[1]}`;
    }
    // Si por alguna razón es un Date válido
    const d = new Date(dt);
    if (!isNaN(d.getTime()))
      return d.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' });
    return '—';
  };
  const rows = asistencias.map((a) => {
    const t = a.Trabajador || {};
    return [
      a.fecha || '—',
      t.cedula || '—',
      t.nombres && t.apellidos ? `${t.nombres} ${t.apellidos}` : '—',
      t.CargoTrabajador?.nombre_cargo || '—',
      fmt(a.entrada_manana),
      fmt(a.salida_manana),
    ];
  });

  const filename = `MAVET_Asistencia_${new Date().toISOString().split('T')[0]}.pdf`;
  const pdfBuffer = await generateTablePdf('Consolidado de Asistencia del Personal', headers, rows);

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
  res.send(pdfBuffer);
});

// ─── Reporte: Carta de Aval (Individual) ──────────────────────────────────
exports.reporteCartaAval = catchAsync(async (req, res) => {
  const { cedula } = req.params;

  const trabajador = await Trabajador.findOne({
    where: { cedula },
    include: [CargoTrabajador],
  });

  if (!trabajador) {
    throw new AppError('Trabajador no encontrado', 404);
  }

  const asistencias = await AsistenciaQR.findAll({
    where: { id_trabajador: trabajador.id_trabajador },
    order: [['fecha', 'DESC']],
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
    order: [['fecha_uso', 'DESC']],
  });

  const headers = [
    { label: 'Evento / Motivo', width: 170 },
    { label: 'Organizador', width: 120 },
    { label: 'Fecha', width: 70, align: 'center' },
    { label: 'Inicio', width: 55, align: 'center' },
    { label: 'Fin', width: 55, align: 'center' },
    { label: 'Estado', width: 70, align: 'center' },
  ];
  const rows = eventos.map((e) => {
    const p = e.Persona || {};
    const orgName = [p.nombres, p.apellidos].filter(Boolean).join(' ') || e.institucion || '—';
    return [
      e.motivo || '—',
      orgName,
      e.fecha_uso || '—',
      e.hora_inicio || '—',
      e.hora_fin || '—',
      e.estado || '—',
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
        [Op.gte]: firstDayOfMonth,
      },
    },
  });

  const ingresosMes = await RegistroIngreso.findAll({
    where: {
      fecha_hora_entrada: {
        [Op.gte]: firstDayOfMonth,
      },
    },
    attributes: ['fecha_hora_entrada'],
  });

  const visitantesDiariosMap = {};
  ingresosMes.forEach((ingreso) => {
    const d = new Date(ingreso.fecha_hora_entrada);
    const day = d.getDate();
    visitantesDiariosMap[day] = (visitantesDiariosMap[day] || 0) + 1;
  });

  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const currentMonthName = firstDayOfMonth.toLocaleString('es-ES', { month: 'short' });
  const visitantesDiarios = [];
  for (let i = 1; i <= daysInMonth; i++) {
    visitantesDiarios.push({
      name: `${i} ${currentMonthName.substring(0, 3)}`,
      visitantes: visitantesDiariosMap[i] || 0,
    });
  }

  // Próximos eventos (3 más cercanos en el futuro)
  const proximosEventos = await SolicitudEspacio.findAll({
    where: {
      fecha_uso: {
        [Op.gte]: now,
      },
      estado: 'Pendiente',
    },
    order: [['fecha_uso', 'ASC']],
    limit: 3,
  });

  // Últimas obras registradas (3 más recientes)
  const ultimasObras = await Obra.findAll({
    include: [EstadoObra],
    order: [['created_at', 'DESC']],
    limit: 3,
  });

  res.status(200).json({
    message: 'Estadísticas del Dashboard obtenidas',
    data: {
      totalObras: obrasCount,
      totalLibros: librosCount,
      visitantesMes: visitantesMesCount,
      visitantesDiarios,
      totalEventosActivos: await SolicitudEspacio.count({
        where: { fecha_uso: { [Op.gte]: now } },
      }),
      proximosEventos,
      ultimasObras,
    },
  });
});

// ─── Reporte: Listado de Trabajadores ──────────────────────────────────────
exports.reporteTrabajadores = catchAsync(async (req, res) => {
  const trabajadores = await Trabajador.findAll({
    include: [CargoTrabajador],
    order: [['nombres', 'ASC']],
  });

  const headers = [
    { label: 'Cédula', width: 65, align: 'center' },
    { label: 'Nombres y Apellidos', width: 150 },
    { label: 'Teléfono', width: 80, align: 'center' },
    { label: 'Correo', width: 120 },
    { label: 'Cargo', width: 100 },
    { label: 'Estado', width: 65, align: 'center' },
  ];
  const rows = trabajadores.map((t) => [
    t.cedula || '—',
    `${t.nombres || ''} ${t.apellidos || ''}`.trim() || '—',
    t.telefono || '—',
    t.correo_personal || '—',
    t.CargoTrabajador?.nombre_cargo || '—',
    t.estado || '—',
  ]);

  const filename = `MAVET_Trabajadores_${new Date().toISOString().split('T')[0]}.pdf`;
  const pdfBuffer = await generateTablePdf(
    'LISTADO DE TRABAJADORES ACTIVOS E INACTIVOS',
    headers,
    rows
  );

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
  res.send(pdfBuffer);
});

// ─── Reporte: Listado de Usuarios ──────────────────────────────────────────
exports.reporteUsuarios = catchAsync(async (req, res) => {
  const usuarios = await Usuario.findAll({
    include: [Role, Trabajador],
    order: [['correo', 'ASC']],
  });

  const headers = [
    { label: 'Correo', width: 150 },
    { label: 'Trabajador Vinculado', width: 160 },
    { label: 'Rol', width: 100, align: 'center' },
    { label: 'Estado', width: 65, align: 'center' },
  ];
  const rows = usuarios.map((u) => [
    u.correo || '—',
    u.Trabajador
      ? `${u.Trabajador.nombres || ''} ${u.Trabajador.apellidos || ''}`.trim()
      : 'No vinculado',
    u.Role ? u.Role.nombre_rol : '—',
    u.estado ? 'Activo' : 'Inactivo',
  ]);

  const filename = `MAVET_Usuarios_${new Date().toISOString().split('T')[0]}.pdf`;
  const pdfBuffer = await generateTablePdf('LISTADO DE USUARIOS DEL SISTEMA', headers, rows);

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
  res.send(pdfBuffer);
});

// ─── Reporte: Carnet Individual de Trabajador ─────────────────────────────
exports.reporteCarnet = catchAsync(async (req, res) => {
  const { id } = req.params;
  const trabajador = await Trabajador.findByPk(id, {
    include: [CargoTrabajador],
  });

  if (!trabajador) {
    throw new AppError('Trabajador no encontrado', 404);
  }

  const filename = `MAVET_Carnet_${trabajador.cedula || id}_${new Date().toISOString().split('T')[0]}.pdf`;
  const pdfBuffer = await generateCarnetPdf(trabajador);

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
  res.send(pdfBuffer);
});

// ─── Reporte: Credenciales Masivas ─────────────────────────────────────────
exports.reporteCredencialesMasivas = catchAsync(async (req, res) => {
  const trabajadores = await Trabajador.findAll({
    where: { estado: 'Activo' },
    include: [CargoTrabajador],
    order: [['nombres', 'ASC']],
  });

  const filename = `MAVET_Credenciales_Masivas_${new Date().toISOString().split('T')[0]}.pdf`;
  const pdfBuffer = await generateCredencialesMasivasPdf(trabajadores);

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
  res.send(pdfBuffer);
});

// ─── Reporte: Código QR de Auto Ingreso ────────────────────────────────────
exports.reporteQR = catchAsync(async (req, res) => {
  const { publicUrl } = req.query;
  if (!publicUrl) {
    throw new AppError('Debe proveer publicUrl', 400);
  }

  // Fetch QR code image
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(publicUrl)}`;
  const response = await fetch(qrUrl);
  let qrBuffer = null;
  if (response.ok) {
    const arrayBuffer = await response.arrayBuffer();
    qrBuffer = Buffer.from(arrayBuffer);
  } else {
    throw new AppError('Error al obtener el código QR de api.qrserver.com', 500);
  }

  const filename = `MAVET_QR_AutoIngreso_${new Date().toISOString().split('T')[0]}.pdf`;
  const pdfBuffer = await generateQRPdf(publicUrl, qrBuffer);

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
  res.send(pdfBuffer);
});

// ─── Reporte: Inventario de Talleres ────────────────────────────────────────
exports.reporteInventarioTalleres = catchAsync(async (req, res) => {
  const inventario = await InventarioTaller.findAll({
    order: [['nombre', 'ASC']],
  });

  const headers = [
    { label: 'Código', width: 80, align: 'center' },
    { label: 'Nombre del Taller', width: 200 },
    { label: 'Descripción', width: 350 },
  ];
  const rows = inventario.map((i) => [i.id || '—', i.nombre || '—', i.descripcion || '—']);

  const filename = `MAVET_Inventario_Talleres_${new Date().toISOString().split('T')[0]}.pdf`;
  const pdfBuffer = await generateTablePdf('INVENTARIO DE TALLERES DISPONIBLES', headers, rows);

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
  res.send(pdfBuffer);
});

// ─── Reporte: Planificación de Talleres ─────────────────────────────────────
exports.reporteTalleres = catchAsync(async (req, res) => {
  const talleres = await Taller.findAll({
    include: [
      { model: InventarioTaller, as: 'inventarioTaller' },
      { model: Instructor, include: [Persona] },
      { model: EspacioMuseo },
    ],
    order: [['fecha', 'DESC']],
  });

  const headers = [
    { label: 'Código', width: 55, align: 'center' },
    { label: 'Curso', width: 120 },
    { label: 'Instructor', width: 120 },
    { label: 'Espacio', width: 90 },
    { label: 'Sesiones', width: 50, align: 'center' },
    { label: 'Fecha Ini', width: 65, align: 'center' },
    { label: 'Fecha Fin', width: 65, align: 'center' },
    { label: 'Horario', width: 75, align: 'center' },
    { label: 'Cupo', width: 50, align: 'center' },
    { label: 'Estado', width: 65, align: 'center' },
  ];
  const fmtTime = (t) => (t ? t.substring(0, 5) : '—');
  const rows = talleres.map((t) => [
    t.id_taller || '—',
    t.nombre_curso || '—',
    t.Instructor?.Persona
      ? `${t.Instructor.Persona.nombres || ''} ${t.Instructor.Persona.apellidos || ''}`.trim()
      : '—',
    t.EspacioMuseo?.nombre || '—',
    t.sesiones || '—',
    t.fecha || '—',
    t.fecha_fin || '—',
    `${fmtTime(t.hora_inicio)} - ${fmtTime(t.hora_fin)}`,
    t.cupo_minimo && t.cupo_maximo ? `${t.cupo_minimo}-${t.cupo_maximo}` : '—',
    t.estado || '—',
  ]);

  const filename = `MAVET_Planificacion_Talleres_${new Date().toISOString().split('T')[0]}.pdf`;
  const pdfBuffer = await generateTablePdf('PLANIFICACIÓN DE TALLERES', headers, rows);

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
  res.send(pdfBuffer);
});
