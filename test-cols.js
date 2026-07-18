const sequelize = require('./src/config/db');
sequelize
  .authenticate()
  .then(() =>
    sequelize
      .query(
        "SELECT column_name FROM information_schema.columns WHERE table_name='solicitudes_espacios';"
      )
      .then((res) => {
        console.log(res[0].map((c) => c.column_name));
        process.exit(0);
      })
  )
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
