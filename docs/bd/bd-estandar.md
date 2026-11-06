# Estándar de base de datos — L2a (auditoría en solo lectura)

Fecha: 5 nov 2026 (noche). Responsable: T2. Proyecto Supabase `hfibhmntifttdududwpw`, esquema `public`, PostgreSQL 17.6.

## 0. Fuentes y método

| Dato | Fuente | Cómo se comprueba |
|---|---|---|
| Estructura (columnas, tipos, PK, UNIQUE, CHECK, FK, índices, vistas, funciones, triggers, RLS, comentarios) | `backend/migrations/0000_baseline.sql`, generado de `pg_catalog` del esquema vivo | `docs/bd/huella_esquema.sql`: mismas 10 huellas en Supabase y en un Postgres 17 local con la línea base cargada (ver §5) |
| Filas | `COUNT(*)` por tabla vía MCP `execute_sql`, 5 nov | Repetir la consulta; **no** se usaron las estimaciones de `list_tables` |
| Uso en código | `grep -rnwE "(FROM\|JOIN\|INTO\|UPDATE\|TABLE) <tabla>" backend --include=*.js` (sin `node_modules`, `migrations`, `tests`) sobre el árbol de trabajo de `feature/landing-editable` con el WIP sin commitear | Mismo comando. Solo detecta SQL en una línea: un `NINGUNO` se confirmó además con `grep -rnw <tabla>` en `backend`, `frontend/src` y `scripts` |
| Advisors | `get_advisors` security y performance, 5 nov 04:39 UTC | Repetir `get_advisors` |

`graphify query` no se pudo usar porque `graphify-out/graph.json` no existe en este árbol. La regla del CLAUDE.md aplica "cuando graph.json existe", así que se usó grep. No se regeneró el grafo porque `graphify-out/` no es ruta de T2; quedó anotado en `docs/alineacion/PENDIENTES_T2.md`.

## 1. Resumen

- 35 tablas, 8 vistas, 17 funciones, 17 triggers, 28 secuencias, 62 FK, 67 índices sueltos (más los de PK/UNIQUE).
- Historial de migraciones: 34 registradas, del `20260816184518` al `20261106040258` (`proveedores_fase1_texto`). Las tablas originales (`users`, `socio`, `transactions`, `pago_mensual`…) se crearon **antes** de ese historial, así que las 34 migraciones no reconstruyen la base desde cero; por eso existe `0000_baseline.sql`.
- Advisor de seguridad al hacer la auditoría: **2 tipos de ERROR** (5 tablas sin RLS; vista `v_estado_resultados` sin `security_invoker`), 1 WARN (`fn_sync_unidades_jersey` sin `search_path`), 30 INFO (RLS sin políticas). **Tras L2b pasos 1 a 3 (6 nov): 0 ERROR, 0 WARN**, y el INFO de RLS sin políticas en 35 tablas, que es intencional (ver `CAMBIOS.md`). Esta sección y la §3 describen el estado de la línea base, anterior a esos cambios.
- Advisor de rendimiento: 17 FK sin índice; 59 índices "sin uso". Lo segundo no indica un problema: con 0 a 18 filas por tabla, Postgres prefiere recorrer la tabla entera. **No se propone borrar índices por ese aviso.**
- Tablas sin código que las use (en este árbol): `alerta_sistema`, `camerino`, `config_mensualidad`, `detalle_factura`, `detalle_transaccion`, `factura`, `movimiento_inventario`, `pago_factura`, `poliza_salud`, `proveedores`, `socio_documento`, `tipo_cartera`. Algunas tienen filas (ver §3).
- Funciones y vistas sin uso en `backend/`: `sp_registrar_pago_mensual`, `sp_generar_mensualidades_anual`, `sp_estado_cuenta_socio`, `sp_registrar_asistencia_masiva`, `verificar_instalacion`, `v_estado_resultados`, `v_cartera_general`, `v_mensualidades_socio`, `v_reporte_asistencia`, `v_resumen_mensual`, `vista_admins`. Usadas: `registrar_pago_cartera` (`controllers/CarteraController.js:141`), `registrar_pago_mensual` (`controllers/PagoController.js:302`, `controllers/PagoMensualController.js:205`), `vista_socios` (`controllers/PortalController.js:28`), `vista_usuarios_sin_socio` (`routes/users.js:40`).
- **Función rota:** `sp_registrar_pago_mensual` inserta en `transaccion_fin`, tabla que no existe (`0000_baseline.sql`, sección funciones). Si se llama, falla. Nadie la llama.

