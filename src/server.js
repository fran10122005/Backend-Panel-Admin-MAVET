const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Base de datos y Modelos centralizados
const { sequelize } = require('./models');

// Middlewares de error
const { notFound, errorHandler } = require('./middleware/errorHandler');

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

// Aplicar rate limiter solo a la API
app.use('/api', limiter);

// Rutas de la API
const rrhhRoutes = require('./modules/rrhh/routes');
const obrasRoutes = require('./modules/obras/routes');
const bibliotecaRoutes = require('./modules/biblioteca/routes');
const visitantesRoutes = require('./modules/visitantes/routes');
const educacionRoutes = require('./modules/educacion/routes');
const authRoutes = require('./modules/auth/routes');

app.use('/api/rrhh', rrhhRoutes);
app.use('/api/obras', obrasRoutes);
app.use('/api/biblioteca', bibliotecaRoutes);
app.use('/api/visitantes', visitantesRoutes);
app.use('/api/educacion', educacionRoutes);
app.use('/api/auth', authRoutes);

// Ruta de prueba
app.get('/', (req, res) => {
    res.json({ message: "Backend MAVET - Activo" });
});

// Manejo de rutas no encontradas y errores
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

// SINCRONIZACIÓN Y ARRANQUE
async function startServer() {
    try {
        await sequelize.sync();
        console.log('✅ Base de datos sincronizada exitosamente');

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