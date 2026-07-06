/* global fetch */
const PDFDocument = require('pdfkit'); // Native PDFKit
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
  doc.rect(0, 0, pw, 78).fill(C.brandDark);
  doc.rect(0, 76, pw, 4).fill(C.gold);
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
    drawHeader(doc, title, pw);
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
      .text(today, margin, h - 30, { lineBreak: false })
      .text(`Pág. ${i + 1} de ${range.count}`, margin, h - 30, {
        width: pw - 2 * margin,
        align: 'center',
        lineBreak: false,
      })
      .text('Documento de uso interno', margin, h - 30, {
        width: pw - 2 * margin,
        align: 'right',
        lineBreak: false,
      });
  }
}

// ─── Generar PDF con tabla (NATIVO, SIN BUGS DE PÁGINAS) ───────────────────
const generateTablePdf = async (title, headers, rows) => {
  return new Promise((resolve, reject) => {
    (async () => {
      try {
        const doc = new PDFDocument({
          margins: { top: MARGIN, left: MARGIN, right: MARGIN, bottom: 15 },
          size: 'A4',
          layout: 'landscape',
          bufferPages: true,
          autoPageBreak: false,
        });
        const bufs = [];
        doc.on('data', bufs.push.bind(bufs));
        doc.on('end', () => resolve(Buffer.concat(bufs)));

        const pw = doc.page.width;
        const ph = doc.page.height;
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
        doc.text(`Generado: ${fecha}`, MARGIN + 14, infoY, { lineBreak: false });
        doc.text(`${rows.length} registro${rows.length !== 1 ? 's' : ''}`, MARGIN, infoY, {
          width: pw - 2 * MARGIN,
          align: 'center',
          lineBreak: false,
        });
        doc.text('MAVET — Reporte oficial', MARGIN, infoY, {
          width: pw - 2 * MARGIN - 14,
          align: 'right',
          lineBreak: false,
        });

        // ── Preparar Cabeceras ──
        const tableHeaders = headers.map((h, i) => {
          if (typeof h === 'string') return { label: h, width: 100, align: 'left' };
          return { label: h.label || `col_${i}`, width: h.width || 100, align: h.align || 'left' };
        });

        let y = 120;
        const rowH = 18; // Altura de cada fila

        const drawTableHead = (currentY) => {
          doc.rect(MARGIN, currentY, pw - 2 * MARGIN, rowH).fill(C.headerBg);
          let cx = MARGIN;
          tableHeaders.forEach((h) => {
            doc.fillColor(C.white).font(FONT_BOLD).fontSize(9);
            doc.text(h.label, cx + 5, currentY + 5, {
              width: h.width - 10,
              align: h.align,
              lineBreak: false,
            });
            cx += h.width;
          });
          return currentY + rowH;
        };

        y = drawTableHead(y);

        // ── Filas ──
        for (let r = 0; r < rows.length; r++) {
          if (y + rowH > ph - MARGIN - 25) {
            doc.addPage();
            y = MARGIN + 60; // Dejar espacio para el header global
            y = drawTableHead(y);
          }

          const rowArr = rows[r];
          doc.rect(MARGIN, y, pw - 2 * MARGIN, rowH).fill(r % 2 === 0 ? C.rowEven : C.rowOdd);

          let cx = MARGIN;
          tableHeaders.forEach((h, i) => {
            const val = rowArr[i] != null ? String(rowArr[i]) : '';
            doc.fillColor(C.text).font(FONT_NORMAL).fontSize(8);
            // lineBreak: false corta el texto si excede el ancho
            doc.text(val, cx + 5, y + 5, {
              width: h.width - 10,
              align: h.align,
              height: 10,
              lineBreak: false,
            });
            cx += h.width;
          });

          doc
            .lineWidth(0.5)
            .strokeColor(C.line)
            .moveTo(MARGIN, y + rowH)
            .lineTo(pw - MARGIN, y + rowH)
            .stroke();
          y += rowH;
        }

        // ── Encabezados y Pies Globales ──
        const range = doc.bufferedPageRange();
        for (let i = 0; i < range.count; i++) {
          doc.switchToPage(i);
          drawHeader(doc, title, pw);
          const h = doc.page.height;
          doc
            .lineWidth(0.4)
            .strokeColor(C.gold)
            .moveTo(MARGIN, h - 38)
            .lineTo(pw - MARGIN, h - 38)
            .stroke();
          doc
            .fontSize(7)
            .fillColor(C.textMuted)
            .font(FONT_NORMAL)
            .text(fecha, MARGIN, h - 30, { lineBreak: false })
            .text(`Pág. ${i + 1} de ${range.count}`, MARGIN, h - 30, {
              width: pw - 2 * MARGIN,
              align: 'center',
              lineBreak: false,
            })
            .text('Documento de uso interno', MARGIN, h - 30, {
              width: pw - 2 * MARGIN,
              align: 'right',
              lineBreak: false,
            });
        }

        doc.end();
      } catch (err) {
        console.error('Error generando PDF tabla:', err);
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
          margins: { top: 40, left: 40, right: 40, bottom: 15 },
          size: 'A4',
          layout: 'portrait',
          bufferPages: true,
          autoPageBreak: false,
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
        doc.rect(42, cy + 1, pw - 80, boxH).fill(C.line);
        doc.rect(40, cy, pw - 80, boxH).fill(C.accent);
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

        // ── Tabla nativa de asistencias ──
        const th = ['Fecha', 'Entrada Mañana', 'Salida Mañana', 'Entrada Tarde', 'Salida Tarde'];
        const colW = (pw - 80) / 5;
        let y = doc.y;
        const rowH = 18;

        const drawHeadCarta = (currentY) => {
          doc.rect(40, currentY, pw - 80, rowH).fill(C.headerBg);
          let cx = 40;
          th.forEach((h) => {
            doc
              .fillColor(C.white)
              .font(FONT_BOLD)
              .fontSize(8.5)
              .text(h, cx + 5, currentY + 5, { width: colW - 10, align: 'left' });
            cx += colW;
          });
          return currentY + rowH;
        };

        y = drawHeadCarta(y);

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

        for (let r = 0; r < trows.length; r++) {
          if (y + rowH > ph - 160) {
            doc.addPage();
            y = 120; // Debajo del header global
            y = drawHeadCarta(y);
          }
          doc.rect(40, y, pw - 80, rowH).fill(r % 2 === 0 ? C.rowEven : C.rowOdd);
          let cx = 40;
          trows[r].forEach((cell) => {
            doc
              .fillColor(C.text)
              .font(FONT_NORMAL)
              .fontSize(8)
              .text(cell, cx + 5, y + 5, { width: colW - 10, height: 10, lineBreak: false });
            cx += colW;
          });
          doc
            .lineWidth(0.5)
            .strokeColor(C.line)
            .moveTo(40, y + rowH)
            .lineTo(pw - 40, y + rowH)
            .stroke();
          y += rowH;
        }

        // ── Totales ──
        const totalDias = asistencias.length;
        const totalHoras = asistencias.reduce((s, a) => s + (a.horasCumplidas || 0), 0);
        y += 10;
        doc
          .fillColor(C.brand)
          .fontSize(10)
          .font(FONT_BOLD)
          .text(`Total: ${totalDias} días  ·  ${totalHoras} horas cumplidas`, 40, y);

        // ── Firma ──
        y += 30;
        if (y > ph - 130) {
          doc.addPage();
          y = 120;
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
        console.error('Error en Carta de Aval:', err);
        reject(err);
      }
    })();
  });
};

// ─── Fetch Helper for Images (Photos and QRs) ────────────────────────────────
const fetchImageBuffer = async (url) => {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const arrayBuffer = await res.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (e) {
    console.error(`[fetchImageBuffer] Error fetching ${url}:`, e);
    return null;
  }
};

// ─── Draw Single Carnet Helper ───────────────────────────────────────────────
const drawSingleCarnet = async (
  doc,
  trabajador,
  originX,
  originY,
  cardW,
  cardH,
  logoImg,
  photoBuffer,
  qrBuffer
) => {
  const mmToPt = (mm) => mm * 2.83465;

  doc.save();

  // 1. Background
  doc.roundedRect(originX, originY, cardW, cardH, mmToPt(4)).fill('#FDF8F6');

  // 2. Left side bar
  const sideW = cardW * 0.35;
  doc.roundedRect(originX, originY, sideW, cardH, mmToPt(4)).fill('#800000');
  // Cover right border of side bar to keep it flat against content
  doc.rect(originX + sideW - mmToPt(4), originY, mmToPt(4), cardH).fill('#800000');

  // 3. Logo MAVET
  if (logoImg) {
    try {
      const logoSize = sideW * 0.3;
      doc.image(logoImg, originX + (sideW - logoSize) / 2, originY + mmToPt(3), {
        width: logoSize,
      });
    } catch (e) {
      console.error('Error drawing logo in carnet:', e);
    }
  }

  // 4. Photo circular centered
  const photoCenterX = originX + sideW / 2;
  const photoSize = sideW * 0.6;
  const photoY = originY + cardH / 2 - photoSize / 2 - mmToPt(4);

  // Gold border circle
  doc.circle(photoCenterX, photoY + photoSize / 2, photoSize / 2 + mmToPt(1.5)).fill('#C4985A');
  // Light grey circle background
  doc.circle(photoCenterX, photoY + photoSize / 2, photoSize / 2).fill('#F0F0F0');

  const drawInitials = (doc, t, pcX, pY, pSize) => {
    const name = t.nombres || t.nombre || '';
    const surname = t.apellidos || t.apellido || '';
    const iniciales = `${name.charAt(0) || ''}${surname.charAt(0) || ''}`.toUpperCase();
    doc
      .fillColor('#FFFFFF')
      .font(FONT_BOLD)
      .fontSize(pSize * 0.4)
      .text(iniciales || '?', pcX - 15, pY + pSize / 2 - 6, { width: 30, align: 'center' });
  };

  if (photoBuffer) {
    try {
      doc.save();
      doc.circle(photoCenterX, photoY + photoSize / 2, photoSize / 2).clip();
      doc.image(photoBuffer, photoCenterX - photoSize / 2, photoY, {
        width: photoSize,
        height: photoSize,
      });
      doc.restore();
    } catch (e) {
      console.error('Error drawing photo in carnet:', e);
      drawInitials(doc, trabajador, photoCenterX, photoY, photoSize);
    }
  } else {
    drawInitials(doc, trabajador, photoCenterX, photoY, photoSize);
  }

  // 5. Right side data
  const leftEdge = originX + sideW + mmToPt(3);
  const rightW = cardW - sideW - mmToPt(6);
  const textX = leftEdge + mmToPt(1);
  let y = originY + mmToPt(7);

  // Name
  const nombreCompleto =
    `${trabajador.nombres || trabajador.nombre || ''} ${trabajador.apellidos || trabajador.apellido || ''}`.trim();
  doc
    .fillColor('#800000')
    .font(FONT_BOLD)
    .fontSize(cardW * 0.065)
    .text(nombreCompleto, textX, y, { width: rightW, height: mmToPt(10) });

  y += mmToPt(4.5);

  // Cargo
  const cargoStr = trabajador.CargoTrabajador?.nombre_cargo || trabajador.cargo || 'TRABAJADOR';
  doc
    .fillColor('#C4985A')
    .font(FONT_BOLD)
    .fontSize(cardW * 0.048)
    .text(cargoStr.toUpperCase(), textX, y, { width: rightW, height: mmToPt(6) });

  y += mmToPt(5);

  // Separator
  doc
    .lineWidth(mmToPt(0.3))
    .strokeColor('#E8D5B0')
    .moveTo(textX, y)
    .lineTo(originX + cardW - mmToPt(3), y)
    .stroke();

  y += mmToPt(3.5);

  // Fields
  const fields = [
    { label: 'Cédula', value: trabajador.cedula || '—' },
    { label: 'Teléfono', value: trabajador.telefono || '—' },
    { label: 'Correo', value: trabajador.correo_personal || trabajador.correo || '—' },
  ];

  doc.fontSize(cardW * 0.038);
  fields.forEach((f) => {
    doc.fillColor('#8C8C8C').font(FONT_BOLD).text(`${f.label}: `, textX, y, { continued: true });
    doc.fillColor('#2D2D2D').font(FONT_NORMAL).text(f.value);
    y += mmToPt(3.8);
  });

  // 6. QR Code at bottom-right
  const qrSize = cardW * 0.12;
  const qrX = originX + cardW - qrSize - mmToPt(3);
  const qrY = originY + cardH - qrSize - mmToPt(3);

  if (qrBuffer) {
    try {
      doc
        .roundedRect(
          qrX - mmToPt(1.5),
          qrY - mmToPt(1.5),
          qrSize + mmToPt(3),
          qrSize + mmToPt(3),
          2
        )
        .stroke('#C4985A');
      doc.image(qrBuffer, qrX, qrY, { width: qrSize, height: qrSize });
    } catch (e) {
      console.error('Error drawing QR:', e);
    }
  }

  // 7. Dates
  const today = new Date();
  const fechaStr = today.toLocaleDateString('es-VE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  doc
    .fillColor('#8C8C8C')
    .font(FONT_NORMAL)
    .fontSize(cardW * 0.036);
  doc.text(`Emitido: ${fechaStr}`, textX, originY + cardH - mmToPt(7));
  doc.text('Válido: mientras dure la relación laboral', textX, originY + cardH - mmToPt(4));

  // 8. Outer border
  doc
    .roundedRect(originX, originY, cardW, cardH, mmToPt(4))
    .lineWidth(mmToPt(0.4))
    .strokeColor('#C4985A')
    .stroke();

  doc.restore();
};

// ─── Generar Carnet de Trabajador Individual ───────────────────────────────
const generateCarnetPdf = async (trabajador) => {
  return new Promise((resolve, reject) => {
    (async () => {
      try {
        const doc = new PDFDocument({
          margins: { top: 0, left: 0, right: 0, bottom: 0 },
          size: 'A4',
          layout: 'portrait',
          bufferPages: true,
          autoPageBreak: false,
        });
        const bufs = [];
        doc.on('data', bufs.push.bind(bufs));
        doc.on('end', () => resolve(Buffer.concat(bufs)));

        const pw = doc.page.width;
        const ph = doc.page.height;
        const mmToPt = (mm) => mm * 2.83465;

        const cardW = mmToPt(88);
        const cardH = mmToPt(56);
        const originX = (pw - cardW) / 2;
        const originY = (ph - cardH) / 2;

        // Fetch photo and QR buffers
        let photoBuffer = null;
        if (trabajador.foto_url && trabajador.foto_url.startsWith('http')) {
          photoBuffer = await fetchImageBuffer(trabajador.foto_url);
        }

        const nombreCompleto =
          `${trabajador.nombres || trabajador.nombre || ''} ${trabajador.apellidos || trabajador.apellido || ''}`.trim();
        const cargoStr =
          trabajador.CargoTrabajador?.nombre_cargo || trabajador.cargo || 'TRABAJADOR';
        const qrData = `MAVET|${trabajador.cedula || ''}|${nombreCompleto}|${cargoStr}`;
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrData)}`;
        const qrBuffer = await fetchImageBuffer(qrUrl);

        // Draw carnet centered
        await drawSingleCarnet(
          doc,
          trabajador,
          originX,
          originY,
          cardW,
          cardH,
          LOGO_IMG,
          photoBuffer,
          qrBuffer
        );

        doc.end();
      } catch (err) {
        console.error('Error generating individual carnet PDF:', err);
        reject(err);
      }
    })();
  });
};

// ─── Generar Credenciales Masivas ───────────────────────────────────────────
const generateCredencialesMasivasPdf = async (trabajadores) => {
  return new Promise((resolve, reject) => {
    (async () => {
      try {
        const doc = new PDFDocument({
          margins: { top: 0, left: 0, right: 0, bottom: 0 },
          size: 'A4',
          layout: 'portrait',
          bufferPages: true,
          autoPageBreak: false,
        });
        const bufs = [];
        doc.on('data', bufs.push.bind(bufs));
        doc.on('end', () => resolve(Buffer.concat(bufs)));

        const pw = doc.page.width;
        const ph = doc.page.height;
        const mmToPt = (mm) => mm * 2.83465;

        const cardW = mmToPt(75);
        const cardH = mmToPt(120);
        const gapX = (pw - cardW * 2) / 3;
        const gapY = (ph - cardH * 2) / 3;

        const positions = [
          { x: gapX, y: gapY },
          { x: gapX * 2 + cardW, y: gapY },
          { x: gapX, y: gapY * 2 + cardH },
          { x: gapX * 2 + cardW, y: gapY * 2 + cardH },
        ];

        for (let i = 0; i < trabajadores.length; i++) {
          const posIndex = i % 4;

          if (i > 0 && posIndex === 0) {
            doc.addPage();
          }

          if (posIndex === 0) {
            // Draw background for new page
            doc.rect(0, 0, pw, ph).fill('#FAF8F6');

            // Draw dotted cutting lines
            doc.save();
            doc.strokeColor('#C8C8C8').lineWidth(0.5).dash(3, { space: 3 });
            // Horizontal line
            doc
              .moveTo(10, ph / 2)
              .lineTo(pw - 10, ph / 2)
              .stroke();
            // Vertical line
            doc
              .moveTo(pw / 2, 10)
              .lineTo(pw / 2, ph - 10)
              .stroke();
            doc.restore();
          }

          const trabajador = trabajadores[i];
          const pos = positions[posIndex];

          // Fetch photo and QR buffers for this worker
          let photoBuffer = null;
          if (trabajador.foto_url && trabajador.foto_url.startsWith('http')) {
            photoBuffer = await fetchImageBuffer(trabajador.foto_url);
          }

          const nombreCompleto =
            `${trabajador.nombres || trabajador.nombre || ''} ${trabajador.apellidos || trabajador.apellido || ''}`.trim();
          const cargoStr =
            trabajador.CargoTrabajador?.nombre_cargo || trabajador.cargo || 'TRABAJADOR';
          const qrData = `MAVET|${trabajador.cedula || ''}|${nombreCompleto}|${cargoStr}`;
          const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrData)}`;
          const qrBuffer = await fetchImageBuffer(qrUrl);

          await drawSingleCarnet(
            doc,
            trabajador,
            pos.x,
            pos.y,
            cardW,
            cardH,
            LOGO_IMG,
            photoBuffer,
            qrBuffer
          );
        }

        doc.end();
      } catch (err) {
        console.error('Error generating mass credentials PDF:', err);
        reject(err);
      }
    })();
  });
};

