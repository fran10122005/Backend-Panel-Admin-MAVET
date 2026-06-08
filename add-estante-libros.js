/**
 * Script de migración: Agrega la columna 'estante' y ajusta 'ano_libro' en la tabla libros.
 * Ejecutar UNA SOLA VEZ con: node add-estante-libros.js
 */
const { Client } = require('pg');
require('dotenv').config();

async function migrate() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { require: true, rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Conectado a la base de datos.');

    // 1. Agregar columna estante si no existe
    await client.query(`
      ALTER TABLE libros
      ADD COLUMN IF NOT EXISTS estante VARCHAR(255);
    `);
    console.log('✅ Columna "estante" agregada a libros.');

    // 2. Verificar columnas actuales de ano_libro
    const colCheck = await client.query(`
      SELECT data_type FROM information_schema.columns
      WHERE table_name = 'libros' AND column_name = 'ano_libro';
    `);
    if (colCheck.rows.length > 0) {
      console.log(`   "ano_libro" existe con tipo: ${colCheck.rows[0].data_type}`);
    }

    console.log('\n✅ Migración completada exitosamente.');
  } catch (err) {
    console.error('❌ Error en migración:', err.message);
  } finally {
    await client.end();
  }
}

migrate();
