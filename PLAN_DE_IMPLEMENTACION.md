## Fase 2: Auditorio (Gestión de Reservas)

| 2.1 | Optimizar paginación de PDF — evitar hojas vacías | `src/services/pdf.service.ts` (función `exportarHistorialEventos`) | Revisar la lógica de `addPage` y `autoTable` de jsPDF. Verificar que no se llame `addPage()` antes de escribir contenido. Usar `table.autosize` o calcular filas por página dinámicamente. |
| 2.2 | Mostrar código de reserva en el formulario | `src/pages/Mavet/Auditorio.tsx:40` ya existe `codigoReserva`, se setea en `handleDateSelect:131-136` | Ya se genera el código en `handleDateSelect`. Solo asegurar que se muestre visible (readonly) en el modal del formulario. Si no está visible, agregar un `<input readonly>` con el valor. |
| 2.3 | Rediseñar selector de fechas: 3 selects (Día, Mes, Año) | `src/pages/Mavet/Auditorio.tsx` (sección del formulario, línea ~480-560) | Reemplazar `<input type="date">` por 3 `<select>` separados: Día (1-31), Mes (Enero-Diciembre), Año (2024-2030). Combinar valores en una fecha ISO al guardar. |
| 2.4 | Nueva categoría "Otros" en tipo de evento | `src/pages/Mavet/Auditorio.tsx:397-402` (filtro y formulario), backend validación | Agregar `"Otros"` al array de opciones de `tipoEvento`. En el switch de colores (línea 322-328), manejar el caso "Otros". |
| 2.5 | Soft delete + notificación al Administrador | `src/pages/Mavet/Auditorio.tsx:280-304` | Backend: agregar `paranoid: true` al modelo de reservas si no lo tiene. El `handleDeleteEvent` llama a `eliminarReservaAuditorio` → el backend debe hacer soft delete. Backend: crear notificación automática al rol Administrador vía tabla `BitacoraAuditoria` o modelo de notificaciones. |
| 2.6 | Botón Guardar deshabilitado hasta validar todos los campos | `src/pages/Mavet/Auditorio.tsx` (botón submit) | Implementar función `isFormValid()` que verifique: `eventTitle`, `tipoEvento`, `eventDate`, `horaInicio`, `horaFin`, `cedulaOrganizador`, `organizador`. El botón debe tener `disabled={!isFormValid() || saving}`. |
| 2.7 | Auditoría de códigos de sala | `src/pages/Mavet/Salas.tsx` + backend `src/modules/educacion/models/EspacioMuseo.model.js` | Revisar qué salas carecen de `codigo_espacio`. Ejecutar script de migración que asigne códigos auto-generados (ej. `SALA-001`, `SALA-002`) a las salas existentes sin código. |

---

## Fase 3: Recepción (Control de Ingresos y Visitas)

| 3.1 | Reactividad del buscador global | `src/pages/Mavet/Recepcion.tsx:10` (`searchQuery`), `handleSearch:83-100` | Actualmente la búsqueda requiere hacer clic o presionar Enter. Agregar `useEffect` que escuche cambios en `searchQuery` y cuando esté vacío (`""`), limpie `searchResults` inmediatamente. Usar `debounce` para el resto. |
| 3.2 | Agrupación de visitantes — columna total de visitas | `src/pages/Mavet/Recepcion.tsx` (tabla de resultados) + backend `src/modules/visitantes/services/ingreso.service.js` | Modificar el endpoint de búsqueda para que agrupe por `cedula`/`id_persona` y devuelva `total_visitas` como campo adicional. En la tabla, mostrar un badge con el contador. |
| 3.3 | Agrupación de acompañantes | `src/pages/Mavet/Recepcion.tsx` + backend `src/modules/visitantes/services/ingreso.service.js` | Misma lógica que 3.2 pero para la tabla de acompañantes asociados a un visitante. Agrupar por nombre+cedula del acompañante. |
| 3.4 | Botón "Limpiar formulario" | `src/pages/Mavet/Recepcion.tsx` (sección del formulario de ingreso) | Agregar botón "Limpiar" al lado del botón "Registrar ingreso". Debe resetear `formData` a sus valores iniciales y limpiar `selectedPersona`. |
| 3.5 | Revisar "Agenda de hoy" en Recepción | `src/pages/Mavet/Recepcion.tsx:33-34,65-77` | Evaluar si la sección `eventosHoy` (agenda del día) corresponde funcionalmente a Recepción o debería moverse a Dashboard. Documentar decisión. |
| 3.6 | Auditoría de horas acumuladas e inasistencias | Backend `src/modules/rrhh/services/asistenciaQR.service.js` | Revisar el cálculo de horas acumuladas (diferencia entre hora_entrada y hora_salida). Verificar que el conteo de inasistencias (días sin registro) sea correcto. Corregir el algoritmo si es necesario. |

