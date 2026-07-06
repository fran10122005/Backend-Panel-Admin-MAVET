const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Base de datos y Modelos centralizados
const { sequelize } = require('./models');

// Middlewares de error y autenticación
const { notFound, errorHandler } = require('./middleware/errorHandler');
const { verifyToken } = require('./middleware/authMiddleware');

const app = express();

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 500 : 10000,
  message: 'Demasiadas peticiones desde esta IP, por favor intente de nuevo en 15 minutos.',
});

// Middlewares globales
app.use(helmet());

// CORS Configurado
const allowedOrigins = [
  process.env.FRONTEND_URL,
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
const { subirFotoPerfil } = require('./modules/auth/services/auth.service');
const catchAsync = require('./utils/catchAsync');

app.post(
  '/api/auth/me/foto',
  upload.single('foto'),
  verifyToken,
  catchAsync(async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ status: 'error', message: 'No se envió ninguna imagen' });
    }
    const url = await subirFotoPerfil(req.user.id_usuario, req.file.path);
    res.status(200).json({ status: 'success', url });
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
app.get('/api/public/obras', obraController.getObrasPublicas);

// Ruta Pública de Imágenes Web (banners, galería, destacados)
const imagenWebService = require('./modules/obras/services/imagenWeb.service');
app.get(
  '/api/public/imagenes-web',
  catchAsync(async (req, res) => {
    const imagenes = await imagenWebService.getPublicas(req.query.seccion);
    res.json({ data: imagenes });
  })
);

// Ruta Pública de Agenda (Talleres y Eventos)
const agendaController = require('./modules/educacion/controllers/agenda.controller');
app.get('/api/public/agenda', agendaController.getAgenda);

// Ruta Pública de Biblioteca (Libros)
const libroController = require('./modules/biblioteca/controllers/libro.controller');
app.get('/api/public/libros', libroController.getLibrosPublicos);

// ── Catálogos de solo-lectura: PÚBLICOS (para poblar selects del frontend) ──
const artistaController = require('./modules/obras/controllers/artista.controller');
const tecnicaController = require('./modules/obras/controllers/tecnicaObra.controller');
const estadoController = require('./modules/obras/controllers/estadoObra.controller');
const categoriaController = require('./modules/obras/controllers/categoriaObra.controller');
app.get('/api/obras/artistas', artistaController.getAllArtistas);
app.get('/api/obras/tecnicas', tecnicaController.getAllTecnicas);
app.get('/api/obras/estados', estadoController.getAllEstados);
app.get('/api/obras/categorias', categoriaController.getAllCategorias);

// Rutas de Auto-Ingreso Públicas (Código QR)
const publicoVisitantesRoutes = require('./modules/visitantes/routes/publico.routes');
app.use('/api/publico/visitantes', publicoVisitantesRoutes);

// Rutas Totalmente Privadas
app.use('/api/obras', verifyToken, obrasRoutes);
app.use('/api/biblioteca', verifyToken, bibliotecaRoutes);
app.use('/api/educacion', verifyToken, educacionRoutes);

const reportesRoutes = require('./modules/reportes/reportes.routes');
app.use('/api/reportes', verifyToken, reportesRoutes);

const papeleraRoutes = require('./modules/papelera/papelera.routes');
app.use('/api/papelera', verifyToken, papeleraRoutes);

const personaRoutes = require('./modules/personas/routes/persona.routes');
app.use('/api/personas', verifyToken, personaRoutes);

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({ message: 'Backend MAVET - Activo' });
});

// Manejo de rutas no encontradas y errores
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