## 2. Reglas de nombres propuestas

Criterio: estandarizar sin romper el backend. Renombrar columnas o cambiar tipos rompe consultas, así que esos cambios **no** entran salvo OK explícito de Samuel. D4 solo cubre las 4 tablas en inglés.

| # | Objeto | Regla | Estado actual |
|---|---|---|---|
| N1 | Tabla | `snake_case`, español, **singular** | Cumplen 29. No cumplen: `users`, `transactions`, `categories`, `products` (inglés, plural; D4), `proveedores` (plural; se elimina en fase 2), `pagos_pasarela` (plural) |
| N2 | PK | Se conserva la existente (`id` o `id_<tabla>`); en tablas nuevas: `id_<tabla>` | Mezcla: `id` en 12 tablas, `id_<algo>` en el resto. No se cambia (renombrar columnas rompe código) |
| N3 | FK | `id_<tabla_referida>`; auditoría: `created_by`, `updated_by` | Excepciones: `categoria_id` (compra, products, transactions), `transaction_id` y `user_id` (pagos_pasarela), `usuario_id` (auditoria), `creado_por` (admin_perfil), `registrado_by`, `recibido_by`, `cerrado_by`, `publicado_by`, `approved_by`. Se documentan en el diccionario y no se renombran |
| N4 | Constraint PK | `<tabla>_pkey` | Cumplen todas |
| N5 | Constraint UNIQUE | `<tabla>_<cols>_key` | Cumplen todas. Excepción: `idx_products_codigo_unique` es un índice único y no un constraint |
| N6 | Constraint FK | `<tabla>_<col>_fkey` | Cumplen las 62 |
| N7 | Constraint CHECK | `<tabla>_<col o regla>_check` | Cumplen, salvo `cartera_pagado_con_transaccion` y `pago_mensual_pagado_con_transaccion` (nombre de regla, válido) |
| N8 | Índice | `idx_<tabla>_<col1>[_<col2>]` con el nombre completo de la columna | En la línea base no cumplían 15: `idx_movimiento_inv_producto`, `idx_poliza_vencimiento`, `idx_cartera_socio`, `idx_pago_factura_factura`, `idx_pago_mensual_periodo`, `idx_pagos_pasarela_orden/_socio/_user`, `idx_pedido_jersey_campana/_socio`, `idx_detalle_transaccion_socio`, `idx_socio_documento_socio`, `idx_auditoria_entidad` (incluye created_at), `idx_jersey_campana_activa` (incluye fecha_fin), `idx_pago_mensual_estado_fecha` (la columna es fecha_vencimiento). **Renombrados el 6 nov** (`20261106_renombrar_indices`). `idx_cartera_estado_fecha` e `idx_pedido_jersey_estado_fecha` sí cumplían, porque la columna se llama `fecha` |
| N9 | Columnas de auditoría | `created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP`, `updated_at` con trigger | `created_at` admite NULL en `jersey_campana`, `products` y `transactions`. Dos funciones hacen lo mismo: `set_updated_at` y `update_updated_at_column` |
| N10 | Dinero | `numeric(12,2)` | Mezcla: `numeric(10,2)`, `numeric(12,2)`, `numeric(15,2)` y `numeric` sin límite (`detalle_compra.valor_unitario/valor_total`, `factura.monto_pagado`, `pago_factura.monto`, `meses_periodo.total_*`, `balance`). Cambiar el tipo requiere OK |
| N11 | Texto | `varchar(n)` con largo explícito | Sin largo: `categoria_producto.nombre`, `compra.estado`, `detalle_compra.concepto`, `transactions.referencia`, `socio.nivel_aprendizaje`, todas las de `proveedores` |
| N12 | Valores de estado | minúsculas en español | Mezcla: `pendiente` (pago_mensual, cartera, compra, transactions), `Pendiente` (factura, inventario_jersey), `PENDING` (pagos_pasarela), `Activa` (poliza_salud), `Solicitado` (pedido_jersey); `categories.type` usa `income/expense` y `transactions.tipo` usa `ingreso/gasto`. **No se toca**: el frontend y el backend comparan esos literales |
| N13 | Comentarios | Toda tabla con `COMMENT ON TABLE`; columnas no obvias con `COMMENT ON COLUMN` | 20 de 35 tablas tienen comentario; faltan 15, o 14 sin contar `proveedores`, que se elimina (§3) |
| N14 | RLS | Activa en toda tabla de `public` | Faltan 5 (§3) |

## 3. Tablas (35)

