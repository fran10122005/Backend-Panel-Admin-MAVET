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

async function generarIdHorario() {
  const lastRecord = await TrabajadorHorario.findOne({
    order: [['id_horario', 'DESC']],
    raw: true,
    paranoid: false,
  });
  let newNumber = 1;
  if (lastRecord && lastRecord.id_horario && lastRecord.id_horario.startsWith('THO-')) {
    const lastNumber = parseInt(lastRecord.id_horario.replace('THO-', ''), 10);
    if (!isNaN(lastNumber)) newNumber = lastNumber + 1;
  }
  return `THO-${String(newNumber).padStart(5, '0')}`;
}

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

    const existente = await TrabajadorHorario.findOne({
      where: { id_trabajador, dia_semana },
    });

    let horario;
    if (existente) {
      existente.hora_entrada = hora_entrada || HORA_ENTRADA_DEFAULT;
      existente.hora_salida = hora_salida || HORA_SALIDA_DEFAULT;
      existente.es_dia_laborable = es_dia_laborable !== undefined ? es_dia_laborable : true;
      existente.observaciones = observaciones || null;
      horario = await existente.save();
    } else {
      const id_horario = await generarIdHorario();
      horario = await TrabajadorHorario.create({
        id_horario,
        id_trabajador,
        dia_semana,
        hora_entrada: hora_entrada || HORA_ENTRADA_DEFAULT,
        hora_salida: hora_salida || HORA_SALIDA_DEFAULT,
        es_dia_laborable: es_dia_laborable !== undefined ? es_dia_laborable : true,
        observaciones: observaciones || null,
      });
    }

    resultados.push({
      ...horario.toJSON(),
      created: !existente,
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

  for (const h of horariosPredeterminados) {
    h.id_horario = await generarIdHorario();
  }
  await TrabajadorHorario.bulkCreate(horariosPredeterminados);

  return await this.obtenerHorario(id_trabajador);
};

exports.crearHorario = async (id_trabajador, data) => {
  const trabajador = await Trabajador.findByPk(id_trabajador);
  if (!trabajador) throw new AppError('Trabajador no encontrado', 404);

  const { dia_semana, hora_entrada, hora_salida, es_dia_laborable, observaciones } = data;

  if (dia_semana === undefined || dia_semana < 0 || dia_semana > 6) {
    throw new AppError('Día de la semana inválido (0-6)', 400);
  }

  const existente = await TrabajadorHorario.findOne({
    where: { id_trabajador, dia_semana },
  });

  let horario;
  if (existente) {
    existente.hora_entrada = hora_entrada || HORA_ENTRADA_DEFAULT;
    existente.hora_salida = hora_salida || HORA_SALIDA_DEFAULT;
    existente.es_dia_laborable = es_dia_laborable !== undefined ? es_dia_laborable : true;
    existente.observaciones = observaciones || null;
    horario = await existente.save();
  } else {
    const id_horario = await generarIdHorario();
    horario = await TrabajadorHorario.create({
      id_horario,
      id_trabajador,
      dia_semana,
      hora_entrada: hora_entrada || HORA_ENTRADA_DEFAULT,
      hora_salida: hora_salida || HORA_SALIDA_DEFAULT,
      es_dia_laborable: es_dia_laborable !== undefined ? es_dia_laborable : true,
      observaciones: observaciones || null,
    });
  }

  return { ...horario.toJSON(), created: !existente };
};

exports.crearHorariosCompletos = async (id_trabajador) => {
  const trabajador = await Trabajador.findByPk(id_trabajador);
  if (!trabajador) throw new AppError('Trabajador no encontrado', 404);

  const existentes = await TrabajadorHorario.count({ where: { id_trabajador } });
  if (existentes > 0) {
    throw new AppError('El trabajador ya tiene horarios configurados', 400);
  }

  const horariosPredeterminados = DIAS_SEMANA.map((dia) => ({
    id_trabajador,
    dia_semana: dia.value,
    hora_entrada: HORA_ENTRADA_DEFAULT,
    hora_salida: HORA_SALIDA_DEFAULT,
    es_dia_laborable: dia.value >= 1 && dia.value <= 5,
    observaciones:
      dia.value >= 1 && dia.value <= 5 ? 'Horario laboral estándar 9am-5pm' : 'Día no laborable',
  }));

  for (const h of horariosPredeterminados) {
    h.id_horario = await generarIdHorario();
  }
  const horarios = await TrabajadorHorario.bulkCreate(horariosPredeterminados);
  return horarios;
};

exports.obtenerHorarios = async (id_trabajador) => {
  return await TrabajadorHorario.findAll({
    where: { id_trabajador },
    order: [['dia_semana', 'ASC']],
  });
};

exports.obtenerHorariosCompletos = async (id_trabajador) => {
  return await exports.obtenerHorario(id_trabajador);
};

exports.actualizarHorario = async (id_trabajador, dia_semana, data) => {
  const horario = await TrabajadorHorario.findOne({
    where: { id_trabajador, dia_semana },
  });
  if (!horario) throw new AppError('No hay horario configurado para este día', 404);

  const { hora_entrada, hora_salida, es_dia_laborable, observaciones } = data;
  if (hora_entrada !== undefined) horario.hora_entrada = hora_entrada;
  if (hora_salida !== undefined) horario.hora_salida = hora_salida;
  if (es_dia_laborable !== undefined) horario.es_dia_laborable = es_dia_laborable;
  if (observaciones !== undefined) horario.observaciones = observaciones;

  await horario.save();
  return horario;
};

exports.eliminarHorario = async (id_trabajador, dia_semana) => {
  return await exports.eliminarHorarioDia(id_trabajador, dia_semana);
};

exports.DIAS_SEMANA = DIAS_SEMANA;
exports.HORA_ENTRADA_DEFAULT = HORA_ENTRADA_DEFAULT;
exports.HORA_SALIDA_DEFAULT = HORA_SALIDA_DEFAULT;
