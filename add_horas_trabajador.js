const sequelize = require('./src/config/db');

async function fixDB() {
  try {
    console.log('Aplicando alteraciones a la base de datos...');
    
    await sequelize.query('ALTER TABLE trabajadores ADD COLUMN IF NOT EXISTS horas_semanales NUMERIC;');
    console.log('✅ Columna horas_semanales agregada a trabajadores (o ya existía)');

    console.log('🎉 Migración completada.');
  } catch (error) {
    console.error('❌ Error aplicando alteraciones:', error);
  } finally {
    process.exit(0);
  }
}

fixDB();
