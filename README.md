# API Backend MAVET (Servidor)

Este es el servidor central y API RESTful que alimenta al Panel de Administración y los portales públicos del **Museo de Artes Visuales y del Espacio del Táchira (MAVET)**. 

Está diseñado con una arquitectura modular y robusta basada en Node.js, Express y Sequelize (PostgreSQL/MySQL), aplicando las mejores prácticas de seguridad.

## 🚀 Stack Tecnológico Principal

- **Entorno:** Node.js
- **Framework Web:** Express.js v5
- **ORM:** Sequelize
- **Base de Datos:** PostgreSQL (o MySQL, según configuración de dialecto)
- **Autenticación:** JSON Web Tokens (JWT) & bcryptjs

## 📦 Dependencias Instaladas

### Dependencias Principales (Dependencies)
- `express` y `cors`: Núcleo del servidor web y manejo de intercambio de recursos de origen cruzado.
- `sequelize` y `pg`: ORM potente para el mapeo relacional de la base de datos (junto al driver de Postgres).
- `bcryptjs` y `jsonwebtoken`: Para el encriptado seguro de contraseñas y la firma/verificación de sesiones JWT.
- `dotenv`: Gestión de variables de entorno y secretos (`.env`).
- `express-validator` y `zod`: Doble capa de validación robusta para sanear los datos que entran al servidor.
- `express-rate-limit` y `helmet`: Middleware crucial para la seguridad web, prevención de ataques DDOS por fuerza bruta y protección de cabeceras HTTP.
- `multer`: Gestión de subida de archivos (ej. imágenes de obras).
- `pdfkit` y `exceljs`: Para generación dinámica de reportes y exportación de datos en PDF o Excel desde el backend.
- `nodemailer` y `handlebars`: Para el envío de notificaciones y correos electrónicos con plantillas HTML.
- `morgan`: Logger HTTP para monitorear el tráfico entrante.

### Dependencias de Desarrollo (DevDependencies)
- `nodemon`: Auto-reinicio del servidor durante el desarrollo.
- `jest` y `supertest`: Framework de pruebas unitarias y testeo de integraciones API.
- `sqlite3`: Soporte para base de datos en memoria (útil para entorno de testing).
- `cross-env`: Para inyectar variables de entorno independientes del sistema operativo.

## 💻 Instalación y Uso Local

1. **Instalar dependencias:**
   ```bash
   npm install
   ```

2. **Configurar el Entorno:**
   Asegúrate de tener un archivo `.env` configurado en la raíz con:
   - Credenciales de Base de Datos.
   - `JWT_SECRET` (Llave secreta para tokens).
   - Variables de puertos.

3. **Levantar servidor de desarrollo:**
   ```bash
   npm run dev
   ```
   *Esto iniciará Nodemon, recargando el servidor cada vez que detecte un cambio en los archivos fuente.*

4. **Levantar en producción:**
   ```bash
   npm start
   ```

## 📁 Estructura Principal (`/src`)
- `/modules`: Contiene todos los módulos de negocio separados por dominios (ej. `/auth`, `/obras`, `/visitantes`, `/educacion`, `/rrhh`). Cada módulo tiene sus propios `models`, `controllers`, `routes` y `services`.
- `/config`: Conexión a la BD y configuraciones globales.
- `/utils`: Funciones utilitarias como el gestor de errores (`catchAsync`).
- `/middlewares`: Capas interceptoras (Validación JWT, Roles).

## 🛡️ Seguridad Implementada
Este servidor cuenta con validación estricta en cada endpoint, limitador de peticiones masivas (Rate Limit) y rutas públicas apartadas en controladores específicos (ej. `/api/publico/`) que no exponen información sensible del museo.

Invoke-WebRequest -Uri "http://localhost:4000/api/auth/   login" -Method POST -ContentType "application/json" -Body   ervicio comunitario\Backend MAVET\src\
'{"email":"admin@mavet.com","password":"123"}