const http = require('http');
const req = http.get('http://localhost:4000/', (res) => {
  let data = '';
  res.on('data', (chunk) => (data += chunk));
  res.on('end', () => {
    console.log('STATUS:', res.statusCode);
    console.log('BODY:', data);
  });
});
req.on('error', (e) => console.error('ERR:', e.message));
req.end();
