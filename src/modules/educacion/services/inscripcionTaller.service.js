const ExcelJS = require('exceljs');
const AppError = require('../../../utils/AppError');
const { generateTablePdf } = require('../../../utils/pdfGenerator');

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
    const headers = [
      { label: 'Alumno', width: 200 },
      { label: 'Representante', width: 200 },
      { label: 'Fecha Inscripción', width: 140, align: 'center' },
    ];
    const rows = filtered.map((ins) => [
      ins.Alumno ? `${ins.Alumno.nombres || ''} ${ins.Alumno.apellidos || ''}`.trim() : '-',
      ins.Representante
        ? `${ins.Representante.nombres || ''} ${ins.Representante.apellidos || ''}`.trim()
        : '-',
      ins.fecha_inscripcion ? new Date(ins.fecha_inscripcion).toLocaleDateString('es-VE') : '-',
    ]);
    const buffer = await generateTablePdf(`Inscripciones — Taller #${tallerId}`, headers, rows, 'Coordinador(a) de Talleres');
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
