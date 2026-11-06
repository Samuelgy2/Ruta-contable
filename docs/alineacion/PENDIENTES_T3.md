# Pendientes de T3 hacia otras terminales

## Para T1 (brechas.csv y matriz v2)

- Contradicción plan↔código: el plan (§1.5) dice "bloqueo tras 5 intentos fallidos" HECHO. `backend/routes/auth.js:54-61` guarda `locked_until` pero el login nunca lo comprueba (`auth.js:41-65`). Registrar en `brechas.csv` con acción AJUSTAR_CODIGO (T3 lo corrige en fase 2). Evidencia completa en `docs/alineacion/seguridad.md`, control 6.
- RNF-009 (notificar errores y caídas): no implementado (control 8). Decidir en matriz v2: implementar o redactar como limitación v1.0.
- RNF-007 (logs): solo existe registro de logins fallidos (control 7). Acotar el texto del RNF a lo real o ampliar el código.
- RNF-010: bcrypt existe en `auth`, `AuthController` y `forgotPassword` (coste 12 en login/registro, 10 para el OTP). Redactar con el algoritmo real.

## Para Samuel (decisiones y accesos)

- Rotación de secretos (control 1): Samuel decidió NO rotar por tiempo (5 nov). Riesgo aceptado y registrado; `git rm --cached` de los 5 archivos hecho (5 nov, autorizado), pendiente de commit. T4: mencionar la limitación en el Manual Técnico (sección de seguridad).
- Visibilidad del repo en GitHub (control 1) y variables en Render/Vercel (control 10).
- Controles 8 y 12: implementar o documentar como limitación.

## Para T1 (infraestructura de ramas)

- No existen worktrees `rc-t3` ni ramas `entrega/*`. T3 escribió `docs/alineacion/seguridad.md` y este archivo en el árbol principal (rama `feature/landing-editable`), ambos sin commitear.

## Estado fase 2 (6 nov)

- Rama `entrega/t3-codigo` (worktree `.claude/worktrees/rc-t3`), commits pequeños, sin merge. T1 integra.
- **Al fusionar:** `backend/node_modules` deja de estar versionado (commit 5bb016e0); en un checkout que aún lo tenga git borrará esos archivos: correr `cd backend && npm ci`.
- **Conflicto esperado** con el WIP sin commitear de proveedores: `backend/server.js` (líneas de `require`/`app.use` de proveedores), `backend/package.json` y `backend/db.js` (cambio idéntico de `DB_SSL`).
- **Para T1 (brechas.csv):** mínimo de clave 6 (reset) vs 8 (registro); RNF-009 sin notificación; RNF-007 solo accesos y logins fallidos.
- **Para T2:** `server.js` valida tablas/columnas contra `0000_baseline.sql`; si renombran tablas o columnas hay que actualizar `ESQUEMA_REQUERIDO` en `backend/server.js` en la misma ventana.
- **Para T4 (manuales):** nuevo `npm run crear-admin`; variable `TRUST_PROXY`; `TEST_ESQUEMA_TEMPORAL=1` para el test de landing; compose ya no levanta Postgres (requiere `backend/.env`).
- **Samuel:** ejecutar el test de landing (comando en el informe) y probar el login contra una base de pruebas antes de desplegar.
