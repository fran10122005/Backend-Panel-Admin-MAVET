const { Visitante } = require('./src/models');
const sequelize = require('./src/config/db');

async function testSequelize() {
  try {
    console.log('Testing Sequelize connection...');
    await sequelize.authenticate();
    console.log('✅ Sequelize authenticated.');

    console.log('Testing query on Visitante...');
    const visitantes = await Visitante.findAll();
    console.log(`✅ Query successful. Found ${visitantes.length} visitantes.`);
    
    if (visitantes.length > 0) {
      console.log('First visitante:', visitantes[0].toJSON());
    } else {
      console.log('Table Visitantes is empty.');
    }
  } catch (error) {
    console.error('❌ Error testing Sequelize:', error);
  } finally {
    await sequelize.close();
  }
}

testSequelize();