Formato por tabla: filas reales · columnas · claves · índices · RLS · comentario · código · hallazgos. "FK sin índice" sale del advisor de rendimiento.

### admin_perfil
- Filas: 3 · Columnas: 6 · PK `user_id`
- FK: `user_id → users` CASCADE; `creado_por → users` SET NULL (sin índice)
- Índices: solo PK · RLS: sí, sin políticas · Comentario: sí
- Triggers: `trg_admin_perfil_updated_at`; las filas las crea `crear_perfil_por_rol` desde `users`
- Código: `routes/users.js:135`
- Hallazgos: `creado_por` no sigue N3.

### alerta_sistema
- Filas: 2 · Columnas: 6 · PK `id`
- FK: ninguna · Índices: solo PK · **RLS: NO** (ERROR) · Comentario: **no**
- Código: NINGUNO (no aparece en `backend/` ni `frontend/src/`, ni en el historial de git de esas carpetas)
- Hallazgos: parece pensada para RNF-009 (avisar errores al administrador), pero nada escribe en ella. Quién insertó las 2 filas: NO VERIFICADO. Es una brecha posible con RNF-009 (se pasa a T1).

### asistencia
- Filas: 1 · Columnas: 8 · PK `id_asistencia` · UNIQUE (`id_socio`,`fecha`) · CHECK `estado` ∈ Presente/Ausente/Justificado/Tarde
- FK: `id_socio → socio`; `registrado_by → users` SET NULL
- Índices: `idx_asistencia_estado`, `idx_asistencia_fecha`, `idx_asistencia_fecha_estado`, `idx_asistencia_registrado_by` · RLS: sí · Comentario: sí
- Código: `controllers/AsistenciaController.js:6`, `controllers/PortalController.js:68`
- Hallazgos: `idx_asistencia_fecha` sobra porque `idx_asistencia_fecha_estado` empieza por `fecha`. `registrado_by` no sigue N3.

### auditoria
- Filas: 13 · Columnas: 7 · PK `id`
- FK: `usuario_id → users` SET NULL (sin índice) · Índices: `idx_auditoria_entidad` (entidad, created_at DESC) · RLS: sí · Comentario: **no**
- Código: `controllers/LandingController.js:149` (escritura); `tests/landing.test.js:227`
- Hallazgos: solo el módulo landing registra auditoría. Para RNF-007 (logs) cuenta como evidencia parcial; T1/T3 deciden.

### camerino
- Filas: 0 · Columnas: 10 · PK `id_camerino` · CHECK `anio >= 2000`, `estado`
- FK: `id_socio → socio`; `id_transaccion → transactions`
- Índices: `idx_camerino_anio`, `idx_camerino_id_socio`, `idx_camerino_id_transaccion` · RLS: sí · Comentario: sí
- Código: NINGUNO. El README la declara como API pendiente.

### cartera
- Filas: 2 · Columnas: 14 · PK `id_cartera` · CHECK `estado` ∈ pendiente/pagado/anulado; `cartera_pagado_con_transaccion`
- FK: `id_socio → socio`; `id_pago_mensual → pago_mensual` SET NULL; `id_tipo_cartera → tipo_cartera` RESTRICT (sin índice); `id_transaccion → transactions`
- Índices: `idx_cartera_estado`, `idx_cartera_estado_fecha`, `idx_cartera_id_pago_mensual`, `idx_cartera_id_transaccion`, `idx_cartera_socio` · RLS: sí · Comentario: sí
- Usan la tabla: la función `registrar_pago_cartera` y el trigger `tr_generar_recargo_mora` (que inserta recargos); las vistas `v_cartera_general` y `v_resumen_mensual`
- Código: `controllers/CarteraController.js:8`, `controllers/PortalController.js:60`
- Hallazgos: `idx_cartera_estado` sobra (lo cubre `idx_cartera_estado_fecha`). `id_tipo_cartera` y `forma_pago` no aparecen en `backend/`. `forma_pago` cumple el papel que en el resto de tablas tiene `metodo_pago`.

### categoria_producto
- Filas: 0 · Columnas: 2 · PK `id` · UNIQUE `nombre` (`varchar` sin largo)
- Referida por: `products.categoria_id` · RLS: sí · Comentario: **no**
- Código: `controllers/InventarioController.js:28`

