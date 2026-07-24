/* eslint-disable no-console */
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
require('dotenv').config();

// Base de datos y Modelos centralizados
const { sequelize } = require('./models');

// Middlewares de error y autenticación
const { notFound, errorHandler } = require('./middleware/errorHandler');
const { verifyToken } = require('./middleware/authMiddleware');
const startCronJobs = require('./cronJobs');

const app = express();

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 500 : 10000,
  message: 'Demasiadas peticiones desde esta IP, por favor intente de nuevo en 15 minutos.',
});

// Middlewares globales
app.use(helmet());
app.use(cookieParser());

// CORS Configurado
const allowedOrigins = [
  process.env.FRONTEND_URL,
  ...(process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : []),
  'http://localhost:5173',
  'http://localhost:3000',
].filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin) || origin.startsWith('http://localhost:')) {
      callback(null, true);
    } else {
      callback(new Error('No permitido por CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// File upload routes — deben ir antes de express.json() en Express 5
const upload = require('./middleware/uploadMiddleware');
const { subirFotoPerfil, eliminarFotoPerfil } = require('./modules/auth/services/auth.service');
const catchAsync = require('./utils/catchAsync');

app.post(
  '/api/auth/me/foto',
  upload.single('foto'),
  upload.compress,
  verifyToken,
  catchAsync(async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ status: 'error', message: 'No se envió ninguna imagen' });
    }
    const url = await subirFotoPerfil(req.user.id_usuario, req.file.path);
    res.status(200).json({ status: 'success', url });
  })
);

app.delete(
  '/api/auth/me/foto',
  verifyToken,
  catchAsync(async (req, res) => {
    await eliminarFotoPerfil(req.user.id_usuario);
    res.status(200).json({ status: 'success', message: 'Foto eliminada correctamente' });
  })
);

// Express 5: body parsers pueden consumir el stream de multipart antes que multer
// Saltamos express.json() para peticiones multipart
app.use((req, res, next) => {
  if (req.headers['content-type']?.startsWith('multipart/form-data')) {
    next();
  } else {
    express.json()(req, res, next);
  }
});
app.use(morgan('dev'));

// Servir archivos estáticos
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

// Aplicar rate limiter solo a la API
app.use('/api', limiter);

// Cache
const cacheService = require('./services/cache.service');
const { cache, limpiarCache } = require('./middleware/cacheMiddleware');

function cacheGet(ttl) {
  return (req, res, next) => {
    if (req.method !== 'GET') return next();
    cache(ttl)(req, res, next);
  };
}

// Rutas de la API
const rrhhRoutes = require('./modules/rrhh/routes');
const obrasRoutes = require('./modules/obras/routes');
const bibliotecaRoutes = require('./modules/biblioteca/routes');
const visitantesRoutes = require('./modules/visitantes/routes');
const educacionRoutes = require('./modules/educacion/routes');
const authRoutes = require('./modules/auth/routes');

app.use('/api/auth', authRoutes); // Público

// Rutas Mixtas (Públicas y Privadas internamente)
app.use('/api/rrhh', rrhhRoutes);
app.use('/api/visitantes', visitantesRoutes);

// Ruta Pública de Obras
const obraController = require('./modules/obras/controllers/obra.controller');
app.get('/api/public/obras', cache(300), obraController.getObrasPublicas);

// Ruta Pública de Imágenes Web (banners, galería, destacados)
const imagenWebService = require('./modules/obras/services/imagenWeb.service');
app.get(
  '/api/public/imagenes-web',
  cache(600),
  catchAsync(async (req, res) => {
    const imagenes = await imagenWebService.getPublicas(req.query.seccion);
    res.json({ data: imagenes });
  })
);

// Ruta Pública de Agenda (Talleres y Eventos)
const agendaController = require('./modules/educacion/controllers/agenda.controller');
app.get('/api/public/agenda', cache(300), agendaController.getAgenda);

// Ruta Pública de Contacto
const contactoController = require('./modules/contacto/controllers/contacto.controller');
app.post('/api/public/contacto', catchAsync(contactoController.enviarContacto));

// Ruta Pública de Biblioteca (Libros)
const libroController = require('./modules/biblioteca/controllers/libro.controller');
app.get('/api/public/libros', cache(300), libroController.getLibrosPublicos);