---

## Fase 4: Talleres (Gestión Académica)

| # | Tarea | Archivos | Descripción |
|---|-------|----------|-------------|
| 4.1 | Scroll interno en filtro de talleres | `src/pages/Mavet/Talleres.tsx` (select de filtro de talleres) | Agregar clases CSS `max-h-48 overflow-y-auto` al `<select>` del filtro de talleres, o reemplazar por un dropdown personalizado con scroll. |
| 4.2 | Campos obligatorios Profesión y Especialidad en instructor | `src/pages/Mavet/Talleres.tsx` (formulario crear instructor, líneas ~67-73) + backend `src/modules/educacion/schemas/instructor.schema.js` | Agregar `required` y validación Zod en backend. En frontend, validar que no estén vacíos antes de enviar. |
| 4.3 | Ajustar overflow del formulario de instructores | `src/pages/Mavet/Talleres.tsx` (modal de instructor) | Agregar `overflow-visible` o ajustar la altura del contenedor del modal para eliminar scrollbars innecesarios. |
| 4.4 | Estado "Deshabilitado/Inactivo" para instructores | Backend `src/modules/educacion/models/Instructor.model.js` | Agregar campo `activo` (boolean) o `estado` (enum: Activo/Inactivo). Frontend: agregar toggle/botón para cambiar estado. |
| 4.5 | Mejorar menú contextual (tres puntos) en tarjetas | `src/pages/Mavet/Talleres.tsx` (tarjetas de talleres) | Estilizar el menú de acciones (Recibir asistencia, inscribir, etc.). Agregar transiciones, sombras, y mejor contraste. |
| 4.6 | Ocultar campo cédula para alumnos menores de 9 años | `src/pages/Mavet/talleres/InscripcionModal.tsx` | Al inscribir alumno, si la edad calculada (desde `fecha_nacimiento`) es < 9, deshabilitar u ocultar el campo `cedula`. |
| 4.7 | Mostrar código único del taller en formulario | `src/pages/Mavet/talleres/TallerFormModal.tsx` + backend | Similar a 2.2. Generar y mostrar el código (readonly) en el modal de creación/edición. |
| 4.8 | Exportación PDF: alumnos por taller, talleres, instructores | `src/services/pdf.service.ts` + `src/pages/Mavet/Talleres.tsx` | Agregar funciones: `exportarAlumnosPorTaller`, `exportarListaTalleres`, `exportarInstructores`. Conectar a botones en la UI. |

---

## Fase 5: Bóveda (Colección y Obras de Arte)

| # | Tarea | Archivos | Descripción |
|---|-------|----------|-------------|
| 5.1 | Contraste en Hover de acciones | `src/pages/Mavet/InventarioBoveda.tsx` (botones de acción en tabla) | Mejorar las clases Tailwind: `hover:bg-brand-600 hover:text-white` y transiciones `transition-all duration-200` en los botones de columna de acciones. |
| 5.2 | Visualización de imágenes en modal Detalle | `src/pages/Mavet/InventarioBoveda.tsx` (modal de detalle) | Asegurar que el `src` de la imagen use la URL correcta del backend. Agregar `object-contain` y tamaño fijo. Si no hay imagen, mostrar placeholder. |
| 5.3 | Filtros combinados: Autor y Categoría | `src/pages/Mavet/InventarioBoveda.tsx:51-52` (solo filtroEstado + searchTerm) | Agregar dos `<select>` adicionales: uno para `id_artista` (poblado desde `mavetApi.getArtistas()`) y otro para `id_categoria_obra`. Combinar lógica de filtrado en el `useMemo`. Conexión con backend: soportar query params `?artista=X&categoria=Y&search=Z`. |

---

## Fase 6: Biblioteca (Inventario y Préstamos)

