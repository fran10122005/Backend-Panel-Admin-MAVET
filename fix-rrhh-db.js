const sequelize = require('./src/config/db');

async function fixDB() {
  try {
    console.log('Aplicando alteraciones a la base de datos...');
    
    // Trabajadores
    await sequelize.query('ALTER TABLE trabajadores ADD COLUMN IF NOT EXISTS telefono VARCHAR(20);');
    console.log('✅ Columna telefono agregada a trabajadores (o ya existía)');
    
    await sequelize.query('ALTER TABLE trabajadores ADD COLUMN IF NOT EXISTS correo_personal VARCHAR(255);');
    console.log('✅ Columna correo_personal agregada a trabajadores (o ya existía)');
    
    // Asistencias QR
    await sequelize.query('ALTER TABLE asistencias_qr ADD COLUMN IF NOT EXISTS id_trabajador INTEGER;');
    console.log('✅ Columna id_trabajador agregada a asistencias_qr (o ya existía)');

    await sequelize.query('ALTER TABLE asistencias_qr ADD COLUMN IF NOT EXISTS salida_manana TIMESTAMPTZ;');
    console.log('✅ Columna salida_manana agregada a asistencias_qr (o ya existía)');
    
    await sequelize.query('ALTER TABLE asistencias_qr ADD COLUMN IF NOT EXISTS entrada_tarde TIMESTAMPTZ;');
    console.log('✅ Columna entrada_tarde agregada a asistencias_qr (o ya existía)');

    console.log('🎉 Migración completada.');
  } catch (error) {
    console.error('❌ Error aplicando alteraciones:', error);
  } finally {
    process.exit(0);
  }
}

fixDB();