// ── Catálogos de solo-lectura: PÚBLICOS (para poblar selects del frontend) ──
const artistaController = require('./modules/obras/controllers/artista.controller');
const tecnicaController = require('./modules/obras/controllers/tecnicaObra.controller');
const estadoController = require('./modules/obras/controllers/estadoObra.controller');
const categoriaController = require('./modules/obras/controllers/categoriaObra.controller');
app.get('/api/obras/artistas', cache(600), artistaController.getAllArtistas);
app.get('/api/obras/tecnicas', cache(600), tecnicaController.getAllTecnicas);
app.get('/api/obras/estados', cache(600), estadoController.getAllEstados);
app.get('/api/obras/categorias', cache(600), categoriaController.getAllCategorias);

// Catálogo de Tipos de Evento (Auditorio) — público con caché
const tipoEventoController = require('./modules/auditorio/controllers/tipoEvento.controller');
app.get('/api/tipos-evento', cache(600), tipoEventoController.getAllTiposEvento);

// Rutas de Auto-Ingreso Públicas (Código QR)
const publicoVisitantesRoutes = require('./modules/visitantes/routes/publico.routes');
app.use('/api/publico/visitantes', publicoVisitantesRoutes);

// Rutas Totalmente Privadas
app.use(
  '/api/obras',
  verifyToken,
  cacheGet(15),
  limpiarCache('mavet:resp:/api/obras*', 'mavet:resp:/api/public/obras*'),
  obrasRoutes
);
app.use(
  '/api/biblioteca',
  verifyToken,
  cacheGet(15),
  limpiarCache('mavet:resp:/api/biblioteca*', 'mavet:resp:/api/public/libros*'),
  bibliotecaRoutes
);
app.use(
  '/api/educacion',
  verifyToken,
  cacheGet(15),
  limpiarCache('mavet:resp:/api/educacion*', 'mavet:resp:/api/public/agenda*'),
  educacionRoutes
);

const reportesRoutes = require('./modules/reportes/reportes.routes');
app.use('/api/reportes', verifyToken, reportesRoutes);

const tipoEventoRoutes = require('./modules/auditorio/routes/tipoEvento.routes');
app.use('/api/tipos-evento', verifyToken, tipoEventoRoutes);

const papeleraRoutes = require('./modules/papelera/papelera.routes');
app.use('/api/papelera', verifyToken, cacheGet(30), papeleraRoutes);

const personaRoutes = require('./modules/personas/routes/persona.routes');
app.use('/api/personas', verifyToken, personaRoutes);

// Rutas de Auditoría
const auditoriaRoutes = require('./modules/auth/routes/auditoria.routes');
app.use('/api/auth/logs', verifyToken, auditoriaRoutes);

// Rutas de CMS (Web Editor)
const cmsRoutes = require('./modules/cms/routes');
app.use('/api/cms', verifyToken, cmsRoutes);

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({ message: 'Backend MAVET - Activo' });
});

// Manejo de rutas no encontradas y errores
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

