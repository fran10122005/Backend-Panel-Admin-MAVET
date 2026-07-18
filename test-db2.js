const sequelize = require('./src/config/db');
sequelize
  .authenticate()
  .then(() =>
    sequelize
      .query(
        'SELECT id_solicitud, correo_electronico, recursos_solicitados FROM solicitudes_espacios WHERE correo_electronico IS NOT NULL;'
      )
      .then((res) => {
        console.log(res[0]);
        process.exit(0);
      })
  )
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
