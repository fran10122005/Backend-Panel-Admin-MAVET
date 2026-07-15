const cron = require('node-cron');
const { SolicitudEspacio } = require('./models');

const startCronJobs = () => {
  // Check every 5 minutes
  cron.schedule('*/5 * * * *', async () => {
    try {
      console.log('[CRON] Verificando reservas pendientes pasadas...');
      const now = new Date();

      const reservas = await SolicitudEspacio.findAll({
        where: { estado: 'Pendiente', estatus_aprobacion: 'aprobado' },
      });

      let actualizadas = 0;
      for (const reserva of reservas) {
        let fecha = reserva.fecha_uso || reserva.fecha_solicitada;
        if (fecha instanceof Date) fecha = fecha.toISOString().split('T')[0];
        else if (typeof fecha === 'string' && fecha.includes('T')) fecha = fecha.split('T')[0];

        const horaFin = reserva.hora_fin;
        if (fecha && horaFin) {
          const eventEnd = new Date(`${fecha}T${horaFin}`);
          if (eventEnd < now) {
            await reserva.update({ estado: 'Realizada' });
            actualizadas++;
          }
        }
      }

      if (actualizadas > 0) {
        console.log(`[CRON] Se actualizaron ${actualizadas} reservas a estado Realizada.`);
      }
    } catch (error) {
      console.error('[CRON] Error actualizando reservas:', error);
    }
  });
};

module.exports = startCronJobs;
