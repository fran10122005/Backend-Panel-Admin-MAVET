require('dotenv').config();
const { sequelize, Trabajador, TrabajadorHorario } = require('./src/models');
const horarioService = require('./src/modules/rrhh/services/trabajadorHorario.service');

async function test() {
  try {
    await sequelize.authenticate();
    console.log('Testing horario operations...\n');

    const trabajador = await Trabajador.findOne({ raw: true });
    const id = trabajador.id_trabajador;
    console.log('Trabajador:', id);

    // Test 1: Get horarios for existing worker
    const horariosExistentes = await horarioService.obtenerHorariosCompletos(id);
    console.log('✅ Get horarios completos:', horariosExistentes.length, 'records');

    // Test 2: crearOActualizarHorario (bulk save)
    const horariosTest = [
      {
        dia_semana: 0,
        hora_entrada: '09:00',
        hora_salida: '17:00',
        es_dia_laborable: false,
        observaciones: 'No laborable',
      },
      {
        dia_semana: 1,
        hora_entrada: '08:00',
        hora_salida: '16:00',
        es_dia_laborable: true,
        observaciones: 'Test Lunes',
      },
    ];

    const result = await horarioService.crearOActualizarHorario(id, horariosTest);
    console.log('✅ crearOActualizarHorario result:', result.length, 'records');

    // Test 3: actualizarHorario
    const updated = await horarioService.actualizarHorario(id, 1, {
      hora_entrada: '09:00',
      hora_salida: '17:00',
      es_dia_laborable: true,
      observaciones: 'Restored',
    });
    console.log('✅ actualizarHorario result:', updated.id_horario);

    console.log('\n✅ All horario tests PASSED!');
  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error(err.stack?.split('\n').slice(0, 5).join('\n'));
  } finally {
    await sequelize.close();
  }
}
test();
