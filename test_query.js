const { Sequelize } = require('sequelize');
require('dotenv').config();
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  dialectOptions: { ssl: { require: true, rejectUnauthorized: false } },
});
async function main() {
  const [users] = await sequelize.query('SELECT id_usuario, correo FROM usuarios LIMIT 5');
  console.log(JSON.stringify(users, null, 2));
  await sequelize.close();
}
main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
