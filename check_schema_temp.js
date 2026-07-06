const { Sequelize } = require('sequelize');
require('dotenv').config();
const sq = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  dialectOptions: { ssl: { rejectUnauthorized: false } },
  logging: false,
});
(async () => {
  try {
    await sq.authenticate();

    // Check talleres columns
    const [talleres] = await sq.query(
      `SELECT column_name, data_type, character_maximum_length FROM information_schema.columns WHERE table_name = 'talleres' ORDER BY ordinal_position`
    );
    console.log('=== talleres ===');
    console.log(JSON.stringify(talleres, null, 2));

    // Check inscripciones_talleres columns + FK constraint
    const [insc] = await sq.query(
      `SELECT column_name, data_type, character_maximum_length FROM information_schema.columns WHERE table_name = 'inscripciones_talleres' ORDER BY ordinal_position`
    );
    console.log('=== inscripciones_talleres ===');
    console.log(JSON.stringify(insc, null, 2));

    // Check FK constraint details
    const [fks] = await sq.query(`
      SELECT
        tc.constraint_name,
        kcu.column_name,
        ccu.table_schema AS foreign_table_schema,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
      WHERE tc.table_name = 'inscripciones_talleres' AND tc.constraint_type = 'FOREIGN KEY'
    `);
    console.log('=== FK constraints ===');
    console.log(JSON.stringify(fks, null, 2));

    // Show existing talleres
    const [existingTalleres] = await sq.query(
      'SELECT id_taller, nombre_curso FROM talleres LIMIT 10'
    );
    console.log('=== Existing talleres ===');
    console.log(JSON.stringify(existingTalleres, null, 2));
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await sq.close();
  }
})();
