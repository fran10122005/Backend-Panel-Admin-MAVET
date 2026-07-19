const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const http = require('http');
const jwt = require('jsonwebtoken');

// Use USU-00006 (adminmavet@gmail.com) which likely exists
const token = jwt.sign({ id: 'USU-00006' }, process.env.JWT_SECRET || 'secret', {
  expiresIn: '1h',
});
console.log('Token:', token);

const body = JSON.stringify([
  {
    dia_semana: 1,
    hora_entrada: '09:00',
    hora_salida: '17:00',
    es_dia_laborable: true,
    observaciones: 'Test',
  },
]);

const options = {
  hostname: 'localhost',
  port: 4000,
  path: '/api/rrhh/trabajadores/TRB-00007/horarios/bulk',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
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