| # | Tarea | Archivos | Descripción |
|---|-------|----------|-------------|
| 6.1 | Fecha de ingreso vacía por defecto | `src/pages/Mavet/biblioteca/LibroFormModal.tsx` | Inicializar el campo `fecha_ingreso` como `""` en lugar de `new Date().toISOString().split('T')[0]`. |
| 6.2 | Placeholder "Seleccione un estado" en selector | `src/pages/Mavet/Biblioteca.tsx` (filtro estado) o `LibroFormModal.tsx` | Agregar opción `<option value="" disabled>Seleccione un estado</option>` al inicio del `<select>` de estado del libro. |
| 6.3 | Armonía visual en Control de Ingresos | `src/pages/Mavet/Biblioteca.tsx` (sección de préstamos/ingresos) | Ajustar paleta de colores: usar colores coherentes con el tema (brand-500, gold, etc.). Mejorar contraste en tablas. |
| 6.4 | Historial de préstamos devueltos | `src/pages/Mavet/Biblioteca.tsx` + backend `src/modules/biblioteca/controllers/prestamo.controller.js` | Crear pestaña/modal "Historial" con lista de préstamos con `fecha_devolucion` no nula. Backend: endpoint `GET /api/biblioteca/prestamos/historial`. |
| 6.5 | Búsqueda por cédula en préstamos | `src/pages/Mavet/Biblioteca.tsx` + `PrestamoFormModal.tsx` | Agregar campo de búsqueda por cédula que autocomplete datos del usuario/bibliotecario al encontrar una persona. |

---

## Fase 7: Recursos Humanos (Personal y Seguridad)

| # | Tarea | Archivos | Descripción |
|---|-------|----------|-------------|
| 7.1 | Máscara de cédula (V-XX.XXX.XXX) | `src/pages/Mavet/rrhh/TrabajadorFormModal.tsx` + backend `src/modules/rrhh/schemas/trabajador.schema.js` | Frontend: aplicar input mask con formato `V-XX.XXX.XXX` o `E-XX.XXX.XXX`. Backend: guardar con el formato estándar. |
| 7.2 | Inmutabilidad del correo electrónico | `src/pages/Mavet/rrhh/UsuarioFormModal.tsx` + `src/services/api.ts` | Al editar usuario, mostrar el campo correo como `disabled`/`readonly`. Backend: ignorar cambios al `correo` en `actualizarUsuario`. |
| 7.3 | Restricción de edición de cuenta de usuario | `src/pages/Mavet/RRHH.tsx` + `UsuarioFormModal.tsx` + `src/services/api.ts` | Solo permitir cambio de contraseña y habilitar/deshabilitar. No permitir editar nombre, rol, correo. Botón para "Deshabilitar usuario y crear nuevo". |
| 7.4 | Mejorar colores y legibilidad en pestaña Usuarios | `src/pages/Mavet/RRHH.tsx` (sección usuarios) | Revisar contraste de texto, colores de fondo, y espaciado en la tabla de usuarios. |

---

## Fase 8: Mejoras Transversales (Todos los módulos)

| # | Tarea | Descripción |
|---|-------|-------------|
| 8.1 | Estandarización UI de filtros y buscadores | Definir posición fija: extremo superior derecho de las tablas. Aplicar en Auditorio, Recepción, Talleres, Bóveda, Biblioteca, RRHH. Usar clases compartidas. |
| 8.2 | Botón "Limpiar formulario" estándar | Incluir un botón "Limpiar" que resetea todos los campos del formulario en modales y páginas de registro. Aplicar en: Auditorio, Recepción, Bóveda, Biblioteca, Talleres, RRHH. |
| 8.3 | Desactivar autocompletado del navegador | Agregar `autoComplete="off"` a todos los `<input>` en formularios. Opcionalmente también `autoCorrect="off"`, `autoCapitalize="off"`, `spellCheck="false"`. |
| 8.4 | Validación regex en campos de texto | Configurar regex en inputs de nombres, apellidos y campos descriptivos: solo letras, acentos, espacios. Prevenir símbolos, números y caracteres especiales. Aplicar tanto en frontend (atributo `pattern`) como en backend (Zod `.regex()`). |
| 8.5 | Transición suave del sidebar | `src/layout/AppSidebar.tsx:303-311` — Ya existe `transition-all duration-300 ease-in-out`. Verificar que al colapsar los iconos sean visibles y no se oculten bruscamente. Ajustar clases: `overflow-hidden` en contenedor de items. |

---

## Priorización Sugerida

1. **Fase 1** (Dashboard/Topbar) — Bajo esfuerzo, alto impacto visual
2. **Fase 8** (Transversales) — Afecta a todos los módulos, hacer primero
3. **Fase 2** (Auditorio) — Funcionalidad crítica de reservas
4. **Fase 4** (Talleres) — Gestión académica diaria
5. **Fase 3** (Recepción) — Control de ingresos diario
6. **Fase 5** (Bóveda) — Consulta frecuente
7. **Fase 6** (Biblioteca) — Funcionalidad complementaria
8. **Fase 7** (RRHH) — Gestión administrativa
