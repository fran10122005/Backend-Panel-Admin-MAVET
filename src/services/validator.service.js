const { Op } = require('sequelize');
const AppError = require('../utils/AppError');

/**
 * Valida si una fecha es anterior al día de hoy (basado en el servidor de base de datos).
 * Lanza un error 403 si la validación falla.
 *
 * @param {string|Date} fecha - Fecha a validar.
 * @param {object} sequelize - Instancia de Sequelize para consultar CURRENT_DATE.
 * @param {string} action - 'editar' o 'eliminar', usado para el mensaje de error.
 */
const validarFechaPasada = async (fecha, sequelize, action = 'editar', hora_inicio = null) => {
  if (!fecha) return;

  let parsedDate;
  if (typeof fecha === 'string') {
    const parts = fecha.split('-');
    parsedDate = new Date(parts[0], parts[1] - 1, parts[2]);
  } else {
    parsedDate = new Date(fecha);
  }

  const [results] = await sequelize.query('SELECT CURRENT_DATE AS db_date');
  const dbDate = new Date(results[0].db_date);
  dbDate.setHours(0, 0, 0, 0);

  if (parsedDate < dbDate) {
    throw new AppError(
      `Error 403 Forbidden: No se pueden ${action} solicitudes de eventos pasados`,
      403
    );
  }

  // Si la fecha es exactamente hoy, validar que la hora de inicio no haya pasado
  if (parsedDate.getTime() === dbDate.getTime() && hora_inicio) {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const [startHour, startMinute] = hora_inicio.split(':').map(Number);

    if (startHour < currentHour || (startHour === currentHour && startMinute < currentMinute)) {
      throw new AppError(
        `Error 403 Forbidden: No se pueden crear reservas en horas que ya han pasado el día de hoy`,
        403
      );
    }
  }
};

/**
 * Valida que la fecha pertenezca al mes en curso.
 */
const validarMesPresente = async (fecha, sequelize) => {
  if (!fecha) return;

  let parsedDate;
  if (typeof fecha === 'string') {
    const parts = fecha.split('-');
    parsedDate = new Date(parts[0], parts[1] - 1, parts[2]);
  } else {
    parsedDate = new Date(fecha);
  }

  const [results] = await sequelize.query('SELECT CURRENT_DATE AS db_date');
  const dbDate = new Date(results[0].db_date);

  if (
    parsedDate.getMonth() !== dbDate.getMonth() ||
    parsedDate.getFullYear() !== dbDate.getFullYear()
  ) {
    throw new AppError(
      'Error 400 Bad Request: Las reservas solo están permitidas para el mes en curso',
      400
    );
  }
};

/**
 * Valida si un intervalo de horario (horaInicio - horaFin) se solapa con
 * registros existentes en una fecha específica.
 * Fórmula: (R1.hora_inicio < R2.hora_fin) AND (R1.hora_fin > R2.hora_inicio)
 *
 * @param {object} model - Modelo Sequelize a consultar (ej. SolicitudEspacio).
 * @param {string} id_espacio - ID del espacio a validar (ej. Auditorio).
 * @param {string|Date} fecha_uso - Fecha en la que ocurrirá el evento.
 * @param {string} hora_inicio - Hora de inicio (formato HH:mm:ss o HH:mm).
 * @param {string} hora_fin - Hora de fin (formato HH:mm:ss o HH:mm).
 * @param {string} idExcluido - ID del registro actual (para ignorarlo en la actualización).
 * @param {string} dateField - Nombre de la columna de fecha en la BD (por defecto 'fecha_uso').
 */
const validarSolapamientoHorario = async (
  model,
  id_espacio,
  fecha_uso,
  hora_inicio,
  hora_fin,
  idExcluido = null,
  dateField = 'fecha_uso'
) => {
  if (!fecha_uso || !hora_inicio || !hora_fin) return;

  const whereClause = {
    id_espacio,
    [dateField]: fecha_uso,
    hora_inicio: { [Op.lt]: hora_fin },
    hora_fin: { [Op.gt]: hora_inicio },
    // Ignorar solicitudes rechazadas o canceladas si es necesario (asumiremos que todo lo que no esté cancelado ocupa espacio,
    // o podemos simplemente bloquear todo solapamiento independientemente del estado).
    // Para simplificar, buscaremos solapamiento en cualquier estado a menos que se indique lo contrario.
  };

  if (idExcluido) {
    // Obtenemos el nombre del campo primary key del modelo
    const pkField = model.primaryKeyAttribute;
    if (pkField) {
      whereClause[pkField] = { [Op.ne]: idExcluido };
    }
  }

  const solapamiento = await model.findOne({ where: whereClause, raw: true });

  if (solapamiento) {
    // Formatear horas a am/pm
    const formatTime = (timeStr) => {
      if (!timeStr) return '';
      let [hours, minutes] = timeStr.split(':');
      hours = parseInt(hours, 10);
      const ampm = hours >= 12 ? 'pm' : 'am';
      hours = hours % 12 || 12;
      return `${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;
    };

    const start = formatTime(solapamiento.hora_inicio);
    const end = formatTime(solapamiento.hora_fin);

    throw new AppError(
      `El Horario de ${start} a ${end} no esta disponible, Por favor, elige otra hora para tu reserva.`,
      409
    );
  }
};

module.exports = {
  validarFechaPasada,
  validarSolapamientoHorario,
  validarMesPresente,
};