### categories
- Filas: 3 · Columnas: 7 (inglés: `name`, `type`, `description`, `active`) · CHECK `type` ∈ income/expense
- Referida por: `compra.categoria_id`, `transactions.categoria_id` · Índices: `idx_categories_active`, `idx_categories_type` · RLS: sí · Comentario: sí
- Función `categoria_mensualidad_id()` (busca la categoría por nombre)
- Código: `controllers/CategoryController.js:28`, `controllers/CompraController.js:6`, `controllers/PagoController.js:149`, `controllers/TransactionController.js:24`, `routes/admin.js:215`
- Hallazgos: candidata a renombrar por D4. El nombre natural, `categoria`, convive mal con `categoria_producto`; se propone `categoria_financiera` (lo decide Samuel en G1).

### compra
- Filas: 1 · Columnas: 15 · CHECK `estado` ∈ pendiente/aprobada (`varchar` sin largo)
- FK: `categoria_id → categories` SET NULL; `created_by → users` SET NULL; `approved_by → users`; `id_proveedor → proveedores`; `id_transaccion → transactions`
- Índices: uno por FK · Referida por: `detalle_compra`, `factura.id_compra`, `movimiento_inventario.id_compra` · RLS: sí · Comentario: sí (tabla + `proveedor_nombre`)
- Código: `controllers/CompraController.js:5`
- Hallazgos: `id_proveedor` e `idx_compra_id_proveedor` se van con la migración `20261105_proveedores_fase2_eliminar` (pendiente del despliegue en Render). La columna `factura varchar(50)` se llama igual que la tabla `factura`. `approved_by` y `approved_at` están en inglés.

### config_mensualidad
- Filas: 0 · Columnas: 9 · UNIQUE `anio` · CHECK `anio >= 2000`
- FK: `created_by → users` SET NULL · RLS: sí · Comentario: sí
- Código: NINGUNO
- Hallazgos: se solapa con `system_data.dia_vencimiento_default`; `sp_generar_mensualidades_anual` lee el día desde `system_data`, no desde aquí.

### detalle_compra
- Filas: 1 · Columnas: 7 · PK (`id_compra`,`nro_linea`) · `valor_total` generado (`cantidad * valor_unitario`)
- FK: `id_compra → compra` (NO ACTION); `id_producto → products` RESTRICT (sin índice) · RLS: sí · Comentario: **no**
- Código: `controllers/CompraController.js:53`
- Hallazgos: dinero en `numeric` sin límite (N10). Borrar una compra con detalle falla (NO ACTION), mientras que `detalle_factura` usa CASCADE.

### detalle_factura
- Filas: 1 · Columnas: 10 · PK (`id_factura`,`nro_linea`) · `valor_total` generado
- FK: `id_factura → factura` CASCADE · RLS: sí · Comentario: sí
- Código: NINGUNO
- Hallazgos: `iva` y `descuento` no entran en el cálculo de `valor_total`.

### detalle_transaccion
- Filas: 0 · Columnas: 5 · UNIQUE (`id_transaccion`,`id_socio`)
- FK: `id_transaccion → transactions`; `id_socio → socio` SET NULL · Índices: `idx_detalle_transaccion_socio` · RLS: sí · Comentario: sí
- Código: NINGUNO. Solo la usa `sp_registrar_pago_mensual`, que está rota.
- Hallazgos: `transactions.id_socio` (migración `20260908193716_transactions_id_socio`) ya cubre el vínculo con el socio, así que esta tabla parece obsoleta. **No se borra sin OK.**

### factura
- Filas: 1 · Columnas: 21 · CHECK `estado` ∈ Pendiente/Emitida/Pagada/Anulada/Vencida
- FK: `created_by`; `id_compra` SET NULL; `id_proveedor`; `id_socio` RESTRICT (sin índice); `id_transaccion`
- Índices: `created_by`, `estado`, `fecha`, `id_compra`, `id_proveedor`, `id_transaccion` · Referida por: `detalle_factura`, `pago_factura` · RLS: sí · Comentario: sí (tabla + `proveedor_nombre`)
- Código: NINGUNO (RF-055/058, facturación, pendiente según el README)
- Hallazgos: columnas duplicadas: `nro_factura`/`numero_factura` y `fecha`/`fecha_emision`. Además `monto_pagado` es `numeric` y `valor_total` es `numeric(10,2)`.

### inventario_jersey
- Filas: 14 · Columnas: 7 · UNIQUE (`id_pedido`,`nro_item`) · CHECK `estado_entrega`
- FK: `id_pedido → pedido_jersey` CASCADE; `recibido_by → users` SET NULL · RLS: sí · Comentario: sí
- La mantiene el trigger `trg_pedido_jersey_unidades`, con la función `fn_sync_unidades_jersey` (sin `search_path`, WARN)
- Código: `controllers/InventarioController.js:185`

