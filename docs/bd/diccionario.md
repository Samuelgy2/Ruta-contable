# Diccionario de datos — Ruta Contable

Generado desde el catálogo de PostgreSQL con `docs/bd/genera_diccionario.sql`. No se edita a mano: se regenera después de cada migración. Esquema `public`: 35 tablas, 8 vistas y 17 funciones.

Reglas de nombres, equivalencias y hallazgos por tabla (filas reales, uso en código): `docs/bd/bd-estandar.md`. Diagrama entidad-relación: `docs/bd/er.md`. Historial de cambios: `docs/bd/CAMBIOS.md`.

Convenciones: **Nulo** = ¿admite NULL? · **Clave**: PK primaria, UK única, FK → tabla.columna referida.

Tablas: [admin_perfil](#admin_perfil), [alerta_sistema](#alerta_sistema), [asistencia](#asistencia), [auditoria](#auditoria), [camerino](#camerino), [cartera](#cartera), [categoria_producto](#categoria_producto), [categories](#categories), [compra](#compra), [config_mensualidad](#config_mensualidad), [detalle_compra](#detalle_compra), [detalle_factura](#detalle_factura), [detalle_transaccion](#detalle_transaccion), [factura](#factura), [inventario_jersey](#inventario_jersey), [jersey_campana](#jersey_campana), [landing_borrador](#landing_borrador), [landing_imagen](#landing_imagen), [landing_version](#landing_version), [meses_periodo](#meses_periodo), [movimiento_inventario](#movimiento_inventario), [pago_factura](#pago_factura), [pago_mensual](#pago_mensual), [pagos_pasarela](#pagos_pasarela), [pedido_jersey](#pedido_jersey), [poliza_salud](#poliza_salud), [products](#products), [proveedores](#proveedores), [socio](#socio), [socio_documento](#socio_documento), [socio_perfil](#socio_perfil), [system_data](#system_data), [tipo_cartera](#tipo_cartera), [transactions](#transactions), [users](#users).

## Tablas

### admin_perfil

Datos propios del administrador. Uno a uno con users donde role = admin.

RLS: activo, sin políticas.

| Columna | Tipo | Nulo | Por defecto | Clave | Descripción |
|---|---|---|---|---|---|
| user_id | integer | no |  | PK, FK → users.id |  |
| cargo | character varying(100) | sí |  |  |  |
| permisos | jsonb | no | '{}'::jsonb |  |  |
| creado_por | integer | sí |  | FK → users.id | FK a users.id: usuario que creó el perfil de administrador. |
| created_at | timestamp without time zone | no | CURRENT_TIMESTAMP |  |  |
| updated_at | timestamp without time zone | no | CURRENT_TIMESTAMP |  |  |

Índices (además de los de PK y UK):

- `idx_admin_perfil_creado_por` (creado_por)

Triggers:

- `trg_admin_perfil_updated_at`: BEFORE UPDATE ON public.admin_perfil FOR EACH ROW EXECUTE FUNCTION set_updated_at()

### alerta_sistema

Alertas internas del sistema: tipo, mensaje, detalle JSON y marca de leída. Sin uso en el backend al 6 nov 2026.

RLS: activo, sin políticas.

| Columna | Tipo | Nulo | Por defecto | Clave | Descripción |
|---|---|---|---|---|---|
| id | integer | no | nextval('alerta_sistema_id_seq'::regclass) | PK |  |
| tipo | character varying(50) | no | 'error_sistema'::character varying |  |  |
| mensaje | text | no |  |  |  |
| detalle | jsonb | sí |  |  |  |
| leida | boolean | no | false |  |  |
| created_at | timestamp without time zone | no | CURRENT_TIMESTAMP |  |  |

### asistencia

Control de asistencia a entrenamientos y actividades

RLS: activo, sin políticas.

| Columna | Tipo | Nulo | Por defecto | Clave | Descripción |
|---|---|---|---|---|---|
| id_asistencia | integer | no | nextval('asistencia_id_asistencia_seq'::regclass) | PK |  |
| id_socio | integer | no |  | UK (compuesta), FK → socio.id_socio |  |
| fecha | date | no |  | UK (compuesta) |  |
| tipo_entrenamiento | character varying(100) | sí |  |  |  |
| estado | character varying(15) | no |  |  |  |
| observacion | character varying(255) | sí |  |  |  |
| registrado_by | integer | sí |  | FK → users.id | FK a users.id: usuario que registró la asistencia. |
| created_at | timestamp without time zone | no | CURRENT_TIMESTAMP |  |  |

Restricciones CHECK:

- `asistencia_estado_check`: `estado` ∈ {Presente, Ausente, Justificado, Tarde}

Índices (además de los de PK y UK):

- `idx_asistencia_estado` (estado)
- `idx_asistencia_fecha` (fecha)
- `idx_asistencia_fecha_estado` (fecha, estado)
- `idx_asistencia_registrado_by` (registrado_by)

### auditoria

Registro de acciones de usuarios: acción, entidad, detalle JSON e IP. Al 6 nov 2026 solo la escribe el módulo de landing.

RLS: activo, sin políticas.

| Columna | Tipo | Nulo | Por defecto | Clave | Descripción |
|---|---|---|---|---|---|
| id | integer | no | nextval('auditoria_id_seq'::regclass) | PK |  |
| usuario_id | integer | sí |  | FK → users.id | FK a users.id: usuario que hizo la acción. |
| accion | character varying(50) | no |  |  |  |
| entidad | character varying(50) | no |  |  |  |
| detalle | jsonb | sí |  |  |  |
| ip | character varying(64) | sí |  |  |  |
| created_at | timestamp without time zone | no | CURRENT_TIMESTAMP |  |  |

Índices (además de los de PK y UK):

- `idx_auditoria_entidad_created_at` (entidad, created_at DESC)
- `idx_auditoria_usuario_id` (usuario_id)

### camerino

Asignación y pago de camerinos o lockers

RLS: activo, sin políticas.

| Columna | Tipo | Nulo | Por defecto | Clave | Descripción |
|---|---|---|---|---|---|
| id_camerino | integer | no | nextval('camerino_id_camerino_seq'::regclass) | PK |  |
| id_socio | integer | no |  | FK → socio.id_socio |  |
| numero_camerino | character varying(20) | no |  |  |  |
| anio | integer | no |  |  |  |
| valor | numeric(10,2) | no |  |  |  |
| fecha_asignacion | date | no |  |  |  |
| fecha_pago | date | sí |  |  |  |
| estado | character varying(15) | sí | 'Asignado'::character varying |  |  |
| id_transaccion | integer | sí |  | FK → transactions.id |  |
| observaciones | text | sí |  |  |  |

Restricciones CHECK:

- `camerino_anio_check`: `CHECK ((anio >= 2000))`
- `camerino_estado_check`: `estado` ∈ {Asignado, Pagado, Vencido, Liberado}

Índices (además de los de PK y UK):

- `idx_camerino_anio` (anio)
- `idx_camerino_id_socio` (id_socio)
- `idx_camerino_id_transaccion` (id_transaccion)

### cartera

Registro de cartera morosa y recargos

RLS: activo, sin políticas.

| Columna | Tipo | Nulo | Por defecto | Clave | Descripción |
|---|---|---|---|---|---|
| id_cartera | integer | no | nextval('cartera_id_cartera_seq'::regclass) | PK |  |
| id_socio | integer | no |  | FK → socio.id_socio |  |
| id_pago_mensual | integer | sí |  | FK → pago_mensual.id_pago | Mensualidad que originó el recargo por mora; lo inserta el trigger tr_generar_recargo_mora. |
| fecha | date | no |  |  |  |
| concepto | character varying(255) | no |  |  |  |
| valor | numeric(10,2) | no |  |  |  |
| estado | character varying(15) | sí | 'pendiente'::character varying |  |  |
| fecha_pago | date | sí |  |  |  |
| id_transaccion | integer | sí |  | FK → transactions.id |  |
| observaciones | text | sí |  |  |  |
| created_at | timestamp without time zone | no | CURRENT_TIMESTAMP |  |  |
| id_tipo_cartera | integer | sí |  | FK → tipo_cartera.id_tipo |  |
| fecha_vencimiento | date | sí |  |  |  |
| forma_pago | character varying(40) | sí |  |  | Forma de pago. Sin uso en el backend al 6 nov 2026; las demás tablas usan metodo_pago. |

Restricciones CHECK:

- `cartera_estado_check`: `estado` ∈ {pendiente, pagado, anulado}
- `cartera_pagado_con_transaccion`: `CHECK ((((estado)::text <> 'pagado'::text) OR (id_transaccion IS NOT NULL)))`

Índices (además de los de PK y UK):

- `idx_cartera_estado` (estado)
- `idx_cartera_estado_fecha` (estado, fecha)
- `idx_cartera_id_pago_mensual` (id_pago_mensual)
- `idx_cartera_id_socio` (id_socio)
- `idx_cartera_id_tipo_cartera` (id_tipo_cartera)
- `idx_cartera_id_transaccion` (id_transaccion)

### categoria_producto

Categorías de los productos del inventario (products.categoria_id).

RLS: activo, sin políticas.

| Columna | Tipo | Nulo | Por defecto | Clave | Descripción |
|---|---|---|---|---|---|
| id | integer | no | nextval('categoria_producto_id_seq'::regclass) | PK |  |
| nombre | character varying | no |  | UK |  |

Referenciada por: `products.categoria_id` (ON DELETE NO ACTION).

### categories

Categorías para clasificar ingresos y gastos

RLS: activo, sin políticas.

| Columna | Tipo | Nulo | Por defecto | Clave | Descripción |
|---|---|---|---|---|---|
| id | integer | no | nextval('categories_id_seq'::regclass) | PK |  |
| name | character varying(100) | no |  |  |  |
| type | character varying(10) | no |  |  |  |
| description | text | sí |  |  |  |
| active | boolean | no | true |  |  |
| created_at | timestamp without time zone | no | CURRENT_TIMESTAMP |  |  |
| updated_at | timestamp without time zone | sí | CURRENT_TIMESTAMP |  |  |

Restricciones CHECK:

- `categories_type_check`: `type` ∈ {income, expense}

Índices (además de los de PK y UK):

- `idx_categories_active` (active)
- `idx_categories_type` (type)

Triggers:

- `update_categories_updated_at`: BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()

Referenciada por: `compra.categoria_id` (ON DELETE SET NULL), `transactions.categoria_id` (ON DELETE NO ACTION).

### compra

Registro de compras y gastos del club

RLS: activo, sin políticas.

| Columna | Tipo | Nulo | Por defecto | Clave | Descripción |
|---|---|---|---|---|---|
| id_compra | integer | no | nextval('compra_id_compra_seq'::regclass) | PK |  |
| concepto | character varying(200) | no |  |  |  |
| tipo | character varying(100) | sí |  |  |  |
| fecha | date | no |  |  |  |
| factura | character varying(50) | sí |  |  | Número de la factura del proveedor, como texto. No es FK a la tabla factura. |
| categoria_id | integer | sí |  | FK → categories.id | FK a categories.id: categoría financiera de la compra. |
| id_transaccion | integer | sí |  | FK → transactions.id |  |
| observaciones | text | sí |  |  |  |
| created_by | integer | sí |  | FK → users.id |  |
| created_at | timestamp without time zone | no | CURRENT_TIMESTAMP |  |  |
| id_proveedor | integer | sí |  | FK → proveedores.id_proveedor |  |
| estado | character varying | no | 'pendiente'::character varying |  |  |
| approved_by | integer | sí |  | FK → users.id | FK a users.id: usuario que aprobó la compra (estado aprobada). |
| approved_at | timestamp without time zone | sí |  |  | Fecha y hora de la aprobación de la compra. |
| proveedor_nombre | character varying(150) | sí |  |  | Proveedor como texto libre (opcional). Reemplaza a la antigua tabla proveedores. |

Restricciones CHECK:

- `compra_estado_check`: `estado` ∈ {pendiente, aprobada}

Índices (además de los de PK y UK):

- `idx_compra_approved_by` (approved_by)
- `idx_compra_categoria_id` (categoria_id)
- `idx_compra_created_by` (created_by)
- `idx_compra_id_proveedor` (id_proveedor)
- `idx_compra_id_transaccion` (id_transaccion)

Referenciada por: `detalle_compra.id_compra` (ON DELETE NO ACTION), `factura.id_compra` (ON DELETE SET NULL), `movimiento_inventario.id_compra` (ON DELETE SET NULL).

### config_mensualidad

Configuración anual de mensualidades

RLS: activo, sin políticas.

| Columna | Tipo | Nulo | Por defecto | Clave | Descripción |
|---|---|---|---|---|---|
| id_config | integer | no | nextval('config_mensualidad_id_config_seq'::regclass) | PK |  |
| anio | integer | no |  | UK |  |
| valor_mensual | numeric(10,2) | no |  |  |  |
| fecha_vencimiento_default | smallint | sí | 15 |  |  |
| activo | boolean | sí | true |  |  |
| observaciones | text | sí |  |  |  |
| created_at | timestamp without time zone | no | CURRENT_TIMESTAMP |  |  |
| updated_at | timestamp without time zone | sí | CURRENT_TIMESTAMP |  |  |
| created_by | integer | sí |  | FK → users.id |  |

Restricciones CHECK:

- `config_mensualidad_anio_check`: `CHECK ((anio >= 2000))`

Índices (además de los de PK y UK):

- `idx_config_mensualidad_created_by` (created_by)

Triggers:

- `update_config_mensualidad_updated_at`: BEFORE UPDATE ON public.config_mensualidad FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()

### detalle_compra

Líneas de una compra: concepto, cantidad, valor unitario y producto opcional. valor_total es una columna calculada.

RLS: activo, sin políticas.

| Columna | Tipo | Nulo | Por defecto | Clave | Descripción |
|---|---|---|---|---|---|
| id_compra | integer | no |  | PK (compuesta), FK → compra.id_compra |  |
| nro_linea | integer | no |  | PK (compuesta) |  |
| concepto | character varying | no |  |  |  |
| cantidad | integer | no | 1 |  |  |
| valor_unitario | numeric | no |  |  |  |
| valor_total | numeric | sí | calculada: ((cantidad)::numeric * valor_unitario) |  | Columna calculada: cantidad * valor_unitario. |
| id_producto | integer | sí |  | FK → products.id |  |

Índices (además de los de PK y UK):

- `idx_detalle_compra_id_producto` (id_producto)

### detalle_factura

Líneas de detalle de facturas

RLS: activo, sin políticas.

| Columna | Tipo | Nulo | Por defecto | Clave | Descripción |
|---|---|---|---|---|---|
| id_factura | integer | no |  | PK (compuesta), FK → factura.id_factura |  |
| nro_linea | integer | no |  | PK (compuesta) |  |
| servicio | character varying(200) | no |  |  |  |
| descripcion | text | sí |  |  |  |
| cantidad | integer | sí | 1 |  |  |
| valor_unitario | numeric(10,2) | no |  |  |  |
| valor_total | numeric(10,2) | sí | calculada: ((cantidad)::numeric * valor_unitario) |  | Columna calculada: cantidad * valor_unitario. No aplica iva ni descuento. |
| iva | numeric(5,2) | sí | 0 |  |  |
| descuento | numeric(5,2) | sí | 0 |  |  |
| observaciones | character varying(255) | sí |  |  |  |

### detalle_transaccion

Detalle de transacciones asociadas a socios

RLS: activo, sin políticas.

| Columna | Tipo | Nulo | Por defecto | Clave | Descripción |
|---|---|---|---|---|---|
| id_detalle | integer | no | nextval('detalle_transaccion_id_detalle_seq'::regclass) | PK |  |
| id_transaccion | integer | no |  | UK (compuesta), FK → transactions.id |  |
| id_socio | integer | sí |  | UK (compuesta), FK → socio.id_socio |  |
| monto | numeric(10,2) | no |  |  |  |
| concepto | character varying(150) | sí |  |  |  |

Índices (además de los de PK y UK):

- `idx_detalle_transaccion_id_socio` (id_socio)

### factura

Facturación de compras y proveedores

RLS: activo, sin políticas.

| Columna | Tipo | Nulo | Por defecto | Clave | Descripción |
|---|---|---|---|---|---|
| id_factura | integer | no | nextval('factura_id_factura_seq'::regclass) | PK |  |
| fecha | date | no |  |  |  |
| concepto | character varying(200) | no |  |  |  |
| valor_total | numeric(10,2) | no |  |  |  |
| numero_factura | character varying(50) | sí |  |  | Mismo propósito que nro_factura (columnas duplicadas). Ninguna de las dos se usa en el backend al 6 nov 2026. |
| fecha_recepcion | date | sí |  |  |  |
| estado | character varying(15) | sí | 'Pendiente'::character varying |  |  |
| id_compra | integer | sí |  | FK → compra.id_compra |  |
| id_transaccion | integer | sí |  | FK → transactions.id |  |
| observaciones | text | sí |  |  |  |
| created_by | integer | sí |  | FK → users.id |  |
| created_at | timestamp without time zone | no | CURRENT_TIMESTAMP |  |  |
| updated_at | timestamp without time zone | sí | CURRENT_TIMESTAMP |  |  |
| id_proveedor | integer | sí |  | FK → proveedores.id_proveedor |  |
| id_socio | integer | sí |  | FK → socio.id_socio |  |
| monto_pagado | numeric | no | 0 |  |  |
| nro_factura | character varying(60) | sí |  |  | Mismo propósito que numero_factura (columnas duplicadas). Ninguna de las dos se usa en el backend al 6 nov 2026. |
| fecha_emision | date | sí | CURRENT_DATE |  | Mismo propósito que fecha (columnas duplicadas). |
| fecha_vencimiento | date | sí |  |  |  |
| nit_club | character varying(40) | sí |  |  |  |
| proveedor_nombre | character varying(150) | sí |  |  | Proveedor como texto libre (opcional). Reemplaza a la antigua tabla proveedores. |

Restricciones CHECK:

- `factura_estado_check`: `estado` ∈ {Pendiente, Emitida, Pagada, Anulada, Vencida}

Índices (además de los de PK y UK):

- `idx_factura_created_by` (created_by)
- `idx_factura_estado` (estado)
- `idx_factura_fecha` (fecha)
- `idx_factura_id_compra` (id_compra)
- `idx_factura_id_proveedor` (id_proveedor)
- `idx_factura_id_socio` (id_socio)
- `idx_factura_id_transaccion` (id_transaccion)

Triggers:

- `update_factura_updated_at`: BEFORE UPDATE ON public.factura FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()

Referenciada por: `detalle_factura.id_factura` (ON DELETE CASCADE), `pago_factura.id_factura` (ON DELETE CASCADE).

### inventario_jersey

Control de inventario y entregas de indumentaria

RLS: activo, sin políticas.

| Columna | Tipo | Nulo | Por defecto | Clave | Descripción |
|---|---|---|---|---|---|
| id_inventario | integer | no | nextval('inventario_jersey_id_inventario_seq'::regclass) | PK |  |
| id_pedido | integer | no |  | UK (compuesta), FK → pedido_jersey.id_pedido |  |
| nro_item | integer | no |  | UK (compuesta) |  |
| estado_entrega | character varying(15) | sí | 'Pendiente'::character varying |  |  |
| fecha_entrega | date | sí |  |  |  |
| recibido_by | integer | sí |  | FK → users.id | FK a users.id: usuario que registró la entrega de la unidad. |
| observaciones | character varying(255) | sí |  |  |  |

Restricciones CHECK:

- `inventario_jersey_estado_entrega_check`: `estado_entrega` ∈ {Pendiente, Entregado, Devuelto}

Índices (además de los de PK y UK):

- `idx_inventario_jersey_recibido_by` (recibido_by)

### jersey_campana

Campañas de pedido de jersey: título, tallas disponibles, valor y rango de fechas. Los socios piden dentro de una campaña (pedido_jersey.id_campana).

RLS: activo, sin políticas.

| Columna | Tipo | Nulo | Por defecto | Clave | Descripción |
|---|---|---|---|---|---|
| id | integer | no | nextval('jersey_campana_id_seq'::regclass) | PK |  |
| titulo | character varying(120) | no |  |  |  |
| descripcion | text | sí |  |  |  |
| tallas | jsonb | no | '["XS", "S", "M", "L", "XL", "XXL"]'::jsonb |  |  |
| valor | numeric(12,2) | no |  |  |  |
| fecha_inicio | date | no | CURRENT_DATE |  |  |
| fecha_fin | date | sí |  |  |  |
| activa | boolean | no | true |  |  |
| created_by | integer | sí |  | FK → users.id |  |
| created_at | timestamp without time zone | sí | now() |  |  |

Restricciones CHECK:

- `jersey_campana_valor_check`: `CHECK ((valor > (0)::numeric))`

Índices (además de los de PK y UK):

- `idx_jersey_campana_activa_fecha_fin` (activa, fecha_fin)
- `idx_jersey_campana_created_by` (created_by)

Referenciada por: `pedido_jersey.id_campana` (ON DELETE NO ACTION).

### landing_borrador

Borrador del contenido editable de la landing page. Tabla de una sola fila (id = 1).

RLS: activo, sin políticas.

| Columna | Tipo | Nulo | Por defecto | Clave | Descripción |
|---|---|---|---|---|---|
| id | integer | no | 1 | PK | Siempre 1: tabla de una sola fila. |
| contenido | jsonb | no |  |  |  |
| updated_by | integer | sí |  | FK → users.id | FK a users.id: último usuario que guardó el borrador. |
| updated_at | timestamp without time zone | no | CURRENT_TIMESTAMP |  |  |

Restricciones CHECK:

- `landing_borrador_id_check`: `CHECK ((id = 1))`

Índices (además de los de PK y UK):

- `idx_landing_borrador_updated_by` (updated_by)

### landing_imagen

Imágenes subidas para la landing page, guardadas en bytea: jpeg, png o webp, máximo 2 MiB, con texto alternativo obligatorio.

RLS: activo, sin políticas.

| Columna | Tipo | Nulo | Por defecto | Clave | Descripción |
|---|---|---|---|---|---|
| id | integer | no | nextval('landing_imagen_id_seq'::regclass) | PK |  |
| mime | character varying(20) | no |  |  |  |
| datos | bytea | no |  |  |  |
| bytes | integer | no |  |  |  |
| alt | character varying(150) | no |  |  |  |
| created_by | integer | sí |  | FK → users.id |  |
| created_at | timestamp without time zone | no | CURRENT_TIMESTAMP |  |  |

Restricciones CHECK:

- `landing_imagen_alt_check`: `CHECK ((length(TRIM(BOTH FROM alt)) > 0))`
- `landing_imagen_bytes_check`: `CHECK (((bytes > 0) AND (bytes <= 2097152)))`
- `landing_imagen_mime_check`: `mime` ∈ {image/jpeg, image/png, image/webp}

Índices (además de los de PK y UK):

- `idx_landing_imagen_created_by` (created_by)

### landing_version

Versiones publicadas del contenido de la landing page, numeradas desde 1.

RLS: activo, sin políticas.

| Columna | Tipo | Nulo | Por defecto | Clave | Descripción |
|---|---|---|---|---|---|
| numero | integer | no |  | PK |  |
| contenido | jsonb | no |  |  |  |
| publicado_by | integer | sí |  | FK → users.id | FK a users.id: usuario que publicó la versión. |
| publicado_at | timestamp without time zone | no | CURRENT_TIMESTAMP |  |  |

Restricciones CHECK:

- `landing_version_numero_check`: `CHECK ((numero > 0))`

Índices (además de los de PK y UK):

- `idx_landing_version_publicado_by` (publicado_by)

### meses_periodo

Periodos mensuales para control contable

RLS: activo, sin políticas.

| Columna | Tipo | Nulo | Por defecto | Clave | Descripción |
|---|---|---|---|---|---|
| id_periodo | integer | no | nextval('meses_periodo_id_periodo_seq'::regclass) | PK |  |
| anio | integer | no |  | UK (compuesta) |  |
| mes | smallint | no |  | UK (compuesta) |  |
| nombre_mes | character varying(20) | no |  |  |  |
| fecha_inicio | date | no |  |  |  |
| fecha_fin | date | no |  |  |  |
| activo | boolean | sí | true |  |  |
| cerrado | boolean | sí | false |  |  |
| fecha_cierre | date | sí |  |  |  |
| observaciones | text | sí |  |  |  |
| cerrado_by | integer | sí |  | FK → users.id | FK a users.id: usuario que cerró el periodo; NULL cuando lo cerró el proceso automático. |
| total_ingresos | numeric | sí | 0.00 |  |  |
| total_gastos | numeric | sí | 0.00 |  |  |
| balance | numeric | sí | 0.00 |  |  |

Restricciones CHECK:

- `meses_periodo_anio_check`: `CHECK ((anio >= 2000))`
- `meses_periodo_mes_check`: `CHECK (((mes >= 1) AND (mes <= 12)))`

Índices (además de los de PK y UK):

- `idx_meses_periodo_anio` (anio)
- `idx_meses_periodo_cerrado_by` (cerrado_by)

Referenciada por: `pago_mensual.id_periodo` (ON DELETE NO ACTION).

### movimiento_inventario

Movimientos de stock de productos (entrada, salida o ajuste) con stock anterior y nuevo. Sin uso en el backend al 6 nov 2026.

RLS: activo, sin políticas.

| Columna | Tipo | Nulo | Por defecto | Clave | Descripción |
|---|---|---|---|---|---|
| id_movimiento | integer | no | nextval('movimiento_inventario_id_movimiento_seq'::regclass) | PK |  |
| id_producto | integer | no |  | FK → products.id |  |
| tipo | character varying(20) | no |  |  |  |
| cantidad | integer | no |  |  |  |
| stock_anterior | integer | no | 0 |  |  |
| stock_nuevo | integer | no | 0 |  |  |
| motivo | character varying(200) | no |  |  |  |
| id_compra | integer | sí |  | FK → compra.id_compra |  |
| created_by | integer | sí |  | FK → users.id |  |
| created_at | timestamp without time zone | no | CURRENT_TIMESTAMP |  |  |
| referencia_origen | character varying(100) | sí | 'manual'::character varying |  |  |
| registrado_by | integer | sí |  | FK → users.id | FK a users.id. Mismo propósito que created_by (columnas duplicadas). |

Restricciones CHECK:

- `movimiento_inventario_cantidad_check`: `CHECK ((cantidad > 0))`
- `movimiento_inventario_tipo_check`: `tipo` ∈ {entrada, salida, ajuste}

Índices (además de los de PK y UK):

- `idx_movimiento_inventario_created_by` (created_by)
- `idx_movimiento_inventario_id_compra` (id_compra)
- `idx_movimiento_inventario_id_producto` (id_producto)
- `idx_movimiento_inventario_registrado_by` (registrado_by)

### pago_factura

Pagos aplicados a una factura. Sin uso en el backend al 6 nov 2026.

RLS: activo, sin políticas.

| Columna | Tipo | Nulo | Por defecto | Clave | Descripción |
|---|---|---|---|---|---|
| id_pago_factura | integer | no | nextval('pago_factura_id_pago_factura_seq'::regclass) | PK |  |
| id_factura | integer | no |  | FK → factura.id_factura |  |
| fecha | date | no | CURRENT_DATE |  |  |
| monto | numeric | no |  |  |  |
| metodo_pago | character varying(40) | no | 'efectivo'::character varying |  |  |
| id_transaccion | integer | sí |  | FK → transactions.id |  |
| observaciones | text | sí |  |  |  |
| created_by | integer | sí |  | FK → users.id |  |
| created_at | timestamp without time zone | no | CURRENT_TIMESTAMP |  |  |
| fecha_pago | date | sí | CURRENT_DATE |  | Mismo propósito que fecha (columnas duplicadas). |
| referencia | character varying(100) | sí |  |  |  |
| registrado_by | integer | sí |  | FK → users.id | FK a users.id. Mismo propósito que created_by (columnas duplicadas). |

Restricciones CHECK:

- `pago_factura_monto_check`: `CHECK ((monto > (0)::numeric))`

Índices (además de los de PK y UK):

- `idx_pago_factura_created_by` (created_by)
- `idx_pago_factura_id_factura` (id_factura)
- `idx_pago_factura_id_transaccion` (id_transaccion)
- `idx_pago_factura_registrado_by` (registrado_by)

### pago_mensual

Control de pagos de mensualidades por socio

RLS: activo, sin políticas.

| Columna | Tipo | Nulo | Por defecto | Clave | Descripción |
|---|---|---|---|---|---|
| id_pago | integer | no | nextval('pago_mensual_id_pago_seq'::regclass) | PK |  |
| id_socio | integer | no |  | UK (compuesta), FK → socio.id_socio |  |
| id_periodo | integer | no |  | UK (compuesta), FK → meses_periodo.id_periodo |  |
| valor | numeric(10,2) | no |  |  |  |
| fecha_vencimiento | date | no |  |  |  |
| fecha_pago | date | sí |  |  |  |
| estado | character varying(15) | sí | 'pendiente'::character varying |  |  |
| id_transaccion | integer | sí |  | FK → transactions.id |  |
| dias_mora | integer | sí | 0 |  | Días de atraso respecto a fecha_vencimiento; lo calcula el trigger tr_actualizar_mora. |
| observaciones | text | sí |  |  |  |
| created_at | timestamp without time zone | no | CURRENT_TIMESTAMP |  |  |
| updated_at | timestamp without time zone | sí | CURRENT_TIMESTAMP |  |  |

Restricciones CHECK:

- `pago_mensual_estado_check`: `estado` ∈ {pendiente, pagado, moroso, exento, cancelado}
- `pago_mensual_pagado_con_transaccion`: `CHECK ((((estado)::text <> 'pagado'::text) OR (id_transaccion IS NOT NULL)))`

Índices (además de los de PK y UK):

- `idx_pago_mensual_estado` (estado)
- `idx_pago_mensual_estado_fecha_vencimiento` (estado, fecha_vencimiento)
- `idx_pago_mensual_fecha_vencimiento` (fecha_vencimiento)
- `idx_pago_mensual_id_periodo` (id_periodo)
- `idx_pago_mensual_id_transaccion` (id_transaccion)

Triggers:

- `trigger_actualizar_mora`: BEFORE UPDATE ON public.pago_mensual FOR EACH ROW EXECUTE FUNCTION tr_actualizar_mora()
- `trigger_generar_recargo_mora`: AFTER UPDATE ON public.pago_mensual FOR EACH ROW EXECUTE FUNCTION tr_generar_recargo_mora()
- `trigger_prevenir_pago_duplicado`: BEFORE INSERT ON public.pago_mensual FOR EACH ROW EXECUTE FUNCTION tr_prevenir_pago_duplicado()
- `update_pago_mensual_updated_at`: BEFORE UPDATE ON public.pago_mensual FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()

Referenciada por: `cartera.id_pago_mensual` (ON DELETE SET NULL).

### pagos_pasarela

Intentos de pago via pasarela. payload_raw guarda el JSON crudo del webhook para auditoria.

RLS: activo, sin políticas.

| Columna | Tipo | Nulo | Por defecto | Clave | Descripción |
|---|---|---|---|---|---|
| id | integer | no | nextval('pagos_pasarela_id_seq'::regclass) | PK |  |
| referencia | character varying(100) | no |  | UK |  |
| proveedor | character varying(30) | no | 'paypal'::character varying |  |  |
| proveedor_id | character varying(100) | sí |  | UK |  |
| user_id | integer | sí |  | FK → users.id | FK a users.id: usuario del portal que inició el pago. Si id_socio llega vacío, el trigger tr_pagos_pasarela_resolver_socio lo toma de socio_perfil. |
| id_socio | integer | sí |  | FK → socio.id_socio |  |
| concepto | character varying(200) | sí |  |  |  |
| monto | numeric(15,2) | no |  |  |  |
| amount_in_cents | bigint | no |  |  |  |
| moneda | character varying(3) | no | 'USD'::character varying |  |  |
| estado | character varying(20) | no | 'PENDING'::character varying |  | Estado normalizado de la aplicacion, independiente de la pasarela. Solo APPROVED genera asiento en transactions. |
| metodo_pago | character varying(50) | sí |  |  |  |
| transaction_id | integer | sí |  | FK → transactions.id | FK a transactions.id: asiento contable generado cuando el pago queda APPROVED. |
| payload_raw | jsonb | sí |  |  |  |
| created_at | timestamp without time zone | no | CURRENT_TIMESTAMP |  |  |
| updated_at | timestamp without time zone | no | CURRENT_TIMESTAMP |  |  |
| finalized_at | timestamp without time zone | sí |  |  |  |
| estado_proveedor | character varying(50) | sí |  |  | Estado crudo de la pasarela, sin traducir. PayPal: COMPLETED, DENIED, PENDING, REFUNDED, APPROVED... Se conserva junto al estado normalizado. |
| orden_id | character varying(100) | sí |  |  |  |

Restricciones CHECK:

- `pagos_pasarela_estado_check`: `estado` ∈ {PENDING, APPROVED, DECLINED, VOIDED, REFUNDED, ERROR}
- `pagos_pasarela_monto_check`: `CHECK ((monto > (0)::numeric))`

Índices (además de los de PK y UK):

- `idx_pagos_pasarela_estado` (estado)
- `idx_pagos_pasarela_id_socio` (id_socio)
- `idx_pagos_pasarela_orden_id` (orden_id)
- `idx_pagos_pasarela_transaction_id` (transaction_id)
- `idx_pagos_pasarela_user_id` (user_id)

Triggers:

- `trg_pagos_pasarela_resolver_socio`: BEFORE INSERT ON public.pagos_pasarela FOR EACH ROW EXECUTE FUNCTION tr_pagos_pasarela_resolver_socio()
- `trg_pagos_pasarela_updated_at`: BEFORE UPDATE ON public.pagos_pasarela FOR EACH ROW EXECUTE FUNCTION set_updated_at()

### pedido_jersey

Pedidos de indumentaria deportiva

RLS: activo, sin políticas.

| Columna | Tipo | Nulo | Por defecto | Clave | Descripción |
|---|---|---|---|---|---|
| id_pedido | integer | no | nextval('pedido_jersey_id_pedido_seq'::regclass) | PK |  |
| id_socio | integer | no |  | UK (compuesta), FK → socio.id_socio |  |
| fecha | date | no |  |  |  |
| tipo | character varying(15) | sí | 'Jersey'::character varying |  |  |
| talla | character varying(10) | sí |  |  |  |
| aplique | character varying(100) | sí |  |  |  |
| valor | numeric(10,2) | no |  |  |  |
| estado | character varying(20) | sí | 'Solicitado'::character varying |  |  |
| fecha_entrega | date | sí |  |  |  |
| observaciones | text | sí |  |  |  |
| created_at | timestamp without time zone | no | CURRENT_TIMESTAMP |  |  |
| updated_at | timestamp without time zone | sí | CURRENT_TIMESTAMP |  |  |
| id_campana | integer | sí |  | UK (compuesta), FK → jersey_campana.id |  |
| cantidad | integer | no | 1 |  |  |
| estampado | character varying(60) | sí |  |  |  |

Restricciones CHECK:

- `pedido_jersey_cantidad_check`: `CHECK ((cantidad > 0))`
- `pedido_jersey_estado_check`: `estado` ∈ {Solicitado, En producción, Listo, Entregado, Cancelado}
- `pedido_jersey_tipo_check`: `tipo` ∈ {Jersey, Short, Medias, Chaqueta}

Índices (además de los de PK y UK):

- `idx_pedido_jersey_estado` (estado)
- `idx_pedido_jersey_estado_fecha` (estado, fecha)
- `idx_pedido_jersey_id_campana` (id_campana)
- `idx_pedido_jersey_id_socio` (id_socio)

Triggers:

- `trg_pedido_jersey_unidades`: AFTER INSERT OR UPDATE OF cantidad, estado, fecha_entrega ON public.pedido_jersey FOR EACH ROW EXECUTE FUNCTION fn_sync_unidades_jersey()

Referenciada por: `inventario_jersey.id_pedido` (ON DELETE CASCADE).

### poliza_salud

Pólizas de seguro de salud para socios

RLS: activo, sin políticas.

| Columna | Tipo | Nulo | Por defecto | Clave | Descripción |
|---|---|---|---|---|---|
| id_poliza | integer | no | nextval('poliza_salud_id_poliza_seq'::regclass) | PK |  |
| id_socio | integer | no |  | FK → socio.id_socio |  |
| tipo | character varying(15) | no |  |  |  |
| numero_poliza | character varying(50) | sí |  |  |  |
| fecha_contratacion | date | no |  |  |  |
| fecha_vencimiento | date | no |  |  |  |
| fecha_pago | date | sí |  |  |  |
| valor | numeric(10,2) | no |  |  |  |
| estado | character varying(15) | sí | 'Activa'::character varying |  |  |
| id_transaccion | integer | sí |  | FK → transactions.id |  |
| observaciones | text | sí |  |  |  |

Restricciones CHECK:

- `poliza_salud_estado_check`: `estado` ∈ {Activa, Vencida, Cancelada}
- `poliza_salud_tipo_check`: `tipo` ∈ {Básica, Premium, Familiar}

Índices (además de los de PK y UK):

- `idx_poliza_salud_fecha_vencimiento` (fecha_vencimiento)
- `idx_poliza_salud_id_socio` (id_socio)
- `idx_poliza_salud_id_transaccion` (id_transaccion)

### products

Productos del inventario: código único, nombre, precio, stock y categoría.

RLS: activo, sin políticas.

| Columna | Tipo | Nulo | Por defecto | Clave | Descripción |
|---|---|---|---|---|---|
| id | integer | no | nextval('products_id_seq'::regclass) | PK |  |
| name | character varying(100) | no |  |  |  |
| price | numeric(10,2) | no |  |  |  |
| description | text | sí |  |  |  |
| stock | integer | sí | 0 |  |  |
| created_at | timestamp without time zone | sí | CURRENT_TIMESTAMP |  |  |
| updated_at | timestamp without time zone | sí | CURRENT_TIMESTAMP |  |  |
| categoria_id | integer | sí |  | FK → categoria_producto.id | FK a categoria_producto.id. |
| codigo | character varying(50) | sí |  |  |  |

Índices (además de los de PK y UK):

- `idx_products_categoria_id` (categoria_id)
- `idx_products_codigo_unique` (codigo) — único

Referenciada por: `detalle_compra.id_producto` (ON DELETE RESTRICT), `movimiento_inventario.id_producto` (ON DELETE RESTRICT).

### proveedores

_Sin comentario._

RLS: activo, sin políticas.

| Columna | Tipo | Nulo | Por defecto | Clave | Descripción |
|---|---|---|---|---|---|
| id_proveedor | integer | no | nextval('proveedores_id_proveedor_seq'::regclass) | PK |  |
| nombre | character varying | no |  | UK |  |
| nit | character varying | sí |  |  |  |
| telefono | character varying | sí |  |  |  |
| email | character varying | sí |  |  |  |
| direccion | character varying | sí |  |  |  |
| estado | character varying | no | 'activo'::character varying |  |  |
| observaciones | text | sí |  |  |  |
| created_by | integer | sí |  | FK → users.id |  |
| created_at | timestamp without time zone | no | CURRENT_TIMESTAMP |  |  |

Restricciones CHECK:

- `proveedores_estado_check`: `estado` ∈ {activo, inactivo}

Índices (además de los de PK y UK):

- `idx_proveedores_created_by` (created_by)

Referenciada por: `compra.id_proveedor` (ON DELETE NO ACTION), `factura.id_proveedor` (ON DELETE NO ACTION).

### socio

Información completa de los socios del club

RLS: activo, sin políticas.

| Columna | Tipo | Nulo | Por defecto | Clave | Descripción |
|---|---|---|---|---|---|
| id_socio | integer | no | nextval('socio_id_socio_seq'::regclass) | PK |  |
| nombre | character varying(100) | no |  |  |  |
| documento | character varying(20) | no |  | UK |  |
| tipo_documento | character varying(5) | sí | 'CC'::character varying |  |  |
| email | character varying(100) | sí |  |  |  |
| telefono | character varying(20) | sí |  |  |  |
| direccion | character varying(200) | sí |  |  |  |
| fecha_nacimiento | date | sí |  |  |  |
| fecha_ingreso | date | no |  |  |  |
| tipo_membresia | character varying(20) | sí | 'Media'::character varying |  |  |
| estado | character varying(15) | sí | 'activo'::character varying |  |  |
| foto | character varying(255) | sí |  |  |  |
| observaciones | text | sí |  |  |  |
| created_at | timestamp without time zone | no | CURRENT_TIMESTAMP |  |  |
| updated_at | timestamp without time zone | sí | CURRENT_TIMESTAMP |  |  |
| created_by | integer | sí |  | FK → users.id |  |
| nivel_aprendizaje | character varying | sí |  |  |  |

Restricciones CHECK:

- `socio_estado_check`: `estado` ∈ {activo, inactivo, suspendido}
- `socio_nivel_aprendizaje_check`: `nivel_aprendizaje` ∈ {Iniciación, Rider School, Club} o NULL
- `socio_tipo_documento_check`: `tipo_documento` ∈ {CC, TI, CE, PAS}
- `socio_tipo_membresia_check`: `tipo_membresia` ∈ {Completa, Media, Beca}

Índices (además de los de PK y UK):

- `idx_socio_created_by` (created_by)
- `idx_socio_documento` (documento)
- `idx_socio_email` (email)
- `idx_socio_estado` (estado)
- `idx_socio_nombre` (nombre)
- `idx_socio_tipo_membresia` (tipo_membresia)

Triggers:

- `update_socio_updated_at`: BEFORE UPDATE ON public.socio FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()

Referenciada por: `asistencia.id_socio` (ON DELETE NO ACTION), `camerino.id_socio` (ON DELETE NO ACTION), `cartera.id_socio` (ON DELETE NO ACTION), `detalle_transaccion.id_socio` (ON DELETE SET NULL), `factura.id_socio` (ON DELETE RESTRICT), `pago_mensual.id_socio` (ON DELETE NO ACTION), `pagos_pasarela.id_socio` (ON DELETE SET NULL), `pedido_jersey.id_socio` (ON DELETE NO ACTION), `poliza_salud.id_socio` (ON DELETE NO ACTION), `socio_documento.id_socio` (ON DELETE CASCADE), `socio_perfil.id_socio` (ON DELETE SET NULL), `transactions.id_socio` (ON DELETE SET NULL).

### socio_documento

Archivos de documentos de un socio guardados en bytea, máximo 5 MiB. Datos personales: RLS activo y sin políticas. Sin uso en el backend al 6 nov 2026.

RLS: activo, sin políticas.

| Columna | Tipo | Nulo | Por defecto | Clave | Descripción |
|---|---|---|---|---|---|
| id_documento | integer | no | nextval('socio_documento_id_documento_seq'::regclass) | PK |  |
| id_socio | integer | no |  | FK → socio.id_socio |  |
| tipo_documento | character varying(60) | no |  |  |  |
| nombre_archivo | character varying(200) | no |  |  |  |
| mime | character varying(100) | no | 'application/octet-stream'::character varying |  |  |
| bytes | integer | no | 0 |  |  |
| datos | bytea | no |  |  |  |
| observaciones | text | sí |  |  |  |
| created_by | integer | sí |  | FK → users.id |  |
| created_at | timestamp without time zone | no | CURRENT_TIMESTAMP |  |  |

Restricciones CHECK:

- `socio_documento_bytes_check`: `CHECK (((bytes >= 0) AND (bytes <= 5242880)))`

Índices (además de los de PK y UK):

- `idx_socio_documento_created_by` (created_by)
- `idx_socio_documento_id_socio` (id_socio)

### socio_perfil

Datos propios del socio del portal. Uno a uno con users donde role = user. id_socio en NULL significa cuenta aun no vinculada a una ficha del club.

RLS: activo, sin políticas.

| Columna | Tipo | Nulo | Por defecto | Clave | Descripción |
|---|---|---|---|---|---|
| user_id | integer | no |  | PK, FK → users.id |  |
| id_socio | integer | sí |  | UK, FK → socio.id_socio |  |
| telefono | character varying(30) | sí |  |  |  |
| email_verified | boolean | no | false |  |  |
| notificaciones | jsonb | no | '{}'::jsonb |  |  |
| created_at | timestamp without time zone | no | CURRENT_TIMESTAMP |  |  |
| updated_at | timestamp without time zone | no | CURRENT_TIMESTAMP |  |  |

Índices (además de los de PK y UK):

- `idx_socio_perfil_id_socio` (id_socio)

Triggers:

- `trg_socio_perfil_cambio_socio`: BEFORE UPDATE OF id_socio ON public.socio_perfil FOR EACH ROW EXECUTE FUNCTION tr_socio_perfil_cambio_socio()
- `trg_socio_perfil_updated_at`: BEFORE UPDATE ON public.socio_perfil FOR EACH ROW EXECUTE FUNCTION set_updated_at()

### system_data

Configuración general del club

RLS: activo, sin políticas.

| Columna | Tipo | Nulo | Por defecto | Clave | Descripción |
|---|---|---|---|---|---|
| id | integer | no | 1 | PK | Siempre 1: tabla de una sola fila. |
| club_nombre | character varying(255) | no | 'Mi Club'::character varying |  |  |
| nit | character varying(50) | sí |  |  |  |
| direccion | text | sí |  |  |  |
| telefono | character varying(50) | sí |  |  |  |
| email | character varying(255) | sí |  |  |  |
| logo_url | character varying(255) | sí |  |  |  |
| moneda | character varying(10) | no | 'COP'::character varying |  |  |
| dia_vencimiento_default | smallint | sí | 15 |  |  |
| porcentaje_mora | numeric(5,2) | sí | 10.00 |  |  |
| created_at | timestamp without time zone | no | CURRENT_TIMESTAMP |  |  |
| updated_at | timestamp without time zone | sí | CURRENT_TIMESTAMP |  |  |
| umbral_inasistencia_consecutiva | smallint | no | 3 |  |  |
| umbral_inasistencia_acumulada | smallint | no | 5 |  |  |

Restricciones CHECK:

- `system_data_id_check`: `CHECK ((id = 1))`

### tipo_cartera

Catálogo de tipos de cartera, referido por cartera.id_tipo_cartera. Sin uso en el backend al 6 nov 2026.

RLS: activo, sin políticas.

| Columna | Tipo | Nulo | Por defecto | Clave | Descripción |
|---|---|---|---|---|---|
| id_tipo | integer | no | nextval('tipo_cartera_id_tipo_seq'::regclass) | PK |  |
| nombre | character varying(80) | no |  | UK |  |
| descripcion | text | sí |  |  |  |
| activo | boolean | no | true |  |  |
| created_at | timestamp without time zone | no | CURRENT_TIMESTAMP |  |  |

Referenciada por: `cartera.id_tipo_cartera` (ON DELETE RESTRICT).

### transactions

Asientos contables: ingresos y gastos con estado pendiente, confirmada o anulada. Los pagos de mensualidades, de cartera y de la pasarela generan aquí su asiento.

RLS: activo, sin políticas.

| Columna | Tipo | Nulo | Por defecto | Clave | Descripción |
|---|---|---|---|---|---|
| id | integer | no | nextval('transactions_id_seq'::regclass) | PK |  |
| tipo | character varying(20) | no |  |  |  |
| monto | numeric(15,2) | no |  |  |  |
| fecha | date | no |  |  |  |
| descripcion | text | sí |  |  |  |
| created_at | timestamp without time zone | sí | CURRENT_TIMESTAMP |  |  |
| metodo_pago | character varying(50) | sí |  |  |  |
| categoria_id | integer | sí |  | FK → categories.id | FK a categories.id: categoría financiera del asiento. |
| referencia | character varying | sí |  |  | Referencia externa del pago; única cuando no es NULL (índice idx_transactions_referencia). |
| created_by | integer | sí |  | FK → users.id |  |
| id_socio | integer | sí |  | FK → socio.id_socio |  |
| estado | character varying(20) | no | 'confirmada'::character varying |  |  |

Restricciones CHECK:

- `transactions_estado_check`: `estado` ∈ {pendiente, confirmada, anulada}
- `transactions_metodo_pago_check`: `metodo_pago` ∈ {efectivo, transferencia, tarjeta, cheque} o NULL
- `transactions_tipo_check`: `tipo` ∈ {ingreso, gasto}

Índices (además de los de PK y UK):

- `idx_transactions_categoria_id` (categoria_id)
- `idx_transactions_created_by` (created_by)
- `idx_transactions_id_socio` (id_socio)
- `idx_transactions_referencia` (referencia) WHERE (referencia IS NOT NULL) — único

Referenciada por: `camerino.id_transaccion` (ON DELETE NO ACTION), `cartera.id_transaccion` (ON DELETE NO ACTION), `compra.id_transaccion` (ON DELETE NO ACTION), `detalle_transaccion.id_transaccion` (ON DELETE NO ACTION), `factura.id_transaccion` (ON DELETE NO ACTION), `pago_factura.id_transaccion` (ON DELETE SET NULL), `pago_mensual.id_transaccion` (ON DELETE NO ACTION), `pagos_pasarela.transaction_id` (ON DELETE SET NULL), `poliza_salud.id_transaccion` (ON DELETE NO ACTION).

### users

Usuarios del sistema con roles diferenciados

RLS: activo, sin políticas.

| Columna | Tipo | Nulo | Por defecto | Clave | Descripción |
|---|---|---|---|---|---|
| id | integer | no | nextval('users_id_seq'::regclass) | PK |  |
| username | character varying(50) | no |  | UK |  |
| password | character varying(255) | no |  |  | Hash bcrypt de la contraseña; nunca se guarda en claro. |
| email | character varying(100) | no |  | UK |  |
| full_name | character varying(100) | no |  |  |  |
| role | character varying(20) | no | 'user'::character varying |  |  |
| active | boolean | no | true |  |  |
| last_login | timestamp without time zone | sí |  |  |  |
| created_at | timestamp without time zone | no | CURRENT_TIMESTAMP |  |  |
| updated_at | timestamp without time zone | sí | CURRENT_TIMESTAMP |  |  |
| failed_attempts | integer | sí | 0 |  | Intentos de inicio de sesión fallidos consecutivos; vuelve a 0 al entrar con éxito. |
| locked_until | timestamp without time zone | sí |  |  | Hasta cuándo la cuenta queda bloqueada por intentos fallidos; NULL = sin bloqueo. |
| reset_token | character varying(255) | sí |  |  |  |
| reset_token_expires | timestamp without time zone | sí |  |  |  |
| otp_attempts | integer | sí | 0 |  |  |

Restricciones CHECK:

- `users_role_check`: `role` ∈ {user, admin}

Índices (además de los de PK y UK):

- `idx_users_email` (email)
- `idx_users_username` (username)

Triggers:

- `trg_users_cambio_rol`: AFTER UPDATE OF role ON public.users FOR EACH ROW WHEN (((old.role)::text IS DISTINCT FROM (new.role)::text)) EXECUTE FUNCTION crear_perfil_por_rol()
- `trg_users_crear_perfil`: AFTER INSERT ON public.users FOR EACH ROW EXECUTE FUNCTION crear_perfil_por_rol()
- `update_users_updated_at`: BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()

Referenciada por: `admin_perfil.creado_por` (ON DELETE SET NULL), `admin_perfil.user_id` (ON DELETE CASCADE), `asistencia.registrado_by` (ON DELETE SET NULL), `auditoria.usuario_id` (ON DELETE SET NULL), `compra.approved_by` (ON DELETE NO ACTION), `compra.created_by` (ON DELETE SET NULL), `config_mensualidad.created_by` (ON DELETE SET NULL), `factura.created_by` (ON DELETE SET NULL), `inventario_jersey.recibido_by` (ON DELETE SET NULL), `jersey_campana.created_by` (ON DELETE NO ACTION), `landing_borrador.updated_by` (ON DELETE SET NULL), `landing_imagen.created_by` (ON DELETE SET NULL), `landing_version.publicado_by` (ON DELETE SET NULL), `meses_periodo.cerrado_by` (ON DELETE SET NULL), `movimiento_inventario.created_by` (ON DELETE SET NULL), `movimiento_inventario.registrado_by` (ON DELETE SET NULL), `pago_factura.created_by` (ON DELETE SET NULL), `pago_factura.registrado_by` (ON DELETE SET NULL), `pagos_pasarela.user_id` (ON DELETE SET NULL), `proveedores.created_by` (ON DELETE NO ACTION), `socio.created_by` (ON DELETE SET NULL), `socio_documento.created_by` (ON DELETE SET NULL), `socio_perfil.user_id` (ON DELETE CASCADE), `transactions.created_by` (ON DELETE NO ACTION).

## Vistas

### v_cartera_general

_Sin comentario._

Opciones: security_invoker=true.

Columnas: `id_cartera` integer, `id_socio` integer, `socio_nombre` character varying(100), `documento` character varying(20), `fecha` date, `concepto` character varying(255), `valor` numeric(10,2), `estado` character varying(15), `dias_antiguedad` integer, `rango_antiguedad` text.

### v_estado_resultados

_Sin comentario._

Opciones: security_invoker=true.

Columnas: `anio` numeric, `mes` numeric, `total_ingresos` numeric, `total_gastos` numeric, `resultado_neto` numeric.

### v_mensualidades_socio

_Sin comentario._

Opciones: security_invoker=true.

Columnas: `id_socio` integer, `nombre` character varying(100), `documento` character varying(20), `anio` integer, `mes` smallint, `nombre_mes` character varying(20), `valor` numeric(10,2), `estado` character varying(15), `fecha_pago` date, `fecha_vencimiento` date, `dias_mora` integer, `estado_actual` character varying.

### v_reporte_asistencia

_Sin comentario._

Opciones: security_invoker=true.

Columnas: `id_asistencia` integer, `id_socio` integer, `socio_nombre` character varying(100), `documento` character varying(20), `fecha` date, `dia_semana` text, `tipo_entrenamiento` character varying(100), `estado` character varying(15), `icono` text, `observacion` character varying(255), `registrado_por` character varying(100), `created_at` timestamp without time zone.

### v_resumen_mensual

_Sin comentario._

Opciones: security_invoker=true.

Columnas: `anio` integer, `mes` smallint, `nombre_mes` character varying(20), `total_socios` bigint, `pagados` bigint, `pendientes` bigint, `morosos` bigint, `total_recaudado` numeric, `total_por_cobrar` numeric, `recargos_pendientes` numeric.

### vista_admins

_Sin comentario._

Opciones: security_invoker=on.

Columnas: `id` integer, `username` character varying(50), `email` character varying(100), `full_name` character varying(100), `active` boolean, `last_login` timestamp without time zone, `created_at` timestamp without time zone, `cargo` character varying(100), `permisos` jsonb, `creado_por` integer.

### vista_socios

_Sin comentario._

Opciones: security_invoker=on.

Columnas: `id` integer, `username` character varying(50), `email` character varying(100), `full_name` character varying(100), `active` boolean, `last_login` timestamp without time zone, `created_at` timestamp without time zone, `telefono` character varying(30), `email_verified` boolean, `id_socio` integer, `notificaciones` jsonb, `documento` character varying(20), `tipo_documento` character varying(5), `tipo_membresia` character varying(20), `nivel_aprendizaje` character varying, `estado_socio` character varying(15), `fecha_ingreso` date.

### vista_usuarios_sin_socio

_Sin comentario._

Opciones: security_invoker=true.

Columnas: `id` integer, `username` character varying(50), `email` character varying(100), `full_name` character varying(100).

## Funciones

- `categoria_mensualidad_id()` → `integer` · sql · search_path: search_path=public
- `crear_perfil_por_rol()` → `trigger` · plpgsql · SECURITY DEFINER · search_path: search_path=""
- `fn_sync_unidades_jersey()` → `trigger` · plpgsql · search_path: search_path=public
- `registrar_pago_cartera(p_id_cartera integer, p_metodo_pago character varying, p_referencia character varying, p_user_id integer, p_fecha_pago date, p_id_transaccion integer)` → `integer` · plpgsql · search_path: search_path=public
- `registrar_pago_mensual(p_id_pago integer, p_metodo_pago character varying, p_referencia character varying, p_user_id integer, p_fecha_pago date, p_id_transaccion integer)` → `integer` · plpgsql · search_path: search_path=public
- `set_updated_at()` → `trigger` · plpgsql · search_path: search_path=""
- `sp_estado_cuenta_socio(p_id_socio integer)` → `TABLE(tipo character varying, anio integer, mes integer, periodo character varying, valor numeric, estado character varying, fecha_pago date, fecha_vencimiento date, dias_mora integer, valor_a_pagar numeric)` · plpgsql · search_path: search_path=public
- `sp_generar_mensualidades_anual(p_anio integer, p_valor numeric)` → `void` · plpgsql · search_path: search_path=public
- `sp_registrar_asistencia_masiva(p_fecha date, p_tipo_entrenamiento character varying, p_ids_socios text, p_user_id integer)` → `text` · plpgsql · search_path: search_path=public
- `sp_registrar_pago_mensual(p_id_socio integer, p_id_periodo integer, p_valor_pago numeric, p_fecha_pago date, p_metodo_pago character varying, p_user_id integer)` → `integer` · plpgsql · search_path: search_path=public
- `tr_actualizar_mora()` → `trigger` · plpgsql · search_path: search_path=public
- `tr_generar_recargo_mora()` → `trigger` · plpgsql · search_path: search_path=public
- `tr_pagos_pasarela_resolver_socio()` → `trigger` · plpgsql · search_path: search_path=public
- `tr_prevenir_pago_duplicado()` → `trigger` · plpgsql · search_path: search_path=public
- `tr_socio_perfil_cambio_socio()` → `trigger` · plpgsql · search_path: search_path=public
- `update_updated_at_column()` → `trigger` · plpgsql · search_path: search_path=public
- `verificar_instalacion()` → `text` · plpgsql · search_path: search_path=public

