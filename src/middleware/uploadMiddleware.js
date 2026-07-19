const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(__dirname, '../../public/uploads');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    cb(
      null,
      `file_${Date.now()}_${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`
    );
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten imágenes'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024,
  },
});

const compressImage = async (req, res, next) => {
  if (!req.file) return next();

  try {
    const sharp = require('sharp');
    const inputPath = req.file.path;
    const ext = path.extname(inputPath).toLowerCase();
    const tmpPath = inputPath + '_tmp' + ext;

    let pipeline = sharp(inputPath);

    const metadata = await sharp(inputPath).metadata();

    if (metadata.width > 2000) {
      pipeline = pipeline.resize(2000, undefined, { fit: 'inside', withoutEnlargement: true });
    }

    if (['.jpg', '.jpeg'].includes(ext)) {
      pipeline = pipeline.jpeg({ quality: 80, mozjpeg: true });
    } else if (ext === '.png') {
      pipeline = pipeline.png({ quality: 80, compressionLevel: 9 });
    } else if (ext === '.webp') {
      pipeline = pipeline.webp({ quality: 80 });
    } else if (ext === '.avif') {
      pipeline = pipeline.avif({ quality: 70 });
    }

    await pipeline.toFile(tmpPath);

    const stats = fs.statSync(tmpPath);
    if (stats.size < req.file.size) {
      fs.unlinkSync(inputPath);
      fs.renameSync(tmpPath, inputPath);
      req.file.size = stats.size;
      req.file.filename = path.basename(inputPath);
      req.file.path = inputPath;
    } else {
      fs.unlinkSync(tmpPath);
    }
  } catch (err) {
    console.error('Error comprimiendo imagen:', err);
  }

  next();
};

upload.compress = compressImage;

const documentStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(__dirname, '../../public/uploads/documents');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    cb(
      null,
      `doc_${Date.now()}_${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`
    );
  },
});

const documentFileFilter = (req, file, cb) => {
  const allowedMimes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/png',
    'image/jpg',
    'image/webp',
  ];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de archivo no permitido. Solo PDF, DOC, DOCX, XLS, XLSX, JPG, PNG'), false);
  }
};

const documentUpload = multer({
  storage: documentStorage,
  fileFilter: documentFileFilter,
  limits: {
    fileSize: 20 * 1024 * 1024,
  },
});

upload.document = documentUpload;

module.exports = upload;
