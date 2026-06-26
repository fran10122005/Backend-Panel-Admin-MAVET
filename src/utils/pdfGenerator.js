const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');

// ─── Constantes de diseño ───────────────────────────────────────────────────
const MAVET_HEX = '#800000';
const MAVET_ALT = '#7C0F0F';
const GRAY_DARK = '#333333';
const GRAY_MED = '#666666';
const GRAY_LIGHT = '#999999';
const BG_ROW = '#F9F5F5';
const FONT_BOLD = 'Helvetica-Bold';
const FONT_NORMAL = 'Helvetica';

const LOGO_PATH = path.join(__dirname, '../../public/images/logo/mavet2.png');
const LOGO_IMG = fs.readFileSync(LOGO_PATH);

const MARGIN = 30;

// ─── Utilidad: dibujar encabezado institucional ─────────────────────────────
function drawHeader(doc, title, pageWidth, _pageHeight) {
  // Barra superior granate
  doc.rect(0, 0, pageWidth, 75).fill(MAVET_ALT);

  // Rectángulo granate más oscuro como acento
  doc.rect(0, 73, pageWidth, 3).fill(MAVET_HEX);

  // Logo
  try {
    doc.image(LOGO_IMG, 15, 8, { width: 50 });
  } catch (_e) {
    // Logo no disponible
  }

  const textX = 75;

  doc
    .fillColor('#FFFFFF')
    .fontSize(16)
    .font(FONT_BOLD)
    .text('MUSEO DE ARTES VISUALES DEL ESTADO TÁCHIRA', textX, 15, { align: 'left' });

  doc
    .fontSize(10)
    .font(FONT_NORMAL)
    .text('MAVET – Sistema de Gestión Interna', textX, 35, { align: 'left' });

  doc.fontSize(13).font(FONT_BOLD).text(title, textX, 52, { align: 'left' });
}

// ─── Utilidad: pie de página ────────────────────────────────────────────────
function drawFooter(doc, _pageWidth, _pageHeight) {
  const range = doc.bufferedPageRange();
  for (let i = 0; i < range.count; i++) {
    doc.switchToPage(i);

    const w = doc.page.width;
    const h = doc.page.height;

    doc
      .lineWidth(0.4)
      .strokeColor(MAVET_HEX)
      .moveTo(MARGIN, h - 35)
      .lineTo(w - MARGIN, h - 35)
      .stroke();

    const today = new Date().toLocaleDateString('es-VE', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });

    doc
      .fontSize(7)
      .fillColor(GRAY_LIGHT)
      .font(FONT_NORMAL)
      .text(`Generado el ${today}`, MARGIN, h - 28)
      .text(`Página ${i + 1} de ${range.count}`, w / 2, h - 28, { align: 'center' })
      .text('Documento de uso interno', w - MARGIN, h - 28, { align: 'right' });
  }
}

// ─── Calcular anchos de columna ─────────────────────────────────────────────
function calcColumnWidths(headers, totalWidth) {
  let fixedWidth = 0;
  let fluidCount = 0;
  const widths = [];

  headers.forEach((h) => {
    if (typeof h === 'object' && h.width) {
      fixedWidth += h.width;
      widths.push(h.width);
    } else {
      widths.push(null);
      fluidCount++;
    }
  });

  const fluidWidth = fluidCount > 0 ? Math.max(30, (totalWidth - fixedWidth) / fluidCount) : 0;
  return widths.map((w) => (w == null ? fluidWidth : w));
}

