const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');

// ─── Paleta de colores premium ──────────────────────────────────────────────
const C = {
  brand: '#800000',
  brandDark: '#5C0000',
  brandLight: '#A33D3D',
  gold: '#C4985A',
  goldLight: '#E8D5B0',
  white: '#FFFFFF',
  text: '#2D2D2D',
  textSoft: '#6B6B6B',
  textMuted: '#9B9B9B',
  line: '#E4E4E4',
  rowEven: '#FFFFFF',
  rowOdd: '#FDF8F6',
  headerBg: '#800000',
  headerBgDark: '#6B0000',
  bodyBg: '#FFFFFF',
  accent: '#F5EDE8',
};

const FONT_BOLD = 'Helvetica-Bold';
const FONT_NORMAL = 'Helvetica';
const MARGIN = 30;

const LOGO_PATH = path.join(__dirname, '../../public/images/logo/mavet2.png');
const LOGO_IMG = fs.readFileSync(LOGO_PATH);

// ─── Encabezado institucional ───────────────────────────────────────────────
function drawHeader(doc, title, pw) {
  // Barra principal
  doc.rect(0, 0, pw, 78).fill(C.brandDark);
  doc.rect(0, 76, pw, 4).fill(C.gold);

  // Logo
  try {
    doc.image(LOGO_IMG, 18, 10, { width: 48 });
  } catch (_e) {
    /* */
  }

  const tx = 78;

  doc
    .fillColor(C.white)
    .fontSize(15)
    .font(FONT_BOLD)
    .text('MUSEO DE ARTES VISUALES DEL ESTADO TÁCHIRA', tx, 16);

  doc.fontSize(9).font(FONT_NORMAL).text('MAVET – Sistema de Gestión Interna', tx, 34);

  doc.fontSize(13).font(FONT_BOLD).text(title, tx, 54);
}

// ─── Pie de página ─────────────────────────────────────────────────────────
function drawFooter(doc, pw) {
  const range = doc.bufferedPageRange();
  for (let i = 0; i < range.count; i++) {
    doc.switchToPage(i);
    const h = doc.page.height;

    doc
      .lineWidth(0.4)
      .strokeColor(C.gold)
      .moveTo(MARGIN, h - 38)
      .lineTo(pw - MARGIN, h - 38)
      .stroke();

    const today = new Date().toLocaleDateString('es-VE', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });

    doc
      .fontSize(7)
      .fillColor(C.textMuted)
      .font(FONT_NORMAL)
      .text(today, MARGIN, h - 30)
      .text(`Pág. ${i + 1} de ${range.count}`, pw / 2, h - 30, { align: 'center' })
      .text('Documento de uso interno', pw - MARGIN, h - 30, { align: 'right' });
  }
}

// ─── Calcula anchos de columna ─────────────────────────────────────────────
function calcWidths(headers, totalW) {
  let fixed = 0,
    fluid = 0,
    widths = [];
  headers.forEach((h) => {
    if (typeof h === 'object' && h.width) {
      fixed += h.width;
      widths.push(h.width);
    } else {
      widths.push(null);
      fluid++;
    }
  });
  const fw = fluid > 0 ? Math.max(30, (totalW - fixed) / fluid) : 0;
  return widths.map((w) => (w == null ? fw : w));
}

// ─── Tabla con diseño premium ──────────────────────────────────────────────
function drawTable(doc, headers, rows, startY, pw) {
  const tw = pw - 2 * MARGIN;
  const cw = calcWidths(headers, tw);
  const colMeta = headers.map((h) =>
    typeof h === 'string'
      ? { label: h, align: 'left' }
      : { label: h.label || h.property, align: h.align || 'left' }
  );
  const padL = 8,
    padR = 4,
    rowH = 20,
    headH = 26;

  let y = startY;

  // ── Encabezado ──
  doc.rect(MARGIN, y, tw, headH).fill(C.headerBg);
  doc.rect(MARGIN, y + headH - 2, tw, 2).fill(C.brandDark);

  doc.fillColor(C.white).fontSize(9).font(FONT_BOLD);
  let cx = MARGIN + padL;
  colMeta.forEach((m, i) => {
    doc.text(m.label, cx, y + 8, { width: cw[i] - padL - padR, align: m.align });
    cx += cw[i];
  });
  y += headH;

  // ── Filas ──
  rows.forEach((row, ri) => {
    if (y + rowH > doc.page.height - 50) {
      doc.addPage();
      y = 50;
    }

    const bg = ri % 2 === 0 ? C.rowEven : C.rowOdd;
    doc.rect(MARGIN, y, tw, rowH).fill(bg);

    doc.fillColor(C.text).fontSize(8).font(FONT_NORMAL);
    cx = MARGIN + padL;
    row.forEach((text, i) => {
      const align = colMeta[i]?.align || 'left';
      doc.text(String(text == null ? '' : text).substring(0, 80), cx, y + 6, {
        width: cw[i] - padL - padR,
        align,
      });
      cx += cw[i];
    });

    if (ri < rows.length - 1) {
      doc
        .moveTo(MARGIN, y + rowH)
        .lineTo(pw - MARGIN, y + rowH)
        .lineWidth(0.2)
        .strokeColor(C.line)
        .stroke();
    }
    y += rowH;
  });

  // ── Borde exterior ──
  doc
    .rect(MARGIN, startY, tw, y - startY)
    .lineWidth(0.5)
    .strokeColor(C.brandLight)
    .stroke();

  return y;
}

