const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');
const { PassThrough } = require('stream');
const AppError = require('../../../utils/AppError');

const LOGO_PATH = path.join(__dirname, '../../../../public/images/logo/mavet2.png');
const LOGO_IMG = fs.readFileSync(LOGO_PATH);

// Export inscripciones for a specific taller in PDF or Excel
const exportInscripciones = async (tallerId, format) => {
  // Fetch all detailed inscripciones and filter by taller
  const allInscripciones = await getInscripcionesConDetalles();
  const filtered = allInscripciones.filter((ins) => ins.Taller && ins.Taller.id_taller == tallerId);

  if (format === 'excel') {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Inscripciones');
    // Define columns
    worksheet.columns = [
      { header: 'Alumno', key: 'alumno', width: 30 },
      { header: 'Representante', key: 'representante', width: 30 },
      { header: 'Fecha Inscripción', key: 'fecha', width: 20 },
    ];
    // Add rows
    filtered.forEach((ins) => {
      const alumnoName = ins.Alumno
        ? `${ins.Alumno.nombres || ''} ${ins.Alumno.apellidos || ''}`.trim()
        : '-';
      const repName = ins.Representante
        ? `${ins.Representante.nombres || ''} ${ins.Representante.apellidos || ''}`.trim()
        : '-';
      const fecha = ins.fecha_inscripcion
        ? new Date(ins.fecha_inscripcion).toLocaleDateString()
        : '-';
      worksheet.addRow({ alumno: alumnoName, representante: repName, fecha });
    });
    const buffer = await workbook.xlsx.writeBuffer();
    const filename = `Inscripciones_Taller_${tallerId}_${new Date().toISOString().split('T')[0]}.xlsx`;
    const mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    return { buffer, filename, mimeType };
  } else if (format === 'pdf') {
    const doc = new PDFDocument({ margin: 30, size: 'A4' });
    const stream = new PassThrough();
    doc.pipe(stream);

    const MAVET_HEX = '#800000';
    const GRAY_MED = '#666666';
    const GRAY_LIGHT = '#999999';
    const HEADER_BG = '#7C0F0F';
    const PAGE_W = doc.page.width;

    // ── Encabezado institucional ──
    doc.rect(0, 0, PAGE_W, 70).fill(HEADER_BG);
    doc.rect(0, 68, PAGE_W, 3).fill(MAVET_HEX);
    try {
      doc.image(LOGO_IMG, 15, 8, { width: 50 });
    } catch (_e) {
      /* Logo no disponible */
    }
    doc
      .fillColor('#FFFFFF')
      .fontSize(16)
      .font('Helvetica-Bold')
      .text('MUSEO DE ARTES VISUALES DEL ESTADO TÁCHIRA', 75, 15);
    doc.fontSize(10).font('Helvetica').text('MAVET – Sistema de Gestión Interna', 75, 35);
    doc.fontSize(13).font('Helvetica-Bold').text(`Inscripciones — Taller #${tallerId}`, 75, 52);

    // ── Fecha ──
    doc.fillColor(GRAY_MED).fontSize(9).font('Helvetica');
    const fechaGen = new Date().toLocaleDateString('es-VE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    doc.text(`Generado el: ${fechaGen}`, 30, 85);

    // ── Tabla ──
    const tableHeaders = ['Alumno', 'Representante', 'Fecha Inscripción'];
    const colW = (PAGE_W - 60) / 3;
    let y = 110;

    doc.rect(30, y, PAGE_W - 60, 22).fill(MAVET_HEX);
    doc.fillColor('#FFFFFF').fontSize(9).font('Helvetica-Bold');
    tableHeaders.forEach((h, i) => doc.text(h, 35 + i * colW, y + 6, { width: colW - 10 }));
    y += 22;

    filtered.forEach((ins, idx) => {
      if (y > 720) {
        doc.addPage();
        y = 50;
      }
      const alumnoName = ins.Alumno
        ? `${ins.Alumno.nombres || ''} ${ins.Alumno.apellidos || ''}`.trim()
        : '-';
      const repName = ins.Representante
        ? `${ins.Representante.nombres || ''} ${ins.Representante.apellidos || ''}`.trim()
        : '-';
      const fecha = ins.fecha_inscripcion
        ? new Date(ins.fecha_inscripcion).toLocaleDateString()
        : '-';
      if (idx % 2 !== 0) doc.rect(30, y, PAGE_W - 60, 18).fill('#F9F5F5');
      doc.fillColor('#333333').fontSize(8).font('Helvetica');
      [alumnoName, repName, fecha].forEach((text, i) =>
        doc.text(String(text).substring(0, 50), 35 + i * colW, y + 5, { width: colW - 10 })
      );
      doc
        .moveTo(30, y + 17.5)
        .lineTo(PAGE_W - 30, y + 17.5)
        .lineWidth(0.3)
        .strokeColor('#E8E8E8')
        .stroke();
      y += 18;
    });

    // ── Pie ──
    const pages = doc.bufferedPageRange();
    for (let i = 0; i < pages.count; i++) {
      doc.switchToPage(i);
      const w = doc.page.width;
      const h = doc.page.height;
      doc
        .lineWidth(0.4)
        .strokeColor(MAVET_HEX)
        .moveTo(30, h - 35)
        .lineTo(w - 30, h - 35)
        .stroke();
      doc
        .fontSize(7)
        .fillColor(GRAY_LIGHT)
        .font('Helvetica')
        .text(`Página ${i + 1} de ${pages.count}`, w / 2, h - 28, { align: 'center' })
        .text('MAVET – Documento de uso interno', w - 30, h - 28, { align: 'right' });
    }

    doc.end();
    const chunks = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);
    const filename = `Inscripciones_Taller_${tallerId}_${new Date().toISOString().split('T')[0]}.pdf`;
    const mimeType = 'application/pdf';
    return { buffer, filename, mimeType };
  }
  throw new Error('Formato no soportado');
};

