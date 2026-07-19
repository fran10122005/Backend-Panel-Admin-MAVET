const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const http = require('http');
const jwt = require('jsonwebtoken');

const token = jwt.sign({ id: 'USU-00006' }, process.env.JWT_SECRET || 'secret', {
  expiresIn: '1h',
});

const boundary = '----FormBoundary' + Math.random().toString(36).substring(2);
let body = '';
body += '--' + boundary + '\r\n';
body += 'Content-Disposition: form-data; name="tipo_documento"\r\n\r\n';
body += 'foto\r\n';
body += '--' + boundary + '\r\n';
body += 'Content-Disposition: form-data; name="notas"\r\n\r\n';
body += 'Foto de prueba\r\n';
body += '--' + boundary + '\r\n';
body += 'Content-Disposition: form-data; name="archivo"; filename="test.jpg"\r\n';
body += 'Content-Type: image/jpeg\r\n\r\n';
body += 'fake-image-content\r\n';
body += '--' + boundary + '--\r\n';

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
