const request = require('supertest');
const app = require('../../src/server');
const jwt = require('jsonwebtoken');
const { sequelize, EspacioMuseo, Persona, Role, Usuario } = require('../../src/models');

let token;

let personaId;
let espacioId;

beforeAll(async () => {
  await sequelize.sync({ force: true });

  const role = await Role.create({ nombre_rol: 'Admin', permisos: 'all' });
  const usuario = await Usuario.create({ correo: 'admin@test.com', password: '123', id_rol: role.id_rol });
  token = jwt.sign({ id: usuario.id_usuario }, process.env.JWT_SECRET || 'secret');

  const espacio = await EspacioMuseo.create({ nombre_espacio: 'Auditorio Principal', capacidad: 100 });
  espacioId = espacio.id_espacio;

  const persona = await Persona.create({
    cedula: 'V-30000000',
    nombres: 'Organizador',
    apellidos: 'Test',
    fecha_de_nac: '1985-01-01'
  });
  personaId = persona.id_persona;
});

afterAll(async () => {
  await sequelize.close();
});

describe('Auditorio Solicitudes Endpoints', () => {
  it('debería rechazar una solicitud de espacio si no se provee id_persona', async () => {
    const res = await request(app)
      .post('/api/educacion/solicitudes-espacio')
      .set('Authorization', `Bearer ${token}`)
      .send({
        id_espacio: espacioId,
        motivo: 'Conferencia de Arte',
        fecha_uso: '2027-01-01'
      });

    // Validamos que falla porque id_persona es requerido
    expect(res.statusCode).toBeGreaterThanOrEqual(400);
    // Como depende del manejo de errores (puede ser validación de DB o controlador), simplemente checamos que falló.
  });

  it('debería aceptar la solicitud de espacio vinculada a una id_persona válida', async () => {
    const res = await request(app)
      .post('/api/educacion/solicitudes-espacio')
      .set('Authorization', `Bearer ${token}`)
      .send({
        id_espacio: espacioId,
        id_persona: personaId,
        motivo: 'Conferencia de Arte',
        fecha_uso: '2027-01-01',
        estado: 'Aprobada'
      });

    // Si la ruta no está plenamente montada en app.js en el entorno, puede dar 404, pero el unit test valida si responde 201/200 cuando se implemente.
    // Asumimos 201 Created o 200 OK
    expect([200, 201]).toContain(res.statusCode);
  });
});
