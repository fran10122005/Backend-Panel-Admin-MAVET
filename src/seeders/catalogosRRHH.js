const { CargoTrabajador, Role, sequelize } = require('../models');
const { permisosCompletos } = require('../config/permissions');

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
  { nombre_rol: 'Administrador', permisos: JSON.stringify(permisosCompletos()) },
  {
    nombre_rol: 'Recepcionista',
    permisos: JSON.stringify({
      dashboard: ['read'],
      recepcion: ['read', 'write'],
      asistencia: ['read'],
    }),
  },
  {
    nombre_rol: 'Curador',
    permisos: JSON.stringify({
      dashboard: ['read'],
      inventario_obras: ['read', 'write', 'delete'],
    }),
  },
  {
    nombre_rol: 'Restaurador',
    permisos: JSON.stringify({
      dashboard: ['read'],
      inventario_obras: ['read', 'write'],
    }),
  },
  {
    nombre_rol: 'Bibliotecario',
    permisos: JSON.stringify({
      dashboard: ['read'],
      biblioteca: ['read', 'write', 'delete'],
    }),
  },
  {
    nombre_rol: 'Educador',
    permisos: JSON.stringify({
      dashboard: ['read'],
      auditorio: ['read', 'write', 'delete'],
      talleres: ['read', 'write', 'delete'],
      educacion: ['read'],
    }),
  },
  {
    nombre_rol: 'Gerente',
    permisos: JSON.stringify({
      dashboard: ['read'],
      recepcion: ['read'],
      auditorio: ['read'],
      talleres: ['read'],
      asistencia: ['read'],
      biblioteca: ['read'],
      inventario_obras: ['read'],
      rrhh: ['read'],
      auditoria: ['read'],
      catalogos: ['read'],
    }),
  },
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
