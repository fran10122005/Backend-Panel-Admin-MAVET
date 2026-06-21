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
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: process.env.NODE_ENV === 'production' ? 100 : 10000,
    message: 'Demasiadas peticiones desde esta IP, por favor intente de nuevo en 15 minutos.'
});

// Middlewares globales
app.use(helmet());

// CORS Configurado
const allowedOrigins = [
    process.env.FRONTEND_URL,
    'http://localhost:5173',
    'http://localhost:3000'
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
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

app.use(express.json());
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

// Ruta Pública de Agenda (Talleres y Eventos)
const agendaController = require('./modules/educacion/controllers/agenda.controller');
app.get('/api/public/agenda', agendaController.getAgenda);

// ── Catálogos de solo-lectura: PÚBLICOS (para poblar selects del frontend) ──
const artistaController = require('./modules/obras/controllers/artista.controller');
const tecnicaController = require('./modules/obras/controllers/tecnicaObra.controller');
const estadoController  = require('./modules/obras/controllers/estadoObra.controller');
const categoriaController = require('./modules/obras/controllers/categoriaObra.controller');
app.get('/api/obras/artistas', artistaController.getAllArtistas);
app.get('/api/obras/tecnicas', tecnicaController.getAllTecnicas);
app.get('/api/obras/estados',  estadoController.getAllEstados);
app.get('/api/obras/categorias', categoriaController.getAllCategorias);

// Rutas Totalmente Privadas
app.use('/api/obras', verifyToken, obrasRoutes);
app.use('/api/biblioteca', verifyToken, bibliotecaRoutes);
app.use('/api/educacion', verifyToken, educacionRoutes);

const reportesRoutes = require('./modules/reportes/reportes.routes');
app.use('/api/reportes', verifyToken, reportesRoutes);

const personaRoutes = require('./modules/personas/routes/persona.routes');
app.use('/api/personas', verifyToken, personaRoutes);

// Ruta de prueba
app.get('/', (req, res) => {
    res.json({ message: "Backend MAVET - Activo" });
});

// Manejo de rutas no encontradas y errores
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

// SINCRONIZACIÓN Y ARRANQUE
async function seedInventarioTalleres() {
    const { InventarioTaller, Taller } = require('./models');
    const talleresBase = [
        { nombre: 'Taller de Pintura y Dibujo', descripcion: 'Taller básico de técnicas de pintura al óleo, acrílico y dibujo artístico.' },
        { nombre: 'Taller de Escultura en Arcilla', descripcion: 'Taller de modelado y escultura con arcilla y herramientas básicas.' },
        { nombre: 'Taller de Fotografía Digital', descripcion: 'Taller de fotografía digital, composición y edición básica.' },
        { nombre: 'Taller de Historia del Arte', descripcion: 'Taller teórico sobre corrientes artísticas y obras emblemáticas.' },
        { nombre: 'Taller de Música y Percusión', descripcion: 'Taller de iniciación musical con instrumentos de percusión.' },
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
                    estado: 'Activo'
                });
                console.log(`  🌱 Taller planificado: "${planificado.nombre_curso}" creado desde inventario.`);
            }
        }
    }
}

async function startServer() {
    try {
        await sequelize.sync();
        console.log('✅ Base de datos sincronizada exitosamente');
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