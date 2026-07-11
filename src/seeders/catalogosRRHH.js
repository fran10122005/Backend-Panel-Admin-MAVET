const { CargoTrabajador, Role, sequelize } = require('../models');

const cargos = [
  { nombre_cargo: 'Director(a)', descripcion: 'Director o Directora del museo' },
  { nombre_cargo: 'Subdirector(a)', descripcion: 'Subdirector o Subdirectora del museo' },
  { nombre_cargo: 'Administrador(a)', descripcion: 'Encargado de la administración general' },
  { nombre_cargo: 'Curador(a)', descripcion: 'Responsable de la colección del museo' },
  { nombre_cargo: 'Restaurador(a)', descripcion: 'Especialista en restauración de obras' },
  {
    nombre_cargo: 'Educador(a) de Museos',
    descripcion: 'Facilita talleres y actividades educativas',
  },
  { nombre_cargo: 'Guía de Sala', descripcion: 'Guía a los visitantes por las salas del museo' },
  { nombre_cargo: 'Recepcionista', descripcion: 'Atención al público en recepción' },
  {
    nombre_cargo: 'Asistente Administrativo(a)',
    descripcion: 'Apoyo a las labores administrativas',
  },
  { nombre_cargo: 'Archivista', descripcion: 'Gestión y conservación de archivos y documentos' },
  { nombre_cargo: 'Bibliotecario(a)', descripcion: 'Gestión de la biblioteca del museo' },
  { nombre_cargo: 'Técnico de Montaje', descripcion: 'Instalación y desmontaje de obras' },
  { nombre_cargo: 'Museógrafo(a)', descripcion: 'Diseño de espacios y narrativa expositiva' },
  { nombre_cargo: 'Fotógrafo(a)', descripcion: 'Registro fotográfico de obras y eventos' },
  { nombre_cargo: 'Diseñador(a) Gráfico(a)', descripcion: 'Material de comunicación y difusión' },
  {
    nombre_cargo: 'Community Manager',
    descripcion: 'Gestión de redes sociales y comunicación digital',
  },
  {
    nombre_cargo: 'Seguridad / Vigilante',
    descripcion: 'Seguridad y vigilancia de las instalaciones',
  },
  { nombre_cargo: 'Mantenimiento', descripcion: 'Mantenimiento general de las instalaciones' },
  { nombre_cargo: 'Personal de Limpieza', descripcion: 'Limpieza y aseo de las instalaciones' },
  {
    nombre_cargo: 'Coordinador(a) de Talleres',
    descripcion: 'Coordinación del programa de talleres y educación',
  },
  { nombre_cargo: 'Instructor(a) de Talleres', descripcion: 'Impartición de talleres artísticos' },
  { nombre_cargo: 'Investigador(a)', descripcion: 'Investigación artística y patrimonial' },
  { nombre_cargo: 'Asistente de Curaduría', descripcion: 'Apoyo al área de curaduría' },
  { nombre_cargo: 'Contador(a)', descripcion: 'Gestión contable y financiera' },
  { nombre_cargo: 'Pasante', descripcion: 'Personal en período de pasantía' },
];

const roles = [
  { nombre_rol: 'Administrador', permisos: 'all' },
  { nombre_rol: 'Recepcionista', permisos: 'visitantes,asistencia' },
  { nombre_rol: 'Curador', permisos: 'obras,biblioteca' },
  { nombre_rol: 'Educador', permisos: 'talleres,auditorio' },
  { nombre_rol: 'Consultor', permisos: 'read' },
];

async function seedRRHH() {
  try {
    await sequelize.authenticate();
    console.log('✅ Conectado a la base de datos\n');

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
