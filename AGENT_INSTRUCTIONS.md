# 🤖 Guía Técnica para Agentes de IA y Desarrolladores - Proyecto MAVET

> **Para el Agente de IA que lea este archivo:** Lee cuidadosamente estas instrucciones antes de modificar código en el Backend o Frontend. Contienen el contexto crítico de las peculiaridades arquitectónicas de este proyecto.

Este documento sirve como puente de conocimiento para que futuros agentes de inteligencia artificial y compañeros de equipo entiendan la arquitectura, reglas y soluciones implementadas en el sistema del **Museo de Artes Visuales y del Espacio del Táchira (MAVET)**.

---

## 🏗️ Arquitectura y Tecnologías
El proyecto está dividido en dos repositorios/carpetas principales:
1. **Backend (`Backend-Panel-Admin-MAVET`)**: API REST construida con Node.js, Express y Sequelize (PostgreSQL alojado en Neon).
2. **Frontend (`mavet-admin`)**: Aplicación web SPA construida con React, TypeScript y Vite, usando TailwindCSS/Lucide para el diseño de UI.

---

## ⚠️ Reglas Críticas del Backend (Sequelize)

### 1. El Modo "Paranoid" (Borrado Lógico)
> Casi todos los modelos del sistema utilizan el modo `paranoid: true` de Sequelize.

* **El Problema Histórico:** Sequelize requiere que la tabla física tenga una columna llamada `deleted_at` (TIMESTAMP) para hacer el borrado lógico. Si creas una tabla nueva o un modelo nuevo sin añadir físicamente esta columna a la base de datos de PostgreSQL, cualquier petición `GET` o `findAll()` hará que la app explote con un error 500 (`column "deleted_at" does not exist`).
* **La Regla:** Si creas un nuevo modelo, **siempre** asegúrate de incluir el campo `deleted_at`. Si utilizas sincronización (`sequelize.sync`), ejecuta scripts de ALTER TABLE para asegurar que la columna existe en la base de datos real.

### 2. Triggers de Auditoría (Legacy DB)
* La base de datos tenía triggers heredados (`funcion_auditoria_mavet`) que bloqueaban operaciones `INSERT` y `UPDATE` porque esperaban columnas (como `id_registro_afectado`) que no coinciden con la definición de Sequelize.
* **La Solución:** Eliminamos la función obsoleta en PostgreSQL (`DROP FUNCTION IF EXISTS funcion_auditoria_mavet CASCADE`). Si restauras la base de datos desde un dump antiguo, debes recordar eliminar este trigger antes de inyectar datos.

---

## 🔐 Autenticación y Seguridad

* **Admin de Pruebas:**
  * **Correo:** `adminmavet@gmail.com`
  * **Contraseña:** `admin123`
  * Si el administrador desaparece, existe un script `createAdmin.js` en la raíz del backend para recrearlo. El hash de la contraseña utiliza `bcryptjs` y requiere un `id_cargo` válido asociado al `Trabajador`.
* **Middlewares:**
  * Todas las rutas protegidas pasan por `verifyToken` (`authMiddleware.js`). 
  * El Frontend inyecta el token en los headers a través de un helper `getHeaders()` en `api.ts`: `{ "Authorization": "Bearer <token>" }`.
* **Manejo de Errores 401:** Si ves errores `401 Unauthorized` en la terminal durante el desarrollo frontend, usualmente significa que la sesión caducó o no hay token en el `localStorage`. Simplemente inicia sesión de nuevo.

---

## 📁 Flujos de Trabajo Actuales (Frontend)

### 1. Kiosko de Visitantes (Registro Público)
* Existe una ruta frontend para visitantes (`RegistroPublico.tsx`) que permite registrar ingresos utilizando lectura de código de barras/QR (cédula) o entrada manual.
* **Modo Personal del Museo:** Se implementó un toggle en la UI que desactiva el guardado en `localStorage`. Esto permite que el vigilante/guía del museo registre visitantes (como personas de la tercera edad sin dispositivo móvil) de manera continua sin quedarse "atascado" en la pantalla de éxito.

### 2. Dashboard y Gráficos
* Los datos estadísticos deben ser extraídos desde endpoints dedicados (ej. `/api/reportes/dashboard` o `/api/visitantes/ingresos/stats`). 

---

## 🛠️ Scripts Útiles Disponibles
En la raíz del Backend encontrarás (o puedes crear basándote en el historial) scripts que facilitan la administración:
* `seedDatabase.js`, `seedDatabase2.js`, `seedFinal.js`: Generan datos falsos robustos para Obras, Libros, Talleres, Trabajadores y Visitantes.

> **A otros Agentes:** Si necesitas buscar errores de Sequelize, siempre revisa si hay problemas de llaves foráneas faltantes (constraints de Neon DB) o columnas `deleted_at`. Utiliza `sequelize.query()` si necesitas forzar alteraciones sin depender de `sync()`.