### jersey_campana
- Filas: 5 · Columnas: 10 · CHECK `valor > 0`
- FK: `created_by → users` (sin índice) · Índices: `idx_jersey_campana_activa` · Referida por: `pedido_jersey.id_campana` · RLS: sí · Comentario: **no**
- Código: `controllers/JerseyController.js:18`
- Hallazgos: `created_at` admite NULL (N9).

### landing_borrador
- Filas: 1 · Columnas: 4 · fila única (`CHECK id = 1`)
- FK: `updated_by → users` SET NULL (sin índice) · RLS: sí · Comentario: **no**
- Código: `controllers/LandingController.js:187`

### landing_imagen
- Filas: 0 · Columnas: 7 · CHECK de mime (jpeg/png/webp), bytes (≤ 2 MiB) y alt no vacío
- FK: `created_by → users` SET NULL (sin índice) · RLS: sí · Comentario: **no**
- Código: `controllers/LandingController.js:157`

### landing_version
- Filas: 0 · Columnas: 4 · PK `numero` (> 0)
- FK: `publicado_by → users` SET NULL (sin índice) · RLS: sí · Comentario: **no**
- Código: `controllers/LandingController.js:126`

### meses_periodo
- Filas: 3 · Columnas: 14 · UNIQUE (`anio`,`mes`) · CHECK `anio`, `mes`
- FK: `cerrado_by → users` SET NULL · Índices: `idx_meses_periodo_anio`, `idx_meses_periodo_cerrado_by` · Referida por: `pago_mensual.id_periodo` · RLS: sí · Comentario: sí
- Código: `controllers/PagoMensualController.js:8`, `controllers/PeriodoController.js:20`, `routes/admin.js:132`, `server.js:201`
- Hallazgos: `idx_meses_periodo_anio` sobra (lo cubre el UNIQUE, que empieza por `anio`). Los totales son `numeric` sin límite.

### movimiento_inventario
- Filas: 5 · Columnas: 12 · CHECK `cantidad > 0`, `tipo` ∈ entrada/salida/ajuste
- FK: `id_producto → products` RESTRICT; `id_compra → compra` SET NULL (sin índice); `created_by` (sin índice); `registrado_by` (sin índice)
- Índices: `idx_movimiento_inv_producto` · **RLS: NO** (ERROR) · Comentario: **no**
- Código: NINGUNO (tampoco en el historial de git de `backend/` y `frontend/`). Quién insertó las 5 filas: NO VERIFICADO.
- Hallazgos: `created_by` y `registrado_by` guardan lo mismo. El stock de `products` no se mueve desde aquí.

### pago_factura
- Filas: 0 · Columnas: 12 · CHECK `monto > 0`
- FK: `id_factura → factura` CASCADE; `id_transaccion` SET NULL (sin índice); `created_by` (sin índice); `registrado_by` (sin índice)
- Índices: `idx_pago_factura_factura` · **RLS: NO** (ERROR) · Comentario: **no**
- Código: NINGUNO
- Hallazgos: columnas duplicadas `fecha`/`fecha_pago` y `created_by`/`registrado_by`; `monto` es `numeric` sin límite.

### pago_mensual
- Filas: 2 · Columnas: 12 · UNIQUE (`id_socio`,`id_periodo`) · CHECK `estado`; `pago_mensual_pagado_con_transaccion`
- FK: `id_socio → socio`; `id_periodo → meses_periodo`; `id_transaccion → transactions`
- Índices: `estado`, `estado+fecha_vencimiento`, `fecha_vencimiento`, `id_transaccion`, `periodo` · RLS: sí · Comentario: sí
- Triggers: `trigger_actualizar_mora`, `trigger_generar_recargo_mora`, `trigger_prevenir_pago_duplicado`, `update_pago_mensual_updated_at`
- Código: `controllers/PagoController.js:286`, `controllers/PagoMensualController.js:6`, `controllers/PeriodoController.js:130`, `controllers/PortalController.js:52`, `routes/admin.js:45`
- Hallazgos: `idx_pago_mensual_estado` sobra (lo cubre `idx_pago_mensual_estado_fecha`).

