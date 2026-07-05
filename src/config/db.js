const { Sequelize } = require('sequelize');
require('dotenv').config();

let sequelize;

if (process.env.NODE_ENV === 'test') {
  sequelize = new Sequelize('sqlite::memory:', {
    logging: false,
  });
} else {
  // ⚠️ SEGURIDAD: Si NODE_ENV no está definido, es probable que se haya ejecutado
  // algo sin el entorno correcto (ej: cross-env falló en Windows).
  // Lanzamos error para evitar que sync({ force: true }) en tests borre la BD real.
  if (!process.env.NODE_ENV) {
    throw new Error(
      'NODE_ENV no está definido. ' +
        'Si ejecutó npm test, asegúrese de que cross-env funcione correctamente. ' +
        'Alternativa: $env:NODE_ENV="test"; npx jest'
    );
  }

  const isLocal =
    !process.env.DATABASE_URL ||
    process.env.DATABASE_URL.includes('localhost') ||
    process.env.DATABASE_URL.includes('127.0.0.1');

  const dialectOptions = isLocal
    ? {}
    : {
        ssl: {
          require: true,
          rejectUnauthorized: false,
        },
      };

  sequelize = new Sequelize(
    process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/mavet_db',
    {
      dialect: 'postgres',
      logging: false,
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000,
      },
      dialectOptions,
    }
  );

  const testConnection = async () => {
    try {
      await sequelize.authenticate();
      console.log('✅ Conexión a PostgreSQL establecida con éxito.');
    } catch (error) {
      console.error('❌ No se pudo conectar a la base de datos:', error);
    }
  };

  testConnection();
}

module.exports = sequelize;
