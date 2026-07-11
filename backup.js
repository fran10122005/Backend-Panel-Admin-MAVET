const fs = require('fs');
const { Role, Usuario } = require('./src/models');

async function backup() {
  try {
    console.log('Obteniendo roles...');
    const roles = await Role.findAll({ raw: true });

    console.log('Obteniendo usuarios...');
    const usuarios = await Usuario.findAll({ raw: true });

    const data = {
      roles,
      usuarios,
    };

    fs.writeFileSync('backup_data.json', JSON.stringify(data, null, 2));
    console.log('✅ Respaldo completado en backup_data.json');
    console.log(`- Roles respaldados: ${roles.length}`);
    console.log(`- Usuarios respaldados: ${usuarios.length}`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error durante el respaldo:', error);
    process.exit(1);
  }
}

backup();
