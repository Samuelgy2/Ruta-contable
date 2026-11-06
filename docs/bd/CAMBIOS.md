# Cambios de esquema aplicados en Supabase (L2b)

Proyecto `hfibhmntifttdududwpw`. Una fila por migración aplicada con `apply_migration`. El archivo de cada una está en `backend/migrations/`.

**Instalar desde cero:** `0000_baseline.sql` (estado al 5 nov, antes de L2b) y después las migraciones de esta tabla en orden.

**Método de cada cambio:**
1. Ensayo en un Postgres 17 local con la línea base cargada: subida, bajada y subida otra vez. La bajada debe devolver la huella exacta de la línea base.
2. Ensayo en Supabase con `BEGIN … ROLLBACK`.
3. `apply_migration`.
4. `get_advisors` (security).
5. Humo.
6. Huella completa (`docs/bd/huella_esquema.sql`) igual en Supabase y en local.

**Respaldo:** Samuel decidió no hacer `pg_dump` (5 nov). Por eso estos cambios se limitan a metadatos (RLS, opciones de vista, configuración de función) y el retiro de `proveedores` deja respaldo en el esquema `respaldo` con su `.down.sql`.

| # | Fecha (UTC) | Versión Supabase | Migración | Qué cambia | Ensayo | Advisor después | Humo |
|---|---|---|---|---|---|---|---|
| 1 | 2026-11-06 04:55 | 20261106045525 | `20261105_rls_tablas_faltantes` | `ENABLE ROW LEVEL SECURITY` en `socio_documento`, `movimiento_inventario`, `tipo_cartera`, `pago_factura`, `alerta_sistema` | Local: huella `rls` pasa de `bccc3f88…` a `5ae8e6b4…` y la bajada la devuelve a `bccc3f88…`. Supabase con ROLLBACK: `postgres` ve 5/5/2 filas, `anon` 0/0/0 | Desaparece el ERROR `rls_disabled_in_public`; INFO `rls_enabled_no_policy` pasa de 30 a 35 tablas (esperado) | `anon` lee 0 filas en las 5 tablas (antes: 5 + 5 + 2). Ninguna tiene endpoints en el backend |
| 2 | 2026-11-06 04:57 | 20261106045718 | `20261105_vista_estado_resultados_invoker` | `v_estado_resultados` con `security_invoker = true` | Local: huella `vistas` pasa de `8abe7fa4…` a `72f30a71…` y la bajada la devuelve a `8abe7fa4…`. Supabase con ROLLBACK: antes `anon` veía 4 filas, después 0; `postgres` 4 en ambos casos | Desaparece el ERROR `security_definer_view`. **Quedan 0 ERROR** | `postgres` sigue leyendo 4 filas. Ningún código usa la vista |
| 3 | 2026-11-06 04:58 | 20261106045841 | `20261105_search_path_fn_sync_unidades_jersey` | `fn_sync_unidades_jersey()` con `search_path = public` | Local: huella `funciones` pasa de `1607204d…` a `e321e2c7…` y la bajada la devuelve a `1607204d…`. Supabase con ROLLBACK: en el pedido 3, cantidad 10→11→10 e `inventario_jersey` 10→11→10 | Desaparece el WARN `function_search_path_mutable`. **Quedan 0 WARN** | Trigger de `pedido_jersey` probado por SQL (arriba). Pedido 3 tras aplicar: 10 ítems de 10 |
| 4 | 2026-11-06 05:02 | 20261106050214 | `20261106_comentarios_tablas` | `COMMENT ON TABLE` en 14 tablas | Local: huella `comentarios` pasa de `5c08d5bf…` a `c9be8f37…` y la bajada la devuelve a `5c08d5bf…`. Supabase con ROLLBACK: solo `proveedores` queda sin comentario | No aplica (solo metadatos) | 34 de 35 tablas con comentario; falta `proveedores`, que se elimina |
| 5 | 2026-11-06 05:04 | 20261106050411 | `20261106_comentarios_columnas` | `COMMENT ON COLUMN` en 32 columnas no obvias | Local: huella `comentarios` pasa de `c9be8f37…` a `a48ae673…` y vuelve. Supabase con ROLLBACK: 36 comentarios de columna (4 previos + 32) | No aplica (solo metadatos) | — |
| 6 | 2026-11-06 05:05 | 20261106050513 | `20261106_indices_fk_faltantes` | 17 índices `idx_<tabla>_<columna>` para las FK sin índice | Local: huella `indices` pasa de `10852ae6…` a `80ed2e97…` y vuelve; FK sin índice que la cubra: 0. Supabase con ROLLBACK: 0 | Rendimiento: desaparece `unindexed_foreign_keys`. Queda el INFO `unused_index`, que es esperable con tablas de 0 a 18 filas (75 índices) | Consulta de FK sin índice: 0 |
| 7 | 2026-11-06 05:06 | 20261106050634 | `20261106_renombrar_indices` | 15 índices renombrados según la regla N8 (`ALTER INDEX … RENAME`, misma definición) | Local: huella `indices` pasa de `80ed2e97…` a `cf0d9efe…` y vuelve. Supabase con ROLLBACK: 0 índices sueltos sin prefijo `idx_<tabla>_` | Sin cambios | Ningún código nombra estos índices (grep `idx_` en `backend/`) |
| 8 | 2026-11-06 20:26 | 20261106202639 | `20261105_proveedores_fase2_eliminar` | Copia `proveedores` e `id_proveedor` al esquema `respaldo` (con RLS), elimina `compra.id_proveedor`, `factura.id_proveedor` y `DROP TABLE public.proveedores` | Supabase con ROLLBACK: `to_regclass('public.proveedores') = null` y `respaldo.proveedores_final = 1` fila | 34 de 34 tablas en `public` con RLS y comentario | `GET /health` en Render responde `200 OK` (`db: OK`) y `/api/proveedores` responde `404` |

**Estado tras el cambio 8.**
- Advisor de seguridad: 0 ERROR y 0 WARN. Las 34 tablas de `public` tienen RLS activo y comentario de tabla.
- Advisor de rendimiento: sin `unindexed_foreign_keys`.

**Huella completa tras el cambio 8** (en Supabase): columnas `d44c4543…`, constraints `c21427ee…`, índices `d6e9c083…`, vistas `8abe7fa4…`, funciones `1607204d…`, triggers `b88cef81…`, rls `a29697e0…`, comentarios `a48ae673…`, secuencias `5bc5199c…`, permisos_funciones `a3a41352…`, orden_columnas `6d02f1a5…`.

**Documentos generados del esquema vivo (6 nov, tras el cambio 8):**
- `docs/bd/diccionario.md`, con `docs/bd/genera_diccionario.sql`: md5 del texto `e3124d70ee8128d712f6653eab0c0836` (34 tablas, 8 vistas y 17 funciones).
- `docs/bd/er.md` (Mermaid), con `docs/bd/genera_er.sql`: md5 `3b8fb624925ae20e740eaf6762fe4e11` (34 tablas y 60 relaciones FK).

**Corrección de `0000_baseline.sql` (6 nov):** el orden de columnas de 20 tablas no era el real. Ver `bd-estandar.md` §5.
