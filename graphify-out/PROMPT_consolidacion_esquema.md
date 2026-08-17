# Prompt: Consolidación de esquema, seguridad y módulos faltantes — Ruta Contable

Pega este prompt completo en el IDE (Claude Code u otro agente con acceso al repo y al MCP de Supabase del proyecto `hfibhmntifttdududwpw`). Es autocontenido: no depende de conversación previa.

---

## Contexto

Ruta Contable es una app de gestión contable/administrativa para un club (backend Express + Postgres en Supabase, frontend Vite/React). Una auditoría reciente comparó la matriz de requisitos del proyecto contra el backend real (`backend/controllers`, `backend/routes`) y el esquema vivo en Supabase (18 tablas, verificado por MCP) y encontró:

1. **Duplicación de tablas de configuración**: `club_config` y `system_data` modelan lo mismo (nombre del club, identificación fiscal, dirección, teléfono, correo, moneda) con columnas nombradas distinto. Ningún controller del backend referencia ninguna de las dos hoy — es terreno libre para elegir una sola.
2. **Duplicación de periodos contables**: `periodos` y `meses_periodo` son dos modelos paralelos del mismo concepto. `pago_mensual` y `cartera` ya apuntan por FK a `meses_periodo`, así que esa es la tabla viva; `periodos` tiene 1 fila y columnas duplicadas dentro de sí misma (`fechainicio` y `fecha_inicio`, `cerradoby` varchar y `cerrado_by` varchar).
3. **Columnas legacy paralelas a relaciones normalizadas**: `transactions.categoria` (texto libre) convive con `transactions.categoria_id` (FK a `categories`); `transactions.creado_por` (texto libre) convive con `created_by` (FK a `users`).
4. **"Proveedor" no es una entidad real**: es un `varchar` suelto repetido en `compra.proveedor` y `factura.proveedor`. El requisito RF-054 de la matriz ("Gestionar proveedores" con datos de contacto y estado activo/inactivo) no tiene modelo de datos detrás.
5. **`compra` no soporta líneas de detalle**: solo tiene una columna `cantidad`/`valor_unitario` a nivel de la fila entera, es decir, una compra hoy solo puede representar un ítem. RF-053 ("Registrar detalle de compras") implica varias líneas por compra, como sí existe para `factura` vía `detalle_factura`.
6. **`products` no está conectado** a nada: `category` es texto libre (no FK), y no se relaciona con `compra`/`detalle_factura` ni con `pedido_jersey`/`inventario_jersey` (que es el inventario real de indumentaria del club).
7. **Brecha de implementación**: el backend solo tiene `Membercontroller.js` y `TransactionController.js`. Las tablas para Compras, Proveedores, Inventario, Cartera y Asistencia ya existen en Supabase (todas con 0 filas) pero no tienen controller ni rutas — la matriz de requisitos para esos 5 procesos (RF-052 a RF-069) no se puede usar todavía aunque el modelo de datos esté listo.
8. **Seguridad — confirmado por inspección del código, no solo por el advisor**: `backend/server.js` se conecta a Postgres directo con `pg.Pool` (variables `DB_HOST` / `DB_HOST_IP`), **no** usa `@supabase/supabase-js`. El frontend tampoco importa ningún cliente de Supabase — toda la app pasa exclusivamente por el backend Express. Esto significa que las políticas RLS son hoy decorativas para el único cliente real (el rol de Postgres que usa el pool, que probablemente es owner/superuser y por lo tanto bypasea RLS de todas formas). Aun así, el advisor de seguridad de Supabase marca las 18 tablas con RLS activado y cero políticas, y marca en **ERROR** la vista `v_estado_resultados` por estar definida `SECURITY DEFINER` (esa sí es un problema real, independiente del cliente que la consulte).
9. **Matriz de requisitos**: RF-064/065/066 están duplicados (aparecen en "Cartera" y en "Asistencia" con contenidos distintos). La hoja `Trazabilidad` usa una numeración paralela (`RF-1 001`…`RF-9 097`, `CU-x yy`) no mapeada a los códigos `RF - 0xx` reales.

## Decisiones ya tomadas (no las vuelvas a preguntar)

- **Alcance**: hacer el rediseño de esquema completo *y* construir el backend faltante *y* resolver los puntos de seguridad (P1 a P3 del roadmap de la auditoría), todo en este trabajo.
- **Estrategia de migración**: rediseño limpio, no migración incremental cuidadosa. Las tablas afectadas tienen 0 filas excepto `socio` (2), `transactions` (3), `users` (4) y `periodos` (1) — volumen insignificante. Está bien `DROP`/`CREATE`/`ALTER` directamente en vez de escribir migraciones `UP`/`DOWN` reversibles.
- **Ejecución**: generar el SQL y aplicarlo directamente contra el proyecto Supabase (`hfibhmntifttdududwpw`) usando las herramientas MCP de Supabase ya conectadas (`apply_migration`, `execute_sql`, etc.), no dejarlo solo en archivos sin correr.
- **Convención de nombres**: mantener el patrón que ya predomina — `snake_case` en español para el dominio de negocio (`id_socio`, `fecha_pago`, `id_proveedor`), columnas de auditoría en inglés (`created_at`, `created_by`, `updated_at`) igual que en las tablas existentes.

