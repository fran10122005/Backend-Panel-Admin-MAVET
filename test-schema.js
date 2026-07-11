const { sequelize } = require('./src/models');

async function test() {
  const tableInfo = await sequelize.query(`PRAGMA foreign_key_list(usuarios);`);
  console.log('Usuarios FKs:', tableInfo[0]);

  const auditInfo = await sequelize.query(`PRAGMA foreign_key_list(bitacora_auditoria);`);
  console.log('BitacoraAuditoria FKs:', auditInfo[0]);
}

test();
