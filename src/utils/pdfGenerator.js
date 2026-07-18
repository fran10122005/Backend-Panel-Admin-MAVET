/* global fetch */
const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');

// ─── Paleta de colores ─────────────────────────────────────────────────────
const C = {
  brand: '#800000',
  text: '#2D2D2D',
  textSoft: '#6B6B6B',
  textMuted: '#999999',
  line: '#D0D0D0',
  lineAccent: '#800000',
  rowEven: '#FFFFFF',
  rowOdd: '#F4F4F7',
  headerBg: '#800000',
  headerBgDark: '#6B0000',
  bodyBg: '#FFFFFF',
  accent: '#F5EDE8',
};

const MARGIN = 30;
const MARGIN_BOTTOM = 15;

const FONT_BOLD = 'Helvetica-Bold';
const FONT_NORMAL = 'Helvetica';

const LOGO_PATH = path.join(__dirname, '../../public/images/logo/mavet2.png');
const LOGO_IMG = fs.readFileSync(LOGO_PATH);

// ─── Font resolution (Arial for better Spanish support) ────────────────────
function resolveFonts(doc) {
  const candidates = [
    { normal: 'C:\\Windows\\Fonts\\arial.ttf', bold: 'C:\\Windows\\Fonts\\arialbd.ttf' },
    { normal: 'C:\\Windows\\Fonts\\Arial.ttf', bold: 'C:\\Windows\\Fonts\\Arialbd.ttf' },
  ];
  for (const c of candidates) {
    try {
      if (fs.existsSync(c.normal)) {
        doc.registerFont('_F', c.normal);
        doc.registerFont('_FB', fs.existsSync(c.bold) ? c.bold : c.normal);
        return { normal: '_F', bold: '_FB' };
      }
    } catch {}
  }
  return { normal: 'Helvetica', bold: 'Helvetica-Bold' };
}

function createDocument(overrides = {}) {
  return new PDFDocument({
    margins: { top: MARGIN, left: MARGIN, right: MARGIN, bottom: MARGIN_BOTTOM },
    size: 'A4',
    layout: 'portrait',
    bufferPages: true,
    autoPageBreak: false,
    ...overrides,
  });
}

function collectBuffer(doc) {
  return new Promise((resolve, reject) => {
    const bufs = [];
    doc.on('data', (d) => bufs.push(d));
    doc.on('end', () => resolve(Buffer.concat(bufs)));
  });
}

// ─── Encabezado institucional ───────────────────────────────────────────────
function drawHeader(doc, title, pw, F, logoSize) {
  const margin = MARGIN;
  const ls = logoSize || 42;
  let logoWidth = 0;

  try {
    doc.image(LOGO_IMG, margin, 12, { width: ls });
    logoWidth = ls + 6;
  } catch (e) {}

  const tx = margin + logoWidth;
  const textW = pw - tx - margin;

  doc
    .fillColor(C.text)
    .font(F.bold)
    .fontSize(11)
    .text('MUSEO DE ARTES VISUALES DEL ESTADO TÁCHIRA', tx, 14, {
      width: textW,
      lineBreak: false,
    });

  doc
    .fillColor(C.brand)
    .font(F.bold)
    .fontSize(10)
    .text(title, tx, 34, { width: textW, lineBreak: false });

  const barY = 56;
  doc
    .lineWidth(2)
    .strokeColor(C.brand)
    .moveTo(margin, barY)
    .lineTo(pw - margin, barY)
    .stroke();
  doc
    .lineWidth(0.5)
    .strokeColor(C.lineAccent)
    .moveTo(margin, barY + 2.5)
    .lineTo(pw - margin, barY + 2.5)
    .stroke();
}