// SINCRONIZACIÓN Y ARRANQUE
async function seedCatalogosObras() {
  const { EstadoObra, CategoriaObra, TecnicaObra } = require('./models');

  const estadosBase = [
    { nombre_estado: 'Excelente', descripcion: 'Obra en perfecto estado, sin daños visibles.' },
    {
      nombre_estado: 'Bueno',
      descripcion: 'Obra en buen estado, con ligeros signos de desgaste normal.',
    },
    {
      nombre_estado: 'En Restauración',
      descripcion: 'Obra que requiere o está en proceso de restauración.',
    },
    {
      nombre_estado: 'Deteriorado',
      descripcion: 'Obra con daños significativos que requieren intervención urgente.',
    },
  ];

  const categoriasBase = [
    {
      nombre_categoria: 'Pintura',
      descripcion: 'Obra pictórica realizada sobre lienzo, tabla, papel u otras superficies.',
    },
    {
      nombre_categoria: 'Escultura',
      descripcion: 'Obra tridimensional modelada, tallada o esculpida en diversos materiales.',
    },
    {
      nombre_categoria: 'Tejido',
      descripcion: 'Obra textil elaborada mediante técnicas de tejido, bordado o tapicería.',
    },
    {
      nombre_categoria: 'Grabado',
      descripcion: 'Impresión artística realizada a partir de una matriz grabada.',
    },
    {
      nombre_categoria: 'Fotografía',
      descripcion:
        'Imagen artística obtenida mediante procesos fotográficos analógicos o digitales.',
    },
    {
      nombre_categoria: 'Dibujo',
      descripcion: 'Representación gráfica realizada con lápiz, carboncillo, tinta u otros medios.',
    },
  ];

  const tecnicasBase = [
    {
      nombre_tecnica: 'Óleo sobre lienzo',
      descripcion: 'Técnica pictórica con pigmentos aglutinados con aceite sobre tela.',
    },
    {
      nombre_tecnica: 'Óleo sobre tabla',
      descripcion: 'Técnica pictórica al óleo sobre soporte de madera.',
    },
    {
      nombre_tecnica: 'Acrílico sobre lienzo',
      descripcion: 'Técnica pictórica con pintura acrílica sobre tela.',
    },
    {
      nombre_tecnica: 'Acuarela',
      descripcion: 'Técnica pictórica con pigmentos diluidos en agua sobre papel.',
    },
    {
      nombre_tecnica: 'Temple',
      descripcion: 'Técnica pictórica con pigmentos aglutinados con huevo o caseína.',
    },
    {
      nombre_tecnica: 'Pastel',
      descripcion: 'Técnica pictórica con barras de pigmento seco sobre papel.',
    },
    {
      nombre_tecnica: 'Técnica mixta',
      descripcion: 'Combinación de varias técnicas pictóricas en una misma obra.',
    },
    {
      nombre_tecnica: 'Carboncillo',
      descripcion: 'Técnica de dibujo con carboncillo vegetal sobre papel.',
    },
    {
      nombre_tecnica: 'Tinta china',
      descripcion: 'Técnica de dibujo o caligrafía con tinta china sobre papel.',
    },
  ];

  for (const e of estadosBase) {
    const existe = await EstadoObra.findOne({ where: { nombre_estado: e.nombre_estado } });
    if (!existe) {
      await EstadoObra.create(e);
      console.log(`  📋 Estado de obra: "${e.nombre_estado}" creado.`);
    }
  }
  for (const c of categoriasBase) {
    const existe = await CategoriaObra.findOne({ where: { nombre_categoria: c.nombre_categoria } });
    if (!existe) {
      await CategoriaObra.create(c);
      console.log(`  📋 Categoría: "${c.nombre_categoria}" creada.`);
    }
  }
  for (const t of tecnicasBase) {
    const existe = await TecnicaObra.findOne({ where: { nombre_tecnica: t.nombre_tecnica } });
    if (!existe) {
      await TecnicaObra.create(t);
      console.log(`  📋 Técnica: "${t.nombre_tecnica}" creada.`);
    }
  }
}

