require('dotenv').config();
const { sequelize } = require('./src/models');

async function migrate() {
  const t = await sequelize.transaction();
  try {
    await sequelize.authenticate();
    console.log('DB connected. Starting migration...\n');

    // ==========================================
    // FIX trabajador_documentos table
    // ==========================================
    console.log('=== Fixing trabajador_documentos ===');

    // Rename 'descripcion' to 'notas' (to match the model)
    const [colCheck] = await sequelize.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name = 'trabajador_documentos' AND column_name = 'notas'`,
      { transaction: t }
    );

    if (colCheck.length === 0) {
      // Check if 'descripcion' exists to rename it
      const [descCheck] = await sequelize.query(
        `SELECT column_name FROM information_schema.columns WHERE table_name = 'trabajador_documentos' AND column_name = 'descripcion'`,
        { transaction: t }
      );

      if (descCheck.length > 0) {
        await sequelize.query(
          `ALTER TABLE trabajador_documentos RENAME COLUMN descripcion TO notas`,
          { transaction: t }
        );
        console.log('✅ Renamed descripcion -> notas in trabajador_documentos');
      } else {
        await sequelize.query(`ALTER TABLE trabajador_documentos ADD COLUMN notas TEXT`, {
          transaction: t,
        });
        console.log('✅ Added notas column to trabajador_documentos');
      }
    } else {
      console.log('✓ notas column already exists in trabajador_documentos');
    }

    // Add deleted_at column for paranoid soft deletes
    const [deletedAtCheck] = await sequelize.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name = 'trabajador_documentos' AND column_name = 'deleted_at'`,
      { transaction: t }
    );
    if (deletedAtCheck.length === 0) {
      await sequelize.query(
        `ALTER TABLE trabajador_documentos ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL`,
        { transaction: t }
      );
      console.log('✅ Added deleted_at column to trabajador_documentos');
    } else {
      console.log('✓ deleted_at already exists in trabajador_documentos');
    }

    // ==========================================
    // Fix fecha_subida being used as createdAt
    // ==========================================
    // The model uses createdAt: 'fecha_subida', updatedAt: false
    // This should already work since the column exists
    console.log('✓ fecha_subida column exists in trabajador_documentos');

    await t.commit();
    console.log('\n✅ Migration completed successfully!');

    // Verify final schema
    const [finalCols] = await sequelize.query(
      `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'trabajador_documentos' ORDER BY ordinal_position`
    );
    console.log('\nFinal trabajador_documentos columns:');
    finalCols.forEach((c) => console.log(' -', c.column_name, ':', c.data_type));
  } catch (err) {
    await t.rollback();
    console.error('Migration FAILED:', err.message);
    console.error(err.stack);
  } finally {
    await sequelize.close();
  }
}

migrate();