// ─── Encabezados y Pies de página ──────────────────────────────────────────
function drawHeadersAndFooters(doc, title, pw, F, margin = MARGIN) {
  const range = doc.bufferedPageRange();
  for (let i = 0; i < range.count; i++) {
    doc.switchToPage(i);
    drawHeader(doc, title, pw, F, 48);
    const h = doc.page.height;
    doc
      .lineWidth(0.3)
      .strokeColor(C.line)
      .moveTo(margin, h - 34)
      .lineTo(pw - margin, h - 34)
      .stroke();
    const today = new Date().toLocaleDateString('es-VE', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
    doc
      .fontSize(7)
      .fillColor(C.textMuted)
      .font(F.normal)
      .text(today, margin, h - 26, { lineBreak: false })
      .text(`Pág. ${i + 1} de ${range.count}`, margin, h - 26, {
        width: pw - 2 * margin,
        align: 'right',
        lineBreak: false,
      });
  }
}

// ─── Generar PDF con tabla ─────────────────────────────────────────────────
const generateTablePdf = async (title, headers, rows, signatureLabel) => {
  return new Promise((resolve, reject) => {
    (async () => {
      try {
        const doc = createDocument({ layout: 'landscape' });
        const F = resolveFonts(doc);
        const [pw, ph] = [doc.page.width, doc.page.height];
        const promise = collectBuffer(doc);
        promise.then(resolve, reject);

        const tableHeaders = headers.map((h, i) => {
          if (typeof h === 'string') return { label: h, width: 100, align: 'left' };
          return { label: h.label || `col_${i}`, width: h.width || 100, align: h.align || 'left' };
        });

        let y = 80;
        const rowH = 20;
        const m = MARGIN;
        const tblW = pw - 2 * m;

        // ── Grid: left + top border ──
        function strokeCell(x, yy, w, hh) {
          doc.lineWidth(0.4).strokeColor(C.line)
            .moveTo(x, yy).lineTo(x + w, yy).stroke()
            .moveTo(x, yy).lineTo(x, yy + hh).stroke();
        }

        const drawTableHead = (cy) => {
          doc.rect(m, cy, tblW, rowH).fill(C.headerBg);
          let cx = m;
          tableHeaders.forEach((h) => {
            strokeCell(cx, cy, h.width, rowH);
            doc.fillColor('#FFFFFF').font(F.bold).fontSize(8.5);
            doc.text(h.label, cx + 5, cy + 5, {
              width: h.width - 10,
              align: h.align,
              lineBreak: false,
            });
            cx += h.width;
          });
          // right border
          doc.lineWidth(0.4).strokeColor(C.line)
            .moveTo(cx, cy).lineTo(cx, cy + rowH).stroke();
          return cy + rowH;
        };

        const drawRow = (rowArr, cy, odd) => {
          doc.rect(m, cy, tblW, rowH).fill(odd ? C.rowOdd : C.rowEven);
          let cx = m;
          tableHeaders.forEach((h, i) => {
            strokeCell(cx, cy, h.width, rowH);
            const val = rowArr[i] != null ? String(rowArr[i]) : '';
            doc.fillColor(C.text).font(F.normal).fontSize(7.5);
            doc.text(val, cx + 5, cy + 5, {
              width: h.width - 10,
              align: h.align,
              lineBreak: false,
            });
            cx += h.width;
          });
          doc.lineWidth(0.4).strokeColor(C.line)
            .moveTo(cx, cy).lineTo(cx, cy + rowH).stroke();
          // bottom
          doc.lineWidth(0.4).strokeColor(C.line)
            .moveTo(m, cy + rowH).lineTo(pw - m, cy + rowH).stroke();
        };

        y = drawTableHead(y);

        for (let r = 0; r < rows.length; r++) {
          if (y + rowH > ph - m - 20) {
            doc.addPage();
            y = m + 60;
            y = drawTableHead(y);
          }
          drawRow(rows[r], y, r % 2 === 1);
          y += rowH;
        }

        // ── Firma centrada ──
        y += 30;
        if (y > ph - 100) {
          doc.addPage();
          y = m + 60;
        }
        const sigW = 260;
        const sigX = (pw - sigW) / 2;
        doc.lineWidth(0.5).strokeColor(C.text)
          .moveTo(sigX, y).lineTo(sigX + sigW, y).stroke();
        doc.fillColor(C.text).font(F.bold).fontSize(10)
          .text(signatureLabel || 'Coordinador(a) MAVET', sigX, y + 6, {
            width: sigW, align: 'center',
          });
        doc.fontSize(9).font(F.normal)
          .text('Firma Autorizada', sigX, y + 20, { width: sigW, align: 'center' });

        // ── Sello a la derecha ──
        const sx = pw - m - 40, sy2 = y - 5;
        doc.lineWidth(0.6).strokeColor(C.brand).circle(sx, sy2, 18).stroke();
        doc.fontSize(6.5).font(F.bold).fillColor(C.brand)
          .text('MAVET', sx, sy2 - 4, { align: 'center' });
        doc.fontSize(4.5).font(F.normal)
          .text('MUSEO DE', sx, sy2 + 3, { align: 'center' })
          .text('ARTES VISUALES', sx, sy2 + 8, { align: 'center' })
          .text('DEL TÁCHIRA', sx, sy2 + 13, { align: 'center' });

        drawHeadersAndFooters(doc, title, pw, F, m);

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
        const doc = createDocument({
          margins: { top: 40, left: 40, right: 40, bottom: MARGIN_BOTTOM },
        });
        const F = resolveFonts(doc);
        const pw = doc.page.width;
        const ph = doc.page.height;
        const promise = collectBuffer(doc);
        promise.then(resolve, reject);
        const fechaHoy = new Date().toLocaleDateString('es-VE', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });

        doc
          .fillColor(C.textSoft)
          .fontSize(9)
          .font(F.normal)
          .text(`Emitida el: ${fechaHoy}`, 78, 82);
        doc
          .lineWidth(0.4)
          .strokeColor(C.line)
          .moveTo(40, 97)
          .lineTo(pw - 40, 97)
          .stroke();

        doc.x = 40;
        doc.y = 112;
        doc.fillColor(C.text).fontSize(11).font(F.normal);
        doc.text(
          'Quien suscribe, Director del Museo de Artes Visuales del Estado Táchira (MAVET), hace constar mediante la presente que:',
          { align: 'justify' }
        );
        doc.moveDown(1.2);

        // ── Recuadro del trabajador ──
        const cy = doc.y;
        const boxH = 80;
        doc.rect(40, cy, pw - 80, boxH).fill(C.accent);
        doc.rect(40, cy, 4, boxH).fill(C.brand);

        const cargo = trabajador.CargoTrabajador?.nombre_cargo || trabajador.cargo || '—';
        const nombre = `${trabajador.nombres || ''} ${trabajador.apellidos || ''}`
          .trim()
          .toUpperCase();

        doc
          .fillColor(C.brand)
          .fontSize(15)
          .font(F.bold)
          .text(nombre, 56, cy + 14);
        doc
          .fillColor(C.text)
          .fontSize(9.5)
          .font(F.normal)
          .text(`Cédula: ${trabajador.cedula || '—'}    Cargo: ${cargo}`, 56, cy + 34)
          .text(
            `Estado: ${trabajador.estado || 'Activo'}    Correo: ${trabajador.correo || '—'}    Tel: ${trabajador.telefono || '—'}`,
            56,
            cy + 48,
            { width: pw - 110 }
          );

        doc.x = 40;
        doc.y = cy + boxH + 22;
        doc.fillColor(C.text).fontSize(11).font(F.normal);
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
              .font(F.bold)
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
              .font(F.normal)
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
          .font(F.bold)
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
          .font(F.bold)
          .text('Director(a) MAVET', 40, y + 6);
        doc
          .fontSize(9)
          .font(F.normal)
          .text('Firma Autorizada', 40, y + 20);

        // ── Sello ──
        const sx = pw - 65,
          sy = y - 8;
        doc.lineWidth(0.6).strokeColor(C.brand).circle(sx, sy, 18).stroke();
        doc
          .fontSize(6.5)
          .font(F.bold)
          .fillColor(C.brand)
          .text('MAVET', sx, sy - 4, { align: 'center' });
        doc
          .fontSize(4.5)
          .font(F.normal)
          .text('MUSEO DE', sx, sy + 3, { align: 'center' })
          .text('ARTES VISUALES', sx, sy + 8, { align: 'center' })
          .text('DEL TÁCHIRA', sx, sy + 13, { align: 'center' });

        drawHeadersAndFooters(doc, 'CARTA DE AVAL', pw, F, MARGIN);
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

  // 1. Background (off-white)
  doc.roundedRect(originX, originY, cardW, cardH, mmToPt(3)).fill('#FFFDFB');

  // Outer gold border
  doc
    .roundedRect(originX, originY, cardW, cardH, mmToPt(3))
    .lineWidth(mmToPt(0.6))
    .strokeColor('#C4985A')
    .stroke();

  // Draw faint watermark behind everything
  if (logoImg) {
    try {
      doc.save();
      doc.opacity(0.06);
      const wmSize = cardW * 0.7;
      doc.image(
        logoImg,
        originX + (cardW - wmSize) / 2,
        originY + (cardH - wmSize) / 2 - mmToPt(10),
        { width: wmSize }
      );
      // Watermark text MAVET
      doc
        .opacity(0.04)
        .fillColor('#800000')
        .fontSize(cardW * 0.25)
        .font(FONT_BOLD);
      doc.text('MAVET', originX, originY + cardH / 2 - mmToPt(5), {
        width: cardW,
        align: 'center',
      });
      doc.restore();
    } catch (e) {
      console.error('Error drawing watermark:', e);
    }
  }

  // 2. Header
  const headerY = originY + mmToPt(3);
  const logoW = mmToPt(11);
  const leftPad = originX + mmToPt(2);

  if (logoImg) {
    try {
      doc.image(logoImg, leftPad, headerY, { width: logoW });
    } catch (e) {
      /* ignore */
    }
  }

  const textX = leftPad + logoW + mmToPt(1.5);
  const textW = cardW - textX - mmToPt(2);

  doc.fillColor('#800000').font(FONT_BOLD).fontSize(mmToPt(2.5));
  doc.text('MUSEO DE ARTES VISUALES', textX, headerY + mmToPt(1.5), { width: textW });

  doc.fillColor('#C4985A').font(FONT_BOLD).fontSize(mmToPt(1.8));
  doc.text('ESTADO TÁCHIRA', textX, headerY + mmToPt(4.5), { width: textW });

  // Horizontal gold line
  const lineY = headerY + mmToPt(9);
  doc
    .moveTo(leftPad, lineY)
    .lineTo(originX + cardW - mmToPt(3), lineY)
    .lineWidth(mmToPt(0.3))
    .strokeColor('#C4985A')
    .stroke();

  // 3. Photo or Initials
  const photoSize = mmToPt(22);
  const photoCenterX = originX + cardW / 2;
  const photoCenterY = lineY + mmToPt(3) + photoSize / 2;

  // Gold ring around photo
  doc
    .circle(photoCenterX, photoCenterY, photoSize / 2 + mmToPt(1))
    .lineWidth(mmToPt(0.6))
    .strokeColor('#C4985A')
    .stroke();

  if (photoBuffer) {
    try {
      doc.save();
      doc.circle(photoCenterX, photoCenterY, photoSize / 2).clip();
      doc.image(photoBuffer, photoCenterX - photoSize / 2, photoCenterY - photoSize / 2, {
        width: photoSize,
        height: photoSize,
      });
      doc.restore();
    } catch (e) {
      photoBuffer = null;
    }
  }

  if (!photoBuffer) {
    doc.circle(photoCenterX, photoCenterY, photoSize / 2).fill('#FFFFFF');
    const name = trabajador.nombres || trabajador.nombre || '';
    const surname = trabajador.apellidos || trabajador.apellido || '';
    const iniciales = `${name.charAt(0) || ''}${surname.charAt(0) || ''}`.toUpperCase();
    doc
      .fillColor('#800000')
      .font(FONT_BOLD)
      .fontSize(photoSize * 0.45);
    doc.text(iniciales || '?', originX, photoCenterY - (photoSize * 0.45) / 3, {
      width: cardW,
      align: 'center',
    });
  }

  // 4. Texts under photo
  let currentY = photoCenterY + photoSize / 2 + mmToPt(1.5);

  // Cargo
  const cargoStr = trabajador.CargoTrabajador?.nombre_cargo || trabajador.cargo || 'TRABAJADOR';
  doc.fillColor('#C4985A').font(FONT_BOLD).fontSize(mmToPt(2.5));
  doc.text(cargoStr.toUpperCase(), originX, currentY, { width: cardW, align: 'center' });
  currentY += mmToPt(3.5);

  // Nombre
  const nombreStr = (trabajador.nombres || trabajador.nombre || '').split(' ')[0];
  const apellidoStr = (trabajador.apellidos || trabajador.apellido || '').split(' ')[0];
  const fullName = `${nombreStr} ${apellidoStr}`.trim().toUpperCase();
  doc.fillColor('#000000').font(FONT_BOLD).fontSize(mmToPt(4));
  doc.text(fullName, originX, currentY, { width: cardW, align: 'center' });
  currentY += mmToPt(5);

  // Cedula
  doc.fillColor('#444444').font(FONT_BOLD).fontSize(mmToPt(2.8));
  doc.text(`C.I: ${trabajador.cedula || '—'}`, originX, currentY, {
    width: cardW,
    align: 'center',
  });

  // 5. QR Code
  const qrSize = mmToPt(21);
  const qrY = originY + cardH - mmToPt(12) - qrSize;
  const qrX = originX + (cardW - qrSize) / 2;

  if (qrBuffer) {
    try {
      doc
        .roundedRect(
          qrX - mmToPt(1.5),
          qrY - mmToPt(1.5),
          qrSize + mmToPt(3),
          qrSize + mmToPt(3),
          mmToPt(2)
        )
        .lineWidth(mmToPt(0.4))
        .strokeColor('#C4985A')
        .stroke();
      doc.image(qrBuffer, qrX, qrY, { width: qrSize, height: qrSize });
    } catch (e) {
      /* ignore */
    }
  }

  // Validity
  const today = new Date();
  const validYear = today.getFullYear();
  const nextYear = validYear + 1;
  doc.fillColor('#888888').font(FONT_NORMAL).fontSize(mmToPt(2.8));
  doc.text(`VÁLIDO ${validYear} - ${nextYear}`, originX, originY + cardH - mmToPt(9), {
    width: cardW,
    align: 'center',
  });

  // 6. Footer bar
  const footerH = mmToPt(6);
  doc.save();
  doc.roundedRect(originX, originY, cardW, cardH, mmToPt(3)).clip();
  doc.rect(originX, originY + cardH - footerH, cardW, footerH).fill('#800000');
  doc.restore();

  // Footer text
  doc.fillColor('#FFFFFF').font(FONT_BOLD).fontSize(mmToPt(2.5));
  doc.text('MUSEO DE ARTES VISUALES', originX, originY + cardH - mmToPt(4.5), {
    width: cardW,
    align: 'center',
  });

  // Re-draw outer border on top just to be clean
  doc
    .roundedRect(originX, originY, cardW, cardH, mmToPt(3))
    .lineWidth(mmToPt(0.6))
    .strokeColor('#C4985A')
    .stroke();

  doc.restore();
};

const drawSingleCarnetBack = async (doc, originX, originY, cardW, cardH, logoImg) => {
  const mmToPt = (mm) => mm * 2.83465;
  doc.save();

  // Background and border
  doc.roundedRect(originX, originY, cardW, cardH, mmToPt(3)).fill('#FFFDFB');
  doc
    .roundedRect(originX, originY, cardW, cardH, mmToPt(3))
    .lineWidth(mmToPt(0.6))
    .strokeColor('#C4985A')
    .stroke();

  // Watermark
  if (logoImg) {
    try {
      doc.save();
      doc.opacity(0.06);
      const wmSize = cardW * 0.7;
      doc.image(
        logoImg,
        originX + (cardW - wmSize) / 2,
        originY + (cardH - wmSize) / 2 - mmToPt(10),
        { width: wmSize }
      );
      doc
        .opacity(0.04)
        .fillColor('#800000')
        .fontSize(cardW * 0.25)
        .font(FONT_BOLD);
      doc.text('MAVET', originX, originY + cardH / 2 - mmToPt(5), {
        width: cardW,
        align: 'center',
      });
      doc.restore();
    } catch (e) {
      /* ignore */
    }
  }

  // Header Logo smaller on top center
  if (logoImg) {
    try {
      const logoW = mmToPt(16);
      doc.image(logoImg, originX + (cardW - logoW) / 2, originY + mmToPt(6), { width: logoW });
    } catch (e) {
      /* ignore */
    }
  }

  // Texts
  let y = originY + mmToPt(24);
  const cx = originX + mmToPt(4);
  const innerW = cardW - mmToPt(8);

  doc.fillColor('#800000').font(FONT_BOLD).fontSize(mmToPt(2.3));
  let str = 'ESTA CREDENCIAL ES PROPIEDAD DEL';
  doc.text(str, cx, y, { width: innerW, align: 'center' });
  y += doc.heightOfString(str, { width: innerW, align: 'center' }) + mmToPt(0.5);

  doc.fillColor('#C4985A').fontSize(mmToPt(2.2));
  str = 'MUSEO DE ARTES VISUALES DEL ESTADO TÁCHIRA';
  doc.text(str, cx, y, { width: innerW, align: 'center' });
  y += doc.heightOfString(str, { width: innerW, align: 'center' }) + mmToPt(1.5);

  doc.fillColor('#444444').font(FONT_NORMAL).fontSize(mmToPt(1.8));
  str = 'Es de uso personal e intransferible y acredita al portador en el cargo mencionado.';
  doc.text(str, cx, y, { width: innerW, align: 'center' });
  y += doc.heightOfString(str, { width: innerW, align: 'center' }) + mmToPt(3);

  doc.text('En caso de emergencia avisar a:', cx, y, { width: innerW, align: 'left' });
  y += mmToPt(3.5);
  doc.text('Nombre: ________________________', cx, y);
  y += mmToPt(3.5);
  doc.text('Tel: ___________________________', cx, y);
  y += mmToPt(3.5);
  doc.text('Tipo de sangre: _______', cx, y);

  y += mmToPt(5);
  str = 'En caso de extravío devolver a:';
  doc.text(str, cx, y, { width: innerW, align: 'center' });
  y += doc.heightOfString(str, { width: innerW, align: 'center' }) + mmToPt(1);

  str = 'Carrera 6 con calle 4, Casona 25\nCentro, San Cristóbal, Táchira';
  doc.text(str, cx, y, { width: innerW, align: 'center', lineGap: mmToPt(0.5) });

  // Signatures
  const sigY = originY + cardH - mmToPt(6);
  const sigW = mmToPt(18);
  doc
    .moveTo(originX + mmToPt(4), sigY)
    .lineTo(originX + mmToPt(4) + sigW, sigY)
    .lineWidth(mmToPt(0.3))
    .strokeColor('#888888')
    .stroke();
  doc
    .moveTo(originX + cardW - mmToPt(4) - sigW, sigY)
    .lineTo(originX + cardW - mmToPt(4), sigY)
    .stroke();

  doc.fontSize(mmToPt(1.6)).fillColor('#666666');
  doc.text('Firma del Titular', originX + mmToPt(4), sigY + mmToPt(1), {
    width: sigW,
    align: 'center',
  });
  doc.text('Dirección General', originX + cardW - mmToPt(4) - sigW, sigY + mmToPt(1), {
    width: sigW,
    align: 'center',
  });

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

        const cardW = mmToPt(54);
        const cardH = mmToPt(86);
        const gap = mmToPt(10);
        const totalW = cardW * 2 + gap;
        const originX = (pw - totalW) / 2;
        const originY = (ph - cardH) / 2;

        // Fetch photo and QR buffers
        let photoBuffer = null;
        if (trabajador.foto_url && trabajador.foto_url.startsWith('http')) {
          const safePhotoUrl = trabajador.foto_url.replace(/\.[^/.]+$/, '.jpg');
          photoBuffer = await fetchImageBuffer(safePhotoUrl);
        }

        const nombreCompleto =
          `${trabajador.nombres || trabajador.nombre || ''} ${trabajador.apellidos || trabajador.apellido || ''}`.trim();
        const cargoStr =
          trabajador.CargoTrabajador?.nombre_cargo || trabajador.cargo || 'TRABAJADOR';
        const qrData = `MAVET|${trabajador.cedula || ''}|${nombreCompleto}|${cargoStr}`;
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&color=800000&data=${encodeURIComponent(qrData)}`;
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

        // Draw back of carnet next to it
        await drawSingleCarnetBack(doc, originX + cardW + gap, originY, cardW, cardH, LOGO_IMG);

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

        const cardW = mmToPt(54);
        const cardH = mmToPt(86);
        const gapX = (pw - cardW * 2) / 3;
        const gapY = (ph - cardH * 2) / 3;

        const positions = [
          { x: gapX, y: gapY },
          { x: gapX * 2 + cardW, y: gapY },
          { x: gapX, y: gapY * 2 + cardH },
          { x: gapX * 2 + cardW, y: gapY * 2 + cardH },
        ];

        for (let pageIdx = 0; pageIdx < Math.ceil(trabajadores.length / 4); pageIdx++) {
          if (pageIdx > 0) doc.addPage();

          // ── Draw Front Page ──
          doc.rect(0, 0, pw, ph).fill('#FAF8F6');
          doc.save();
          doc.strokeColor('#C8C8C8').lineWidth(0.5).dash(3, { space: 3 });
          doc
            .moveTo(10, ph / 2)
            .lineTo(pw - 10, ph / 2)
            .stroke();
          doc
            .moveTo(pw / 2, 10)
            .lineTo(pw / 2, ph - 10)
            .stroke();
          doc.restore();

          const pageWorkers = trabajadores.slice(pageIdx * 4, pageIdx * 4 + 4);

          for (let i = 0; i < pageWorkers.length; i++) {
            const trabajador = pageWorkers[i];
            const pos = positions[i];

            let photoBuffer = null;
            if (trabajador.foto_url && trabajador.foto_url.startsWith('http')) {
              const safePhotoUrl = trabajador.foto_url.replace(/\.[^/.]+$/, '.jpg');
              photoBuffer = await fetchImageBuffer(safePhotoUrl);
            }
            const nombreCompleto =
              `${trabajador.nombres || trabajador.nombre || ''} ${trabajador.apellidos || trabajador.apellido || ''}`.trim();
            const cargoStr =
              trabajador.CargoTrabajador?.nombre_cargo || trabajador.cargo || 'TRABAJADOR';
            const qrData = `MAVET|${trabajador.cedula || ''}|${nombreCompleto}|${cargoStr}`;
            const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&color=800000&data=${encodeURIComponent(qrData)}`;
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

          // ── Draw Back Page (for double-sided printing) ──
          doc.addPage();
          doc.rect(0, 0, pw, ph).fill('#FAF8F6');
          doc.save();
          doc.strokeColor('#C8C8C8').lineWidth(0.5).dash(3, { space: 3 });
          doc
            .moveTo(10, ph / 2)
            .lineTo(pw - 10, ph / 2)
            .stroke();
          doc
            .moveTo(pw / 2, 10)
            .lineTo(pw / 2, ph - 10)
            .stroke();
          doc.restore();

          for (let i = 0; i < pageWorkers.length; i++) {
            // Mirror positions horizontally: index 0 (top-left) goes to index 1 (top-right), 1->0, 2->3, 3->2
            const mirroredIndex = i % 2 === 0 ? i + 1 : i - 1;
            const pos = positions[mirroredIndex];
            await drawSingleCarnetBack(doc, pos.x, pos.y, cardW, cardH, LOGO_IMG);
          }
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
        const doc = createDocument();
        const F = resolveFonts(doc);
        const pw = doc.page.width;
        const promise = collectBuffer(doc);
        promise.then(resolve, reject);
        const ph = doc.page.height;
        const mmToPt = (mm) => mm * 2.83465;

        // Draw header
        drawHeader(doc, 'CÓDIGO QR – AUTO INGRESO', pw, F, 48);

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
          .font(F.normal)
          .text('O escanee el código QR o visite:', MARGIN, yPos + qrSize + mmToPt(14), {
            width: pw - 2 * MARGIN,
            align: 'center',
          });

        doc
          .fillColor(C.brand || '#800000')
          .fontSize(10)
          .font(F.bold)
          .text(publicUrl, MARGIN, yPos + qrSize + mmToPt(22), {
            width: pw - 2 * MARGIN,
            align: 'center',
          });

        doc
          .fillColor(C.text || '#2D2D2D')
          .fontSize(9)
          .font(F.normal);
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
        drawHeadersAndFooters(doc, 'CÓDIGO QR – AUTO INGRESO', pw, F, MARGIN);

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
