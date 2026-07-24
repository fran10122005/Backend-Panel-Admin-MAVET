const { TipoEvento } = require('../models');

const tipos = [
  { nombre: 'Conferencia', descripcion: 'Conferencia o ponencia' },
  { nombre: 'Reunión', descripcion: 'Reunión de trabajo o institucional' },
  { nombre: 'Taller', descripcion: 'Taller o capacitación' },
  { nombre: 'Otros', descripcion: 'Otro tipo de evento no contemplado' },
];

const seedTiposEvento = async () => {
  try {
    for (const tipo of tipos) {
      const existe = await TipoEvento.findOne({ where: { nombre: tipo.nombre } });
      if (!existe) {
        await TipoEvento.create(tipo);
        console.log(`✅ Tipo de evento "${tipo.nombre}" creado.`);
      } else {
        if (existe.descripcion !== tipo.descripcion) {
          await existe.update({ descripcion: tipo.descripcion });
          console.log(`🔄 Tipo de evento "${tipo.nombre}" actualizado.`);
        } else {
          console.log(
            `ℹ️  Tipo de evento "${tipo.nombre}" ya existe (id=${existe.id_tipo_evento}).`
          );
        }
      }
    }
    console.log('🚀 Seed de tipos de evento completado.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error en seed de tipos de evento:', error);
    process.exit(1);
  }
};

seedTiposEvento();
