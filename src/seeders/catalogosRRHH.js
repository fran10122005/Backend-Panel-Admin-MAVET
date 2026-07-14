const { CargoTrabajador, Role, sequelize } = require('../models');

const { Op } = require('sequelize');

const cargos = [
  { nombre_cargo: 'Educador', descripcion: 'Facilita talleres y actividades educativas' },
  { nombre_cargo: 'Bibliotecario(a)', descripcion: 'Gestión de la biblioteca del museo' },
  { nombre_cargo: 'Curador(a)', descripcion: 'Responsable de la colección del museo' },
  { nombre_cargo: 'Recepcionista', descripcion: 'Atención al público en recepción' },
  { nombre_cargo: 'Coordinador', descripcion: 'Coordinación general' },
  { nombre_cargo: 'Guía de Sala', descripcion: 'Guía a los visitantes por las salas del museo' },
  { nombre_cargo: 'Mantenimiento', descripcion: 'Mantenimiento general de las instalaciones' },
  { nombre_cargo: 'Pasante', descripcion: 'Personal en período de pasantía' },
  {
    nombre_cargo: 'Seguridad / Vigilante',
    descripcion: 'Seguridad y vigilancia de las instalaciones',
  },
];

const roles = [
  { nombre_rol: 'Administrador', permisos: 'all' },
  { nombre_rol: 'Recepcionista', permisos: 'visitantes,asistencia' },
  { nombre_rol: 'Curador', permisos: 'obras' },
  { nombre_rol: 'Restaurador', permisos: 'obras' },
  { nombre_rol: 'Bibliotecario', permisos: 'biblioteca' },
  { nombre_rol: 'Educador', permisos: 'talleres,auditorio' },
  { nombre_rol: 'Gerente', permisos: 'read' },
];

async function seedRRHH() {
  try {
    await sequelize.authenticate();
    console.log('✅ Conectado a la base de datos\n');

    // Cleanup unused cargos
    console.log('--- Limpiando Cargos Antiguos ---');
    const namesToKeep = cargos.map((c) => c.nombre_cargo);
    const deleted = await CargoTrabajador.destroy({
      where: {
        nombre_cargo: { [Op.notIn]: namesToKeep },
      },
    });
    console.log(`🗑️  Se eliminaron ${deleted} cargos que ya no se usan.\n`);

    // Cargos de Trabajador
    console.log('--- Cargos de Trabajador ---');
    for (const c of cargos) {
      const [obj, created] = await CargoTrabajador.findOrCreate({
        where: { nombre_cargo: c.nombre_cargo },
        defaults: c,
      });
      console.log(
        `  ${created ? '✅ Creado' : 'ℹ️  Ya existe'}: ${c.nombre_cargo} (id=${obj.id_cargo})`
      );
    }

    // Roles de Usuario
    console.log('\n--- Roles de Usuario ---');
    for (const r of roles) {
      const [obj, created] = await Role.findOrCreate({
        where: { nombre_rol: r.nombre_rol },
        defaults: r,
      });
      console.log(
        `  ${created ? '✅ Creado' : 'ℹ️  Ya existe'}: ${r.nombre_rol} (id=${obj.id_rol})`
      );
    }

    console.log('\n🚀 Seed de RRHH completado.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

seedRRHH();