### pagos_pasarela
- Filas: 18 · Columnas: 19 · UNIQUE `referencia`, `proveedor_id` · CHECK `estado` ∈ PENDING/APPROVED/DECLINED/VOIDED/REFUNDED/ERROR; `monto > 0`
- FK: `user_id → users` SET NULL; `id_socio → socio` SET NULL; `transaction_id → transactions` SET NULL (sin índice)
- Índices: `estado`, `orden_id`, `id_socio`, `user_id` · RLS: sí · Comentario: sí (tabla + 2 columnas)
- Triggers: `trg_pagos_pasarela_resolver_socio`, `trg_pagos_pasarela_updated_at`
- Código: `controllers/PagoController.js:79`, `controllers/PortalController.js:76`, `controllers/TransactionController.js:63`
- Hallazgos: nombre en plural (N1); `transaction_id`, `user_id` y `amount_in_cents` en inglés; `moneda` vale `USD` por defecto, mientras `system_data.moneda` es `COP` (lo explica PayPal: NO VERIFICADO).

### pedido_jersey
- Filas: 4 · Columnas: 15 · UNIQUE (`id_campana`,`id_socio`) · CHECK `cantidad > 0`, `estado`, `tipo`
- FK: `id_campana → jersey_campana`; `id_socio → socio`
- Índices: `campana`, `estado`, `estado+fecha`, `socio` · RLS: sí · Comentario: sí
- Código: `controllers/InventarioController.js:183`, `controllers/JerseyController.js:16`
- Hallazgos: `idx_pedido_jersey_campana` sobra (lo cubre el UNIQUE, que empieza por `id_campana`) y también `idx_pedido_jersey_estado` (lo cubre `estado_fecha`).

### poliza_salud
- Filas: 0 · Columnas: 11 · CHECK `estado`, `tipo`
- FK: `id_socio → socio`; `id_transaccion → transactions` · Índices: 3 · RLS: sí · Comentario: sí
- Código: NINGUNO. El README la declara como API pendiente.

### products
- Filas: 3 · Columnas: 9 (inglés: `name`, `price`, `description`) · índice único `idx_products_codigo_unique`
- FK: `categoria_id → categoria_producto` · Referida por: `detalle_compra.id_producto`, `movimiento_inventario.id_producto` · RLS: sí · Comentario: **no**
- Código: `controllers/InventarioController.js:27`
- Hallazgos: candidata a renombrar por D4 (`producto`). `created_at` admite NULL.

### proveedores
- Filas: 1 · Columnas: 10 · UNIQUE `nombre` · columnas `varchar` sin largo
- RLS: sí · Comentario: **no**
- Código: NINGUNO (se quitó por D7)
- Hallazgos: la borra `20261105_proveedores_fase2_eliminar` (ya escrita y ensayada). Se aplica solo después del despliegue en Render y con OK de Samuel. **No hace falta comentarla.**

### socio
- Filas: 4 · Columnas: 17 · UNIQUE `documento` · CHECK `estado`, `tipo_documento`, `tipo_membresia`, `nivel_aprendizaje`
- FK: `created_by → users` SET NULL
- Índices: `created_by`, `documento`, `email`, `estado`, `nombre`, `tipo_membresia` · Referida por 12 tablas · RLS: sí · Comentario: sí
- Código: `controllers/Membercontroller.js:10` y 8 archivos más (`AsistenciaController`, `CarteraController`, `InventarioController`, `JerseyController`, `PagoController`, `PagoMensualController`, `TransactionController`, `routes/admin.js`)
- Hallazgos: `idx_socio_documento` repite el índice de `socio_documento_key`; sobra.

### socio_documento
- Filas: 0 · Columnas: 10 · CHECK `bytes` ≤ 5 MiB · guarda archivos en `bytea`
- FK: `id_socio → socio` CASCADE; `created_by` SET NULL (sin índice)
- Índices: `idx_socio_documento_socio` · **RLS: NO** (ERROR) · Comentario: **no**
- Código: NINGUNO
- Hallazgos: **prioridad 1 de L2b.** Está pensada para documentos personales y queda expuesta a la clave `anon` por la Data API. Hoy no tiene filas.

### socio_perfil
- Filas: 4 · Columnas: 7 · PK `user_id` · UNIQUE `id_socio`
- FK: `user_id → users` CASCADE; `id_socio → socio` SET NULL · Índices: `idx_socio_perfil_id_socio` · RLS: sí · Comentario: sí
- Triggers: `trg_socio_perfil_cambio_socio`, `trg_socio_perfil_updated_at`
- Código: `controllers/AuthController.js:76`, `controllers/JerseyController.js:383`, `controllers/Membercontroller.js:11`, `controllers/PagoController.js:59`, `controllers/PortalController.js:258`
- Hallazgos: `idx_socio_perfil_id_socio` repite el índice de `socio_perfil_id_socio_key`; sobra.

