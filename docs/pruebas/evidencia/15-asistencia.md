# Evidencia del plan 15, Gestión de asistencia

Plan: `docs/pruebas/15 Plan de pruebas gestion de asistencia.docx` (49 casos, 4 figuras). Redactado el 6 de noviembre de 2026.

Qué está verificado y qué no:

- Ningún caso se ha ejecutado. Los resultados esperados salen de la matriz y de la lectura del código, citada abajo.
- Las cuatro capturas son de la aplicación real (6 de noviembre de 2026), con `scripts/tmp/capturas-manual.mjs` y `scripts/tmp/pasos/pasos-asistencia.json`. Resumen en `scripts/tmp/capturas-asi/resumen.json`: 4 capturas, 0 omitidas, 0 peticiones de escritura. Nombres de socios, observaciones y documentos se taparon en pantalla antes de la foto.
- Estado del ambiente ese día (Figura 1): 1 registro de asistencia, estado Presente, fecha 26/08/2026 en el listado. Ninguna alerta.
- El defecto DEF-ASI-01 sí se vio en pantalla: el mismo registro muestra 26/08/2026 en el listado (Figura 1) y 27/08/2026 en el formulario de edición (Figura 3). La causa es una hipótesis, ver abajo.

## Matriz (fuente: `docs/fuentes/matriz_rf_plano.csv`)

| Requisito | Qué dice | Casos |
|---|---|---|
| RF-082 (Media) | Gestión de asistencia. RI: socio, actividad y estado (presente/ausente). RN-001 a RN-005 solo con título. | 13 a 22, 49 |
| RF-083 (Baja) | Visualización. RI: registros por socio o por actividad. RN: consulta individual y general, filtros, acceso según rol, solo lectura. | 01 a 12, 46, 47 |
| RF-084 (Baja) | Alertas. RI: inasistencias acumuladas o consecutivas. RN: acumulada, consecutiva, configuración de parámetros, notificación al gestor. | 34 a 40 |
| RF-085 (Baja) | Editar. RI: socio, tipo de entrenamiento y estado (Presente, Ausente, Justificado, Tarde). Mismas RN que RF-082. | 23 a 28 |
| RF-086 (Baja) | Eliminar. RN1 solo el gestor, RN2 queda registrada, RN3 no con alertas activas. | 29 a 33 |
| RF-087 (Baja) | Exportar. RN1 solo autorizados, RN2 incluir el periodo, RN3 conservar lo mostrado. | 41 a 45 |

Todos los casos con acceso a la API o al menú cubren también RN-004 de RF-083, RN1 de RF-086 y RN1 de RF-087 (46 a 48).

## Código (fuente: este worktree, rama `entrega/t4-docs`)

