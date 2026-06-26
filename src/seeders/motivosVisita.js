const { MotivoVisita } = require('../models');

const motivosAGregar = [
  { nombre: 'Entrega de Obra', descripcion: 'Entrega de obra' },
  { nombre: 'Otro', descripcion: 'Otro' },
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