### system_data
- Filas: 1 · Columnas: 14 · fila única (`CHECK id = 1`)
- RLS: sí · Comentario: sí
- Lo leen las funciones `sp_generar_mensualidades_anual` y `tr_generar_recargo_mora` (`porcentaje_mora`)
- Código: `controllers/ClubDataController.js:6`, `routes/admin.js:54`

### tipo_cartera
- Filas: 5 · Columnas: 5 · UNIQUE `nombre`
- Referida por: `cartera.id_tipo_cartera` (RESTRICT) · **RLS: NO** (ERROR) · Comentario: **no**
- Código: NINGUNO. `id_tipo_cartera` tampoco aparece en `backend/`.
- Hallazgos: catálogo con 5 filas que nadie usa (origen NO VERIFICADO).

### transactions
- Filas: 18 · Columnas: 12 · CHECK `estado`, `tipo` ∈ ingreso/gasto, `metodo_pago` ∈ efectivo/transferencia/tarjeta/cheque · índice único parcial `idx_transactions_referencia`
- FK: `categoria_id → categories`; `created_by → users`; `id_socio → socio` SET NULL
- Referida por 9 tablas · RLS: sí · Comentario: **no**
- Vista: `v_estado_resultados` (sin `security_invoker`, ERROR; ningún código la usa)
- Código: `controllers/TransactionController.js:59`, `controllers/PagoController.js:233`, `controllers/CategoryController.js:127`, `routes/admin.js:29`, `server.js:227`
- Hallazgos: candidata a renombrar por D4 (`transaccion`). La lista de `metodo_pago` no incluye un valor para la pasarela; si `pagos_pasarela` crea asientos con otro valor, el CHECK los rechaza (NO VERIFICADO: falta revisar qué valor manda `PagoController`).

### users
- Filas: 7 · Columnas: 15 (inglés) · UNIQUE `email`, `username` · CHECK `role` ∈ user/admin
- Índices: `idx_users_email`, `idx_users_username` · Referida por 20 FK · RLS: sí · Comentario: sí
- Triggers: `trg_users_crear_perfil`, `trg_users_cambio_rol`, `update_users_updated_at`
- Código: `middleware/auth.js:8`, `controllers/AuthController.js:42`, `routes/auth.js:42`, `routes/forgotPassword.js:82`, `routes/users.js:11`, `server.js:135` y 6 más
- Hallazgos: `idx_users_email` e `idx_users_username` repiten los índices de sus UNIQUE; sobran. Candidata a renombrar por D4 (`usuario`). Si `reset_token` se guarda en claro o con hash: NO VERIFICADO (lo revisa T3).

## 4. Lista de cambios para L2b (después de G1)

Cada cambio va en su propia migración `.up.sql` y `.down.sql`, en este orden. "OK" = necesita aprobación explícita de Samuel en el chat de T2.