// ─── Dibujar tabla completa ─────────────────────────────────────────────────
function drawTable(doc, headers, rows, startY, pageWidth) {
  const totalWidth = pageWidth - 2 * MARGIN;
  const columnWidths = calcColumnWidths(headers, totalWidth);
  const headerTexts = headers.map((h) => (typeof h === 'string' ? h : h.label || h.property));

  let y = startY;

  // Encabezado
  doc.rect(MARGIN, y, totalWidth, 24).fill(MAVET_HEX);
  doc.fillColor('#FFFFFF').fontSize(9).font(FONT_BOLD);
  let cx = MARGIN + 5;
  headerTexts.forEach((text, i) => {
    doc.text(text, cx, y + 7, {
      width: columnWidths[i] - 10,
      align: 'left',
    });
    cx += columnWidths[i];
  });
  y += 24;

  // Filas
  rows.forEach((row, ri) => {
    // Row height estimation (simple: 1 line per cell)
    const rowH = 18;

    if (y + rowH > doc.page.height - 50) {
      doc.addPage();
      y = 50;
    }

    if (ri % 2 !== 0) {
      doc.rect(MARGIN, y, totalWidth, rowH).fill(BG_ROW);
    }

    doc.fillColor(GRAY_DARK).fontSize(8).font(FONT_NORMAL);
    cx = MARGIN + 5;
    row.forEach((text, i) => {
      const str = String(text == null ? '' : text).substring(0, 80);
      doc.text(str, cx, y + 5, {
        width: columnWidths[i] - 10,
        align: 'left',
      });
      cx += columnWidths[i];
    });

    // Línea divisoria
    doc
      .moveTo(MARGIN, y + rowH - 0.5)
      .lineTo(pageWidth - MARGIN, y + rowH - 0.5)
      .lineWidth(0.3)
      .strokeColor('#E8E8E8')
      .stroke();

    y += rowH;
  });

  return y; // final Y position
}

// ─── TABLA DE DATOS (principal, landscape) ──────────────────────────────────
const generateTablePdf = async (title, headers, rows) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        margin: MARGIN,
        size: 'A4',
        layout: 'landscape',
        bufferPages: true,
      });
      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      const pw = doc.page.width;
      const ph = doc.page.height;

      // Encabezado
      drawHeader(doc, title, pw, ph);

      // Fecha de generación
      doc.fillColor(GRAY_MED).fontSize(9).font(FONT_NORMAL);
      const fecha = new Date().toLocaleDateString('es-VE', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      doc.text(`Generado el: ${fecha}`, MARGIN, 90);

      // Tabla
      drawTable(doc, headers, rows, 110, pw);

      // Footer
      drawFooter(doc, pw, ph);

      doc.end();
    } catch (error) {
      console.error('Error generando PDF:', error);
      reject(error);
    }
  });
};

