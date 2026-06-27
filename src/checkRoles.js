const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  },
});

async function run() {
  try {
    await sequelize.authenticate();
    const [roles] = await sequelize.query(`
      SELECT id_rol, nombre_rol, permisos
      FROM roles;
    `);
    // eslint-disable-next-line no-console
    console.log('Roles in DB:');
    // eslint-disable-next-line no-console
    console.log(roles);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error:', error);
  } finally {
    await sequelize.close();
  }
}

run();
