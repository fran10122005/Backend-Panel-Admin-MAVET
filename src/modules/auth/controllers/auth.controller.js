const authService = require('../services/auth.service');
const catchAsync = require('../../../utils/catchAsync');
const { Usuario, Role } = require('../../../models');
const { generateTablePdf } = require('../../../utils/pdfGenerator');

exports.register = catchAsync(async (req, res) => {
  const result = await authService.register(req.body);
  
  res.status(201).json({
    status: 'success',
    data: result
  });
});

exports.login = catchAsync(async (req, res) => {
  const { correo, password } = req.body;
  const result = await authService.login(correo, password);

  res.status(200).json({
    status: 'success',
    data: result
  });
});

exports.getMe = catchAsync(async (req, res) => {
  // El usuario ya viene del authMiddleware
  res.status(200).json({
    status: 'success',
    data: {
      usuario: req.user
    }
  });
});

exports.getAllUsuarios = catchAsync(async (req, res) => {
  const usuarios = await Usuario.findAll({
    include: [
      { model: Role },
      { 
        model: require('../../../models').Trabajador,
        include: [{ model: require('../../../models').CargoTrabajador }] 
      }
    ],
    order: [['id_usuario', 'DESC']]
  });

  res.status(200).json({
    status: 'success',
    data: usuarios
  });
});

exports.forgotPassword = catchAsync(async (req, res) => {
  const { correo } = req.body;
  await authService.forgotPassword(correo);

  // Siempre respondemos el mismo mensaje por seguridad (no revelamos si el correo existe)
  res.status(200).json({
    status: 'success',
    message: 'Si el correo está registrado en el sistema, recibirás un enlace de recuperación en breve.'
  });
});

exports.resetPassword = catchAsync(async (req, res) => {
  const { token, nuevaPassword } = req.body;
  await authService.resetPassword(token, nuevaPassword);

  res.status(200).json({
    status: 'success',
    message: 'Contraseña actualizada exitosamente. Ya puedes iniciar sesión con tu nueva contraseña.'
  });
});

exports.exportUsuariosPdf = catchAsync(async (req, res) => {
  const usuarios = await Usuario.findAll({
    include: [{ model: Role }],
    order: [['id_usuario', 'DESC']]
  });

  const title = "Reporte de Usuarios del Sistema";
  
  const headers = [
    { label: "ID", property: "id", width: 50 },
    { label: "Nombre de Usuario", property: "nombre_usuario", width: 150 },
    { label: "Correo", property: "correo", width: 150 },
    { label: "Rol", property: "rol", width: 100 },
    { label: "Fecha Registro", property: "fecha", width: 100 }
  ];

  const rows = usuarios.map(u => [
    (u.id_usuario || u.id).toString(),
    u.nombre_usuario,
    u.correo,
    u.Role ? u.Role.nombre_rol : 'N/A',
    u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'
  ]);

  await generateTablePdf(res, title, headers, rows, 'usuarios_mavet.pdf');
});

exports.updateMe = catchAsync(async (req, res) => {
  await authService.updateMe(req.user.id_usuario, req.body);
  
  res.status(200).json({
    status: 'success',
    message: 'Perfil actualizado exitosamente'
  });
});

exports.updateUsuario = catchAsync(async (req, res) => {
  const usuario = await authService.updateUsuario(req.params.id, req.body);
  res.status(200).json({
    status: 'success',
    message: 'Usuario actualizado exitosamente',
    data: usuario
  });
});