## Salvaguarda mínima antes de tocar nada

Aunque el volumen de datos es insignificante, antes de cualquier `DROP TABLE`:

1. Ejecutar un `SELECT * FROM <tabla>` de las 4 tablas con filas (`socio`, `transactions`, `users`, `periodos`) y guardar el resultado en un comentario o archivo dentro de `graphify-out/_pre_migration_snapshot.sql` (como `INSERT`s de respaldo), por si hay que reconstruir algo a mano.
2. Confirmar con `git status` que no hay cambios sin commitear en el repo antes de tocar `backend/` (si los hay, avisar y no seguir sin decírselo al usuario).

## Fase 1 — Seguridad (prioridad P1)

1. **`v_estado_resultados`**: leer su definición actual (`SELECT pg_get_viewdef('public.v_estado_resultados', true)`) y recrearla sin `SECURITY DEFINER` (o con `SECURITY INVOKER` explícito si la sintaxis de la versión de Postgres lo soporta — está en Postgres 17.6, así que sí). Si la vista necesitaba `SECURITY DEFINER` para acceder a datos que el invocador no vería, evaluar si eso sigue siendo necesario dado que RLS no se está aplicando realmente hoy (ver punto siguiente); si no hay una razón activa, quitarlo.
2. **RLS**: documentar explícitamente (en un comentario SQL o en un `README` corto dentro de `backend/`) que el único cliente de la base de datos es el backend Express vía conexión directa `pg.Pool`, que el frontend nunca habla con Supabase directamente, y que por lo tanto las políticas RLS no son hoy la capa de autorización real — esa capa vive en el middleware de Express. No es necesario escribir 18 tablas de políticas para un vector de acceso que no existe. En cambio:
   - Verificar con qué rol de Postgres se conecta el pool (columna `DB_USER` o similar en las variables de entorno — no está en `.env` visible pero sí debe estar declarada en `backend/.env`, que ya está excluido del graphify por sensible; leerlo directamente del filesystem si hace falta) y confirmar si es el owner de las tablas.
   - Si en el futuro se agrega un cliente de Supabase directo (frontend u otro servicio), esta decisión debe revisarse — dejarlo anotado como nota, no como TODO suelto.

## Fase 2 — Consolidación del esquema (prioridad P2)

Ejecutar contra Supabase (proyecto `hfibhmntifttdududwpw`) en este orden, cada bloque en su propia migración con `apply_migration`:

1. **Fusionar `club_config` + `system_data` → mantener `system_data`** (tiene el `CHECK (id = 1)` que garantiza fila única, y más columnas completas: `logo_url`, `dia_vencimiento_default`, `porcentaje_mora`). Antes de dropear `club_config`, revisar si tiene alguna columna sin equivalente en `system_data` (`concurrency`, `fiscal_year`) y decidir si vale la pena agregarla a `system_data` o si son redundantes con columnas ya existentes (`moneda`, `dia_vencimiento_default`). Luego `DROP TABLE club_config`.
2. **Fusionar `periodos` + `meses_periodo` → mantener `meses_periodo`** (ya tiene las FKs reales de `pago_mensual` y `cartera`). Antes de dropear `periodos`, revisar si `total_ingresos`/`total_gastos`/`balance` (resumen calculado del periodo) valen la pena agregarlos a `meses_periodo` como columnas calculadas o vistas — si sí, agregarlas; si no, documentar por qué se descartan. Luego `DROP TABLE periodos`.
3. **Crear tabla `proveedores`**:
   ```sql
   CREATE TABLE proveedores (
     id_proveedor SERIAL PRIMARY KEY,
     nombre VARCHAR NOT NULL UNIQUE,
     nit VARCHAR,
     telefono VARCHAR,
     email VARCHAR,
     direccion VARCHAR,
     estado VARCHAR NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo')),
     observaciones TEXT,
     created_by INTEGER REFERENCES users(id),
     created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
   );
   ```
   Agregar `id_proveedor INTEGER REFERENCES proveedores(id_proveedor)` a `compra` y a `factura`, migrar los valores de texto existentes (si hay filas) creando el proveedor correspondiente, y luego `DROP COLUMN proveedor` (y `nit_proveedor` en `factura`, que pasa a vivir en `proveedores.nit`) de ambas tablas.
4. **Agregar detalle de compra**:
   ```sql
   CREATE TABLE detalle_compra (
     id_compra INTEGER NOT NULL REFERENCES compra(id_compra),
     nro_linea INTEGER NOT NULL,
     concepto VARCHAR NOT NULL,
     cantidad INTEGER NOT NULL DEFAULT 1,
     valor_unitario NUMERIC NOT NULL,
     valor_total NUMERIC GENERATED ALWAYS AS (cantidad * valor_unitario) STORED,
     PRIMARY KEY (id_compra, nro_linea)
   );
   ```
   Migrar la línea única que hoy vive en `compra.concepto`/`cantidad`/`valor_unitario` a una primera fila de `detalle_compra` por cada compra existente, y luego dejar `compra.cantidad`/`valor_unitario` como columnas legacy a eliminar (o eliminarlas ya, dado el volumen 0).
