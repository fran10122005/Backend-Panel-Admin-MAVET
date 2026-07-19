const { TrabajadorHorario, Trabajador } = require('../../../models');
const AppError = require('../../../utils/AppError');

const DIAS_SEMANA = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Lunes' },
  { value: 2, label: 'Martes' },
  { value: 3, label: 'Miércoles' },
  { value: 4, label: 'Jueves' },
  { value: 5, label: 'Viernes' },
  { value: 6, label: 'Sábado' },
];

const HORA_ENTRADA_DEFAULT = '09:00:00';
const HORA_SALIDA_DEFAULT = '17:00:00';

exports.obtenerHorario = async (id_trabajador) => {
  const trabajador = await Trabajador.findByPk(id_trabajador);
  if (!trabajador) throw new AppError('Trabajador no encontrado', 404);

  const horarios = await TrabajadorHorario.findAll({
    where: { id_trabajador },
    order: [['dia_semana', 'ASC']],
  });

  // Asegurar que existan todos los días
  const horarioCompleto = DIAS_SEMANA.map((dia) => {
    const existente = horarios.find((h) => h.dia_semana === dia.value);
    return (
      existente || {
        id_horario: null,
        id_trabajador,
        dia_semana: dia.value,
        dia_label: dia.label,
        hora_entrada: HORA_ENTRADA_DEFAULT,
        hora_salida: HORA_SALIDA_DEFAULT,
        es_dia_laborable: dia.value >= 1 && dia.value <= 5, // Lunes a Viernes
        observaciones: null,
      }
    );
  });

  return horarioCompleto;
};

exports.crearOActualizarHorario = async (id_trabajador, horariosArray) => {
  const trabajador = await Trabajador.findByPk(id_trabajador);
  if (!trabajador) throw new AppError('Trabajador no encontrado', 404);

  const resultados = [];

  for (const item of horariosArray) {
    const { dia_semana, hora_entrada, hora_salida, es_dia_laborable, observaciones } = item;

    if (dia_semana === undefined || dia_semana === null) {
      throw new AppError('dia_semana es requerido', 400);
    }
    if (dia_semana < 0 || dia_semana > 6) {
      throw new AppError('dia_semana debe estar entre 0 (Domingo) y 6 (Sábado)', 400);
    }

    const [horario, created] = await TrabajadorHorario.upsert({
      id_trabajador,
      dia_semana,
      hora_entrada: hora_entrada || HORA_ENTRADA_DEFAULT,
      hora_salida: hora_salida || HORA_SALIDA_DEFAULT,
      es_dia_laborable: es_dia_laborable !== undefined ? es_dia_laborable : true,
      observaciones: observaciones || null,
    });

    resultados.push({
      ...horario.toJSON(),
      created,
    });
  }

  return resultados;
};

exports.obtenerHorarioDia = async (id_trabajador, dia_semana) => {
  return await TrabajadorHorario.findOne({
    where: { id_trabajador, dia_semana },
  });
};

exports.eliminarHorarioDia = async (id_trabajador, dia_semana) => {
  const horario = await TrabajadorHorario.findOne({
    where: { id_trabajador, dia_semana },
  });
  if (!horario) throw new AppError('No hay horario configurado para este día', 404);

  await horario.destroy();
  return true;
};

exports.inicializarHorarioPredeterminado = async (id_trabajador) => {
  const trabajador = await Trabajador.findByPk(id_trabajador);
  if (!trabajador) throw new AppError('Trabajador no encontrado', 404);

  // Verificar si ya tiene horarios
  const existentes = await TrabajadorHorario.count({ where: { id_trabajador } });
  if (existentes > 0) {
    throw new AppError(
      'El trabajador ya tiene horarios configurados. Use la edición individual.',
      400
    );
  }

  const horariosPredeterminados = DIAS_SEMANA.map((dia, index) => ({
    id_trabajador,
    dia_semana: dia.value,
    hora_entrada: HORA_ENTRADA_DEFAULT,
    hora_salida: HORA_SALIDA_DEFAULT,
    es_dia_laborable: dia.value >= 1 && dia.value <= 5, // Lunes a Viernes
    observaciones:
      index >= 1 && index <= 5 ? 'Horario laboral estándar 9am-5pm' : 'Día no laborable',
  }));

  await TrabajadorHorario.bulkCreate(horariosPredeterminados);

  return await this.obtenerHorario(id_trabajador);
};

exports.DIAS_SEMANA = DIAS_SEMANA;
exports.HORA_ENTRADA_DEFAULT = HORA_ENTRADA_DEFAULT;
exports.HORA_SALIDA_DEFAULT = HORA_SALIDA_DEFAULT;
