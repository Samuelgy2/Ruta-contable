# Origen de los datos que no salieron de este repositorio

Investigación de T1, 2026-11-06. Todo se hizo en solo lectura: no se borró ni se modificó ningún dato.

**Fuentes:**
- Supabase (consultas `SELECT`, `list_migrations` y los logs de Postgres y Supavisor, que abarcan las últimas 24 horas);
- `git grep` sobre todas las ramas locales y remotas, el stash, los 2 commits sueltos y todas las entradas del reflog;
- el código sin commitear de la carpeta principal y de los 11 worktrees;
- las carpetas Escritorio, Documentos y Descargas;
- los historiales de sesión de Claude Code de este equipo (`~/.claude/projects`).

Las horas son UTC (la base usa `CURRENT_TIMESTAMP` en UTC). Para Colombia hay que restar 5 horas.

## 1. Los datos

| Dato | Fecha (UTC) | Contenido |
|---|---|---|
| `tipo_cartera` (5 filas) | 2026-11-04 03:57:46 | Contado, Crédito, Por cuotas, Acuerdo de pago, Recargo por mora |
| `alerta_sistema` id 1 y 2 | 2026-11-05 04:20:19 y 04:20:23 | `error_sistema`: `column "nro_factura" does not exist`, `detalle` vacío |
| `movimiento_inventario` id 1 y 2 | 2026-11-05 18:42:18 y 18:42:44 | Producto 4 (Jerseys): entrada 5 "Inventario inicial al crear producto"; salida 2 "dotacion (test)" |
| `factura` id 1 + `detalle_factura` | 2026-11-06 03:47:30 | `FAC-2026-0001`, concepto "test", socio 4, usuario 1, `nit_club` 900.000.000-1; línea 1 × 10 000 con descuento 1 → total 9 999 |
| `movimiento_inventario` id 3 | 2026-11-06 03:48:51 | Producto 3 (Neumaticos 3/8): salida 15, motivo "test" |
| `movimiento_inventario` id 4 y 5 | 2026-11-06 03:52:17 y 03:52:44 | Producto 5 (takis): entrada 50 "Inventario inicial al crear producto"; salida 25 |
| `detalle_compra` de la compra 2 | sin fecha propia (la compra es del 2026-09-08) | 30 × 45 000, producto 3: coincide con el relleno automático descrito abajo |

## 2. Qué se encontró

1. **Ninguna de las 41 migraciones registradas** (`list_migrations`) crea:
   - las tablas `socio_documento`, `movimiento_inventario`, `tipo_cartera`, `pago_factura` y `alerta_sistema`;
   - las columnas `factura.id_socio`, `monto_pagado`, `nro_factura`, `fecha_emision`, `fecha_vencimiento` y `nit_club`;
   - las columnas `products.codigo` y `detalle_compra.id_producto`;
   - los umbrales de asistencia en `system_data`.

   Se crearon por fuera del historial de migraciones. Por eso esas 5 tablas no tenían RLS (el advisor las marcaba ERROR).
2. **Los logs de Postgres muestran 4 arranques de un backend distinto al del repositorio:** 2026-11-05 17:29 y 18:41, 2026-11-06 03:46 y 03:54. En cada uno, justo después del DDL de `setupDatabase()` de `server.js`, se ejecuta un SQL de 10 943 caracteres que empieza con:
   > `-- Migración integral para completar RF-006, RF-017, RF-022, RF-044, RF-048, RF-050, RF-051, RF-052, RF-055, RF-058, RF-063, RF-064, RF-071, RF-072, RF-074, RF-075, RF-080, RF-081, RF-084, RF-086, RNF-007 y RNF-009.`