| # | Cambio | Migración propuesta | Riesgo | ¿OK? |
|---|---|---|---|---|
| 1 | `ENABLE ROW LEVEL SECURITY` en `socio_documento`, `movimiento_inventario`, `tipo_cartera`, `pago_factura`, `alerta_sistema` | `20261105_rls_tablas_faltantes` | **HECHO 6 nov 04:55 UTC** (ver `CAMBIOS.md`) | OK de Samuel, 5 nov |
| 2 | `ALTER VIEW v_estado_resultados SET (security_invoker = true)` | `20261105_vista_estado_resultados_invoker` | **HECHO 6 nov 04:57 UTC** | OK de Samuel, 5 nov |
| 3 | `ALTER FUNCTION fn_sync_unidades_jersey() SET search_path = public` | `20261105_search_path_fn_sync_unidades_jersey` | **HECHO 6 nov 04:58 UTC** | OK de Samuel, 5 nov |
| 4 | `COMMENT ON TABLE` en las 14 tablas sin comentario (`proveedores` no, porque se elimina); `COMMENT ON COLUMN` en 32 columnas no obvias (FK con nombre atípico, duplicadas, calculadas, llenadas por trigger) | `20261106_comentarios_tablas` y `20261106_comentarios_columnas` | **HECHO 6 nov 05:02 y 05:04 UTC** | OK de Samuel, 6 nov |
| 5 | Índices para las 17 FK sin índice, con nombre N8 (`idx_<tabla>_<col>`) | `20261106_indices_fk_faltantes` | **HECHO 6 nov 05:05 UTC** | OK de Samuel, 6 nov |
| 6 | Renombrar los 15 índices que no cumplen N8 (`ALTER INDEX … RENAME`) | `20261106_renombrar_indices` | **HECHO 6 nov 05:06 UTC** | OK de Samuel, 6 nov |
| 7 | Quitar los índices duplicados: `idx_socio_documento`, `idx_users_email`, `idx_users_username`, `idx_socio_perfil_id_socio`, `idx_asistencia_fecha`, `idx_cartera_estado`, `idx_pago_mensual_estado`, `idx_pedido_jersey_campana`, `idx_pedido_jersey_estado`, `idx_meses_periodo_anio` | `AAAAMMDD_quitar_indices_duplicados` | Bajo, pero es un `DROP INDEX`. **Depende de T3:** `server.js:178` vuelve a crear `idx_socio_documento` en cada arranque hasta que se quite el DDL de `setupDatabase()` (plan §9.1.2) | **Sí** |
| 8 | Convertir `idx_products_codigo_unique` en constraint `products_codigo_key` | `AAAAMMDD_products_codigo_key` | Bajo; es un `DROP` + `ADD` | **Sí** |
| 9 | `created_at SET NOT NULL` en `jersey_campana`, `products` y `transactions` (antes, comprobar que no hay NULL) | `AAAAMMDD_created_at_not_null` | Bajo | **Sí** (cambia una restricción) |
| 10 | Unificar `update_updated_at_column` y `set_updated_at` en una sola función | — | Bajo | **Sí**; propuesta: dejarlo como está y documentarlo |
| 11 | Arreglar o borrar `sp_registrar_pago_mensual`, la función rota | — | Nulo si se borra (nadie la llama) | **Sí** |
| 12 | Renombrar `users`, `transactions`, `categories`, `products` | según D4 | Alto: toca todas las consultas del backend; va con T3 en la misma ventana. **Bloqueo duro:** `setupDatabase()` (`server.js:121`, `:184`) hace `CREATE TABLE IF NOT EXISTS users` y `transactions`. Si se renombra antes de quitar ese DDL, el siguiente arranque crea tablas `users`/`transactions` vacías y además siembra `admin`/`admin123` (`server.js:147-151`) | **Sí** (G1, con regresión en verde antes del 11 nov y después de que T3 quite el DDL) |
| 13 | Fase 2 de proveedores (borrar la tabla y `id_proveedor`) | `20261105_proveedores_fase2_eliminar` (ya existe) | Medio: el backend desplegado todavía hace JOIN | **Sí**, después del despliegue en Render |

Fuera de alcance de L2b (requieren decisión de producto, no de esquema): columnas duplicadas en `factura` y `pago_factura`, tablas sin código (`camerino`, `poliza_salud`, `config_mensualidad`, `detalle_transaccion`, `tipo_cartera`, `alerta_sistema`), mezcla de mayúsculas en los estados (N12) y tipos de dinero (N10). Se documentan en `docs/bd/diccionario.md`.

## 5. Comprobación de la línea base

```
# local (Postgres 17 desechable, sin secretos)
docker run -d --name rc_t2_baseline -e POSTGRES_PASSWORD=qa_local_only -e POSTGRES_DB=qa_baseline postgres:17
docker exec -i rc_t2_baseline psql -U postgres -d qa_baseline -c "create role anon nologin; create role authenticated nologin; create role service_role nologin; create schema extensions;"
docker exec -i rc_t2_baseline psql -U postgres -d qa_baseline -v ON_ERROR_STOP=1 --single-transaction < backend/migrations/0000_baseline.sql
docker exec -i rc_t2_baseline psql -U postgres -d qa_baseline -tA < docs/bd/huella_esquema.sql
# Supabase: correr docs/bd/huella_esquema.sql con execute_sql y comparar las 10 filas
```

Resultado del 5 nov: las 10 huellas son iguales.

| sección | huella |
|---|---|
| columnas | 22093a7dd5f90f26e4d0cf43a884b60d |
| constraints | 67ff3c876cdba886a915d8feccaf3ef6 |
| indices | 10852ae6c45280a9d1da778ceffa55e4 |
| vistas | 8abe7fa4721692e1afc56b74f6e683f7 |
| funciones | 1607204d6aff5132e6f2d75fe0d7f396 |
| triggers | b88cef818ae6506ca3d68ebcf0ff4397 |
| rls | bccc3f88c08c95d23ebc5da8cbf88247 |
| comentarios | 5c08d5bfbe06d1bf1bff47b835cb6437 |
| secuencias | c5f0a08000ec3733afb43eb79e4d890c |
| permisos_funciones | a3a413520b1d7a029a3c876b02a76e42 |