5. **Categorías de producto**: crear `categoria_producto (id SERIAL PK, nombre VARCHAR UNIQUE NOT NULL)`, agregar `products.categoria_id INTEGER REFERENCES categoria_producto(id)`, migrar el texto libre de `products.category` y luego `DROP COLUMN category`. **No** reutilizar la tabla `categories` financiera (income/expense) para esto — son dominios distintos (clasificación contable vs. catálogo de productos) y forzar el mismo modelo los mezclaría mal.
6. **Limpiar columnas legacy**: `DROP COLUMN transactions.categoria`, `DROP COLUMN transactions.creado_por` (una vez confirmado que ningún código del backend los lee — revisar `grep -r "\.categoria\b\|creado_por" backend/controllers backend/routes` antes de dropear).
7. **Índices**: agregar índice a cada FK marcada por el advisor de performance como sin cobertura (`asistencia.registrado_by`, `camerino.id_socio`, `camerino.id_transaccion`, `cartera.id_pago_mensual`, `cartera.id_transaccion`, `compra.categoria_id`, `compra.created_by`, `compra.id_transaccion`, `config_mensualidad.created_by`, `factura.created_by`, `factura.id_compra`, `factura.id_transaccion`, `inventario_jersey.recibido_by`, `meses_periodo.cerrado_by`, `pago_mensual.id_transaccion`, `poliza_salud.id_socio`, `poliza_salud.id_transaccion`, `socio.created_by`, `transactions.categoria_id`, `transactions.created_by`), más las nuevas FKs creadas en este trabajo (`compra.id_proveedor`, `factura.id_proveedor`, `products.categoria_id`).

Después de cada bloque, correr `get_advisors` (security y performance) de nuevo para confirmar que el hallazgo correspondiente desaparece.

## Fase 3 — Backend faltante (prioridad P2)

1. Primero **leer `backend/controllers/Membercontroller.js` y `backend/controllers/TransactionController.js`** completos para extraer el patrón real del proyecto: forma de manejar errores, forma de las respuestas JSON, uso (o no) de middleware de autenticación/roles, estilo de queries (SQL crudo vs. builder), manejo de transacciones SQL. No inventar un estilo nuevo — replicar el que ya existe.
2. Construir, siguiendo ese mismo patrón:
   - `ProveedorController.js` + `routes/proveedores.js` — CRUD de `proveedores` (RF-054), con la regla de negocio "no se permite eliminar/desactivar un proveedor con compras asociadas activas" (RN-054 de la matriz).
   - `CompraController.js` + `routes/compras.js` — registrar compra + `detalle_compra` (RF-052/053), con el flujo de aprobación descrito en la matriz (pendiente → aprobada, solo aprobada permite detalle, no editable tras aprobar).
   - `InventarioController.js` + `routes/inventario.js` — CRUD de `products`/`categoria_producto` (RF-056 a RF-061) y consulta de `pedido_jersey`/`inventario_jersey` si aplica.
   - `CarteraController.js` + `routes/cartera.js` — CRUD de `cartera` (RF-062 a RF-066), con las reglas de estado (pendiente/pagado/anulado) y restricción de eliminar solo cuentas saldadas.
   - `AsistenciaController.js` + `routes/asistencia.js` — CRUD de `asistencia` (RF-064 a RF-069: registrar, visualizar, alertas por inasistencia acumulada/consecutiva, editar, eliminar, exportar).
3. Registrar las rutas nuevas en `backend/server.js` (o donde estén montadas las demás, revisar el patrón de `Member.js`/`Transaction.js`).
4. No tocar `camerino` ni `poliza_salud` en esta fase — no están en la matriz de requisitos; señalarlo como pendiente de decisión del usuario (¿se documentan como alcance extra, o se dejan sin exponer por ahora?) en el resumen final, no decidir por tu cuenta.

## Fase 4 — Limpieza del documento (prioridad P3, no requiere código)

Esto es edición manual del archivo `Matriz_de_requisitos ruta contable ULTIMATE.xlsx` (fuera del repo, en Descargas) — dejar como nota de cierre, no como tarea automatizada:
- Renumerar uno de los dos grupos que hoy comparten `RF-064/065/066` (recomendado: renumerar el bloque de Asistencia como `RF-067/068/069/070/071/072` corriendo la numeración, ya que Compras/Proveedores ya llega hasta ahí en otro orden — o al revés, lo que genere menos texto para tocar).
- Agregar una columna en la hoja `Trazabilidad` que mapee cada `RF-x nnn`/`CU-x yy` a su `RF - 0nn` real de la hoja `RF`.

## Al terminar

Entregar un resumen con: qué migraciones se aplicaron (con sus IDs de `apply_migration`), qué controllers/rutas se crearon, el resultado de `get_advisors` antes/después, y la lista de decisiones que quedaron pendientes de que el usuario las confirme (en particular `camerino`/`poliza_salud` y cualquier columna de `club_config`/`periodos` que se haya decidido no migrar).
