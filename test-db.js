const sequelize = require('./src/config/db');
sequelize
  .authenticate()
  .then(() =>
    sequelize
      .query(
        'SELECT id_solicitud, motivo, correo_electronico, recursos_solicitados FROM solicitudes_espacios ORDER BY fecha_creacion DESC LIMIT 1;'
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
