const ingresoService = require('../services/ingreso.service');
const catchAsync = require('../../../utils/catchAsync');

exports.checkVisitante = catchAsync(async (req, res) => {
  const visitante = await ingresoService.checkVisitante(req.params.cedula);
  
  // Por seguridad en el endpoint público, NO devolvemos todo el objeto persona
  // Solo devolvemos si existe, y el primer nombre para darle la bienvenida
  res.status(200).json({
    existe: !!visitante,
    nombre: visitante ? visitante.nombres.split(' ')[0] : null
  });
});

exports.registrarAutoIngreso = catchAsync(async (req, res) => {
  // Para auto-ingresos forzamos 0 acompañantes, ya que las visitas 
  // grupales/institucionales DEBEN ser manejadas por el recepcionista.
  const payloadSeguro = {
    ...req.body,
    cantidad_acompanantes: 0 
  };
  
  const result = await ingresoService.registrarIngreso(payloadSeguro);
  
  res.status(201).json({
    message: 'Auto-ingreso registrado correctamente',
    success: true
  });
});
