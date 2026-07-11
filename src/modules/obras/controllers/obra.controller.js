const obraService = require('../services/obra.service');
const catchAsync = require('../../../utils/catchAsync');
const AppError = require('../../../utils/AppError');

exports.createObra = catchAsync(async (req, res) => {
  const data = { ...req.body };
  if (req.file) {
    const cloudinary = require('../../../config/cloudinary');
    const fs = require('fs');
    try {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'mavet_uploads',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'avif'],
      });
      data.imagen_url = result.secure_url;
    } catch (err) {
      console.error('Error uploading image to Cloudinary', err);
      throw new AppError('Error al procesar la imagen.', 500);
    } finally {
      try {
        fs.unlinkSync(req.file.path);
      } catch (_) {
        /* ignore */
      }
    }
  }
  const obra = await obraService.createObra(data);
  res.status(201).json({ message: 'Obra creada correctamente', data: obra });
});

exports.getAllObras = catchAsync(async (req, res) => {
  const page = req.query.page ? parseInt(req.query.page, 10) : null;
  const limit = req.query.limit ? parseInt(req.query.limit, 10) : 20;
  const result = await obraService.getAllObras(page, limit);
  res.status(200).json(result);
});

exports.getObrasPublicas = catchAsync(async (req, res) => {
  const page = req.query.page ? parseInt(req.query.page, 10) : null;
  const limit = req.query.limit ? parseInt(req.query.limit, 10) : 20;
  const result = await obraService.getObrasPublicas(page, limit);
  res.status(200).json(result);
});

exports.getObraById = catchAsync(async (req, res) => {
  const obra = await obraService.getObraById(req.params.id);
  res.status(200).json(obra);
});

exports.updateObra = catchAsync(async (req, res) => {
  const data = { ...req.body };
  if (req.file) {
    const cloudinary = require('../../../config/cloudinary');
    const fs = require('fs');
    try {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'mavet_uploads',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'avif'],
      });
      data.imagen_url = result.secure_url;
    } catch (err) {
      console.error('Error uploading image to Cloudinary', err);
      throw new AppError('Error al procesar la imagen.', 500);
    } finally {
      try {
        fs.unlinkSync(req.file.path);
      } catch (_) {
        /* ignore */
      }
    }
  }
  const obra = await obraService.updateObra(req.params.id, data);
  res.status(200).json({ message: 'Obra actualizada correctamente', data: obra });
});

exports.deleteObra = catchAsync(async (req, res) => {
  await obraService.deleteObra(req.params.id);
  res.status(200).json({ message: 'Obra eliminada de la base de datos' });
});
