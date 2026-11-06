# Integración en `entrega/final`

Fecha: 2026-11-06. Terminal integradora: T1. Worktree: `.claude/worktrees/rc-final`.

**Estado: INTEGRADA Y PUBLICADA.** Las 5 ramas quedaron unidas en `entrega/final` (los bloqueos reportados previamente se dejaron anotados en la sección 5 por decisión de Samuel).

## 1. Ramas y SHAs

| Rama | SHA | Estado en `entrega/final` |
|---|---|---|
| `entrega/t3-codigo` | `30d4b79967` | base |
| `entrega/rf-faltantes` | `4706187362` | unida (`daf2f8a6`) |
| `entrega/quitar-proveedores` | `14eef93de2` | unida (`85c2756d`) |
| `entrega/t2-bd` | `85e11d62e8` | unida (`8696df17`) |
| `entrega/t4-docs` | `3bbcb45828` | unida (`df902189`) |

Commit propio de la integración: `bce07c12 docs: agregar a CLAUDE.md las reglas de commits y pull requests`.

**Orden real de los merges:** `rf-faltantes` → `quitar-proveedores` → `t2-bd`. El plan pedía empezar por `quitar-proveedores`, pero `entrega/final` ya existía del ensayo anterior con `rf-faltantes` unido, y Samuel eligió reutilizarla. El merge a medias del ensayo se abortó con `git merge --abort` antes de seguir.

**Firmas:** ninguno de los commits sobre `origin/main` de las 5 ramas ni de `entrega/final` tiene `Co-Authored-By`, `Claude-Session` ni "Generated with".

## 2. Conflictos y resolución (todos mecánicos)

| Merge | Archivo | Resolución |
|---|---|---|
| `rf-faltantes` | `backend/server.js` | Se conservan `app.use('/api/facturas', facturaRoutes);` y el `/health` nuevo de T3, que consulta la base |
| `quitar-proveedores` | `frontend/src/App.tsx` (2 bloques) | `AdminCompras, AdminInventario, AdminAsistencia, AdminFacturas,` y `'compras', 'inventario', 'asistencia', 'facturas',` |
| `quitar-proveedores` | `frontend/src/features/admin/components/AdminLayout.tsx` | `\| 'compras' \| 'inventario' \| 'asistencia' \| 'facturas'` |
| `quitar-proveedores` | `frontend/src/lib/dataEvents.ts` | Sin `'proveedores'` y con `'facturas'` antes de `'unknown'` |
| `t2-bd` | — | Sin conflictos. Las 4 migraciones de proveedores son idénticas byte a byte en las dos ramas (mismo blob) |

**Referencias a proveedores tras unir:** `git grep` de ProveedorController, useProveedores, AdminProveedores, proveedorService, routes/proveedores, id_proveedor y /api/proveedores en `backend` y `frontend/src` (sin migraciones) da 0 resultados. La columna `proveedor` de PayPal (`PagoController.js`) no se tocó.

## 3. Verificaciones

| Paso | Resultado |
|---|---|
| a) Marcadores de conflicto en backend y frontend/src | 0 |
| b) `node --check` de todos los `.js` del backend | 49 archivos, 0 errores |
| c) `npx tsc --noEmit` | 38 errores, el máximo permitido. Los únicos que no son TS7016/TS7006 son los 3 conocidos: `Header.tsx` fullName y 2 en `initialData.ts`. En archivos de facturas solo aparece el TS7016 de `facturaService.ts`, el mismo import de `./api` sin tipos que tienen los otros 14 servicios. Está dentro de los 38 (40 de t3 − 3 de proveedorService + 1). |
| d) `npm run build` | Termina bien. Escribe en `frontend/build/index.html`, que está versionado aunque `.gitignore` ignora `frontend/build/`; se restauró sin commitear |
| e) `check_cobertura.py` y `check_matriz.py` | Los dos en verde |
| f) `git ls-files` | Ningún `.env` real, `security.log` ni `node_modules`. Solo `backend/.env.example` y `frontend/.env.example`, que son plantillas sin valores |
| g) `npm test` | Sin base: 14 pruebas, 13 pasan, 0 fallan, 1 omitida (landing). **Con `TEST_ESQUEMA_TEMPORAL=1`: falla por el código de la prueba** (ver 5.2). No quedaron esquemas `test_` en la base: comprobado con `pg_namespace`, 0 |
| h) Arranque en seco `PORT=3999` | "Esquema de la base de datos verificado"; `GET /health` → 200 `{"db":"OK"}`; proceso detenido |
| i) Variables | `FISCAL_YEAR`: por defecto el año en curso (`admin.js:78`). `TRUST_PROXY`: por defecto 1 (`server.js:83`); si trae un valor que no es un entero ≥ 0, el servidor se detiene (`server.js:84-87`). Ninguna es obligatoria |

