const PDFDocument = require('pdfkit');

/**
 * Genera un PDF con formato de tabla y retorna el buffer.
 * 
 * @param {String} title - Título del reporte.
 * @param {Array} headers - Arreglo de strings o objetos para los encabezados de la tabla.
 * @param {Array} rows - Arreglo de arreglos con los datos de las filas.
 * @returns {Promise<Buffer>}
 */
const generateTablePdf = async (title, headers, rows) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 30, size: 'A4', layout: 'landscape', bufferPages: true });
      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      // --- ENCABEZADO DEL DOCUMENTO ---
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
      let y = 150;
      doc.rect(30, y - 5, doc.page.width - 60, 25).fill('#F5F8FC');
      doc.fillColor('#333333').fontSize(9).font('Helvetica-Bold');
      
      const columnWidths = [];
      const totalWidth = doc.page.width - 60;
      // Extract texts and widths if headers are objects
      const headerTexts = headers.map(h => typeof h === 'string' ? h : (h.label || h.property));
      
      // Calculate column widths
      let fixedWidth = 0;
      let fluidCols = 0;
      headers.forEach(h => {
        if (typeof h === 'object' && h.width) {
          fixedWidth += h.width;
          columnWidths.push(h.width);
        } else {
          columnWidths.push(null);
          fluidCols++;
        }
      });
      
      const fluidWidth = fluidCols > 0 ? (totalWidth - fixedWidth) / fluidCols : 0;
      columnWidths.forEach((w, i) => { if (!w) columnWidths[i] = fluidWidth; });

      // Draw Headers
      let currentX = 35;
      headerTexts.forEach((text, i) => {
        doc.text(text, currentX, y, { width: columnWidths[i] - 10 });
        currentX += columnWidths[i];
      });

      y += 25;
      doc.font('Helvetica').fontSize(8);

      // Draw Rows
      rows.forEach((row, rowIndex) => {
        if (y > doc.page.height - 80) { 
          doc.addPage();
          y = 50; 
        }
        
        if (rowIndex % 2 !== 0) {
            doc.rect(30, y - 5, doc.page.width - 60, 20).fill('#F5F8FC');
        }
        
        currentX = 35;
        row.forEach((text, i) => {
          doc.fillColor('#333333');
          doc.text(String(text).substring(0, 60), currentX, y, { width: columnWidths[i] - 10 });
          currentX += columnWidths[i];
        });
        
        doc.moveTo(30, y + 15).lineTo(doc.page.width - 30, y + 15).lineWidth(0.5).strokeColor('#E0E0E0').stroke();
        y += 20;
      });

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

      // Finalizar el documento
      doc.end();
    } catch (error) {
      console.error("Error generando PDF:", error);
      reject(error);
    }
  });
};

// ─── CARTA DE AVAL ──────────────────────────────────────────────────────────
const generateCartaAvalPdf = async (trabajador, asistencias) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40, size: 'A4', layout: 'portrait', bufferPages: true });
      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

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
      let y = doc.y;
      const headers = ['Fecha', 'Entrada Mañana', 'Salida Mañana', 'Entrada Tarde', 'Salida Tarde'];
      const columnWidth = (doc.page.width - 80) / headers.length;

      doc.rect(40, y - 5, doc.page.width - 80, 25).fill('#800000');
      doc.fillColor('#FFFFFF').fontSize(9).font('Helvetica-Bold');
      headers.forEach((h, i) => doc.text(h, 45 + (i * columnWidth), y, { width: columnWidth - 10 }));

      y += 25;
      doc.font('Helvetica').fontSize(8);
      
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

      rows.forEach((row, rowIndex) => {
        if (y > doc.page.height - 150) { 
          doc.addPage();
          y = 50; 
        }
        if (rowIndex % 2 !== 0) doc.rect(40, y - 5, doc.page.width - 80, 20).fill('#F5F8FC');
        row.forEach((text, i) => {
          doc.fillColor('#333333');
          doc.text(String(text).substring(0, 40), 45 + (i * columnWidth), y, { width: columnWidth - 10 });
        });
        doc.moveTo(40, y + 15).lineTo(doc.page.width - 40, y + 15).lineWidth(0.5).strokeColor('#E0E0E0').stroke();
        y += 20;
      });

      // --- FIRMA ---
      doc.moveDown(4);
      let firmaY = doc.y;
      if (firmaY > doc.page.height - 100) { doc.addPage(); firmaY = 50; }
      doc.moveTo(40, firmaY).lineTo(200, firmaY).stroke('#666666');
      doc.fontSize(10).font('Helvetica-Bold').fillColor('#000000').text('Firma Autorizada', 40, firmaY + 5);
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
    } catch (error) {
      console.error("Error dibujando la tabla de asistencia en Carta de Aval:", error);
      reject(error);
    }
  });
};

module.exports = {
  generateTablePdf,
  generateCartaAvalPdf
};
