const authService = require('../services/auth.service');
const catchAsync = require('../../../utils/catchAsync');

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
