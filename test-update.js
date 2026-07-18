const sequelize = require('./src/config/db');
sequelize
  .authenticate()
  .then(() =>
    sequelize
      .query(
        "UPDATE solicitudes_espacios SET correo_electronico='test_manual@correo.com', recursos_solicitados='[\"Sillas\",\"Proyector\"]'::jsonb WHERE id_solicitud='SES-00014';"
      )
      .then(() => {
        console.log('Updated');
        process.exit(0);
      })
  )
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
