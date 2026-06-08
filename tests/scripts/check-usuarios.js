const sequelize = require('../../src/config/db');

async function check() {
  try {
    const cols = await sequelize.query(
      "SELECT column_name FROM information_schema.columns WHERE table_name = 'usuarios'",
      { type: sequelize.QueryTypes.SELECT }
    );
    console.log('Columnas usuarios:', cols.map(c => c.column_name));

    const rows = await sequelize.query(
      'SELECT id_usuario, correo, id_rol, estado FROM usuarios',
      { type: sequelize.QueryTypes.SELECT }
    );
    console.log('Usuarios en BD:', JSON.stringify(rows, null, 2));
  } catch(e) {
    console.log('Error:', e.message);
  } finally {
    process.exit(0);
  }
}

check();
