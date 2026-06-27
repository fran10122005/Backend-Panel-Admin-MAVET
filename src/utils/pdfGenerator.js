const PDFDocument = require('pdfkit-table');
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
  } catch (e) {
    // ignorar error de logo
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

// ─── Encabezados y Pies de página para todas las páginas ───────────────────
function drawHeadersAndFooters(doc, title, pw, margin = MARGIN) {
  const range = doc.bufferedPageRange();
  for (let i = 0; i < range.count; i++) {
    doc.switchToPage(i);

    // Encabezado institucional
    drawHeader(doc, title, pw);

    // Pie de página
    const h = doc.page.height;

    doc
      .lineWidth(0.4)
      .strokeColor(C.gold)
      .moveTo(margin, h - 38)
      .lineTo(pw - margin, h - 38)
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
      .text(today, margin, h - 30)
      .text(`Pág. ${i + 1} de ${range.count}`, margin, h - 30, {
        width: pw - 2 * margin,
        align: 'center',
      })
      .text('Documento de uso interno', margin, h - 30, {
        width: pw - 2 * margin,
        align: 'right',
      });
  }
}

// (The drawTable function has been removed. We now use pdfkit-table natively inside generateTablePdf)

// ─── Generar PDF con tabla ─────────────────────────────────────────────────
const generateTablePdf = async (title, headers, rows) => {
  return new Promise((resolve, reject) => {
    (async () => {
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

        const fecha = new Date().toLocaleDateString('es-VE', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });

        // ── Barra de metadatos ──
        doc.rect(MARGIN, 90, pw - 2 * MARGIN, 20).fill(C.accent);
        doc.rect(MARGIN, 90, 4, 20).fill(C.gold);

        doc.fillColor(C.textSoft).fontSize(8).font(FONT_NORMAL);
        const infoY = 97;
        doc.text(`Generado: ${fecha}`, MARGIN + 14, infoY);
        doc.text(`${rows.length} registro${rows.length !== 1 ? 's' : ''}`, MARGIN, infoY, {
          width: pw - 2 * MARGIN,
          align: 'center',
        });
        doc.text('MAVET — Reporte oficial', MARGIN, infoY, {
          width: pw - 2 * MARGIN - 14,
          align: 'right',
        });

        // ── Transform data for pdfkit-table ──
        const tableHeaders = headers.map((h, i) => {
          if (typeof h === 'string') return { label: h, property: `col_${i}`, renderer: null };
          return {
            label: h.label || h.property,
            property: h.property || `col_${i}`,
            width: h.width,
            align: h.align || 'left',
            headerColor: C.headerBg,
            headerOpacity: 1,
          };
        });

        const tableRows = rows.map((rowArr) => {
          const rowObj = {};
          rowArr.forEach((cell, i) => {
            rowObj[tableHeaders[i].property] = cell != null ? String(cell) : '';
          });
          return rowObj;
        });

        await doc.table(
          {
            headers: tableHeaders,
            datas: tableRows,
          },
          {
            x: MARGIN,
            y: 120,
            padding: 5,
            margins: { left: MARGIN, right: MARGIN, top: 95, bottom: 50 },
            prepareHeader: () => doc.font(FONT_BOLD).fontSize(9).fillColor(C.white),
            prepareRow: (row, indexColumn, indexRow, rectRow) => {
              doc.font(FONT_NORMAL).fontSize(8).fillColor(C.text);
              if (indexColumn === 0) {
                doc.addBackground(rectRow, indexRow % 2 === 0 ? C.rowEven : C.rowOdd, 1);
              }
            },
            divider: {
              header: { disabled: false, width: 2, opacity: 1, color: C.brandDark },
              horizontal: { disabled: false, width: 0.5, opacity: 1, color: C.line },
            },
          }
        );
        drawHeadersAndFooters(doc, title, pw, MARGIN);
        doc.end();
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Error generando PDF:', err);
        reject(err);
      }
    })();
  });
};

// ─── CARTA DE AVAL ──────────────────────────────────────────────────────────
const generateCartaAvalPdf = async (trabajador, asistencias) => {
  return new Promise((resolve, reject) => {
    (async () => {
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

        doc.x = 40;
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

        doc.x = 40;
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
            : [['Sin registros', '', '', '', '']];

        // ── Transform data for pdfkit-table ──
        const tableHeaders = th.map((h, i) => ({
          label: h,
          property: `col_${i}`,
          headerColor: C.headerBg,
          headerOpacity: 1,
        }));

        const tableRows = trows.map((rowArr) => {
          const rowObj = {};
          rowArr.forEach((cell, i) => {
            rowObj[`col_${i}`] = cell != null ? String(cell) : '';
          });
          return rowObj;
        });

        await doc.table(
          {
            headers: tableHeaders,
            datas: tableRows,
          },
          {
            x: 40,
            y: doc.y,
            padding: 5,
            margins: { left: 40, right: 40, top: 95, bottom: 50 },
            prepareHeader: () => doc.font(FONT_BOLD).fontSize(8.5).fillColor(C.white),
            prepareRow: (row, indexColumn, indexRow, rectRow) => {
              doc.font(FONT_NORMAL).fontSize(8).fillColor(C.text);
              if (indexColumn === 0) {
                doc.addBackground(rectRow, indexRow % 2 === 0 ? C.rowEven : C.rowOdd, 1);
              }
            },
            divider: {
              header: { disabled: false, width: 2, opacity: 1, color: C.brandDark },
              horizontal: { disabled: false, width: 0.5, opacity: 1, color: C.line },
            },
          }
        );

        let y = doc.y;

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

        drawHeadersAndFooters(doc, 'CARTA DE AVAL', pw, 40);
        doc.end();
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Error en Carta de Aval:', err);
        reject(err);
      }
    })();
  });
};

module.exports = { generateTablePdf, generateCartaAvalPdf };
