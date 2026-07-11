require('dotenv').config();
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  },
});

async function dropTable() {
  try {
    await sequelize.authenticate();
    console.log('Connected.');
    await sequelize.query('DROP TABLE IF EXISTS "visitantes" CASCADE;');
    console.log('Table visitantes dropped successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

dropTable();