// SINCRONIZACIÓN Y ARRANQUE
async function migrateTablas() {
  const cambios = [
    `ALTER TABLE registros_ingresos ADD COLUMN IF NOT EXISTS id_solicitud VARCHAR(15);`,
    `ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS foto_url VARCHAR(500);`,
    `ALTER TABLE asistencias_qr ADD COLUMN IF NOT EXISTS horas_justificadas DECIMAL;`,
    `ALTER TABLE asistencias_qr ADD COLUMN IF NOT EXISTS tipo_justificacion VARCHAR(20) DEFAULT NULL;`,
    `ALTER TABLE trabajadores ADD COLUMN IF NOT EXISTS foto_url VARCHAR(500);`,
    `ALTER TABLE trabajadores ADD COLUMN IF NOT EXISTS fecha_nacimiento DATE;`,
    `ALTER TABLE trabajadores ADD COLUMN IF NOT EXISTS horas_semanales DECIMAL;`,
    `ALTER TABLE trabajadores ADD COLUMN IF NOT EXISTS direccion TEXT;`,
    `ALTER TABLE trabajadores ADD COLUMN IF NOT EXISTS fecha_ingreso DATE;`,
    `ALTER TABLE trabajadores ADD COLUMN IF NOT EXISTS pin_hash VARCHAR(255);`,
    `ALTER TABLE trabajadores ADD COLUMN IF NOT EXISTS pin_intentos_fallidos INTEGER DEFAULT 0;`,
    `ALTER TABLE trabajadores ADD COLUMN IF NOT EXISTS pin_bloqueado_hasta TIMESTAMP WITH TIME ZONE;`,
    `ALTER TABLE obras ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;`,
    `ALTER TABLE obras ADD COLUMN IF NOT EXISTS mostrar_en_web BOOLEAN DEFAULT false;`,
    `ALTER TABLE artistas ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;`,
    `ALTER TABLE libros ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;`,
    `ALTER TABLE trabajadores ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;`,
    `ALTER TABLE talleres ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;`,
    `ALTER TABLE talleres ADD COLUMN IF NOT EXISTS mostrar_en_web BOOLEAN DEFAULT false;`,
    `ALTER TABLE talleres ADD COLUMN IF NOT EXISTS descripcion_web TEXT;`,
    `ALTER TABLE talleres ADD COLUMN IF NOT EXISTS fecha_fin DATE;`,
    `ALTER TABLE talleres ADD COLUMN IF NOT EXISTS documento_plan VARCHAR(500);`,
    `ALTER TABLE solicitudes_espacios ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;`,
    `ALTER TABLE solicitudes_espacios ADD COLUMN IF NOT EXISTS mostrar_en_web BOOLEAN DEFAULT false;`,
    `ALTER TABLE solicitudes_espacios ADD COLUMN IF NOT EXISTS descripcion_web TEXT;`,
    `ALTER TABLE solicitudes_espacios ADD COLUMN IF NOT EXISTS numero_expediente VARCHAR(30);`,

    `ALTER TABLE inscripciones_talleres ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;`,
    `ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();`,
    `ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE;`,
    `ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;`,
    `ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS intentos_fallidos INTEGER DEFAULT 0;`,
    `ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS bloqueado_hasta TIMESTAMP WITH TIME ZONE;`,
    `ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS refresh_token VARCHAR(255);`,
    `ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS refresh_token_expires TIMESTAMP WITH TIME ZONE;`,
    `CREATE TABLE IF NOT EXISTS bitacora_auditoria (
      id_auditoria VARCHAR(15) PRIMARY KEY,
      id_usuario VARCHAR(15),
      correo VARCHAR(255),
      tipo VARCHAR(50) NOT NULL,
      detalle TEXT,
      ip VARCHAR(45),
      user_agent VARCHAR(500),
      fecha TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );`,
    `ALTER TABLE inventario_talleres ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;`,
    `ALTER TABLE inventario_talleres ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE;`,
    `ALTER TABLE espacios_museo ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();`,
    `ALTER TABLE espacios_museo ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE;`,
    `ALTER TABLE espacios_museo ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;`,
    `ALTER TABLE espacios_museo ADD COLUMN IF NOT EXISTS codigo_espacio VARCHAR(255);`,
    `UPDATE espacios_museo SET codigo_espacio = CONCAT('SALA-', LPAD(id_espacio::text, 3, '0')) WHERE codigo_espacio IS NULL;`,
    `ALTER TABLE libros ALTER COLUMN cantidad_total TYPE INTEGER USING COALESCE(NULLIF(cantidad_total, ''), '0')::INTEGER;`,
    `ALTER TABLE libros ALTER COLUMN cantidad_disponible TYPE INTEGER USING COALESCE(NULLIF(cantidad_disponible, ''), '0')::INTEGER;`,
    `ALTER TABLE obras ADD COLUMN IF NOT EXISTS clasificacion_patrimonial VARCHAR(50) DEFAULT 'no_clasificado';`,
    `ALTER TABLE registros_ingresos ADD COLUMN IF NOT EXISTS consentimiento_datos BOOLEAN DEFAULT false;`,
    `ALTER TABLE registros_ingresos ADD COLUMN IF NOT EXISTS consentimiento_fecha TIMESTAMP WITH TIME ZONE;`,
    `CREATE TABLE IF NOT EXISTS movimientos_obras (
      id_movimiento VARCHAR(15) PRIMARY KEY,
      id_obra VARCHAR(15) NOT NULL,
      tipo VARCHAR(50) NOT NULL,
      descripcion TEXT NOT NULL,
      fecha DATE NOT NULL,
      ubicacion_origen VARCHAR(255),
      ubicacion_destino VARCHAR(255),
      responsable VARCHAR(255),
      observaciones TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE,
      FOREIGN KEY (id_obra) REFERENCES obras(id_obra) ON DELETE CASCADE
    );`,
    `ALTER TABLE obras ALTER COLUMN imagen_url TYPE VARCHAR(500);`,
    `ALTER TYPE enum_bitacora_auditoria_tipo ADD VALUE IF NOT EXISTS 'pin_fallido';`,
    `ALTER TYPE enum_bitacora_auditoria_tipo ADD VALUE IF NOT EXISTS 'pin_exitoso';`,
    `ALTER TYPE enum_bitacora_auditoria_tipo ADD VALUE IF NOT EXISTS 'pin_cambio';`,
    `ALTER TYPE enum_bitacora_auditoria_tipo ADD VALUE IF NOT EXISTS 'pin_reset';`,
    `ALTER TYPE enum_bitacora_auditoria_tipo ADD VALUE IF NOT EXISTS 'confirmacion_asistencia';`,
    `ALTER TYPE enum_bitacora_auditoria_tipo ADD VALUE IF NOT EXISTS 'cancelacion_asistencia';`,
    `ALTER TYPE enum_bitacora_auditoria_tipo ADD VALUE IF NOT EXISTS 'facial_exitoso';`,
    `ALTER TYPE enum_bitacora_auditoria_tipo ADD VALUE IF NOT EXISTS 'facial_fallido';`,
    `ALTER TYPE enum_trabajador_documentos_tipo_documento ADD VALUE IF NOT EXISTS 'foto';`,
    `ALTER TABLE trabajadores ADD COLUMN IF NOT EXISTS descriptor_facial TEXT;`,
    `ALTER TABLE trabajadores ADD COLUMN IF NOT EXISTS descriptores_faciales JSONB DEFAULT '[]'::jsonb;`,
    `ALTER TABLE trabajadores ADD COLUMN IF NOT EXISTS "usarFacial" BOOLEAN DEFAULT false;`,
    `ALTER TABLE trabajadores ADD COLUMN IF NOT EXISTS "consentimientoFacial" BOOLEAN DEFAULT false;`,
    `ALTER TABLE trabajadores ADD COLUMN IF NOT EXISTS "fechaConsentimiento" DATE;`,
    `ALTER TABLE trabajadores ADD COLUMN IF NOT EXISTS documento_minuta_url VARCHAR(500);`,
    `ALTER TABLE trabajadores ADD COLUMN IF NOT EXISTS documento_minuta_nombre VARCHAR(255);`,
    `UPDATE trabajadores SET descriptores_faciales = CASE WHEN descriptor_facial IS NOT NULL AND descriptor_facial != '' THEN jsonb_build_array(descriptor_facial) ELSE '[]'::jsonb END WHERE descriptores_faciales IS NULL OR descriptores_faciales = '[]'::jsonb;`,
    `CREATE TABLE IF NOT EXISTS consultas_sala (
      id_consulta VARCHAR(15) PRIMARY KEY,
      id_libro VARCHAR(15) NOT NULL,
      id_persona VARCHAR(15),
      id_trabajador VARCHAR(15),
      estado VARCHAR(255),
      hora_entrega TIMESTAMP WITH TIME ZONE,
      hora_devolucion TIMESTAMP WITH TIME ZONE,
      observaciones TEXT,
      FOREIGN KEY (id_libro) REFERENCES libros(id_libro) ON DELETE CASCADE,
      FOREIGN KEY (id_persona) REFERENCES personas(id_persona) ON DELETE SET NULL,
      FOREIGN KEY (id_trabajador) REFERENCES trabajadores(id_trabajador) ON DELETE SET NULL
    );`,
    `CREATE TABLE IF NOT EXISTS tipos_evento (
      id_tipo_evento VARCHAR(15) PRIMARY KEY,
      nombre VARCHAR(255) NOT NULL UNIQUE,
      descripcion VARCHAR(255)
    );`,
  ];
  for (const sql of cambios) {
    try {
      await sequelize.query(sql);
    } catch (e) {
      console.warn(`⚠️ Migración saltada: ${e.message}`);
    }
  }
}

async function startServer() {
  try {
    // Inicializar Redis (no bloqueante si no está disponible)
    await cacheService.inicializar();

    // Limpiar referencias FK inválidas antes de sync
    await sequelize.query(
      'UPDATE talleres SET id_instructor = NULL WHERE id_instructor IS NOT NULL AND id_instructor NOT IN (SELECT id_instructor FROM instructores)'
    );
    await sequelize.sync();
    await migrateTablas();
    console.log('✅ Base de datos sincronizada exitosamente');

    if (require.main === module) {
      app.listen(PORT, () => {
        console.log(`🚀 Servidor corriendo en el puerto ${PORT}`);
        startCronJobs();
      });
    }
  } catch (error) {
    console.error('❌ Error al conectar/sincronizar la base de datos:', error);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = app;
