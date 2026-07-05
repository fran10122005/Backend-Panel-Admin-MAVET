const { MotivoVisita } = require('../models');

const motivosAGregar = [
  {
    nombre: 'Visita Guiada',
    descripcion: 'Recorrido guiado por las instalaciones y exhibiciones del museo',
  },
  {
    nombre: 'Exposición Temporal',
    descripcion: 'Visita a una exposición temporal o muestra especial',
  },
  { nombre: 'Exposición Permanente', descripcion: 'Visita a la colección permanente del museo' },

  {
    nombre: 'Investigación',
    descripcion: 'Consulta de archivo, biblioteca o investigación académica',
  },
  {
    nombre: 'Entrega de Obra',
    descripcion: 'Entrega de obra para exposición, restauración o depósito',
  },
  {
    nombre: 'Trámite Administrativo',
    descripcion: 'Gestión documental, permisos, solicitudes o certificados',
  },
  {
    nombre: 'Visita Escolar',
    descripcion: 'Visita educativa de instituciones escolares o universitarias',
  },
  {
    nombre: 'Mantenimiento',
    descripcion: 'Personal externo realizando trabajos de mantenimiento o instalación',
  },
  { nombre: 'Otro', descripcion: 'Otro motivo no contemplado en las categorías anteriores' },
];

const seedMotivos = async () => {
  try {
    for (const motivo of motivosAGregar) {
      const existe = await MotivoVisita.findOne({ where: { nombre: motivo.nombre } });
      if (!existe) {
        await MotivoVisita.create(motivo);
        console.log(`✅ Motivo "${motivo.nombre}" creado.`);
      } else {
        console.log(`ℹ️  Motivo "${motivo.nombre}" ya existe (id=${existe.id_motivo}).`);
      }
    }
    console.log('🚀 Seed de motivos completado.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error en seed de motivos:', error);
    process.exit(1);
  }
};

seedMotivos();