3. **Ese SQL corre en cada arranque y hace lo siguiente** (texto leído del log de 2026-11-06 03:46:49):
   - crea con `IF NOT EXISTS` todo lo del punto 1 y siembra `tipo_cartera`;
   - **modifica datos:**
     - `UPDATE socio SET fecha_nacimiento = '2010-01-01' WHERE fecha_nacimiento IS NULL`;
     - pone códigos `PROD-NNN` a los productos;
     - por cada compra sin detalle crea un producto (precio 45 000, stock 30) y una línea de detalle de 30 × 45 000. La única línea así es la de la compra 2;
     - reescribe `fn_sync_unidades_jersey` y el trigger `trg_pedido_jersey_unidades`, y rellena unidades de inventario de pedidos existentes;
     - **recrea `v_estado_resultados` sin `security_invoker`.** Esto explica el ERROR del advisor que PLAN §1.4 dejó "con causa no determinada": cada arranque deshacía el arreglo del 16 de agosto. T2 lo corrigió otra vez el 2026-11-06 a las 04:57 (`vista_estado_resultados_invoker`).
   - Hoy ningún socio tiene fecha de nacimiento 2010-01-01, así que, o no había nulos, o se corrigieron después.
4. **Origen de la red:** las conexiones de esos 4 arranques vienen todas de `peer_ip` 181.132.125.143, una IP residencial colombiana, según el log de Supavisor. Los arranques sin la migración integral vienen de:
   - 74.220.48.20: 2026-11-06 03:35 y 16:36. Probablemente Render; NO VERIFICADO.
   - 181.51.32.43: 04:31 a 05:36.
   - 179.1.218.200: 16:36. Es la IP pública actual de este equipo, comprobada con `api.ipify.org`.
5. **El código que contiene esa migración no está en este equipo:**
   - en git (todas las ramas, el stash, los commits sueltos y el reflog) solo aparecen los nombres de las columnas en la documentación de T2, que vienen del esquema vivo;
   - tampoco en los archivos sin commitear de la carpeta principal ni de los worktrees, ni en el Escritorio, Documentos o Descargas;
   - en los historiales de Claude Code de este equipo solo aparece la sesión actual (por haber leído el log).
6. **La facturación de esa versión desconocida** guarda el descuento como monto (10 000 − 1 = 9 999). El esquema (`numeric(5,2)`) y el módulo de `entrega/rf-faltantes` lo tratan como porcentaje.

## 3. Qué rama o versión lo explica

Ninguna rama ni versión de este repositorio. Lo explica una copia del backend con una "migración integral" que corre al arrancar, ejecutada en un equipo con la IP 181.132.125.143 entre el 2026-11-04 (la siembra de `tipo_cartera`) y el 2026-11-06 a las 03:54 UTC.

## 4. Qué sigue NO VERIFICADO

- **De quién es el equipo con la IP 181.132.125.143.** Las IPs residenciales cambian: pudo ser este mismo equipo con otra IP, porque la de este equipo cambió durante el día, o el de otra persona del equipo.
- **Dónde está ese código ahora.** Pudo estar en una carpeta borrada, en cambios descartados o en otro equipo.
- **El origen de las alertas del 2026-11-05 a las 04:20,** que quedan fuera de la ventana de 24 horas de los logs. Su mensaje encaja con esa misma versión del código antes de que existiera `nro_factura`.
- **Si 74.220.48.20 es Render.**

## 5. Preguntas para Samuel

1. ¿Quién corrió ese backend? ¿Lo tiene alguien del equipo o fue una sesión en este equipo? Si sigue existiendo, **hay que detenerlo**. Cada arranque contra la base única vuelve a ejecutar la migración: modifica datos y deshace el arreglo de seguridad de `v_estado_resultados`.
2. ¿Se conservan o se borran los datos de prueba (la factura 1 "test", los movimientos 1 a 5 y el producto 5 "takis")? ¿La línea 30 × 45 000 de la compra 2 es real o fue el relleno automático? Antes de borrar algo, hace falta un respaldo y tu OK (regla 7).
3. Si ese código tiene algo que se quiera conservar, ¿se trae al repositorio como migración versionada (T2) y no como SQL de arranque?
