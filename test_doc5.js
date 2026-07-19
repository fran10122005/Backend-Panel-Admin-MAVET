const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const http = require('http');
const jwt = require('jsonwebtoken');

const token = jwt.sign({ id: 'USU-00006' }, process.env.JWT_SECRET || 'secret', {
  expiresIn: '1h',
});
console.log('Token:', token);

const boundary = '----TestBoundary' + Math.random().toString(36).substring(2, 15);

const lines = [];
lines.push('--' + boundary);
lines.push('Content-Disposition: form-data; name="tipo_documento"');
lines.push('');
lines.push('foto');
lines.push('--' + boundary);
lines.push('Content-Disposition: form-data; name="notas"');
lines.push('');
lines.push('Foto de prueba');
lines.push('--' + boundary);
lines.push('Content-Disposition: form-data; name="archivo"; filename="test.jpg"');
lines.push('Content-Type: image/jpeg');
lines.push('');
lines.push('fake-image-content');
lines.push('--' + boundary + '--');

const body = lines.join('\r\n') + '\r\n';
console.log('Body length:', Buffer.byteLength(body));

const options = {
  hostname: 'localhost',
  port: 4000,
  path: '/api/rrhh/trabajadores/TRB-00010/documentos',
  method: 'POST',
  headers: {
    'Content-Type': 'multipart/form-data; boundary=' + boundary,
    Authorization: 'Bearer ' + token,
    'Content-Length': Buffer.byteLength(body),
  },
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => (data += chunk));
  res.on('end', () => {
    console.log('STATUS:', res.statusCode);
    console.log('BODY:', data);
  });
});
req.on('error', (e) => console.error('ERR:', e.message));
req.write(body);
req.end();
