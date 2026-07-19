require('dotenv').config();
const { sequelize, Trabajador, TrabajadorDocumento } = require('./src/models');
const docService = require('./src/modules/rrhh/services/trabajadorDocumento.service');
const fs = require('fs');
const path = require('path');

async function test() {
  try {
    await sequelize.authenticate();
    const trabajador = await Trabajador.findOne({ raw: true });
    const id = trabajador.id_trabajador;
    console.log('Testing document upload for:', id);

    // Create a test file
    const testPath = path.join(__dirname, 'test_upload_real.txt');
    fs.writeFileSync(testPath, 'Test document content');

    const fakeFile = {
      path: testPath,
      originalname: 'test_upload_real.txt',
      mimetype: 'application/pdf', // Use valid mimetype
      size: 21,
    };

    try {
      const doc = await docService.subirDocumento(id, fakeFile, 'otro', 'Nota de prueba');
      console.log('✅ Document created successfully:', doc.id_documento);

      // Clean up - delete the document
      await TrabajadorDocumento.destroy({ where: { id_documento: doc.id_documento }, force: true });
      console.log('✅ Document cleaned up');
    } catch (err) {
      console.error('❌ Error creating document:', err.message);
    }

    if (fs.existsSync(testPath)) fs.unlinkSync(testPath);
  } catch (err) {
    console.error('DB Error:', err.message);
  } finally {
    await sequelize.close();
  }
}
test();
