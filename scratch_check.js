const models = require('./src/models');

async function check() {
  try {
    // Show all registered model names
    const { sequelize } = models;
    console.log("Registered models:", Object.keys(sequelize.models));

    // Check Obra associations
    const { Obra } = models;
    console.log("\nObra associations:", Object.keys(Obra.associations));
    
    // Show the foreign key info for each association
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