| Afirmación del plan | Casos | Archivo y línea |
|---|---|---|
| Contador, botones Exportar Excel y Registrar Asistencia | 01 | `frontend/src/pages/admin/AdminAsistencia.tsx:259-268` |
| Columnas de la tabla y mensaje de lista vacía | 01, 07, 11 | `AdminAsistencia.tsx:313,322` |
| Orden por fecha descendente | 02 | `backend/controllers/AsistenciaController.js:39` |
| Filtros de estado y fechas los aplica el servidor (con espera de 400 ms) | 03, 04, 05 | `AdminAsistencia.tsx:138-145`; `AsistenciaController.js:19-34` |
| La búsqueda es solo por nombre del socio y se hace en pantalla | 06, 07, 09 | `AdminAsistencia.tsx:147,297` |
| No hay filtro por actividad ni por documento | 09 | `AdminAsistencia.tsx:297-307` |
| Editar y Eliminar en la misma tabla de consulta | 12 | `AdminAsistencia.tsx:331-332` |
| Valores por defecto del formulario (hoy y Presente) | 13 | `AdminAsistencia.tsx:113-116` |
| Socio y fecha con `required`; solo socios activos; sin límite de fecha | 16, 17, 18, 20 | `AdminAsistencia.tsx:227,229,234` |
| Tipo de entrenamiento y observación opcionales; cuatro estados | 15, 19 | `AdminAsistencia.tsx:235-245`; `AsistenciaController.js:78` |
| El servidor valida socio no vacío, fecha válida y estado; no revisa el estado del socio ni duplicados | 18, 20, 21 | `AsistenciaController.js:72-90` |
| Mensaje "Asistencia registrada correctamente" | 14 | `AsistenciaController.js:92` |
| El formulario de edición envía `idSocio`; el servidor no lo actualiza | 28 | `AdminAsistencia.tsx:169-173`; `AsistenciaController.js:103,116-125` |
| Mensaje "Asistencia actualizada correctamente" | 24 | `AsistenciaController.js:127` |
| La fecha del listado se formatea con `new Date(...).toLocaleDateString` y el formulario usa `fecha.split('T')[0]` | 27 | `frontend/src/utils/format.ts:14-21`; `AdminAsistencia.tsx:325,153` |
| Ventana "¿Eliminar registro?" y su texto | 29, 30 | `AdminAsistencia.tsx:215` |
| Eliminar borra directo: sin validar alertas ni auditoría | 32, 33 | `AsistenciaController.js:135-151` |
| Mensaje "Registro de asistencia eliminado correctamente" y aviso amarillo | 31 | `AsistenciaController.js:146`; `AdminAsistencia.tsx:185` |
| Umbrales 3 consecutivas, 5 acumuladas y 30 días; configurables solo por parámetros de la API | 34 a 38 | `AsistenciaController.js:227-229` |
| Regla de la alerta y motivo | 34, 35, 36 | `AsistenciaController.js:250-271` |
| Solo cuentan los registros de los últimos 30 días | 37 | `AsistenciaController.js:235` |
| El servicio de alertas no envía parámetros | 38 | `frontend/src/services/asistenciaService.ts:35-38` |
| Panel de alertas dentro de la pantalla Asistencia | 34, 35, 39 | `AdminAsistencia.tsx:273-294` |
| Las alertas se recalculan tras crear y editar | 40 | `frontend/src/hooks/useAsistencia.ts:76,90` |
| Exportación: columnas, "N/A", nombre del archivo | 41 | `AsistenciaController.js:311-333` |
| La exportación solo envía las fechas, no el estado ni el buscador | 42, 43 | `AdminAsistencia.tsx:192`; `AsistenciaController.js:284-301` |
| El archivo no incluye el periodo consultado | 44 | `AsistenciaController.js:310-330` |
| Aviso de exportación correcta | 41 | `AdminAsistencia.tsx:202` |
| Todas las rutas exigen administrador | 46 a 48 | `backend/routes/asistencia.js:6` |
| 401 sin token y 403 con otro rol | 48 | `backend/middleware/auth.js:16-21,40-45` |
| La opción del menú es solo para el rol admin | 46 | `frontend/src/features/admin/components/AdminLayout.tsx:49` |
| El socio ve su conteo propio en el Resumen | 46 | `backend/controllers/PortalController.js:64-71`; `frontend/src/pages/portal/PortalOverview.tsx:165-168` |
| `saveChecklist` existe y no tiene ruta ni uso | 49 | `AsistenciaController.js:154-220`; `routes/asistencia.js:8-14`; búsqueda de "checklist" solo la encuentra en el controlador |
| Comentarios con numeración antigua RF-064 a RF-069 | EP, riesgo 6 | `AsistenciaController.js:10,67,99,134,222,281` |

## Sin verificar

- La causa de DEF-ASI-01. Hipótesis: el servidor devuelve la fecha como marca de tiempo a medianoche UTC y `toLocaleDateString` la muestra en la zona horaria del navegador, un día antes. No se probó.
- Si otros listados con fechas (transacciones, mensualidades, socios) tienen el mismo desfase.
- Si el backend publicado en Render coincide con este código, en particular que `/api/asistencia/checklist` no exista (CP-ASI-49).
- Si hay otro aviso de las alertas fuera de la pantalla Asistencia (CP-ASI-39).
- Qué hace el botón Eliminar al refrescar las alertas: `useAsistencia.ts` se leyó solo hasta la línea 99.
- La numeración 15 del archivo se infirió del README de `docs/fuentes`.
