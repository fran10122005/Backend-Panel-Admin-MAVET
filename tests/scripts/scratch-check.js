const models = require('../../src/models');

async function check() {
  try {
    const { sequelize } = models;
    console.log("Registered models:", Object.keys(sequelize.models));

    const { Obra } = models;
    console.log("\nObra associations:", Object.keys(Obra.associations));
    
    Object.entries(Obra.associations).forEach(([key, assoc]) => {
      console.log(`  [${key}] -> target: ${assoc.target.name}, as: ${assoc.as}, fk: ${assoc.foreignKey}`);
    });
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    process.exit(0);
  }
}

check();