// ─── Generar PDF con tabla ─────────────────────────────────────────────────
const generateTablePdf = async (title, headers, rows) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        margin: MARGIN,
        size: 'A4',
        layout: 'landscape',
        bufferPages: true,
      });
      const bufs = [];
      doc.on('data', bufs.push.bind(bufs));
      doc.on('end', () => resolve(Buffer.concat(bufs)));

      const pw = doc.page.width;
      const ph = doc.page.height;

      drawHeader(doc, title, pw);

      const fecha = new Date().toLocaleDateString('es-VE', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      // ── Barra de metadatos ──
      doc.rect(MARGIN, 90, pw - 2 * MARGIN, 20).fill(C.accent);
      doc.rect(MARGIN, 90, 4, 20).fill(C.gold);

      doc.fillColor(C.textSoft).fontSize(8).font(FONT_NORMAL);
      const infoY = 103;
      doc.text(`Generado: ${fecha}`, MARGIN + 14, infoY);
      doc.text(`${rows.length} registro${rows.length !== 1 ? 's' : ''}`, pw / 2, infoY, {
        align: 'center',
      });
      doc.text('MAVET — Reporte oficial', pw - MARGIN - 8, infoY, { align: 'right' });

      drawTable(doc, headers, rows, 120, pw);
      drawFooter(doc, pw);
      doc.end();
    } catch (err) {
      console.error('Error generando PDF:', err);
      reject(err);
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
      const bufs = [];
      doc.on('data', bufs.push.bind(bufs));
      doc.on('end', () => resolve(Buffer.concat(bufs)));

      const pw = doc.page.width;
      const ph = doc.page.height;

      drawHeader(doc, 'CARTA DE AVAL', pw);

      const fechaHoy = new Date().toLocaleDateString('es-VE', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      doc
        .fillColor(C.textSoft)
        .fontSize(9)
        .font(FONT_NORMAL)
        .text(`Emitida el: ${fechaHoy}`, 78, 82);

      // ── Línea decorativa ──
      doc
        .lineWidth(0.4)
        .strokeColor(C.gold)
        .moveTo(40, 97)
        .lineTo(pw - 40, 97)
        .stroke();

      doc.y = 112;
      doc.fillColor(C.text).fontSize(11).font(FONT_NORMAL);
      doc.text(
        'Quien suscribe, Director del Museo de Artes Visuales del Estado Táchira (MAVET), hace constar mediante la presente que:',
        { align: 'justify' }
      );
      doc.moveDown(1.2);

      // ── Recuadro del trabajador ──
      const cy = doc.y;
      const boxH = 80;

      // Sombra (desplazada)
      doc.rect(42, cy + 1, pw - 80, boxH).fill(C.line);

      // Fondo
      doc.rect(40, cy, pw - 80, boxH).fill(C.accent);

      // Borde izquierdo decorativo (gold)
      doc.rect(40, cy, 4, boxH).fill(C.gold);

      const cargo = trabajador.CargoTrabajador?.nombre_cargo || trabajador.cargo || '—';
      const nombre = `${trabajador.nombres || ''} ${trabajador.apellidos || ''}`
        .trim()
        .toUpperCase();

      doc
        .fillColor(C.brand)
        .fontSize(15)
        .font(FONT_BOLD)
        .text(nombre, 56, cy + 14);

      doc
        .fillColor(C.text)
        .fontSize(9.5)
        .font(FONT_NORMAL)
        .text(`Cédula: ${trabajador.cedula || '—'}    Cargo: ${cargo}`, 56, cy + 34)
        .text(
          `Estado: ${trabajador.estado || 'Activo'}    Correo: ${trabajador.correo || '—'}    Tel: ${trabajador.telefono || '—'}`,
          56,
          cy + 48,
          { width: pw - 110 }
        );

      doc.y = cy + boxH + 22;

      doc.fillColor(C.text).fontSize(11).font(FONT_NORMAL);
      doc.text(
        'Ha cumplido sus horas de servicio en esta institución de manera satisfactoria, de acuerdo con los registros de asistencia que se detallan a continuación:',
        { align: 'justify' }
      );
      doc.moveDown(1.5);

      // ── Tabla de asistencias ──
      const th = ['Fecha', 'Entrada Mañana', 'Salida Mañana', 'Entrada Tarde', 'Salida Tarde'];
      const trows =
        asistencias.length > 0
          ? asistencias.map((a) => {
              const fmt = (dt) =>
                dt
                  ? new Date(dt).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })
                  : '—';
              return [
                a.fecha || '—',
                fmt(a.entrada_manana),
                fmt(a.salida_manana),
                fmt(a.entrada_tarde),
                fmt(a.salida_tarde),
              ];
            })
          : [['Sin registros', '', '', '', '']];

      const cw = (pw - 80) / 5;
      let y = doc.y;

      // Sombra encabezado
      doc.rect(42, y + 1, pw - 80, 22).fill(C.line);
      doc.rect(40, y, pw - 80, 22).fill(C.headerBg);
      doc.rect(40, y + 20, pw - 80, 2).fill(C.brandDark);

      doc.fillColor(C.white).fontSize(8.5).font(FONT_BOLD);
      th.forEach((h, i) => doc.text(h, 46 + i * cw, y + 6, { width: cw - 10 }));
      y += 22;

      trows.forEach((row, ri) => {
        if (y > ph - 110) {
          doc.addPage();
          y = 50;
        }
        const bg = ri % 2 === 0 ? C.rowEven : C.rowOdd;
        doc.rect(40, y, pw - 80, 18).fill(bg);
        doc.fillColor(C.text).fontSize(8).font(FONT_NORMAL);
        row.forEach((text, i) => doc.text(String(text), 46 + i * cw, y + 5, { width: cw - 10 }));
        if (ri < trows.length - 1) {
          doc
            .moveTo(40, y + 18)
            .lineTo(pw - 40, y + 18)
            .lineWidth(0.2)
            .strokeColor(C.line)
            .stroke();
        }
        y += 18;
      });
      doc
        .rect(40, y - trows.length * 18, pw - 80, trows.length * 18)
        .lineWidth(0.4)
        .strokeColor(C.brandLight)
        .stroke();

      // ── Totales ──
      const totalDias = asistencias.length;
      const totalHoras = asistencias.reduce((s, a) => s + (a.horasCumplidas || 0), 0);
      doc.moveDown(1.5);
      y = Math.max(doc.y, y + 10);
      doc
        .fillColor(C.brand)
        .fontSize(10)
        .font(FONT_BOLD)
        .text(`Total: ${totalDias} días  ·  ${totalHoras} horas cumplidas`, 40, y);

      // ── Firma ──
      y += 30;
      if (y > ph - 130) {
        doc.addPage();
        y = 60;
      }

      doc.lineWidth(0.5).strokeColor(C.text).moveTo(40, y).lineTo(200, y).stroke();

      doc
        .fillColor(C.text)
        .fontSize(10)
        .font(FONT_BOLD)
        .text('Director(a) MAVET', 40, y + 6);
      doc
        .fontSize(9)
        .font(FONT_NORMAL)
        .text('Firma Autorizada', 40, y + 20);

      // ── Sello ──
      const sx = pw - 65,
        sy = y - 8;
      doc.lineWidth(0.6).strokeColor(C.brand).circle(sx, sy, 18).stroke();
      doc
        .fontSize(7)
        .font(FONT_BOLD)
        .fillColor(C.brand)
        .text('MAVET', sx, sy - 3, { align: 'center' });
      doc
        .fontSize(5.5)
        .font(FONT_NORMAL)
        .text('MUSEO DE', sx, sy + 4, { align: 'center' })
        .text('ARTES VISUALES', sx, sy + 9, { align: 'center' })
        .text('DEL TÁCHIRA', sx, sy + 14, { align: 'center' });

      drawFooter(doc, pw);
      doc.end();
    } catch (err) {
      console.error('Error en Carta de Aval:', err);
      reject(err);
    }
  });
};

module.exports = { generateTablePdf, generateCartaAvalPdf };
