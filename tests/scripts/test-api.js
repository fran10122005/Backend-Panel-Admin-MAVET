const jwt = require('jsonwebtoken');
const http = require('http');

const token = jwt.sign({ id: 1 }, 'tu_clave_secreta_super_segura_cambiame', { expiresIn: '1h' });

function req(path) {
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: 'localhost', port: 3000,
      path: '/api/educacion/solicitudes-espacio',
      method: 'GET',
      headers: { Authorization: 'Bearer ' + token }
    };
    const r = http.request(opts, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(d) }); }
        catch { resolve({ status: res.statusCode, body: d }); }
      });
    });
    r.on('error', reject);
    r.end();
  });
}

(async () => {
  try {
    const res = await req('/api/educacion/solicitudes-espacio');
    console.log('Status:', res.status);
    if (res.status === 200) {
      const events = res.body;
      console.log('Count:', events.length);
      if (events.length > 0) {
        const e = events[0];
        console.log('First event:', JSON.stringify({
          id_solicitud: e.id_solicitud,
          motivo: e.motivo,
          fecha_uso: e.fecha_uso,
          hora_inicio: e.hora_inicio,
          hora_fin: e.hora_fin,
          estado: e.estado,
          institucion: e.institucion,
          organizador: e.Persona ? e.Persona.nombres + ' ' + e.Persona.apellidos : null,
          espacio: e.EspacioMuseo ? e.EspacioMuseo.nombre : null
        }, null, 2));
      } else {
        console.log('OK - 0 events. Try creating one...');
        const persona = require('../../src/models').Persona;
        const p = await persona.findOne();
        const payload = JSON.stringify({
          id_espacio: 1,
          cedula: p ? p.cedula : 'V-TEST',
          nombre_responsable: 'Test User',
          institucion: 'Conferencia',
          fecha_uso: '2026-07-01',
          hora_inicio: '09:00:00',
          hora_fin: '17:00:00',
          motivo: 'Test Event from API',
          estado: 'Aprobada'
        });
        const r2 = await new Promise((resolve, reject) => {
          const opts = {
            hostname: 'localhost', port: 3000,
            path: '/api/educacion/solicitudes-espacio',
            method: 'POST',
            headers: {
              'Authorization': 'Bearer ' + token,
              'Content-Type': 'application/json',
              'Content-Length': Buffer.byteLength(payload)
            }
          };
          const r = http.request(opts, res => {
            let d = '';
            res.on('data', c => d += c);
            res.on('end', () => {
              try { resolve({ status: res.statusCode, body: JSON.parse(d) }); }
              catch { resolve({ status: res.statusCode, body: d }); }
            });
          });
          r.on('error', reject);
          r.write(payload);
          r.end();
        });
        console.log('POST status:', r2.status);
        console.log('POST body:', JSON.stringify(r2.body));
      }
    } else {
      console.log('Error body:', JSON.stringify(res.body));
    }
  } catch(e) { console.error('Error:', e.message); }
  process.exit(0);
})();
