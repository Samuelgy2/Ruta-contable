# Evidencia del plan 11, Gestión de categorías

Plan: `docs/pruebas/11 Plan de pruebas gestion de categorias.docx` (34 casos, 5 figuras). Redactado el 6 de noviembre de 2026.

Qué está verificado y qué no:

- Ningún caso se ha ejecutado. Los resultados esperados salen de la matriz de requisitos y de la lectura del código, citada abajo.
- Las cinco capturas sí son de la aplicación real (6 de noviembre de 2026). Se tomaron con `scripts/tmp/capturas-manual.mjs` y los pasos de `scripts/tmp/pasos/pasos-categorias.json`. El resumen está en `scripts/tmp/capturas-cat/resumen.json`: 0 peticiones de escritura, 5 capturas, 0 omitidas.
- Los avisos de éxito y de rechazo de los casos que escriben vienen del código, no de una ejecución. Siguen sin verificar en ejecución.

## Matriz (fuente: `docs/fuentes/matriz_rf_plano.csv`)

| Requisito | Qué dice | Casos |
|---|---|---|
| RF-065 | Consultar listado de categorías. RI-065: alerta si no hay categorías de gasto activas. RN-065: nombre, tipo y cantidad total. | 01 a 06 |
| RF-066, RF-067 | Registrar categoría de ingreso o de gasto. RI: nombre y tipo obligatorios, tipo preseleccionado, activa por defecto salvo que se desmarque. | 07 a 20 |
| RF-068 | Editar categoría. RI: el nombre no puede quedar vacío y el formulario muestra los datos actuales. | 21 a 27 |
| RF-042 | Gestionar categorías de egresos. RN-001 unicidad nombre y tipo (creación y edición). RN-002 con transacciones no se elimina, solo se desactiva. RN-003 nombre obligatorio, error 400. | 10, 12, 15 a 17, 23 a 31 |
| RF-043 | Gestionar categorías de ingresos, mismas reglas. | 08, 14, 16, 25 a 31 |

## Código (fuente: este worktree, rama `entrega/t4-docs`)

| Afirmación del plan | Casos | Archivo y línea |
|---|---|---|
| Dos columnas, ingresos y gastos | 01, 06 | `frontend/src/pages/admin/AdminCategories.tsx:240-256` |
| Contador "N categoría(s)" | 01 | `AdminCategories.tsx:223` |
| Orden por tipo y nombre ascendente | 02 | `backend/controllers/CategoryController.js:28` |
| Aviso rojo si no hay categorías de gasto. Usa todas las de gasto, no solo las activas | 03, 04 | `AdminCategories.tsx:109,227-232` |
| Aviso amarillo de inactivas y etiqueta "Inactiva" | 05, 19, 26 | `AdminCategories.tsx:110,158-160,233-238` |
| Columna vacía muestra "Sin categorías" | 06 | `AdminCategories.tsx:147-148` |
| "+ Nueva" preselecciona el tipo; la categoría nace activa | 07, 09 | `AdminCategories.tsx:96,112,244,252` |
| Nombre obligatorio con `required`; solo espacios da el aviso propio | 11, 12, 23, 24 | `AdminCategories.tsx:122-125,194` |
| El tipo se puede cambiar en el formulario | 20, 27 | `AdminCategories.tsx:196-199` |
| Cancelar, Escape, "×" y clic fuera cierran sin guardar | 18 | `AdminCategories.tsx:48,54,190,210` |
| Crear valida nombre, tipo y duplicado; recorta el nombre; mensajes 400 y 409 | 08, 10, 13 a 17 | `CategoryController.js:61-73,79,82` |
| La comparación de duplicados es por nombre exacto | 17 | `CategoryController.js:68-70` |
| Actualizar no valida nombre vacío ni duplicado; usa COALESCE | 23 a 25, 27 | `CategoryController.js:90-120` |
| Actualizar acepta el cambio de tipo sin revisar transacciones | 27 | `CategoryController.js:99-113` |
| Mensaje "Categoría actualizada correctamente" | 22 | `CategoryController.js:115` |
| Ventana "¿Eliminar categoría?" y su texto | 28, 29 | `AdminCategories.tsx:175-182` |
| Eliminar rechaza si hay transacciones (409) y mensaje | 31 | `CategoryController.js:127-133` |
| Eliminar bien: mensaje y aviso de tipo "warning" (amarillo) | 30 | `CategoryController.js:141`, `AdminCategories.tsx:141` |
| Todas las rutas exigen administrador | 32 a 34 | `backend/routes/categories.js:6` |
| 401 "No autorizado" sin token | 34 | `backend/middleware/auth.js:16-21` |
| 403 "Acceso denegado. Se requiere rol de administrador." | 34 | `backend/middleware/auth.js:40-45` |
| La opción del menú es solo para el rol admin | 32 | `frontend/src/features/admin/components/AdminLayout.tsx:40` |
| El servidor acepta `?search`, pero el formulario no tiene buscador | EP-CAT-01 | `CategoryController.js:6,20-23`; `AdminCategories.tsx` no tiene campo de búsqueda |

## Ambiente (fuente: `scripts/tmp/capturas-cat/resumen.json`)

- El frontend de `http://localhost:5173` envía el login a `https://ruta-contable.onrender.com/api/auth/login`. Es decir, el backend publicado en Render, no uno local.
- Estado de las categorías el 6 de noviembre de 2026, visto en la Figura 1: 3 categorías (2 de ingreso y 1 de gasto), todas activas.

## Sin verificar

- La base exacta que usa Render (se dice Supabase en el plan de entrega, D2, pero no se comprobó).
- Si existe una restricción única en la tabla `categories` que cambie el resultado de CP-CAT-25.
- Longitud máxima de `name` y `description` en la base.
- El rol exacto que devuelve la API para una cuenta Usuario (CP-CAT-34): se leyó en el código, no se probó.
- Que la numeración 11 del archivo sea la que Samuel quiere: se infirmó del README de `docs/fuentes` (planes 09 a 16 pendientes).
