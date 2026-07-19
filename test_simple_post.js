const http = require('http');
const token =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IlVTVS0wMDAwNiIsImlhdCI6MTc4NDQzMTgwMiwiZXhwIjoxNzg0NDM1NDAyfQ.GX0KagcMYq2SAyqyz76oyceUIqt4sUb7ELYMydGL5GY';
const body = JSON.stringify({
  dia_semana: 2,
  hora_entrada: '09:00',
  hora_salida: '17:00',
  es_dia_laborable: true,
});
const options = {
  hostname: 'localhost',
  port: 4000,
  path: '/api/rrhh/trabajadores/TRB-00007/horarios',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: 'Bearer ' + token,
    'Content-Length': Buffer.byteLength(body),
  },
};
const req = http.request(options, (res) => {
  let d = '';
  res.on('data', (c) => (d += c));
  res.on('end', () => {
    console.log('S:', res.statusCode);
    console.log('B:', d);
  });
});
req.on('error', (e) => console.error('E:', e.message));
req.write(body);
req.end();