const sequelize = require('../../../config/db');
const {
  InscripcionTaller,
  Taller,
  Alumno,
  Persona,
  AlumnoRepresentante,
  Representante,
} = require('../../../models');
const { normalizeCedula } = require('../../../utils/cedula');

const getInscripcionesConDetalles = async () => {
  const inscripciones = await InscripcionTaller.findAll();

  const result = [];
  for (let ins of inscripciones) {
    const taller = await Taller.findByPk(ins.id_taller);
    const alumno = await Alumno.findByPk(ins.id_alumno);
    let alumnoPersona = null;
    let representante = null;
    if (alumno) {
      alumnoPersona = await Persona.findByPk(alumno.id_persona);
      const vinculo = await AlumnoRepresentante.findOne({ where: { id_alumno: alumno.id_alumno } });
      if (vinculo) {
        const repRole = await Representante.findByPk(vinculo.id_representante);
        if (repRole) {
          const repPersona = await Persona.findByPk(repRole.id_persona);
          representante = repPersona;
        }
      }
    }
    result.push({
      ...ins.toJSON(),
      Alumno: alumnoPersona,
      Taller: taller,
      Representante: representante,
    });
  }
  return result;
};

const inscribirAlumno = async (data) => {
  const t = await sequelize.transaction();

  try {
    const { tallerId, alumno: alumnoData, representante: repData } = data;
    const edad = parseInt(alumnoData.edad, 10);
    const esMenor = !isNaN(edad) && edad < 18;

    // Validar representante si es menor
    if (esMenor && (!repData || !repData.nombre || !repData.cedula)) {
      throw new Error('Los menores de edad requieren un representante con nombre y cédula.');
    }

    // Calcular fecha de nacimiento aproximada desde la edad o usar la proporcionada
    const hoy = new Date();
    let fechaNac = new Date(hoy.getFullYear() - edad, hoy.getMonth(), hoy.getDate());
    if (alumnoData.fecha_nacimiento) {
      fechaNac = new Date(alumnoData.fecha_nacimiento);
    }

    // 1. Encontrar o Crear Persona del alumno
    let alumnoPersona = null;

    if (alumnoData.cedula) {
      const normalizedCed = normalizeCedula(alumnoData.cedula);
      alumnoPersona = await Persona.findOne({
        where: { cedula: normalizedCed },
        transaction: t,
      });
    }

    if (!alumnoPersona) {
      const namePartsAlumno = (alumnoData.nombre || '').trim().split(' ');
      const nombreAlumno = namePartsAlumno[0] || alumnoData.nombre;
      const apellidoAlumno = namePartsAlumno.slice(1).join(' ') || '';

      // Si no envían cédula (caso anómalo) generamos un temporal, de lo contrario usamos la enviada
      const cedulaAlumno =
        alumnoData.cedula || `V-INF-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      alumnoPersona = await Persona.create(
        {
          cedula: cedulaAlumno,
          nombres: nombreAlumno,
          apellidos: apellidoAlumno,
          telefono: repData?.telefono || '',
          fecha_de_nac: fechaNac,
          fecha_registro: new Date(),
        },
        { transaction: t }
      );
    }

    // 2. Crear o buscar Alumno
    let alumnoRecord = await Alumno.findOne({
      where: { id_persona: alumnoPersona.id_persona },
      transaction: t,
    });

    if (!alumnoRecord) {
      alumnoRecord = await Alumno.create(
        {
          id_persona: alumnoPersona.id_persona,
          nivel_experiencia: null,
        },
        { transaction: t }
      );
    }

    // 3. Si es menor, crear/traer Representante y vincular
    if (esMenor && repData) {
      const normalizedRepCed = normalizeCedula(repData.cedula);
      let repPersona = await Persona.findOne({
        where: { cedula: normalizedRepCed },
        transaction: t,
      });

      if (!repPersona) {
        const namePartsRep = (repData.nombre || '').trim().split(' ');
        const nombreRep = namePartsRep[0] || repData.nombre;
        const apellidoRep = namePartsRep.slice(1).join(' ') || '';

        repPersona = await Persona.create(
          {
            cedula: repData.cedula,
            nombres: nombreRep,
            apellidos: apellidoRep,
            telefono: repData.telefono || '',
            fecha_de_nac: null,
            fecha_registro: new Date(),
          },
          { transaction: t }
        );
      }

      let repRecord = await Representante.findOne({
        where: { id_persona: repPersona.id_persona },
        transaction: t,
      });

      if (!repRecord) {
        repRecord = await Representante.create(
          {
            id_persona: repPersona.id_persona,
            profesion_ocupacion: null,
          },
          { transaction: t }
        );
      }

      await AlumnoRepresentante.findOrCreate({
        where: { id_alumno: alumnoRecord.id_alumno, id_representante: repRecord.id_representante },
        defaults: { parentesco: 'Representante Legal' },
        transaction: t,
      });
    }

    // 4. Crear Inscripcion
    const inscripcion = await InscripcionTaller.create(
      {
        id_taller: tallerId,
        id_alumno: alumnoRecord.id_alumno,
        fecha_inscripcion: new Date(),
        estado_inscripcion: 'Inscrito',
      },
      { transaction: t }
    );

    await t.commit();
    return inscripcion;
  } catch (error) {
    await t.rollback();
    throw new Error('Error en el proceso de inscripción: ' + error.message);
  }
};

const eliminarInscripcion = async (id) => {
  const inscripcion = await InscripcionTaller.findByPk(id);
  if (!inscripcion) {
    throw new AppError('Inscripción no encontrada', 404);
  }
  await inscripcion.destroy();
  return { message: 'Inscripción eliminada correctamente. Puede restaurarla desde la papelera.' };
};

module.exports = {
  getInscripcionesConDetalles,
  inscribirAlumno,
  exportInscripciones,
  eliminarInscripcion,
};
