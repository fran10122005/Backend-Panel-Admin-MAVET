const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const cloudinary = require('./src/config/cloudinary');
const fs = require('fs');

const testFile = path.join(__dirname, 'test_upload.txt');
fs.writeFileSync(testFile, 'test content');

cloudinary.uploader
  .upload(testFile, {
    folder: 'mavet_uploads/test',
    resource_type: 'auto',
  })
  .then((result) => {
    console.log('Cloudinary upload success:', result.secure_url);
    fs.unlinkSync(testFile);
  })
  .catch((err) => {
    console.error('Cloudinary error:', err.message);
    console.error('Cloudinary error details:', err);
    fs.unlinkSync(testFile);
  });
