const PDFDocument = require('pdfkit-table');

/**
 * Genera un PDF con formato de tabla y lo envía como respuesta HTTP.
 * 
 * @param {Object} res - Objeto de respuesta de Express.
 * @param {String} title - Título del reporte.
 * @param {Array} headers - Arreglo de strings o objetos para los encabezados de la tabla.
 * @param {Array} rows - Arreglo de arreglos con los datos de las filas.
 * @param {String} filename - Nombre del archivo a descargar (por defecto: reporte.pdf).
 */
const generateTablePdf = async (res, title, headers, rows, filename = 'reporte.pdf') => {
  // Configurar las cabeceras de respuesta para descargar el PDF
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=${filename}`);

  // Crear el documento PDF con un margen adecuado (Landscape para mejor visibilidad en tablas)
  const doc = new PDFDocument({ margin: 30, size: 'A4', layout: 'landscape' });

  // Enlazar el documento con la respuesta de Express
  doc.pipe(res);

  // --- ENCABEZADO DEL DOCUMENTO ---
  // Fondo de encabezado MAVET_COLOR brand-500 = #800000
  doc.rect(0, 0, doc.page.width, 80).fill('#800000');

  doc
    .fillColor('#FFFFFF')
    .fontSize(18)
    .font('Helvetica-Bold')
    .text('MUSEO DE ARTES VISUALES Y DEL ESPACIO DEL ESTADO TÁCHIRA', 30, 25, { align: 'left' });

  doc
    .fontSize(12)
    .font('Helvetica')
    .text('MAVET – Sistema Administrativo Interno', 30, 45, { align: 'left' })
    .moveDown(1);

  // Fecha de generación
  const fechaGeneracion = new Date().toLocaleDateString('es-VE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  doc.fillColor('#000000');
  doc.fontSize(14).font('Helvetica-Bold').text(title, 30, 100);
  doc.fontSize(10).font('Helvetica').text(`Generado el: ${fechaGeneracion}`, 30, 120);
  doc.moveDown(1);

  // --- TABLA DE DATOS ---
  const table = {
    headers: headers,
    rows: rows,
  };

  try {
    await doc.table(table, {
      y: 140,
      prepareHeader: () => doc.font('Helvetica-Bold').fontSize(9).fillColor('#FFFFFF'),
      prepareRow: (row, indexColumn, indexRow, rectRow, rectCell) => {
        doc.font('Helvetica').fontSize(8).fillColor('#333333');
        // Colores alternos en filas (zebra striping)
        if (indexRow % 2 !== 0) {
          doc.addBackground(rectRow, '#F5F8FC');
        }
      },
      padding: 5,
      divider: {
        header: { disabled: false, width: 1, opacity: 1 },
        horizontal: { disabled: false, width: 0.5, opacity: 0.5 }
      }
    });
  } catch (error) {
    console.error("Error dibujando la tabla en PDF:", error);
    doc.text('Ocurrió un error al generar los datos de la tabla.');
  }

  // --- PIE DE PÁGINA ---
  const pages = doc.bufferedPageRange();
  for (let i = 0; i < pages.count; i++) {
    doc.switchToPage(i);
    doc.fontSize(8)
      .fillColor('#888888')
      .text(`MAVET – Documento de uso interno. No reproducir sin autorización. | Página ${i + 1} de ${pages.count}`,
        30,
        doc.page.height - 30,
        { align: 'center' });
  }

  // Finalizar el documento
  doc.end();
};

// ─── CARTA DE AVAL ──────────────────────────────────────────────────────────
const generateCartaAvalPdf = async (res, trabajador, asistencias, filename = 'carta_aval.pdf') => {
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=${filename}`);

  const doc = new PDFDocument({ margin: 40, size: 'A4', layout: 'portrait' });
  doc.pipe(res);

  // Colores MAVET
  const MAVET_COLOR = '#800000';
  const ACCENT_COLOR = '#A33D3D';

  // --- ENCABEZADO ---
  doc.rect(0, 0, doc.page.width, 80).fill(MAVET_COLOR);

  doc
    .fillColor('#FFFFFF')
    .fontSize(16)
    .font('Helvetica-Bold')
    .text('MUSEO DE ARTES VISUALES Y DEL ESPACIO DEL ESTADO TÁCHIRA', 40, 25, { align: 'left' });

  doc
    .fontSize(10)
    .font('Helvetica')
    .text('MAVET – Sistema Administrativo Interno', 40, 45, { align: 'left' });

  // Fecha
  const fechaHoy = new Date().toLocaleDateString('es-VE', {
    year: 'numeric', month: 'long', day: 'numeric'
  });

  doc.fillColor('#000000');
  doc.moveDown(3);
  doc.fontSize(14).font('Helvetica-Bold').text('CARTA DE AVAL DE HORAS DE SERVICIO COMUNITARIO', { align: 'left' });
  doc.fontSize(10).font('Helvetica').fillColor('#666666').text(`Emitida el: ${fechaHoy}`, { align: 'left' });
  doc.moveDown(2);

  // --- CUERPO ---
  doc.fillColor('#000000').fontSize(11).font('Helvetica');
  const intro = `Quien suscribe, Director del Museo de Artes Visuales y del Espacio del Estado Táchira (MAVET), hace constar mediante la presente que:`;
  doc.text(intro, { align: 'justify' });
  doc.moveDown(1);

  // Recuadro del trabajador
  const currentY = doc.y;
  doc.rect(40, currentY, doc.page.width - 80, 80).fill('#F5F8FC');
  doc.rect(40, currentY, doc.page.width - 80, 80).stroke(ACCENT_COLOR);
  
  doc.fillColor('#000000').fontSize(12).font('Helvetica-Bold').text(`${trabajador.nombres || ''} ${trabajador.apellidos || ''}`.trim().toUpperCase(), 55, currentY + 15);
  doc.fontSize(10).font('Helvetica').text(`Cédula: ${trabajador.cedula || '—'}   ·   Cargo: ${trabajador.CargoTrabajador?.nombre_cargo || '—'}   ·   Estado: Activo`, 55, currentY + 35);
  doc.text(`Correo: ${trabajador.correo || '—'}   ·   Teléfono: ${trabajador.telefono || '—'}`, 55, currentY + 50);

  doc.y = currentY + 95;
  doc.x = 40;
  
  const body = `Ha cumplido sus horas de servicio en esta institución de manera satisfactoria, de acuerdo con los registros de asistencia que se detallan a continuación:`;
  doc.text(body, { align: 'justify' });
  doc.moveDown(1);

  // --- TABLA DE ASISTENCIAS ---
  const headers = ['Fecha', 'Entrada Mañana', 'Salida Mañana', 'Entrada Tarde', 'Salida Tarde'];
  const fmt = (dt) => dt ? new Date(dt).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' }) : '—';
  
  const rows = asistencias.length > 0 
    ? asistencias.map(a => [
        a.fecha || '—',
        fmt(a.entrada_manana),
        fmt(a.salida_manana),
        fmt(a.entrada_tarde),
        fmt(a.salida_tarde),
      ])
    : [['Sin registros de asistencia', '', '', '', '']];

  const table = { headers, rows };

  try {
    await doc.table(table, {
      y: doc.y,
      prepareHeader: () => doc.font('Helvetica-Bold').fontSize(9).fillColor('#FFFFFF'),
      prepareRow: (row, indexColumn, indexRow, rectRow) => {
        doc.font('Helvetica').fontSize(8).fillColor('#333333');
        if (indexRow % 2 !== 0) doc.addBackground(rectRow, '#F5F8FC');
      },
      padding: 5,
      divider: {
        header: { disabled: false, width: 1, opacity: 1 },
        horizontal: { disabled: false, width: 0.5, opacity: 0.5 }
      }
    });
  } catch (error) {
    console.error("Error dibujando la tabla de asistencia en Carta de Aval:", error);
  }

  // --- FIRMA ---
  doc.moveDown(4);
  const firmaY = doc.y;
  doc.moveTo(40, firmaY).lineTo(200, firmaY).stroke('#666666');
  doc.fontSize(10).font('Helvetica-Bold').text('Firma Autorizada', 40, firmaY + 5);
  doc.font('Helvetica').text('Director – MAVET', 40, firmaY + 20);

  // --- PIE DE PÁGINA ---
  const pages = doc.bufferedPageRange();
  for (let i = 0; i < pages.count; i++) {
    doc.switchToPage(i);
    doc.fontSize(8)
      .fillColor('#888888')
      .text(`MAVET – Documento de uso interno. No reproducir sin autorización. | Página ${i + 1} de ${pages.count}`,
        0,
        doc.page.height - 30,
        { align: 'center', width: doc.page.width });
  }

  doc.end();
};

module.exports = {
  generateTablePdf,
  generateCartaAvalPdf
};