async function seedInventarioTalleres() {
  const { InventarioTaller, Taller } = require('./models');
  const talleresBase = [
    {
      nombre: 'Taller de Pintura y Dibujo',
      descripcion: 'Taller básico de técnicas de pintura al óleo, acrílico y dibujo artístico.',
    },
    {
      nombre: 'Taller de Escultura en Arcilla',
      descripcion: 'Taller de modelado y escultura con arcilla y herramientas básicas.',
    },
    {
      nombre: 'Taller de Fotografía Digital',
      descripcion: 'Taller de fotografía digital, composición y edición básica.',
    },
    {
      nombre: 'Taller de Historia del Arte',
      descripcion: 'Taller teórico sobre corrientes artísticas y obras emblemáticas.',
    },
    {
      nombre: 'Taller de Música y Percusión',
      descripcion: 'Taller de iniciación musical con instrumentos de percusión.',
    },
  ];
  for (const t of talleresBase) {
    const existe = await InventarioTaller.findOne({ where: { nombre: t.nombre } });
    if (!existe) {
      const creado = await InventarioTaller.create(t);
      console.log(`  🌱 Inventario: "${t.nombre}" creado.`);

      // También crear un taller planificado de ejemplo para el primero
      if (t.nombre === 'Taller de Pintura y Dibujo') {
        const planificado = await Taller.create({
          nombre_curso: t.nombre,
          inventario_id: creado.id,
          sesiones: 8,
          fecha: new Date(),
          hora_inicio: '10:00',
          hora_fin: '12:00',
          horas_totales: 16,
          cupo_minimo: 5,
          cupo_maximo: 20,
          estado: 'Activo',
        });
        console.log(
          `  🌱 Taller planificado: "${planificado.nombre_curso}" creado desde inventario.`
        );
      }
    }
  }
}

async function migrateTablas() {
  const cambios = [
    `ALTER TABLE registros_ingresos ADD COLUMN IF NOT EXISTS cantidad_acompanantes INTEGER DEFAULT 0;`,
    `ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS foto_url VARCHAR(500);`,
    `ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS reset_password_token VARCHAR(255);`,
    `ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS reset_password_expires TIMESTAMP WITH TIME ZONE;`,
    `ALTER TABLE trabajadores ADD COLUMN IF NOT EXISTS foto_url VARCHAR(500);`,
    `ALTER TABLE obras ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;`,
    `ALTER TABLE artistas ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;`,
    `ALTER TABLE libros ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;`,
    `ALTER TABLE trabajadores ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;`,
    `ALTER TABLE talleres ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;`,
    `ALTER TABLE solicitudes_espacios ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;`,
    `ALTER TABLE espacios_museo ADD COLUMN IF NOT EXISTS codigo_espacio VARCHAR(255);`,
    `UPDATE espacios_museo SET codigo_espacio = CONCAT('SALA-', LPAD(id_espacio::text, 3, '0')) WHERE codigo_espacio IS NULL;`,
    `ALTER TABLE libros ALTER COLUMN cantidad_total TYPE INTEGER USING COALESCE(NULLIF(cantidad_total, ''), '0')::INTEGER;`,
    `ALTER TABLE libros ALTER COLUMN cantidad_disponible TYPE INTEGER USING COALESCE(NULLIF(cantidad_disponible, ''), '0')::INTEGER;`,
    `ALTER TABLE obras ALTER COLUMN imagen_url TYPE VARCHAR(500);`,
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
    // Limpiar referencias FK inválidas antes de sync
    await sequelize.query(
      'UPDATE talleres SET id_instructor = NULL WHERE id_instructor IS NOT NULL AND id_instructor NOT IN (SELECT id_instructor FROM instructores)'
    );
    await sequelize.sync();
    await migrateTablas();
    console.log('✅ Base de datos sincronizada exitosamente');
    await seedCatalogosObras();
    await seedInventarioTalleres();

    if (require.main === module) {
      app.listen(PORT, () => {
        console.log(`🚀 Servidor corriendo en el puerto ${PORT}`);
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
