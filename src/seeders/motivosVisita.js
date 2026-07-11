const { MotivoVisita, RegistroIngreso } = require('../models');

const motivos = [
  { nombre: 'Visita Guiada', descripcion: 'Recorrido guiado por el museo' },
  { nombre: 'Biblioteca', descripcion: 'Consulta e investigación en biblioteca' },
  { nombre: 'Trámites', descripcion: 'Trámites administrativos y documentación' },
  { nombre: 'Visita Escolar', descripcion: 'Visita educativa de instituciones' },
  { nombre: 'Mantenimiento', descripcion: 'Trabajos de mantenimiento o instalación' },
  { nombre: 'Otro', descripcion: 'Otro motivo no contemplado' },
];

const oldNames = [
  'Exposición Temporal',
  'Investigación',
  'Visita de Obras',
  'Entrega de Obra',
  'Trámite Administrativo',
];

const seedMotivos = async () => {
  try {
    // Eliminar motivos antiguos que no tienen registros asociados
    for (const oldName of oldNames) {
      const old = await MotivoVisita.findOne({ where: { nombre: oldName } });
      if (old) {
        const count = await RegistroIngreso.count({ where: { id_motivo: old.id_motivo } });
        if (count === 0) {
          await old.destroy();
          console.log(`🗑️  Motivo antiguo "${oldName}" eliminado.`);
        } else {
          console.log(`⏭️  "${oldName}" tiene ${count} ingresos asociados — se conserva.`);
        }
      }
    }

    // Crear o actualizar motivos nuevos
    for (const motivo of motivos) {
      const existe = await MotivoVisita.findOne({ where: { nombre: motivo.nombre } });
      if (!existe) {
        await MotivoVisita.create(motivo);
        console.log(`✅ Motivo "${motivo.nombre}" creado.`);
      } else {
        // Actualizar descripción por si cambió
        if (existe.descripcion !== motivo.descripcion) {
          await existe.update({ descripcion: motivo.descripcion });
          console.log(`🔄 Motivo "${motivo.nombre}" actualizado.`);
        } else {
          console.log(`ℹ️  Motivo "${motivo.nombre}" ya existe (id=${existe.id_motivo}).`);
        }
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
