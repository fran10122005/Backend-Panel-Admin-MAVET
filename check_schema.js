require('dotenv').config();
const { sequelize } = require('./src/models');

async function test() {
  try {
    await sequelize.authenticate();

    const tables = ['trabajador_documentos', 'trabajador_horarios', 'trabajador_justificaciones'];

    for (const table of tables) {
      const [cols] = await sequelize.query(
        `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = '${table}' ORDER BY ordinal_position`
      );
      console.log(`\n=== ${table} columns ===`);
      if (cols.length === 0) {
        console.log('  TABLE DOES NOT EXIST!');
      } else {
        cols.forEach((c) => console.log(' -', c.column_name, ':', c.data_type));
      }
    }
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await sequelize.close();
  }
}
test();