// ─── CARTA DE AVAL ──────────────────────────────────────────────────────────
const generateCartaAvalPdf = async (trabajador, asistencias) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        margin: 40,
        size: 'A4',
        layout: 'portrait',
        bufferPages: true,
      });
      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      const pw = doc.page.width;
      const ph = doc.page.height;

      // ── Encabezado ──
      drawHeader(doc, 'CARTA DE AVAL DE HORAS DE SERVICIO COMUNITARIO', pw, ph);

      // Fecha
      const fechaHoy = new Date().toLocaleDateString('es-VE', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      doc.fillColor(GRAY_MED).fontSize(9).font(FONT_NORMAL).text(`Emitida el: ${fechaHoy}`, 75, 82);

      // ── Línea decorativa ──
      doc
        .lineWidth(0.5)
        .strokeColor(MAVET_HEX)
        .moveTo(40, 95)
        .lineTo(pw - 40, 95)
        .stroke();

      // ── Cuerpo ──
      doc.y = 110;
      doc.fillColor(GRAY_DARK).fontSize(11).font(FONT_NORMAL);

      const intro =
        'Quien suscribe, Director del Museo de Artes Visuales del Estado Táchira (MAVET), hace constar mediante la presente que:';
      doc.text(intro, { align: 'justify' });
      doc.moveDown(1);

      // ── Recuadro del trabajador ──
      const cy = doc.y;
      const boxH = 75;
      doc
        .rect(40, cy, pw - 80, boxH)
        .fill('#F5F0F0')
        .rect(40, cy, pw - 80, boxH)
        .lineWidth(1)
        .strokeColor(MAVET_HEX)
        .stroke();

      doc
        .fillColor(MAVET_HEX)
        .fontSize(14)
        .font(FONT_BOLD)
        .text(
          `${trabajador.nombres || ''} ${trabajador.apellidos || ''}`.trim().toUpperCase(),
          55,
          cy + 15
        );

      const cargo =
        (trabajador.CargoTrabajador && trabajador.CargoTrabajador.nombre_cargo) ||
        trabajador.cargo ||
        '—';

      doc
        .fillColor(GRAY_DARK)
        .fontSize(10)
        .font(FONT_NORMAL)
        .text(`Cédula: ${trabajador.cedula || '—'}`, 55, cy + 35)
        .text(`Cargo: ${cargo}`, 55, cy + 48)
        .text(
          `Estado: ${trabajador.estado || 'Activo'}  ·  Correo: ${trabajador.correo || '—'}  ·  Teléfono: ${trabajador.telefono || '—'}`,
          55,
          cy + 61,
          { width: pw - 110 }
        );

      doc.y = cy + boxH + 20;

      const body =
        'Ha cumplido sus horas de servicio en esta institución de manera satisfactoria, de acuerdo con los registros de asistencia que se detallan a continuación:';
      doc.fillColor(GRAY_DARK).fontSize(11).font(FONT_NORMAL).text(body, {
        align: 'justify',
      });
      doc.moveDown(1.5);

      // ── Tabla de asistencias ──
      const tableHeaders = [
        'Fecha',
        'Entrada Mañana',
        'Salida Mañana',
        'Entrada Tarde',
        'Salida Tarde',
      ];
      const tableRows =
        asistencias.length > 0
          ? asistencias.map((a) => {
              const fmt = (dt) =>
                dt
                  ? new Date(dt).toLocaleTimeString('es-VE', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : '—';
              return [
                a.fecha || '—',
                fmt(a.entrada_manana),
                fmt(a.salida_manana),
                fmt(a.entrada_tarde),
                fmt(a.salida_tarde),
              ];
            })
          : [['Sin registros de asistencia', '', '', '', '']];

      const colW = (pw - 80) / tableHeaders.length;

      let y = doc.y;

      // Encabezado de tabla
      doc.rect(40, y, pw - 80, 22).fill(MAVET_HEX);
      doc.fillColor('#FFFFFF').fontSize(9).font(FONT_BOLD);
      tableHeaders.forEach((h, i) => doc.text(h, 45 + i * colW, y + 6, { width: colW - 10 }));
      y += 22;

      // Filas
      tableRows.forEach((row, ri) => {
        if (y > ph - 100) {
          doc.addPage();
          y = 50;
        }
        if (ri % 2 !== 0) doc.rect(40, y, pw - 80, 18).fill(BG_ROW);
        doc.fillColor(GRAY_DARK).fontSize(8).font(FONT_NORMAL);
        row.forEach((text, i) =>
          doc.text(String(text), 45 + i * colW, y + 5, {
            width: colW - 10,
          })
        );
        doc
          .moveTo(40, y + 17.5)
          .lineTo(pw - 40, y + 17.5)
          .lineWidth(0.3)
          .strokeColor('#E8E8E8')
          .stroke();
        y += 18;
      });

      // ── Firma ──
      doc.moveDown(3);
      y = doc.y;
      if (y > ph - 120) {
        doc.addPage();
        y = 50;
      }

      doc.lineWidth(0.5).strokeColor(GRAY_DARK).moveTo(40, y).lineTo(200, y).stroke();
      doc
        .fontSize(10)
        .font(FONT_BOLD)
        .fillColor(GRAY_DARK)
        .text('Director(a) MAVET', 40, y + 5);
      doc
        .fontSize(9)
        .font(FONT_NORMAL)
        .text('Firma Autorizada', 40, y + 18);

      // ── Sello ──
      const selloCX = pw - 70;
      const selloCY = y - 5;
      doc.lineWidth(0.8).strokeColor(MAVET_HEX).circle(selloCX, selloCY, 20).stroke();
      doc
        .fontSize(8)
        .font(FONT_BOLD)
        .fillColor(MAVET_HEX)
        .text('MAVET', selloCX, selloCY - 4, { align: 'center' });
      doc
        .fontSize(6)
        .font(FONT_NORMAL)
        .text('MUSEO DE ARTES', selloCX, selloCY + 4, { align: 'center' })
        .text('VISUALES TÁCHIRA', selloCX, selloCY + 10, { align: 'center' });

      // ── Footer ──
      drawFooter(doc, pw, ph);

      doc.end();
    } catch (error) {
      console.error('Error dibujando la tabla de asistencia en Carta de Aval:', error);
      reject(error);
    }
  });
};

module.exports = {
  generateTablePdf,
  generateCartaAvalPdf,
};
