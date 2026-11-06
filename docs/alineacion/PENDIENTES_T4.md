# Pendientes de T4 en rutas de otros terminales

Escrito el 6 de noviembre de 2026 por T4 (rama `entrega/t4-docs`). T4 no toca estas rutas; las deja aquí.

## Para T3 (seguridad y código)

1. **Crítico.** La cuenta `admin` con la contraseña por defecto del sembrado de `server.js` inicia sesión en el backend publicado en Render. Evidencia: login automático exitoso el 6 de noviembre, `scripts/tmp/capturas-cat/resumen.json` (POST a `https://ruta-contable.onrender.com/api/auth/login`). Rotar la contraseña y registrar el hallazgo en `docs/alineacion/seguridad.md`. El plan de entrega (§1.4) decía que no usaba esa clave. Qué base de datos usa Render: NO VERIFICADO.
2. **Defecto visible (H1 de `docs/pruebas/ANOMALIAS.md`).** En Asistencia, el mismo registro muestra 26/08/2026 en el listado y 27/08/2026 en el formulario de edición. Causa probable, no verificada: `formatDateShort` (`frontend/src/utils/format.ts:14-21`) convierte a la zona horaria del navegador una fecha que llega como marca de tiempo UTC. Corregir y revisar otros listados con fechas.
3. Menor (H7): el formulario de edición de asistencia deja cambiar el socio y el servidor lo ignora (`AsistenciaController.js:103,116-125`). Quitar el campo en edición o guardarlo.
4. Opcional, solo si Samuel elige código para F4 de `ANOMALIAS.md`: validar nombre vacío y duplicado de nombre y tipo en `backend/controllers/CategoryController.js`, función `update` (líneas 90-120). Por defecto se ajusta la matriz (D1).
5. Decidir qué hacer con `saveChecklist` de `AsistenciaController.js`: está en el controlador y no tiene ruta ni pantalla (H9). Actualizar también los comentarios que citan RF-064 a RF-069.

## Para T1 (integrador y L1)

1. Pasar a `docs/alineacion/brechas.csv` los hallazgos F1 a F8 (categorías, RF-042, RF-043 y RF-065 a RF-068) y H1 a H10 (asistencia, RF-082 a RF-087) de `docs/pruebas/ANOMALIAS.md`.
2. El ambiente de capturas es el publicado (G1 de `ANOMALIAS.md`): el frontend local usa el backend de Render. Los casos de escritura de los planes afectan datos reales. Conviene decidirlo en G1.
3. `docs/fuentes/` y `docs/bd/` no están versionados en el repositorio principal, y de `docs/alineacion/` solo lo están `PENDIENTES_T3.md` y `seguridad.md`. Por eso `docs/fuentes/` no existe en el worktree `rc-t4` y T4 lo lee por ruta absoluta. Decidir si se versionan.
4. La numeración de los planes nuevos (11 categorías y 15 asistencia) se infirió del README de `docs/fuentes` (09 compras, 14 cartera, 16 landing). Confirmar la numeración de los planes 09 a 16 con Samuel.
5. La numeración de los RF de asistencia en el código (RF-064 a RF-069) no coincide con la matriz (RF-082 a RF-087); ver H9.

## Para Samuel

Los casos que escriben (crear, editar, eliminar, con prefijo QA_) no se ejecutan sin tu autorización. Dijiste que no habrá `pg_dump`; los planes 11 y 15 lo dejan escrito en la sección 11 (riesgo de la base compartida).
