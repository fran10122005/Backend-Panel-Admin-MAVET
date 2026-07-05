const bcrypt = require('bcryptjs');
const { sequelize, Role, Usuario } = require('./models');

const usuarios = [
  { correo: 'curador@gmail.com', password: 'admin123', rol: 'Curador' },
  { correo: 'educacion@gmail.com', password: 'admin123', rol: 'Educación' },
  { correo: 'rinconfrancisco10122005@gmail.com', password: 'admin123', rol: 'Gerente' },
  { correo: 'bibliotecaria@gmail.com', password: 'admin123', rol: 'Bibliotecaria' },
  { correo: 'restauradormavet@gmail.com', password: 'admin123', rol: 'Recepcionista' },
  { correo: 'adminmavet@gmail.com', password: 'admin123', rol: 'Administrador' },
];

async function seed() {
  try {
    await sequelize.authenticate();
    console.log('Conectado a la base de datos');

    const salt = await bcrypt.genSalt(10);

    for (const u of usuarios) {
      const [role] = await Role.findOrCreate({
        where: { nombre_rol: u.rol },
        defaults: { nombre_rol: u.rol },
      });

      const password_hash = await bcrypt.hash(u.password, salt);

      const [user, created] = await Usuario.findOrCreate({
        where: { correo: u.correo },
        defaults: {
          correo: u.correo,
          password_hash,
          id_rol: role.id_rol,
          estado: true,
        },
      });

      if (created) {
        console.log(`✓ Usuario creado: ${u.correo} — Rol: ${u.rol}`);
      } else {
        console.log(`- Ya existe: ${u.correo}`);
      }
    }

    console.log('\nSeed completado exitosamente');
  } catch (error) {
    console.error('Error durante el seed:', error);
  } finally {
    await sequelize.close();
  }
}

seed();
