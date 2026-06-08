const request = require('supertest');
const app = require('../../src/server');
const { sequelize, Persona, MotivoVisita, RegistroIngreso, AlumnoRepresentante } = require('../../src/models');

let adultoId;
let motivoId;

beforeAll(async () => {
  await sequelize.sync({ force: true });

  const motivo = await MotivoVisita.create({ descripcion: 'Visita general' });
  motivoId = motivo.id_motivo;

  const adulto = await Persona.create({
    cedula: 'V-20000000',
    nombres: 'Carlos',
    apellidos: 'Gómez',
    fecha_de_nac: '1990-01-01'
  });
  adultoId = adulto.id_persona;
});

afterAll(async () => {
  await sequelize.close();
});

describe('Registro Ingreso Endpoints', () => {
  it('debería rechazar el registro de un menor de edad sin id_representante_persona', async () => {
    const res = await request(app)
      .post('/api/visitantes/ingresos') // Asumiendo esta ruta base para ingresos
      .send({
        nombres: 'Niño',
        apellidos: 'Sin Representante',
        fecha_de_nac: new Date(new Date().setFullYear(new Date().getFullYear() - 8)).toISOString().split('T')[0],
        id_motivo: motivoId
      });

    expect(res.statusCode).toEqual(400); // Bad Request o Internal Server Error si es handleado genéricamente, asumiendo 400 por AppError
    expect(res.body.message).toContain('Todo menor de 18 años debe tener un representante');
  });

  it('debería registrar un menor, generar su cédula derivada y crear el vínculo atómico', async () => {
    const res = await request(app)
      .post('/api/visitantes/ingresos')
      .send({
        nombres: 'Niño',
        apellidos: 'Con Representante',
        fecha_de_nac: new Date(new Date().setFullYear(new Date().getFullYear() - 5)).toISOString().split('T')[0],
        id_motivo: motivoId,
        id_representante_persona: adultoId
      });

    expect(res.statusCode).toEqual(201);
    expect(res.body.data.persona.cedula).toMatch(/^V-20000000-\d+$/); // Cédula derivada
    
    // Verificar que el ingreso existe
    const ingreso = await RegistroIngreso.findOne({ where: { id_persona: res.body.data.persona.id_persona }});
    expect(ingreso).not.toBeNull();

    // Verificar que se creó el vínculo en AlumnoRepresentante
    const vinculos = await AlumnoRepresentante.findAll();
    expect(vinculos.length).toBeGreaterThan(0);
  });
});