// ─── Generar PDF del Código QR Público ───────────────────────────────────────
const generateQRPdf = async (publicUrl, qrBuffer) => {
  return new Promise((resolve, reject) => {
    (async () => {
      try {
        const doc = new PDFDocument({
          margins: { top: MARGIN, left: MARGIN, right: MARGIN, bottom: 15 },
          size: 'A4',
          layout: 'portrait',
          bufferPages: true,
          autoPageBreak: false,
        });
        const bufs = [];
        doc.on('data', bufs.push.bind(bufs));
        doc.on('end', () => resolve(Buffer.concat(bufs)));

        const pw = doc.page.width;
        const ph = doc.page.height;
        const mmToPt = (mm) => mm * 2.83465;

        // Draw header
        drawHeader(doc, 'CÓDIGO QR – AUTO INGRESO', pw);

        const qrSize = mmToPt(100);
        const xPos = (pw - qrSize) / 2;
        const yPos = mmToPt(55);

        // Shadow
        doc
          .rect(xPos - mmToPt(6), yPos + mmToPt(1), qrSize + mmToPt(12), qrSize + mmToPt(12))
          .fill(C.line || '#E4E4E4');

        // White background + border
        doc
          .rect(xPos - mmToPt(6), yPos - mmToPt(6), qrSize + mmToPt(12), qrSize + mmToPt(12))
          .fill(C.white || '#FFFFFF');
        doc
          .rect(xPos - mmToPt(6), yPos - mmToPt(6), qrSize + mmToPt(12), qrSize + mmToPt(12))
          .lineWidth(mmToPt(0.5))
          .stroke(C.brand || '#800000');

        if (qrBuffer) {
          doc.image(qrBuffer, xPos, yPos, { width: qrSize, height: qrSize });
        }

        doc
          .fillColor(C.textSoft || '#6B6B6B')
          .fontSize(9)
          .font(FONT_NORMAL)
          .text('O escanee el código QR o visite:', MARGIN, yPos + qrSize + mmToPt(14), {
            width: pw - 2 * MARGIN,
            align: 'center',
          });

        doc
          .fillColor(C.brand || '#800000')
          .fontSize(10)
          .font(FONT_BOLD)
          .text(publicUrl, MARGIN, yPos + qrSize + mmToPt(22), {
            width: pw - 2 * MARGIN,
            align: 'center',
          });

        doc
          .fillColor(C.text || '#2D2D2D')
          .fontSize(9)
          .font(FONT_NORMAL);
        const instructions = [
          '1. Abra la cámara de su teléfono y apunte al código QR.',
          '2. Toque el enlace que aparece en la pantalla.',
          '3. Complete sus datos personales y seleccione el motivo de su visita.',
          '4. ¡Listo! Su ingreso quedará registrado automáticamente.',
        ];
        let iy = yPos + qrSize + mmToPt(36);
        instructions.forEach((line) => {
          doc.text(line, mmToPt(28), iy);
          iy += mmToPt(7);
        });

        // Headers and footers
        drawHeadersAndFooters(doc, 'CÓDIGO QR – AUTO INGRESO', pw, MARGIN);

        doc.end();
      } catch (err) {
        console.error('Error generating QR PDF:', err);
        reject(err);
      }
    })();
  });
};

module.exports = {
  generateTablePdf,
  generateCartaAvalPdf,
  generateCarnetPdf,
  generateCredencialesMasivasPdf,
  generateQRPdf,
};
