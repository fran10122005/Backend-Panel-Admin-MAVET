# ANÁLISIS BRUTAL — MAVET

## El Estado Real del Proyecto

Llevas meses construyendo un sistema de gestión museística y el resultado es un **prototipo funcional con deuda técnica institucionalizada**. No es un fracaso, pero está lejos de ser sólido. Esto es lo que estás evitando ver.

---

## 1. Estás Confundiendo "Avanzar" con "Apagar Incendios"

**Patrón observado:** Entro a trabajar, aparece un bug en recepción, lo arreglo. Luego otro en agenda, lo parcheo. Luego "necesitamos un manual de usuario", lo construyo desde cero en una sentada. Luego "mejóralo", luego "quita las imágenes".

**Esto no es desarrollo. Es manten correctivo reactivo.**

No hay una hoja de ruta. No hay un `TODO` priorizado más allá de lo que grita más fuerte en el momento. El costo de oportunidad es enorme: cada parche que metes sin planificación es tiempo que no estás invirtiendo en la arquitectura, las pruebas y la estabilidad que el sistema necesita para no colapsar cuando tenga 10 usuarios concurrentes en lugar de 2.

---

## 2. Tu Estrategia de Pruebas es una Bomba de Tiempo

De tu propio `AGENTS.md`:

> *"NUNCA ejecute npm test sin NODE_ENV=test. Los tests usan sequelize.sync({ force: true }) que borra todas las tablas"*

Esto es **terrorismo de base de datos**. Tienes una seguridad que depende de que una variable de entorno esté correctamente configurada en un `cross-env` que **sabes que falla en Windows**. Tu `test:win` es un parche sobre un parche.

**Pregunta incómoda:** ¿Cuándo fue la última vez que ejecutaste los tests? ¿Pasaban? Si no lo sabes, no sabes si tu sistema funciona. Y si los tests no se ejecutan regularmente, **no tienes un sistema fiable, tienes un castillo de naipes**.

---

## 3. Tu Modelo de Datos es Ad-Hoc

Miras `server.js` y tienes una función `migrateTablas` con `ALTER TABLE` manuales para columnas que añadiste después del sync inicial. Esto significa:

- No usas migraciones formales (sequelize-cli, umzug, etc.)
- Tus cambios de esquema son quirúrgicos y manuales
- No hay un historial de migraciones
- Reproducir la base de datos desde cero es un proceso manual de varios pasos

**En producción, esto te va a morder.** Cuando necesites hacer un rollback o reproducir un entorno, vas a pasar horas rastreando qué ALTER TABLE manual ejecutaste en qué orden.

---

## 4. Tu Frontend Tiene Problemas de Base que Estás Ignorando

- **Los iconos SVG se importan con rutas inconsistentes:** `../icons` en AppSidebar (layout/) y `../../icons` en páginas dentro de pages/Mavet/. Esto es un smell de que la estructura de carpetas no está estandarizada.

- **El manual de usuario que acabo de construir** es frágil: usa datos hardcodeados en un array gigante, sin tipado fuerte, con cadenas que contienen caracteres Unicode que se corrompen con facilidad (como acabamos de ver).

- **No hay lazy loading real** más allá del `React.lazy` básico. Las páginas se cargan cuando se navega a ellas, pero los bundles son grandes porque no code-splitteas por ruta de manera agresiva.

- **La carpeta del frontend se llama `Fronted-Panel-Admin-Mavet`** — con una "d" en vez de "end". Esto es un indicador de que los fundamentos (nombrar las cosas correctamente) no son una prioridad.

---

## 5. Tu Dependencia de Cloudinary es Frágil

`multer-storage-cloudinary` v4 es incompatible con multer v2. Tu solución fue bypassearlo con disk storage + subida manual en el service layer. Esto:

- Añade complejidad innecesaria
- Duplica la lógica de manejo de archivos
- Es una solución temporal que se volverá permanente porque "funciona"

**O eliges una versión de multer que sea compatible, o implementas una solución de almacenamiento completa (S3, Cloudinary SDK directo, etc.). Lo de "mitad y mitad" es lo peor de ambos mundos.**

---

## 6. No Estás Construyendo para el Futuro

Cosas que no existen y deberían:
- **CI/CD**: cero automatización. Cada deploy es manual.
- **TypeScript en el backend**: el frontend tiene TS, el backend es JavaScript puro. Inconsistencia.
- **Logging estructurado**: usas morgan para requests y console.error para errores. No hay un sistema de logging (Winston, Pino, etc.).
- **Manejo de errores global consistente**: tienes `catchAsync` y `AppError`, pero en el frontend los errores se manejan con `alert()` en la mayoría de los casos.
- **Documentación de API**: no hay OpenAPI/Swagger. El contrato entre frontend y backend existe en la cabeza de los desarrolladores.
- **Pruebas de integración**: dices tener 7 archivos de test, pero ¿cubren los flijos críticos? ¿Registro de visitante → creación de persona → registro de ingreso? ¿O son tests superficiales?