## 4. Archivos sin commit de la carpeta principal (no incluidos)

Leídos con `git -C <carpeta principal> diff --ignore-space-at-eol`; no se tocaron.

| Archivo | Cambio | Situación en `entrega/final` |
|---|---|---|
| `README.md` | +9 líneas: filas de `/api/admin/landing` y `/api/landing` en la tabla de rutas, y una sección "Módulo de landing editable (RF-088 a RF-097)" | No incluido. La sección menciona pruebas contra un Postgres local `_test`, algo que T3 ya cambió a un esquema temporal en Supabase |
| `.gitignore` | +`scripts/tmp/` (capturas y scripts temporales del plan de pruebas) | No incluido. **Resolvería el bloqueo de T4** si se integra |
| `backend/db.js` | SSL desactivable con `DB_SSL=false` | Ya está en `entrega/final` (cambio equivalente de T3) |
| `backend/package.json` | `"test": "node --test \"tests/**/*.test.js\""` | En `entrega/final` es `"test": "node --test"`, con el mismo efecto (último ajuste de T3) |
| `backend/routes/admin.js` | El Resumen lee el nombre del club y la moneda de `system_data` (id=1), con las variables de entorno como respaldo | No incluido. Es la decisión pendiente de **RF-011** (PENDIENTE_SAMUEL) |
| `frontend/src/pages/admin/AdminOverview.tsx` | Rótulos "Transacciones del mes" y "Socios activos" (antes "Total transacciones" y "Usuarios activos") | No incluido. Corrige el rótulo señalado en RF-011 |

`CLAUDE.md` también tiene cambios sin commit en la carpeta principal: la misma sección de commits ya incluida en `bce07c12`.

## 5. Bloqueos para publicar

1. **T4:** `.claude/worktrees/rc-t4` tiene `scripts/tmp/` sin versionar (804 KB), y `entrega/t4-docs` no lo ignora. T4 debe commitearlo o ignorarlo (por ejemplo, con la línea de `.gitignore` de la carpeta principal). Después se une `entrega/t4-docs` y se repiten las verificaciones b), c), d) y e).
2. **Prueba de landing (código de T3):** `backend/tests/landing.test.js:53` compara `current_schemas(false)` con un arreglo. Con las dependencias fijadas en `package-lock.json` (pg 8.20.0, pg-types 2.2.0), el tipo `name[]` llega como texto (`'{test_1793987346973}'`), así que la salvaguarda falla aunque el `search_path` sí apunte solo al esquema temporal. Las 7 pruebas del archivo fallan (0 pasan) en el hook de arranque, antes de ejecutar la landing. Corrección sugerida para T3: `SELECT current_schemas(false)::text[] AS s`.

## 6. Pendientes

- **Fase 2 de proveedores:** no se aplicó en Supabase. Solo debe aplicarse cuando el backend nuevo esté desplegado en Render.
- **Columnas nuevas de factura** (`id_socio`, `monto_pagado`, `nro_factura`, `fecha_emision`, `fecha_vencimiento`, `nit_club`) y las 5 tablas creadas fuera del historial: falta registrarlas como migración versionada (T2). Ver `docs/alineacion/origen_datos_factura.md`.
- **`frontend/build/`:** tiene 3 archivos versionados aunque está en `.gitignore` (T3).
- **PR a `main`:** cuando se resuelvan los dos bloqueos y se publique `entrega/final`.
