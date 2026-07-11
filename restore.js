const fs = require('fs');
const { sequelize, Role, Usuario } = require('./src/models');

async function restore() {
  try {
    console.log('Sincronizando base de datos con force: true...');
    // Esto eliminará TODAS las tablas y las recreará con la nueva estructura
    await sequelize.sync({ force: true });
    console.log('✅ Base de datos sincronizada y tablas recreadas.');

    // Leer backup
    const backupData = JSON.parse(fs.readFileSync('backup_data.json', 'utf8'));

    // Mapeo de IDs antiguos a nuevos
    const rolMap = {}; // { 1: 'ROL-00001', 2: 'ROL-00002' }

    console.log('Restaurando Roles...');
    for (const oldRol of backupData.roles) {
      // Dejamos que el hook genere el nuevo ID, solo pasamos los otros datos
      const newRol = await Role.create({
        nombre_rol: oldRol.nombre_rol,
        permisos: oldRol.permisos,
      });
      rolMap[oldRol.id_rol] = newRol.id_rol;
      console.log(`Rol migrado: ${oldRol.id_rol} -> ${newRol.id_rol}`);
    }

    console.log('Restaurando Usuarios...');
    for (const oldUser of backupData.usuarios) {
      const newIdRol = rolMap[oldUser.id_rol];
      if (!newIdRol) {
        console.warn(
          `Usuario ${oldUser.correo} tiene un id_rol ${oldUser.id_rol} que no se migró.`
        );
      }

      const newUser = await Usuario.create({
        correo: oldUser.correo,
        password_hash: oldUser.password_hash,
        estado: oldUser.estado,
        foto_url: oldUser.foto_url,
        id_rol: newIdRol,
      });
      console.log(`Usuario migrado: ${oldUser.id_usuario} -> ${newUser.id_usuario}`);
    }

    console.log('✅ Restauración completada exitosamente.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error durante la restauración:', error);
    process.exit(1);
  }
}

restore();
