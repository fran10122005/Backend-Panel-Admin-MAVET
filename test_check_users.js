const { Sequelize } = require('sequelize');
require('dotenv').config();
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  dialectOptions: { ssl: { require: true, rejectUnauthorized: false } },
});
async function main() {
  const [users] = await sequelize.query('SELECT id_usuario, correo, password_hash FROM usuarios');
  for (const u of users) {
    console.log(`${u.id_usuario} | ${u.correo} | ${(u.password_hash || '').substring(0, 30)}...`);
  }
  await sequelize.close();
}
main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
