const http = require('http');

http.get('http://localhost:3000/api/rrhh/trabajadores', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log('Status Code:', res.statusCode);
    console.log('Response Body:', data.substring(0, 500));
  });
}).on('error', (err) => {
  console.log('Error:', err.message);
});
