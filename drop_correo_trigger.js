const { sequelize } = require('./src/models');

async function run() {
  try {
    // 1. Eliminar columna correo de personas
    await sequelize.query('ALTER TABLE personas DROP COLUMN IF EXISTS correo;');
    console.log('Columna correo eliminada de la tabla personas.');

    // 2. Crear función del trigger para asignar la fecha de registro
    await sequelize.query(`
      CREATE OR REPLACE FUNCTION set_fecha_registro_persona()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.fecha_registro = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);
    console.log('Función del trigger creada.');

    // 3. Recrear el trigger en la tabla personas
    await sequelize.query('DROP TRIGGER IF EXISTS trigger_fecha_registro_persona ON personas;');
    await sequelize.query(`
      CREATE TRIGGER trigger_fecha_registro_persona
      BEFORE INSERT ON personas
      FOR EACH ROW
      EXECUTE FUNCTION set_fecha_registro_persona();
    `);
    console.log('Trigger en Neon creado exitosamente.');
  } catch (error) {
    console.error('Error ejecutando consultas SQL:', error);
  } finally {
    process.exit(0);
  }
}

run();
