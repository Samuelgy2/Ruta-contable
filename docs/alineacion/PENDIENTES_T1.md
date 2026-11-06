# Pendientes detectados por T1 fuera de sus rutas

Fecha: 2026-11-06. Rama: `entrega/rf-faltantes`.

## Para T3 (código e infraestructura)

0. **Prioridad alta: el bloqueo de cuenta no se aplica.** `backend/routes/auth.js:55-61` guarda `failed_attempts` y `locked_until` al quinto intento, pero ningún archivo del backend compara `locked_until` con la hora actual, y un login correcto lo reinicia (`auth.js:68`). El único freno es `loginLimiter`, que es por IP (10 intentos cada 15 min, `auth.js:11-13`). Además, `/login` no revisa `users.active`: un usuario inhabilitado recibe token y solo lo frenan después `requireAuth`, `requireAdmin` y `/verify`. Afecta RF-002, RF-020 y el control "bloqueo de cuenta" de `seguridad.md`.
0b. `backend/routes/forgotPassword.js:144-168` escribe en el log los primeros 20 caracteres de `reset_token` (es un hash bcrypt del OTP) y su expiración. Hay que quitar ese diagnóstico.

1. **`backend/node_modules` está versionado en git y le faltan dependencias.** `git ls-files backend/node_modules | wc -l` da 1198 archivos, pero no está `express-rate-limit`: en un checkout limpio (worktree) `node server.js` falla con `Cannot find module 'express-rate-limit'`. Hay que sacarlo del índice (`git rm -r --cached backend/node_modules`), agregarlo al `.gitignore` y usar `npm ci`.
2. **bcrypt con 10 rondas** en `backend/routes/users.js:121` y `:213`; el README declara 12 (RNF-010, ver `brechas.csv`).
3. **`npm test` del backend en HEAD** es el marcador `echo "Error: no test specified" && exit 1`. Los tests nuevos se corren con `node --test tests/rf-faltantes.test.js`. Conviene que `npm test` ejecute `node --test tests/`.

## Para T2 (base de datos)

1. `factura` tiene dos columnas para el número: `nro_factura` (60) y `numero_factura` (50). El módulo nuevo escribe ambas con el mismo valor. Hay que elegir una.
2. `detalle_factura.descuento` e `iva` son `numeric(5,2)` sin comentario. El código nuevo los trata como porcentajes; falta el `COMMENT ON COLUMN`.
3. La fila `factura` id 1 (`FAC-2026-0001`, concepto `test`, usuario 1, 2026-11-06 03:47 UTC) no salió de ningún código del repo y su total es inconsistente con descuento en %. Preguntar a Samuel si se borra.
4. `alerta_sistema` solo guarda alertas de tipo `error_sistema`. Las alertas de pagos (RF-031) se calculan en vivo y no usan esa tabla.