---

## 7. Estás Tomando Decisiones Reactivas

**Caso concreto:** "Creemos un manual de usuarios" → lo construyes en 30 minutos → "mejóralo con iconos, PDF y capturas" → lo reescribes → "quita las imágenes".

Cada uno de estos cambios introduce riesgo de errores (encuentras 7 entradas corruptas en el proceso). El tiempo invertido en el manual podría haberse usado para:
- Escribir tests para los flujos críticos
- Refactorizar el modelo de datos problemático
- Configurar CI/CD
- Documentar la API
- Arreglar la incompatibilidad de multer

**El manual de usuario no debería ser prioridad cuando la base del sistema es frágil.** Es worth asking: ¿para quién es realmente el manual? ¿Usuarios finales o para sentir que "avanzas"?

---

## Diagnóstico Resumido

| Área | Estado | Riesgo |
|------|--------|--------|
| Arquitectura | Funcional pero frágil | Medio-Alto |
| Pruebas | Existen pero no se ejecutan | Alto |
| Modelo de datos | Ad-hoc, sin migraciones | Alto |
| Frontend | Correcto pero inconsistente | Medio |
| Backend | JS sin TS, sin logging estructurado | Medio |
| DevOps | Cero automatización | Alto |
| Proceso | Reactivo, sin planificación | Crítico |
| Dependencias | Fragiles, con parches | Medio |

---

## Plan de Acción (Priorizado)

### Inmediato (esta semana)

1. **Ejecuta los tests ahora mismo.** `npm run test:win`. Si fallan, arréglalos. Si no existen para los flujos críticos, escríbelos antes de tocar cualquier otra cosa. Los tests no son opcionales.

2. **Configura un pipeline CI/CD mínimo.** GitHub Actions con: linter → tests → build. No más deploys manuales. Esto te obligará a mantener los tests verdes.

3. **Elimina el ALTER TABLE manual.** Implementa sequelize-cli o umzug para migraciones formales. Una semana de dolor ahora versus meses de dolor cuando algo falle en producción.

### Corto plazo (próximas 2 semanas)

4. **Decide el futuro de multer/Cloudinary.** O vuelves a multer 1.x compatible con el plugin, o implementas subida directa a Cloudinary con su SDK. No más soluciones híbridas.

5. **Tipa el backend con TypeScript.** El frontend ya lo usa. La inconsistencia te está costando bugs que podrías atrapar en compilación. Empieza por los modelos y servicios, que son el núcleo.

6. **Reemplaza los `alert()` del frontend por un sistema de notificaciones con toast** (react-hot-toast ya está importado, úsalo consistentemente).

### Mediano plazo (próximo mes)

7. **Crea una hoja de ruta escrita.** No más "el próximo bug que aparezca". Define: ¿qué funcionalidad es crítica para el lanzamiento? ¿Qué es nice-to-have? ¿Qué deuda técnica vas a pagar esta iteración?

8. **Documenta la API con Swagger/OpenAPI.** Cada endpoint que no está documentado es un contrato que alguien va a romper.

9. **Implementa logging estructurado.** Winston o Pino. Cuando algo falle en producción, necesitas poder rastrearlo sin hacer `console.log` en código de producción.

### Estructural (transformación)

10. **Deja de trabajar "en" el sistema y empieza a trabajar "sobre" el sistema.** El 80% de tu tiempo debería ser en cosas que hacen el sistema más fiable, no en features nuevas. Esto incluye tests, refactors, documentación, CI/CD, y arquitectura.

---

## Preguntas Incómodas para Reflexionar

- Si dejaras de trabajar hoy, ¿alguien más podría continuar tu proyecto? (la respuesta es no, y eso es un problema)
- ¿Estás construyendo para una demo o para producción real?
- ¿Para quién es realmente el manual de usuario cuando los usuarios potenciales no tienen acceso al sistema?
- ¿Cuánto tiempo has perdido esta semana en cosas que no acercan el proyecto a producción?
- ¿El miedo a lo complejo (tests, CI/CD, migraciones) te está haciendo priorizar lo trivial (manual de usuario, iconos)?

---

*Documento generado por opencode como asesor técnico. Sin filtros. Sin validación gratuita. Con la intención de que el proyecto MAVET sobreviva al primer mes en producción real.*
