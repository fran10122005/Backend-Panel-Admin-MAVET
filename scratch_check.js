const { Usuario, Role } = require('./src/models');

async function check() {
  const roles = await Role.findAll();
  console.log("Roles:", roles.map(r => r.nombre_rol));
  process.exit(0);
}

check();
