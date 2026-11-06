-- =====================================================================
-- 0000_baseline.sql — Línea base del esquema public de Ruta Contable
-- Origen: esquema vivo de Supabase (proyecto hfibhmntifttdududwpw), 5 nov 2026.
-- Generado desde pg_catalog (pg_get_constraintdef, pg_get_indexdef,
-- pg_get_functiondef, pg_get_viewdef, pg_get_triggerdef) vía MCP.
-- Solo estructura: SIN datos.
--
-- Estado que refleja: las 34 migraciones registradas en
-- supabase_migrations.schema_migrations, la última 20261106040258
-- proveedores_fase1_texto. Fase 2 de proveedores NO aplicada:
-- la tabla proveedores y las columnas id_proveedor siguen aquí.
--
-- Uso: instalar el sistema desde cero sobre un proyecto Supabase vacío
-- (requiere los roles anon, authenticated y service_role de Supabase).
-- NO ejecutar sobre la base existente: todos los objetos ya existen.
--
-- Contenido: 35 tablas, 28 secuencias, 62 FK, 67 índices sueltos, 17 funciones,
-- 8 vistas, 17 triggers, RLS en 30 tablas, 24 comentarios.
-- Defectos conocidos que se conservan a propósito (se corrigen en L2b):
--   * 5 tablas sin RLS; v_estado_resultados sin security_invoker;
--     fn_sync_unidades_jersey sin search_path fijo;
--   * sp_registrar_pago_mensual referencia la tabla inexistente transaccion_fin.
-- =====================================================================

SET check_function_bodies = false;
SET search_path = public, extensions;

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;

-- Secuencias (todas: integer, inicio 1, incremento 1, caché 1)
CREATE SEQUENCE public.alerta_sistema_id_seq AS integer;
CREATE SEQUENCE public.asistencia_id_asistencia_seq AS integer;
CREATE SEQUENCE public.auditoria_id_seq AS integer;
CREATE SEQUENCE public.camerino_id_camerino_seq AS integer;
CREATE SEQUENCE public.cartera_id_cartera_seq AS integer;
CREATE SEQUENCE public.categoria_producto_id_seq AS integer;
CREATE SEQUENCE public.categories_id_seq AS integer;
CREATE SEQUENCE public.compra_id_compra_seq AS integer;
CREATE SEQUENCE public.config_mensualidad_id_config_seq AS integer;
CREATE SEQUENCE public.detalle_transaccion_id_detalle_seq AS integer;
CREATE SEQUENCE public.factura_id_factura_seq AS integer;
CREATE SEQUENCE public.inventario_jersey_id_inventario_seq AS integer;
CREATE SEQUENCE public.jersey_campana_id_seq AS integer;
CREATE SEQUENCE public.landing_imagen_id_seq AS integer;
CREATE SEQUENCE public.meses_periodo_id_periodo_seq AS integer;
CREATE SEQUENCE public.movimiento_inventario_id_movimiento_seq AS integer;
CREATE SEQUENCE public.pago_factura_id_pago_factura_seq AS integer;
CREATE SEQUENCE public.pago_mensual_id_pago_seq AS integer;
CREATE SEQUENCE public.pagos_pasarela_id_seq AS integer;
CREATE SEQUENCE public.pedido_jersey_id_pedido_seq AS integer;
CREATE SEQUENCE public.poliza_salud_id_poliza_seq AS integer;
CREATE SEQUENCE public.products_id_seq AS integer;
CREATE SEQUENCE public.proveedores_id_proveedor_seq AS integer;
CREATE SEQUENCE public.socio_documento_id_documento_seq AS integer;
CREATE SEQUENCE public.socio_id_socio_seq AS integer;
CREATE SEQUENCE public.tipo_cartera_id_tipo_seq AS integer;
CREATE SEQUENCE public.transactions_id_seq AS integer;
CREATE SEQUENCE public.users_id_seq AS integer;
CREATE TABLE public.admin_perfil (
  user_id integer NOT NULL,
  cargo character varying(100),
  permisos jsonb DEFAULT '{}'::jsonb NOT NULL,
  creado_por integer,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
  CONSTRAINT admin_perfil_pkey PRIMARY KEY (user_id)
);

CREATE TABLE public.alerta_sistema (
  id integer DEFAULT nextval('alerta_sistema_id_seq'::regclass) NOT NULL,
  tipo character varying(50) DEFAULT 'error_sistema'::character varying NOT NULL,
  mensaje text NOT NULL,
  detalle jsonb,
  leida boolean DEFAULT false NOT NULL,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
  CONSTRAINT alerta_sistema_pkey PRIMARY KEY (id)
);

CREATE TABLE public.asistencia (
  id_asistencia integer DEFAULT nextval('asistencia_id_asistencia_seq'::regclass) NOT NULL,
  id_socio integer NOT NULL,
  fecha date NOT NULL,
  tipo_entrenamiento character varying(100),
  estado character varying(15) NOT NULL,
  observacion character varying(255),
  registrado_by integer,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
  CONSTRAINT asistencia_pkey PRIMARY KEY (id_asistencia),
  CONSTRAINT asistencia_id_socio_fecha_key UNIQUE (id_socio, fecha),
  CONSTRAINT asistencia_estado_check CHECK (((estado)::text = ANY (ARRAY[('Presente'::character varying)::text, ('Ausente'::character varying)::text, ('Justificado'::character varying)::text, ('Tarde'::character varying)::text])))
);

CREATE TABLE public.auditoria (
  id integer DEFAULT nextval('auditoria_id_seq'::regclass) NOT NULL,
  usuario_id integer,
  accion character varying(50) NOT NULL,
  entidad character varying(50) NOT NULL,
  detalle jsonb,
  ip character varying(64),
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
  CONSTRAINT auditoria_pkey PRIMARY KEY (id)
);

CREATE TABLE public.camerino (
  id_camerino integer DEFAULT nextval('camerino_id_camerino_seq'::regclass) NOT NULL,
  observaciones text,
  id_socio integer NOT NULL,
  numero_camerino character varying(20) NOT NULL,
  anio integer NOT NULL,
  valor numeric(10,2) NOT NULL,
  fecha_asignacion date NOT NULL,
  fecha_pago date,
  estado character varying(15) DEFAULT 'Asignado'::character varying,
  id_transaccion integer,
  CONSTRAINT camerino_pkey PRIMARY KEY (id_camerino),
  CONSTRAINT camerino_anio_check CHECK ((anio >= 2000)),
  CONSTRAINT camerino_estado_check CHECK (((estado)::text = ANY (ARRAY[('Asignado'::character varying)::text, ('Pagado'::character varying)::text, ('Vencido'::character varying)::text, ('Liberado'::character varying)::text])))
);

CREATE TABLE public.cartera (
  id_cartera integer DEFAULT nextval('cartera_id_cartera_seq'::regclass) NOT NULL,
  observaciones text,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
  id_tipo_cartera integer,
  fecha_vencimiento date,
  forma_pago character varying(40),
  id_socio integer NOT NULL,
  id_pago_mensual integer,
  fecha date NOT NULL,
  concepto character varying(255) NOT NULL,
  valor numeric(10,2) NOT NULL,
  estado character varying(15) DEFAULT 'pendiente'::character varying,
  fecha_pago date,
  id_transaccion integer,
  CONSTRAINT cartera_pkey PRIMARY KEY (id_cartera),
  CONSTRAINT cartera_estado_check CHECK (((estado)::text = ANY (ARRAY[('pendiente'::character varying)::text, ('pagado'::character varying)::text, ('anulado'::character varying)::text]))),
  CONSTRAINT cartera_pagado_con_transaccion CHECK ((((estado)::text <> 'pagado'::text) OR (id_transaccion IS NOT NULL)))
);

CREATE TABLE public.categoria_producto (
  id integer DEFAULT nextval('categoria_producto_id_seq'::regclass) NOT NULL,
  nombre character varying NOT NULL,
  CONSTRAINT categoria_producto_pkey PRIMARY KEY (id),
  CONSTRAINT categoria_producto_nombre_key UNIQUE (nombre)
);

CREATE TABLE public.categories (
  id integer DEFAULT nextval('categories_id_seq'::regclass) NOT NULL,
  name character varying(100) NOT NULL,
  type character varying(10) NOT NULL,
  description text,
  active boolean DEFAULT true NOT NULL,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT categories_pkey PRIMARY KEY (id),
  CONSTRAINT categories_type_check CHECK (((type)::text = ANY (ARRAY[('income'::character varying)::text, ('expense'::character varying)::text])))
);

CREATE TABLE public.compra (
  id_compra integer DEFAULT nextval('compra_id_compra_seq'::regclass) NOT NULL,
  categoria_id integer,
  id_transaccion integer,
  observaciones text,
  created_by integer,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
  id_proveedor integer,
  estado character varying DEFAULT 'pendiente'::character varying NOT NULL,
  approved_by integer,
  approved_at timestamp without time zone,
  proveedor_nombre character varying(150),
  concepto character varying(200) NOT NULL,
  tipo character varying(100),
  fecha date NOT NULL,
  factura character varying(50),
  CONSTRAINT compra_pkey PRIMARY KEY (id_compra),
  CONSTRAINT compra_estado_check CHECK (((estado)::text = ANY ((ARRAY['pendiente'::character varying, 'aprobada'::character varying])::text[])))
);

CREATE TABLE public.config_mensualidad (
  id_config integer DEFAULT nextval('config_mensualidad_id_config_seq'::regclass) NOT NULL,
  anio integer NOT NULL,
  valor_mensual numeric(10,2) NOT NULL,
  fecha_vencimiento_default smallint DEFAULT 15,
  activo boolean DEFAULT true,
  observaciones text,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  created_by integer,
  CONSTRAINT config_mensualidad_pkey PRIMARY KEY (id_config),
  CONSTRAINT config_mensualidad_anio_key UNIQUE (anio),
  CONSTRAINT config_mensualidad_anio_check CHECK ((anio >= 2000))
);

CREATE TABLE public.detalle_compra (
  id_compra integer NOT NULL,
  nro_linea integer NOT NULL,
  concepto character varying NOT NULL,
  cantidad integer DEFAULT 1 NOT NULL,
  valor_unitario numeric NOT NULL,
  valor_total numeric GENERATED ALWAYS AS ((cantidad)::numeric * valor_unitario) STORED,
  id_producto integer,
  CONSTRAINT detalle_compra_pkey PRIMARY KEY (id_compra, nro_linea)
);

CREATE TABLE public.detalle_factura (
  id_factura integer NOT NULL,
  observaciones character varying(255),
  nro_linea integer NOT NULL,
  servicio character varying(200) NOT NULL,
  descripcion text,
  cantidad integer DEFAULT 1,
  valor_unitario numeric(10,2) NOT NULL,
  valor_total numeric(10,2) GENERATED ALWAYS AS ((cantidad)::numeric * valor_unitario) STORED,
  iva numeric(5,2) DEFAULT 0,
  descuento numeric(5,2) DEFAULT 0,
  CONSTRAINT detalle_factura_pkey PRIMARY KEY (id_factura, nro_linea)
);

CREATE TABLE public.detalle_transaccion (
  id_detalle integer DEFAULT nextval('detalle_transaccion_id_detalle_seq'::regclass) NOT NULL,
  id_transaccion integer NOT NULL,
  id_socio integer,
  monto numeric(10,2) NOT NULL,
  concepto character varying(150),
  CONSTRAINT detalle_transaccion_pkey PRIMARY KEY (id_detalle),
  CONSTRAINT detalle_transaccion_id_transaccion_id_socio_key UNIQUE (id_transaccion, id_socio)
);

CREATE TABLE public.factura (
  id_factura integer DEFAULT nextval('factura_id_factura_seq'::regclass) NOT NULL,
  id_compra integer,
  id_transaccion integer,
  observaciones text,
  created_by integer,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  id_proveedor integer,
  id_socio integer,
  monto_pagado numeric DEFAULT 0 NOT NULL,
  nro_factura character varying(60),
  fecha date NOT NULL,
  fecha_emision date DEFAULT CURRENT_DATE,
  fecha_vencimiento date,
  nit_club character varying(40),
  proveedor_nombre character varying(150),
  concepto character varying(200) NOT NULL,
  valor_total numeric(10,2) NOT NULL,
  numero_factura character varying(50),
  fecha_recepcion date,
  estado character varying(15) DEFAULT 'Pendiente'::character varying,
  CONSTRAINT factura_pkey PRIMARY KEY (id_factura),
  CONSTRAINT factura_estado_check CHECK (((estado)::text = ANY ((ARRAY['Pendiente'::character varying, 'Emitida'::character varying, 'Pagada'::character varying, 'Anulada'::character varying, 'Vencida'::character varying])::text[])))
);

CREATE TABLE public.inventario_jersey (
  id_inventario integer DEFAULT nextval('inventario_jersey_id_inventario_seq'::regclass) NOT NULL,
  id_pedido integer NOT NULL,
  nro_item integer NOT NULL,
  estado_entrega character varying(15) DEFAULT 'Pendiente'::character varying,
  fecha_entrega date,
  recibido_by integer,
  observaciones character varying(255),
  CONSTRAINT inventario_jersey_pkey PRIMARY KEY (id_inventario),
  CONSTRAINT inventario_jersey_id_pedido_nro_item_key UNIQUE (id_pedido, nro_item),
  CONSTRAINT inventario_jersey_estado_entrega_check CHECK (((estado_entrega)::text = ANY (ARRAY[('Pendiente'::character varying)::text, ('Entregado'::character varying)::text, ('Devuelto'::character varying)::text])))
);

CREATE TABLE public.jersey_campana (
  id integer DEFAULT nextval('jersey_campana_id_seq'::regclass) NOT NULL,
  created_at timestamp without time zone DEFAULT now(),
  titulo character varying(120) NOT NULL,
  descripcion text,
  tallas jsonb DEFAULT '["XS", "S", "M", "L", "XL", "XXL"]'::jsonb NOT NULL,
  valor numeric(12,2) NOT NULL,
  fecha_inicio date DEFAULT CURRENT_DATE NOT NULL,
  fecha_fin date,
  activa boolean DEFAULT true NOT NULL,
  created_by integer,
  CONSTRAINT jersey_campana_pkey PRIMARY KEY (id),
  CONSTRAINT jersey_campana_valor_check CHECK ((valor > (0)::numeric))
);

CREATE TABLE public.landing_borrador (
  id integer DEFAULT 1 NOT NULL,
  contenido jsonb NOT NULL,
  updated_by integer,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
  CONSTRAINT landing_borrador_pkey PRIMARY KEY (id),
  CONSTRAINT landing_borrador_id_check CHECK ((id = 1))
);

CREATE TABLE public.landing_imagen (
  id integer DEFAULT nextval('landing_imagen_id_seq'::regclass) NOT NULL,
  mime character varying(20) NOT NULL,
  datos bytea NOT NULL,
  bytes integer NOT NULL,
  alt character varying(150) NOT NULL,
  created_by integer,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
  CONSTRAINT landing_imagen_pkey PRIMARY KEY (id),
  CONSTRAINT landing_imagen_alt_check CHECK ((length(TRIM(BOTH FROM alt)) > 0)),
  CONSTRAINT landing_imagen_bytes_check CHECK (((bytes > 0) AND (bytes <= 2097152))),
  CONSTRAINT landing_imagen_mime_check CHECK (((mime)::text = ANY ((ARRAY['image/jpeg'::character varying, 'image/png'::character varying, 'image/webp'::character varying])::text[])))
);

CREATE TABLE public.landing_version (
  numero integer NOT NULL,
  contenido jsonb NOT NULL,
  publicado_by integer,
  publicado_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
  CONSTRAINT landing_version_pkey PRIMARY KEY (numero),
  CONSTRAINT landing_version_numero_check CHECK ((numero > 0))
);
CREATE TABLE public.meses_periodo (
  id_periodo integer DEFAULT nextval('meses_periodo_id_periodo_seq'::regclass) NOT NULL,
  observaciones text,
  cerrado_by integer,
  total_ingresos numeric DEFAULT 0.00,
  total_gastos numeric DEFAULT 0.00,
  balance numeric DEFAULT 0.00,
  anio integer NOT NULL,
  mes smallint NOT NULL,
  nombre_mes character varying(20) NOT NULL,
  fecha_inicio date NOT NULL,
  fecha_fin date NOT NULL,
  activo boolean DEFAULT true,
  cerrado boolean DEFAULT false,
  fecha_cierre date,
  CONSTRAINT meses_periodo_pkey PRIMARY KEY (id_periodo),
  CONSTRAINT meses_periodo_anio_mes_key UNIQUE (anio, mes),
  CONSTRAINT meses_periodo_anio_check CHECK ((anio >= 2000)),
  CONSTRAINT meses_periodo_mes_check CHECK (((mes >= 1) AND (mes <= 12)))
);

CREATE TABLE public.movimiento_inventario (
  id_movimiento integer DEFAULT nextval('movimiento_inventario_id_movimiento_seq'::regclass) NOT NULL,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
  referencia_origen character varying(100) DEFAULT 'manual'::character varying,
  registrado_by integer,
  id_producto integer NOT NULL,
  tipo character varying(20) NOT NULL,
  cantidad integer NOT NULL,
  stock_anterior integer DEFAULT 0 NOT NULL,
  stock_nuevo integer DEFAULT 0 NOT NULL,
  motivo character varying(200) NOT NULL,
  id_compra integer,
  created_by integer,
  CONSTRAINT movimiento_inventario_pkey PRIMARY KEY (id_movimiento),
  CONSTRAINT movimiento_inventario_cantidad_check CHECK ((cantidad > 0)),
  CONSTRAINT movimiento_inventario_tipo_check CHECK (((tipo)::text = ANY ((ARRAY['entrada'::character varying, 'salida'::character varying, 'ajuste'::character varying])::text[])))
);

CREATE TABLE public.pago_factura (
  id_pago_factura integer DEFAULT nextval('pago_factura_id_pago_factura_seq'::regclass) NOT NULL,
  fecha_pago date DEFAULT CURRENT_DATE,
  referencia character varying(100),
  registrado_by integer,
  id_factura integer NOT NULL,
  fecha date DEFAULT CURRENT_DATE NOT NULL,
  monto numeric NOT NULL,
  metodo_pago character varying(40) DEFAULT 'efectivo'::character varying NOT NULL,
  id_transaccion integer,
  observaciones text,
  created_by integer,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
  CONSTRAINT pago_factura_pkey PRIMARY KEY (id_pago_factura),
  CONSTRAINT pago_factura_monto_check CHECK ((monto > (0)::numeric))
);

CREATE TABLE public.pago_mensual (
  id_pago integer DEFAULT nextval('pago_mensual_id_pago_seq'::regclass) NOT NULL,
  observaciones text,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  id_socio integer NOT NULL,
  id_periodo integer NOT NULL,
  valor numeric(10,2) NOT NULL,
  fecha_vencimiento date NOT NULL,
  fecha_pago date,
  estado character varying(15) DEFAULT 'pendiente'::character varying,
  id_transaccion integer,
  dias_mora integer DEFAULT 0,
  CONSTRAINT pago_mensual_pkey PRIMARY KEY (id_pago),
  CONSTRAINT pago_mensual_id_socio_id_periodo_key UNIQUE (id_socio, id_periodo),
  CONSTRAINT pago_mensual_estado_check CHECK (((estado)::text = ANY (ARRAY[('pendiente'::character varying)::text, ('pagado'::character varying)::text, ('moroso'::character varying)::text, ('exento'::character varying)::text, ('cancelado'::character varying)::text]))),
  CONSTRAINT pago_mensual_pagado_con_transaccion CHECK ((((estado)::text <> 'pagado'::text) OR (id_transaccion IS NOT NULL)))
);

CREATE TABLE public.pagos_pasarela (
  id integer DEFAULT nextval('pagos_pasarela_id_seq'::regclass) NOT NULL,
  moneda character varying(3) DEFAULT 'USD'::character varying NOT NULL,
  estado character varying(20) DEFAULT 'PENDING'::character varying NOT NULL,
  metodo_pago character varying(50),
  transaction_id integer,
  payload_raw jsonb,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
  finalized_at timestamp without time zone,
  estado_proveedor character varying(50),
  orden_id character varying(100),
  referencia character varying(100) NOT NULL,
  proveedor character varying(30) DEFAULT 'paypal'::character varying NOT NULL,
  proveedor_id character varying(100),
  user_id integer,
  id_socio integer,
  concepto character varying(200),
  monto numeric(15,2) NOT NULL,
  amount_in_cents bigint NOT NULL,
  CONSTRAINT pagos_pasarela_pkey PRIMARY KEY (id),
  CONSTRAINT pagos_pasarela_proveedor_id_key UNIQUE (proveedor_id),
  CONSTRAINT pagos_pasarela_referencia_key UNIQUE (referencia),
  CONSTRAINT pagos_pasarela_estado_check CHECK (((estado)::text = ANY ((ARRAY['PENDING'::character varying, 'APPROVED'::character varying, 'DECLINED'::character varying, 'VOIDED'::character varying, 'REFUNDED'::character varying, 'ERROR'::character varying])::text[]))),
  CONSTRAINT pagos_pasarela_monto_check CHECK ((monto > (0)::numeric))
);

CREATE TABLE public.pedido_jersey (
  id_pedido integer DEFAULT nextval('pedido_jersey_id_pedido_seq'::regclass) NOT NULL,
  observaciones text,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  id_campana integer,
  cantidad integer DEFAULT 1 NOT NULL,
  estampado character varying(60),
  id_socio integer NOT NULL,
  fecha date NOT NULL,
  tipo character varying(15) DEFAULT 'Jersey'::character varying,
  talla character varying(10),
  aplique character varying(100),
  valor numeric(10,2) NOT NULL,
  estado character varying(20) DEFAULT 'Solicitado'::character varying,
  fecha_entrega date,
  CONSTRAINT pedido_jersey_pkey PRIMARY KEY (id_pedido),
  CONSTRAINT pedido_jersey_id_campana_id_socio_key UNIQUE (id_campana, id_socio),
  CONSTRAINT pedido_jersey_cantidad_check CHECK ((cantidad > 0)),
  CONSTRAINT pedido_jersey_estado_check CHECK (((estado)::text = ANY (ARRAY[('Solicitado'::character varying)::text, ('En producción'::character varying)::text, ('Listo'::character varying)::text, ('Entregado'::character varying)::text, ('Cancelado'::character varying)::text]))),
  CONSTRAINT pedido_jersey_tipo_check CHECK (((tipo)::text = ANY (ARRAY[('Jersey'::character varying)::text, ('Short'::character varying)::text, ('Medias'::character varying)::text, ('Chaqueta'::character varying)::text])))
);

CREATE TABLE public.poliza_salud (
  id_poliza integer DEFAULT nextval('poliza_salud_id_poliza_seq'::regclass) NOT NULL,
  id_transaccion integer,
  observaciones text,
  id_socio integer NOT NULL,
  tipo character varying(15) NOT NULL,
  numero_poliza character varying(50),
  fecha_contratacion date NOT NULL,
  fecha_vencimiento date NOT NULL,
  fecha_pago date,
  valor numeric(10,2) NOT NULL,
  estado character varying(15) DEFAULT 'Activa'::character varying,
  CONSTRAINT poliza_salud_pkey PRIMARY KEY (id_poliza),
  CONSTRAINT poliza_salud_estado_check CHECK (((estado)::text = ANY (ARRAY[('Activa'::character varying)::text, ('Vencida'::character varying)::text, ('Cancelada'::character varying)::text]))),
  CONSTRAINT poliza_salud_tipo_check CHECK (((tipo)::text = ANY (ARRAY[('Básica'::character varying)::text, ('Premium'::character varying)::text, ('Familiar'::character varying)::text])))
);

CREATE TABLE public.products (
  id integer DEFAULT nextval('products_id_seq'::regclass) NOT NULL,
  codigo character varying(50),
  name character varying(100) NOT NULL,
  price numeric(10,2) NOT NULL,
  description text,
  stock integer DEFAULT 0,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  categoria_id integer,
  CONSTRAINT products_pkey PRIMARY KEY (id)
);

CREATE TABLE public.proveedores (
  id_proveedor integer DEFAULT nextval('proveedores_id_proveedor_seq'::regclass) NOT NULL,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
  nombre character varying NOT NULL,
  nit character varying,
  telefono character varying,
  email character varying,
  direccion character varying,
  estado character varying DEFAULT 'activo'::character varying NOT NULL,
  observaciones text,
  created_by integer,
  CONSTRAINT proveedores_pkey PRIMARY KEY (id_proveedor),
  CONSTRAINT proveedores_nombre_key UNIQUE (nombre),
  CONSTRAINT proveedores_estado_check CHECK (((estado)::text = ANY ((ARRAY['activo'::character varying, 'inactivo'::character varying])::text[])))
);

CREATE TABLE public.socio (
  id_socio integer DEFAULT nextval('socio_id_socio_seq'::regclass) NOT NULL,
  tipo_membresia character varying(20) DEFAULT 'Media'::character varying,
  estado character varying(15) DEFAULT 'activo'::character varying,
  foto character varying(255),
  observaciones text,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  created_by integer,
  nivel_aprendizaje character varying,
  nombre character varying(100) NOT NULL,
  documento character varying(20) NOT NULL,
  tipo_documento character varying(5) DEFAULT 'CC'::character varying,
  email character varying(100),
  telefono character varying(20),
  direccion character varying(200),
  fecha_nacimiento date,
  fecha_ingreso date NOT NULL,
  CONSTRAINT socio_pkey PRIMARY KEY (id_socio),
  CONSTRAINT socio_documento_key UNIQUE (documento),
  CONSTRAINT socio_estado_check CHECK (((estado)::text = ANY (ARRAY[('activo'::character varying)::text, ('inactivo'::character varying)::text, ('suspendido'::character varying)::text]))),
  CONSTRAINT socio_nivel_aprendizaje_check CHECK (((nivel_aprendizaje IS NULL) OR ((nivel_aprendizaje)::text = ANY (ARRAY[('Iniciación'::character varying)::text, ('Rider School'::character varying)::text, ('Club'::character varying)::text])))),
  CONSTRAINT socio_tipo_documento_check CHECK (((tipo_documento)::text = ANY (ARRAY[('CC'::character varying)::text, ('TI'::character varying)::text, ('CE'::character varying)::text, ('PAS'::character varying)::text]))),
  CONSTRAINT socio_tipo_membresia_check CHECK (((tipo_membresia)::text = ANY (ARRAY[('Completa'::character varying)::text, ('Media'::character varying)::text, ('Beca'::character varying)::text])))
);

CREATE TABLE public.socio_documento (
  id_documento integer DEFAULT nextval('socio_documento_id_documento_seq'::regclass) NOT NULL,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
  id_socio integer NOT NULL,
  tipo_documento character varying(60) NOT NULL,
  nombre_archivo character varying(200) NOT NULL,
  mime character varying(100) DEFAULT 'application/octet-stream'::character varying NOT NULL,
  bytes integer DEFAULT 0 NOT NULL,
  datos bytea NOT NULL,
  observaciones text,
  created_by integer,
  CONSTRAINT socio_documento_pkey PRIMARY KEY (id_documento),
  CONSTRAINT socio_documento_bytes_check CHECK (((bytes >= 0) AND (bytes <= 5242880)))
);

CREATE TABLE public.socio_perfil (
  user_id integer NOT NULL,
  id_socio integer,
  telefono character varying(30),
  email_verified boolean DEFAULT false NOT NULL,
  notificaciones jsonb DEFAULT '{}'::jsonb NOT NULL,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
  CONSTRAINT socio_perfil_pkey PRIMARY KEY (user_id),
  CONSTRAINT socio_perfil_id_socio_key UNIQUE (id_socio)
);

CREATE TABLE public.system_data (
  id integer DEFAULT 1 NOT NULL,
  porcentaje_mora numeric(5,2) DEFAULT 10.00,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  umbral_inasistencia_consecutiva smallint DEFAULT 3 NOT NULL,
  umbral_inasistencia_acumulada smallint DEFAULT 5 NOT NULL,
  club_nombre character varying(255) DEFAULT 'Mi Club'::character varying NOT NULL,
  nit character varying(50),
  direccion text,
  telefono character varying(50),
  email character varying(255),
  logo_url character varying(255),
  moneda character varying(10) DEFAULT 'COP'::character varying NOT NULL,
  dia_vencimiento_default smallint DEFAULT 15,
  CONSTRAINT system_data_pkey PRIMARY KEY (id),
  CONSTRAINT system_data_id_check CHECK ((id = 1))
);

CREATE TABLE public.tipo_cartera (
  id_tipo integer DEFAULT nextval('tipo_cartera_id_tipo_seq'::regclass) NOT NULL,
  nombre character varying(80) NOT NULL,
  descripcion text,
  activo boolean DEFAULT true NOT NULL,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
  CONSTRAINT tipo_cartera_pkey PRIMARY KEY (id_tipo),
  CONSTRAINT tipo_cartera_nombre_key UNIQUE (nombre)
);

CREATE TABLE public.transactions (
  id integer DEFAULT nextval('transactions_id_seq'::regclass) NOT NULL,
  categoria_id integer,
  referencia character varying,
  created_by integer,
  id_socio integer,
  estado character varying(20) DEFAULT 'confirmada'::character varying NOT NULL,
  tipo character varying(20) NOT NULL,
  monto numeric(15,2) NOT NULL,
  fecha date NOT NULL,
  descripcion text,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  metodo_pago character varying(50),
  CONSTRAINT transactions_pkey PRIMARY KEY (id),
  CONSTRAINT transactions_estado_check CHECK (((estado)::text = ANY ((ARRAY['pendiente'::character varying, 'confirmada'::character varying, 'anulada'::character varying])::text[]))),
  CONSTRAINT transactions_metodo_pago_check CHECK (((metodo_pago IS NULL) OR ((metodo_pago)::text = ANY ((ARRAY['efectivo'::character varying, 'transferencia'::character varying, 'tarjeta'::character varying, 'cheque'::character varying])::text[])))),
  CONSTRAINT transactions_tipo_check CHECK (((tipo)::text = ANY ((ARRAY['ingreso'::character varying, 'gasto'::character varying])::text[])))
);

CREATE TABLE public.users (
  id integer DEFAULT nextval('users_id_seq'::regclass) NOT NULL,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  failed_attempts integer DEFAULT 0,
  locked_until timestamp without time zone,
  reset_token character varying(255),
  reset_token_expires timestamp without time zone,
  otp_attempts integer DEFAULT 0,
  username character varying(50) NOT NULL,
  password character varying(255) NOT NULL,
  email character varying(100) NOT NULL,
  full_name character varying(100) NOT NULL,
  role character varying(20) DEFAULT 'user'::character varying NOT NULL,
  active boolean DEFAULT true NOT NULL,
  last_login timestamp without time zone,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_email_key UNIQUE (email),
  CONSTRAINT users_username_key UNIQUE (username),
  CONSTRAINT users_role_check CHECK (((role)::text = ANY ((ARRAY['user'::character varying, 'admin'::character varying])::text[])))
);
-- Secuencias ligadas a su columna
ALTER SEQUENCE public.alerta_sistema_id_seq OWNED BY public.alerta_sistema.id;
ALTER SEQUENCE public.asistencia_id_asistencia_seq OWNED BY public.asistencia.id_asistencia;
ALTER SEQUENCE public.auditoria_id_seq OWNED BY public.auditoria.id;
ALTER SEQUENCE public.camerino_id_camerino_seq OWNED BY public.camerino.id_camerino;
ALTER SEQUENCE public.cartera_id_cartera_seq OWNED BY public.cartera.id_cartera;
ALTER SEQUENCE public.categoria_producto_id_seq OWNED BY public.categoria_producto.id;
ALTER SEQUENCE public.categories_id_seq OWNED BY public.categories.id;
ALTER SEQUENCE public.compra_id_compra_seq OWNED BY public.compra.id_compra;
ALTER SEQUENCE public.config_mensualidad_id_config_seq OWNED BY public.config_mensualidad.id_config;
ALTER SEQUENCE public.detalle_transaccion_id_detalle_seq OWNED BY public.detalle_transaccion.id_detalle;
ALTER SEQUENCE public.factura_id_factura_seq OWNED BY public.factura.id_factura;
ALTER SEQUENCE public.inventario_jersey_id_inventario_seq OWNED BY public.inventario_jersey.id_inventario;
ALTER SEQUENCE public.jersey_campana_id_seq OWNED BY public.jersey_campana.id;
ALTER SEQUENCE public.landing_imagen_id_seq OWNED BY public.landing_imagen.id;
ALTER SEQUENCE public.meses_periodo_id_periodo_seq OWNED BY public.meses_periodo.id_periodo;
ALTER SEQUENCE public.movimiento_inventario_id_movimiento_seq OWNED BY public.movimiento_inventario.id_movimiento;
ALTER SEQUENCE public.pago_factura_id_pago_factura_seq OWNED BY public.pago_factura.id_pago_factura;
ALTER SEQUENCE public.pago_mensual_id_pago_seq OWNED BY public.pago_mensual.id_pago;
ALTER SEQUENCE public.pagos_pasarela_id_seq OWNED BY public.pagos_pasarela.id;
ALTER SEQUENCE public.pedido_jersey_id_pedido_seq OWNED BY public.pedido_jersey.id_pedido;
ALTER SEQUENCE public.poliza_salud_id_poliza_seq OWNED BY public.poliza_salud.id_poliza;
ALTER SEQUENCE public.products_id_seq OWNED BY public.products.id;
ALTER SEQUENCE public.proveedores_id_proveedor_seq OWNED BY public.proveedores.id_proveedor;
ALTER SEQUENCE public.socio_documento_id_documento_seq OWNED BY public.socio_documento.id_documento;
ALTER SEQUENCE public.socio_id_socio_seq OWNED BY public.socio.id_socio;
ALTER SEQUENCE public.tipo_cartera_id_tipo_seq OWNED BY public.tipo_cartera.id_tipo;
ALTER SEQUENCE public.transactions_id_seq OWNED BY public.transactions.id;
ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;

-- Llaves foráneas
ALTER TABLE ONLY public.admin_perfil ADD CONSTRAINT admin_perfil_creado_por_fkey FOREIGN KEY (creado_por) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.admin_perfil ADD CONSTRAINT admin_perfil_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.asistencia ADD CONSTRAINT asistencia_id_socio_fkey FOREIGN KEY (id_socio) REFERENCES socio(id_socio);
ALTER TABLE ONLY public.asistencia ADD CONSTRAINT asistencia_registrado_by_fkey FOREIGN KEY (registrado_by) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.auditoria ADD CONSTRAINT auditoria_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.camerino ADD CONSTRAINT camerino_id_socio_fkey FOREIGN KEY (id_socio) REFERENCES socio(id_socio);
ALTER TABLE ONLY public.camerino ADD CONSTRAINT camerino_id_transaccion_fkey FOREIGN KEY (id_transaccion) REFERENCES transactions(id);
ALTER TABLE ONLY public.cartera ADD CONSTRAINT cartera_id_pago_mensual_fkey FOREIGN KEY (id_pago_mensual) REFERENCES pago_mensual(id_pago) ON DELETE SET NULL;
ALTER TABLE ONLY public.cartera ADD CONSTRAINT cartera_id_socio_fkey FOREIGN KEY (id_socio) REFERENCES socio(id_socio);
ALTER TABLE ONLY public.cartera ADD CONSTRAINT cartera_id_tipo_cartera_fkey FOREIGN KEY (id_tipo_cartera) REFERENCES tipo_cartera(id_tipo) ON DELETE RESTRICT;
ALTER TABLE ONLY public.cartera ADD CONSTRAINT cartera_id_transaccion_fkey FOREIGN KEY (id_transaccion) REFERENCES transactions(id);
ALTER TABLE ONLY public.compra ADD CONSTRAINT compra_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES users(id);
ALTER TABLE ONLY public.compra ADD CONSTRAINT compra_categoria_id_fkey FOREIGN KEY (categoria_id) REFERENCES categories(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.compra ADD CONSTRAINT compra_created_by_fkey FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.compra ADD CONSTRAINT compra_id_proveedor_fkey FOREIGN KEY (id_proveedor) REFERENCES proveedores(id_proveedor);
ALTER TABLE ONLY public.compra ADD CONSTRAINT compra_id_transaccion_fkey FOREIGN KEY (id_transaccion) REFERENCES transactions(id);
ALTER TABLE ONLY public.config_mensualidad ADD CONSTRAINT config_mensualidad_created_by_fkey FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.detalle_compra ADD CONSTRAINT detalle_compra_id_compra_fkey FOREIGN KEY (id_compra) REFERENCES compra(id_compra);
ALTER TABLE ONLY public.detalle_compra ADD CONSTRAINT detalle_compra_id_producto_fkey FOREIGN KEY (id_producto) REFERENCES products(id) ON DELETE RESTRICT;
ALTER TABLE ONLY public.detalle_factura ADD CONSTRAINT detalle_factura_id_factura_fkey FOREIGN KEY (id_factura) REFERENCES factura(id_factura) ON DELETE CASCADE;
ALTER TABLE ONLY public.detalle_transaccion ADD CONSTRAINT detalle_transaccion_id_socio_fkey FOREIGN KEY (id_socio) REFERENCES socio(id_socio) ON DELETE SET NULL;
ALTER TABLE ONLY public.detalle_transaccion ADD CONSTRAINT detalle_transaccion_id_transaccion_fkey FOREIGN KEY (id_transaccion) REFERENCES transactions(id);
ALTER TABLE ONLY public.factura ADD CONSTRAINT factura_created_by_fkey FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.factura ADD CONSTRAINT factura_id_compra_fkey FOREIGN KEY (id_compra) REFERENCES compra(id_compra) ON DELETE SET NULL;
ALTER TABLE ONLY public.factura ADD CONSTRAINT factura_id_proveedor_fkey FOREIGN KEY (id_proveedor) REFERENCES proveedores(id_proveedor);
ALTER TABLE ONLY public.factura ADD CONSTRAINT factura_id_socio_fkey FOREIGN KEY (id_socio) REFERENCES socio(id_socio) ON DELETE RESTRICT;
ALTER TABLE ONLY public.factura ADD CONSTRAINT factura_id_transaccion_fkey FOREIGN KEY (id_transaccion) REFERENCES transactions(id);
ALTER TABLE ONLY public.inventario_jersey ADD CONSTRAINT inventario_jersey_id_pedido_fkey FOREIGN KEY (id_pedido) REFERENCES pedido_jersey(id_pedido) ON DELETE CASCADE;
ALTER TABLE ONLY public.inventario_jersey ADD CONSTRAINT inventario_jersey_recibido_by_fkey FOREIGN KEY (recibido_by) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.jersey_campana ADD CONSTRAINT jersey_campana_created_by_fkey FOREIGN KEY (created_by) REFERENCES users(id);
ALTER TABLE ONLY public.landing_borrador ADD CONSTRAINT landing_borrador_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.landing_imagen ADD CONSTRAINT landing_imagen_created_by_fkey FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.landing_version ADD CONSTRAINT landing_version_publicado_by_fkey FOREIGN KEY (publicado_by) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.meses_periodo ADD CONSTRAINT meses_periodo_cerrado_by_fkey FOREIGN KEY (cerrado_by) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.movimiento_inventario ADD CONSTRAINT movimiento_inventario_created_by_fkey FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.movimiento_inventario ADD CONSTRAINT movimiento_inventario_id_compra_fkey FOREIGN KEY (id_compra) REFERENCES compra(id_compra) ON DELETE SET NULL;
ALTER TABLE ONLY public.movimiento_inventario ADD CONSTRAINT movimiento_inventario_id_producto_fkey FOREIGN KEY (id_producto) REFERENCES products(id) ON DELETE RESTRICT;
ALTER TABLE ONLY public.movimiento_inventario ADD CONSTRAINT movimiento_inventario_registrado_by_fkey FOREIGN KEY (registrado_by) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.pago_factura ADD CONSTRAINT pago_factura_created_by_fkey FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.pago_factura ADD CONSTRAINT pago_factura_id_factura_fkey FOREIGN KEY (id_factura) REFERENCES factura(id_factura) ON DELETE CASCADE;
ALTER TABLE ONLY public.pago_factura ADD CONSTRAINT pago_factura_id_transaccion_fkey FOREIGN KEY (id_transaccion) REFERENCES transactions(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.pago_factura ADD CONSTRAINT pago_factura_registrado_by_fkey FOREIGN KEY (registrado_by) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.pago_mensual ADD CONSTRAINT pago_mensual_id_periodo_fkey FOREIGN KEY (id_periodo) REFERENCES meses_periodo(id_periodo);
ALTER TABLE ONLY public.pago_mensual ADD CONSTRAINT pago_mensual_id_socio_fkey FOREIGN KEY (id_socio) REFERENCES socio(id_socio);
ALTER TABLE ONLY public.pago_mensual ADD CONSTRAINT pago_mensual_id_transaccion_fkey FOREIGN KEY (id_transaccion) REFERENCES transactions(id);
ALTER TABLE ONLY public.pagos_pasarela ADD CONSTRAINT pagos_pasarela_id_socio_fkey FOREIGN KEY (id_socio) REFERENCES socio(id_socio) ON DELETE SET NULL;
ALTER TABLE ONLY public.pagos_pasarela ADD CONSTRAINT pagos_pasarela_transaction_id_fkey FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.pagos_pasarela ADD CONSTRAINT pagos_pasarela_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.pedido_jersey ADD CONSTRAINT pedido_jersey_id_campana_fkey FOREIGN KEY (id_campana) REFERENCES jersey_campana(id);
ALTER TABLE ONLY public.pedido_jersey ADD CONSTRAINT pedido_jersey_id_socio_fkey FOREIGN KEY (id_socio) REFERENCES socio(id_socio);
ALTER TABLE ONLY public.poliza_salud ADD CONSTRAINT poliza_salud_id_socio_fkey FOREIGN KEY (id_socio) REFERENCES socio(id_socio);
ALTER TABLE ONLY public.poliza_salud ADD CONSTRAINT poliza_salud_id_transaccion_fkey FOREIGN KEY (id_transaccion) REFERENCES transactions(id);
ALTER TABLE ONLY public.products ADD CONSTRAINT products_categoria_id_fkey FOREIGN KEY (categoria_id) REFERENCES categoria_producto(id);
ALTER TABLE ONLY public.proveedores ADD CONSTRAINT proveedores_created_by_fkey FOREIGN KEY (created_by) REFERENCES users(id);
ALTER TABLE ONLY public.socio ADD CONSTRAINT socio_created_by_fkey FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.socio_documento ADD CONSTRAINT socio_documento_created_by_fkey FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.socio_documento ADD CONSTRAINT socio_documento_id_socio_fkey FOREIGN KEY (id_socio) REFERENCES socio(id_socio) ON DELETE CASCADE;
ALTER TABLE ONLY public.socio_perfil ADD CONSTRAINT socio_perfil_id_socio_fkey FOREIGN KEY (id_socio) REFERENCES socio(id_socio) ON DELETE SET NULL;
ALTER TABLE ONLY public.socio_perfil ADD CONSTRAINT socio_perfil_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.transactions ADD CONSTRAINT transactions_categoria_id_fkey FOREIGN KEY (categoria_id) REFERENCES categories(id);
ALTER TABLE ONLY public.transactions ADD CONSTRAINT transactions_created_by_fkey FOREIGN KEY (created_by) REFERENCES users(id);
ALTER TABLE ONLY public.transactions ADD CONSTRAINT transactions_id_socio_fkey FOREIGN KEY (id_socio) REFERENCES socio(id_socio) ON DELETE SET NULL;

-- Índices (los de PK/UNIQUE ya los crean sus constraints)
CREATE INDEX idx_asistencia_estado ON public.asistencia USING btree (estado);
CREATE INDEX idx_asistencia_fecha ON public.asistencia USING btree (fecha);
CREATE INDEX idx_asistencia_fecha_estado ON public.asistencia USING btree (fecha, estado);
CREATE INDEX idx_asistencia_registrado_by ON public.asistencia USING btree (registrado_by);
CREATE INDEX idx_auditoria_entidad ON public.auditoria USING btree (entidad, created_at DESC);
CREATE INDEX idx_camerino_anio ON public.camerino USING btree (anio);
CREATE INDEX idx_camerino_id_socio ON public.camerino USING btree (id_socio);
CREATE INDEX idx_camerino_id_transaccion ON public.camerino USING btree (id_transaccion);
CREATE INDEX idx_cartera_estado ON public.cartera USING btree (estado);
CREATE INDEX idx_cartera_estado_fecha ON public.cartera USING btree (estado, fecha);
CREATE INDEX idx_cartera_id_pago_mensual ON public.cartera USING btree (id_pago_mensual);
CREATE INDEX idx_cartera_id_transaccion ON public.cartera USING btree (id_transaccion);
CREATE INDEX idx_cartera_socio ON public.cartera USING btree (id_socio);
CREATE INDEX idx_categories_active ON public.categories USING btree (active);
CREATE INDEX idx_categories_type ON public.categories USING btree (type);
CREATE INDEX idx_compra_approved_by ON public.compra USING btree (approved_by);
CREATE INDEX idx_compra_categoria_id ON public.compra USING btree (categoria_id);
CREATE INDEX idx_compra_created_by ON public.compra USING btree (created_by);
CREATE INDEX idx_compra_id_proveedor ON public.compra USING btree (id_proveedor);
CREATE INDEX idx_compra_id_transaccion ON public.compra USING btree (id_transaccion);
CREATE INDEX idx_config_mensualidad_created_by ON public.config_mensualidad USING btree (created_by);
CREATE INDEX idx_detalle_transaccion_socio ON public.detalle_transaccion USING btree (id_socio);
CREATE INDEX idx_factura_created_by ON public.factura USING btree (created_by);
CREATE INDEX idx_factura_estado ON public.factura USING btree (estado);
CREATE INDEX idx_factura_fecha ON public.factura USING btree (fecha);
CREATE INDEX idx_factura_id_compra ON public.factura USING btree (id_compra);
CREATE INDEX idx_factura_id_proveedor ON public.factura USING btree (id_proveedor);
CREATE INDEX idx_factura_id_transaccion ON public.factura USING btree (id_transaccion);
CREATE INDEX idx_inventario_jersey_recibido_by ON public.inventario_jersey USING btree (recibido_by);
CREATE INDEX idx_jersey_campana_activa ON public.jersey_campana USING btree (activa, fecha_fin);
CREATE INDEX idx_meses_periodo_anio ON public.meses_periodo USING btree (anio);
CREATE INDEX idx_meses_periodo_cerrado_by ON public.meses_periodo USING btree (cerrado_by);
CREATE INDEX idx_movimiento_inv_producto ON public.movimiento_inventario USING btree (id_producto);
CREATE INDEX idx_pago_factura_factura ON public.pago_factura USING btree (id_factura);
CREATE INDEX idx_pago_mensual_estado ON public.pago_mensual USING btree (estado);
CREATE INDEX idx_pago_mensual_estado_fecha ON public.pago_mensual USING btree (estado, fecha_vencimiento);
CREATE INDEX idx_pago_mensual_fecha_vencimiento ON public.pago_mensual USING btree (fecha_vencimiento);
CREATE INDEX idx_pago_mensual_id_transaccion ON public.pago_mensual USING btree (id_transaccion);
CREATE INDEX idx_pago_mensual_periodo ON public.pago_mensual USING btree (id_periodo);
CREATE INDEX idx_pagos_pasarela_estado ON public.pagos_pasarela USING btree (estado);
CREATE INDEX idx_pagos_pasarela_orden ON public.pagos_pasarela USING btree (orden_id);
CREATE INDEX idx_pagos_pasarela_socio ON public.pagos_pasarela USING btree (id_socio);
CREATE INDEX idx_pagos_pasarela_user ON public.pagos_pasarela USING btree (user_id);
CREATE INDEX idx_pedido_jersey_campana ON public.pedido_jersey USING btree (id_campana);
CREATE INDEX idx_pedido_jersey_estado ON public.pedido_jersey USING btree (estado);
CREATE INDEX idx_pedido_jersey_estado_fecha ON public.pedido_jersey USING btree (estado, fecha);
CREATE INDEX idx_pedido_jersey_socio ON public.pedido_jersey USING btree (id_socio);
CREATE INDEX idx_poliza_salud_id_socio ON public.poliza_salud USING btree (id_socio);
CREATE INDEX idx_poliza_salud_id_transaccion ON public.poliza_salud USING btree (id_transaccion);
CREATE INDEX idx_poliza_vencimiento ON public.poliza_salud USING btree (fecha_vencimiento);
CREATE INDEX idx_products_categoria_id ON public.products USING btree (categoria_id);
CREATE UNIQUE INDEX idx_products_codigo_unique ON public.products USING btree (codigo);
CREATE INDEX idx_proveedores_created_by ON public.proveedores USING btree (created_by);
CREATE INDEX idx_socio_created_by ON public.socio USING btree (created_by);
CREATE INDEX idx_socio_documento ON public.socio USING btree (documento);
CREATE INDEX idx_socio_email ON public.socio USING btree (email);
CREATE INDEX idx_socio_estado ON public.socio USING btree (estado);
CREATE INDEX idx_socio_nombre ON public.socio USING btree (nombre);
CREATE INDEX idx_socio_tipo_membresia ON public.socio USING btree (tipo_membresia);
CREATE INDEX idx_socio_documento_socio ON public.socio_documento USING btree (id_socio);
CREATE INDEX idx_socio_perfil_id_socio ON public.socio_perfil USING btree (id_socio);
CREATE INDEX idx_transactions_categoria_id ON public.transactions USING btree (categoria_id);
CREATE INDEX idx_transactions_created_by ON public.transactions USING btree (created_by);
CREATE INDEX idx_transactions_id_socio ON public.transactions USING btree (id_socio);
CREATE UNIQUE INDEX idx_transactions_referencia ON public.transactions USING btree (referencia) WHERE (referencia IS NOT NULL);
CREATE INDEX idx_users_email ON public.users USING btree (email);
CREATE INDEX idx_users_username ON public.users USING btree (username);
CREATE OR REPLACE FUNCTION public.categoria_mensualidad_id()
 RETURNS integer
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  SELECT id FROM categories
  WHERE type = 'income' AND active = true
  ORDER BY
    CASE
      WHEN LOWER(name) = 'cuotas de socios' THEN 0
      WHEN name ILIKE '%mensualidad%'       THEN 1
      WHEN name ILIKE '%cuota%'             THEN 2
      ELSE 3
    END,
    id
  LIMIT 1;
$function$
;

CREATE OR REPLACE FUNCTION public.crear_perfil_por_rol()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  IF NEW.role = 'admin' THEN
    INSERT INTO public.admin_perfil (user_id) VALUES (NEW.id)
      ON CONFLICT (user_id) DO NOTHING;
  ELSIF NEW.role = 'user' THEN
    INSERT INTO public.socio_perfil (user_id) VALUES (NEW.id)
      ON CONFLICT (user_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.fn_sync_unidades_jersey()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_actuales INTEGER;
  v_i        INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_actuales
  FROM inventario_jersey
  WHERE id_pedido = NEW.id_pedido;

  IF v_actuales < COALESCE(NEW.cantidad, 1) THEN
    FOR v_i IN (v_actuales + 1)..COALESCE(NEW.cantidad, 1) LOOP
      INSERT INTO inventario_jersey (id_pedido, nro_item, estado_entrega, fecha_entrega, observaciones)
      VALUES (
        NEW.id_pedido,
        v_i,
        CASE WHEN NEW.estado = 'Entregado' THEN 'Entregado' ELSE 'Pendiente' END,
        CASE WHEN NEW.estado = 'Entregado' THEN COALESCE(NEW.fecha_entrega, CURRENT_DATE) ELSE NULL END,
        NEW.observaciones
      );
    END LOOP;
  ELSIF v_actuales > COALESCE(NEW.cantidad, 1) THEN
    DELETE FROM inventario_jersey
    WHERE id_pedido = NEW.id_pedido
      AND nro_item > COALESCE(NEW.cantidad, 1);
  END IF;

  IF NEW.estado = 'Entregado' THEN
    UPDATE inventario_jersey
       SET estado_entrega = 'Entregado',
           fecha_entrega  = COALESCE(NEW.fecha_entrega, CURRENT_DATE)
     WHERE id_pedido = NEW.id_pedido;
  ELSIF NEW.estado = 'Cancelado' THEN
    UPDATE inventario_jersey
       SET estado_entrega = 'Devuelto'
     WHERE id_pedido = NEW.id_pedido;
  END IF;

  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.registrar_pago_cartera(p_id_cartera integer, p_metodo_pago character varying, p_referencia character varying, p_user_id integer, p_fecha_pago date DEFAULT CURRENT_DATE, p_id_transaccion integer DEFAULT NULL::integer)
 RETURNS integer
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_cartera         cartera%ROWTYPE;
  v_id_transaccion  integer;
  v_fecha_pago      date := COALESCE(p_fecha_pago, CURRENT_DATE);
BEGIN
  SELECT * INTO v_cartera FROM cartera WHERE id_cartera = p_id_cartera FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Registro de cartera % no existe', p_id_cartera USING ERRCODE = 'no_data_found';
  END IF;

  IF v_cartera.estado = 'pagado' THEN
    RETURN v_cartera.id_transaccion;
  END IF;

  IF v_cartera.estado = 'anulado' THEN
    RAISE EXCEPTION 'No se puede registrar el pago de un registro anulado'
      USING ERRCODE = 'check_violation';
  END IF;

  IF p_id_transaccion IS NOT NULL THEN
    UPDATE transactions
       SET id_socio = COALESCE(id_socio, v_cartera.id_socio)
     WHERE id = p_id_transaccion
     RETURNING id INTO v_id_transaccion;
    IF v_id_transaccion IS NULL THEN
      RAISE EXCEPTION 'La transacción % no existe', p_id_transaccion USING ERRCODE = 'no_data_found';
    END IF;
  ELSE
    INSERT INTO transactions
      (tipo, monto, fecha, descripcion, categoria_id, metodo_pago, referencia, created_by, id_socio)
    VALUES
      ('ingreso',
       v_cartera.valor,
       v_fecha_pago,
       v_cartera.concepto,
       categoria_mensualidad_id(),
       p_metodo_pago,
       p_referencia,
       p_user_id,
       v_cartera.id_socio)
    RETURNING id INTO v_id_transaccion;
  END IF;

  UPDATE cartera
     SET estado         = 'pagado',
         fecha_pago     = v_fecha_pago,
         id_transaccion = v_id_transaccion
   WHERE id_cartera = p_id_cartera;

  RETURN v_id_transaccion;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.registrar_pago_mensual(p_id_pago integer, p_metodo_pago character varying, p_referencia character varying, p_user_id integer, p_fecha_pago date DEFAULT CURRENT_DATE, p_id_transaccion integer DEFAULT NULL::integer)
 RETURNS integer
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_pago            pago_mensual%ROWTYPE;
  v_nombre_mes      varchar;
  v_anio            integer;
  v_id_transaccion  integer;
  v_fecha_pago      date := COALESCE(p_fecha_pago, CURRENT_DATE);
BEGIN
  SELECT * INTO v_pago FROM pago_mensual WHERE id_pago = p_id_pago FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pago mensual % no existe', p_id_pago USING ERRCODE = 'no_data_found';
  END IF;

  IF v_pago.estado = 'pagado' THEN
    RETURN v_pago.id_transaccion;
  END IF;

  IF v_pago.estado = 'cancelado' THEN
    RAISE EXCEPTION 'No se puede registrar el pago de una cuota cancelada'
      USING ERRCODE = 'check_violation';
  END IF;

  IF p_id_transaccion IS NOT NULL THEN
    UPDATE transactions
       SET id_socio = COALESCE(id_socio, v_pago.id_socio)
     WHERE id = p_id_transaccion
     RETURNING id INTO v_id_transaccion;
    IF v_id_transaccion IS NULL THEN
      RAISE EXCEPTION 'La transacción % no existe', p_id_transaccion USING ERRCODE = 'no_data_found';
    END IF;
  ELSE
    SELECT mp.nombre_mes, mp.anio INTO v_nombre_mes, v_anio
    FROM meses_periodo mp WHERE mp.id_periodo = v_pago.id_periodo;

    INSERT INTO transactions
      (tipo, monto, fecha, descripcion, categoria_id, metodo_pago, referencia, created_by, id_socio)
    VALUES
      ('ingreso',
       v_pago.valor,
       v_fecha_pago,
       'Mensualidad ' || COALESCE(v_nombre_mes, '') || ' ' || COALESCE(v_anio::text, ''),
       categoria_mensualidad_id(),
       p_metodo_pago,
       p_referencia,
       p_user_id,
       v_pago.id_socio)
    RETURNING id INTO v_id_transaccion;
  END IF;

  UPDATE pago_mensual
     SET estado         = 'pagado',
         fecha_pago     = v_fecha_pago,
         id_transaccion = v_id_transaccion,
         updated_at     = CURRENT_TIMESTAMP
   WHERE id_pago = p_id_pago;

  RETURN v_id_transaccion;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.sp_estado_cuenta_socio(p_id_socio integer)
 RETURNS TABLE(tipo character varying, anio integer, mes integer, periodo character varying, valor numeric, estado character varying, fecha_pago date, fecha_vencimiento date, dias_mora integer, valor_a_pagar numeric)
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
    RETURN QUERY
    -- Mensualidades
    SELECT
        'Mensualidad'::VARCHAR(20) AS tipo,
        mp.anio,
        mp.mes,
        mp.nombre_mes AS periodo,
        pm.valor,
        pm.estado::VARCHAR(20),
        pm.fecha_pago,
        pm.fecha_vencimiento,
        CASE
        WHEN pm.fecha_pago IS NOT NULL THEN pm.dias_mora
        ELSE GREATEST(0, (CURRENT_DATE - pm.fecha_vencimiento))
    END AS dias_mora,
        CASE
            WHEN pm.estado = 'pendiente' AND pm.fecha_vencimiento < CURRENT_DATE
            THEN pm.valor * 1.10
            ELSE pm.valor
        END AS valor_a_pagar
    FROM pago_mensual pm
    JOIN meses_periodo mp ON pm.id_periodo = mp.id_periodo
    WHERE pm.id_socio = p_id_socio

    UNION ALL

    -- Cartera (recargos)
    -- CORRECCIÓN: (CURRENT_DATE - fecha) ya devuelve INTEGER
    SELECT
        'Recargo'::VARCHAR(20) AS tipo,
        EXTRACT(YEAR FROM fecha)::INTEGER AS anio,
        EXTRACT(MONTH FROM fecha)::INTEGER AS mes,
        concepto AS periodo,
        valor,
        estado::VARCHAR(20),
        fecha_pago,
        fecha AS fecha_vencimiento,
        (CURRENT_DATE - fecha)::INTEGER AS dias_mora,
        valor AS valor_a_pagar
    FROM cartera
    WHERE id_socio = p_id_socio AND estado = 'pendiente'

    ORDER BY anio, mes, tipo;
END;
$function$
;
CREATE OR REPLACE FUNCTION public.sp_generar_mensualidades_anual(p_anio integer, p_valor numeric)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
    v_mes INTEGER;
    v_id_periodo INTEGER;
    v_fecha_venc DATE;
    v_dia_venc INTEGER;
    v_nombre_mes TEXT[];
BEGIN
    v_nombre_mes := ARRAY['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                          'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

    -- Obtener día de vencimiento de configuración
    SELECT COALESCE(dia_vencimiento_default, 15) INTO v_dia_venc
    FROM system_data
    WHERE id = 1;

    -- Generar para cada mes
    FOR v_mes IN 1..12 LOOP
        -- Insertar periodo si no existe
        INSERT INTO meses_periodo (anio, mes, nombre_mes, fecha_inicio, fecha_fin)
        VALUES (
            p_anio,
            v_mes,
            v_nombre_mes[v_mes],
            MAKE_DATE(p_anio, v_mes, 1),
            (MAKE_DATE(p_anio, v_mes, 1) + INTERVAL '1 month' - INTERVAL '1 day')::DATE
        )
        ON CONFLICT (anio, mes) DO NOTHING;

        -- Obtener ID del periodo
        SELECT id_periodo INTO v_id_periodo
        FROM meses_periodo
        WHERE anio = p_anio AND mes = v_mes;

        -- Calcular fecha de vencimiento
        v_fecha_venc := MAKE_DATE(p_anio, v_mes, v_dia_venc);

        -- Insertar mensualidades para socios activos
        INSERT INTO pago_mensual (id_socio, id_periodo, valor, fecha_vencimiento, estado)
        SELECT id_socio, v_id_periodo, p_valor, v_fecha_venc, 'pendiente'
        FROM socio
        WHERE estado = 'activo'
        ON CONFLICT (id_socio, id_periodo) DO NOTHING;

    END LOOP;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.sp_registrar_asistencia_masiva(p_fecha date, p_tipo_entrenamiento character varying, p_ids_socios text, p_user_id integer)
 RETURNS text
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
    v_count INTEGER;
    v_socio_id INTEGER;
    v_socios_array INTEGER[];
    v_i INTEGER;
BEGIN
    -- Convertir string de IDs a array
    v_socios_array := string_to_array(p_ids_socios, ',')::int[];

    v_count := 0;

    -- Insertar asistencia para cada socio
    FOREACH v_socio_id IN ARRAY v_socios_array
    LOOP
        BEGIN
            INSERT INTO asistencia (id_socio, fecha, tipo_entrenamiento, estado, registrado_by)
            VALUES (v_socio_id, p_fecha, p_tipo_entrenamiento, 'Presente', p_user_id)
            ON CONFLICT (id_socio, fecha) DO NOTHING;

            IF FOUND THEN
                v_count := v_count + 1;
            END IF;
        END;
    END LOOP;

    RETURN 'Asistencia registrada para ' || v_count || ' socios';
END;
$function$
;

-- NOTA (L2a): esta función inserta en "transaccion_fin", tabla que no existe en el esquema vivo.
-- Se conserva tal cual para que la línea base refleje el estado real; ver docs/bd/bd-estandar.md.
CREATE OR REPLACE FUNCTION public.sp_registrar_pago_mensual(p_id_socio integer, p_id_periodo integer, p_valor_pago numeric, p_fecha_pago date, p_metodo_pago character varying, p_user_id integer)
 RETURNS integer
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
    v_id_transaccion INTEGER;
    v_mes INTEGER;
    v_anio INTEGER;
    v_nombre_mes VARCHAR(20);
    v_categoria_id INTEGER;
BEGIN
    -- Obtener información del periodo
    SELECT mes, anio, nombre_mes INTO v_mes, v_anio, v_nombre_mes
    FROM meses_periodo
    WHERE id_periodo = p_id_periodo;

    -- Obtener ID de categoría
    SELECT id INTO v_categoria_id FROM categories
    WHERE name = 'Cuotas de Socios' AND type = 'income'
    LIMIT 1;

    -- Crear transacción financiera
    INSERT INTO transaccion_fin (fecha, tipo, monto, categoria_id, descripcion, metodo_pago, created_by)
    VALUES (
        p_fecha_pago,
        'income',
        p_valor_pago,
        v_categoria_id,
        'Pago mensualidad ' || v_nombre_mes || '/' || v_anio || ' - Socio: ' || p_id_socio,
        p_metodo_pago,
        p_user_id
    ) RETURNING id_transaccion INTO v_id_transaccion;

    -- Detalle de transacción
    INSERT INTO detalle_transaccion (id_transaccion, id_socio, monto, concepto)
    VALUES (v_id_transaccion, p_id_socio, p_valor_pago, 'Mensualidad ' || v_nombre_mes || '/' || v_anio);

    -- Actualizar pago mensual
    UPDATE pago_mensual
    SET
        fecha_pago = p_fecha_pago,
        id_transaccion = v_id_transaccion
    WHERE id_socio = p_id_socio AND id_periodo = p_id_periodo;

    RETURN v_id_transaccion;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.tr_actualizar_mora()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
    IF NEW.fecha_pago IS NOT NULL THEN
        NEW.dias_mora = GREATEST(NEW.fecha_pago - NEW.fecha_vencimiento, 0);
        -- Pago registrado sin cambio explícito de estado: pasa a pagado.
        IF NEW.estado = OLD.estado AND NEW.estado IN ('pendiente', 'moroso') THEN
            NEW.estado = 'pagado';
        END IF;
    ELSIF NEW.estado = 'moroso' THEN
        NEW.dias_mora = GREATEST(CURRENT_DATE - NEW.fecha_vencimiento, 0);
    END IF;
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.tr_generar_recargo_mora()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
    v_recargo DECIMAL(10,2);
    v_porcentaje_mora DECIMAL(5,2);
    v_nombre_mes VARCHAR(20);
BEGIN
    IF NEW.estado = 'pagado' AND OLD.estado <> 'pagado'
       AND NEW.fecha_pago IS NOT NULL AND NEW.fecha_pago > NEW.fecha_vencimiento THEN
        SELECT COALESCE(porcentaje_mora, 0) INTO v_porcentaje_mora FROM system_data WHERE id = 1;
        v_recargo = NEW.valor * (COALESCE(v_porcentaje_mora, 0) / 100);

        IF v_recargo > 0 THEN
            SELECT nombre_mes INTO v_nombre_mes
            FROM meses_periodo
            WHERE id_periodo = NEW.id_periodo;

            INSERT INTO cartera (id_socio, id_pago_mensual, fecha, concepto, valor, estado)
            VALUES (
                NEW.id_socio,
                NEW.id_pago,
                NEW.fecha_pago,
                'Recargo por mora - Mensualidad ' || COALESCE(v_nombre_mes, ''),
                v_recargo,
                'pendiente'
            );
        END IF;
    END IF;
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.tr_pagos_pasarela_resolver_socio()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.id_socio IS NULL AND NEW.user_id IS NOT NULL THEN
    SELECT sp.id_socio INTO NEW.id_socio
    FROM socio_perfil sp
    WHERE sp.user_id = NEW.user_id;
  END IF;

  IF NEW.id_socio IS NULL THEN
    RAISE EXCEPTION 'El usuario no tiene un socio vinculado'
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.tr_prevenir_pago_duplicado()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
    v_existe INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_existe
    FROM pago_mensual
    WHERE id_socio = NEW.id_socio
      AND id_periodo = NEW.id_periodo
      AND estado IN ('pagado', 'moroso');

    IF v_existe > 0 THEN
        RAISE EXCEPTION 'Este socio ya tiene procesada esta mensualidad';
    END IF;
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.tr_socio_perfil_cambio_socio()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  IF OLD.id_socio IS NOT NULL
     AND NEW.id_socio IS NOT NULL
     AND OLD.id_socio <> NEW.id_socio THEN
    RAISE EXCEPTION 'Desvincule el socio actual antes de asignar otro'
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.verificar_instalacion()
 RETURNS text
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
    v_tablas INTEGER;
    v_result TEXT;
BEGIN
    SELECT COUNT(*) INTO v_tablas
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE';

    v_result := '✅ Instalación completada exitosamente.' || chr(10);
    v_result := v_result || '📊 Total de tablas creadas: ' || v_tablas || chr(10);
    v_result := v_result || '🚀 El sistema está listo para usar en pgAdmin4.';

    RETURN v_result;
END;
$function$
;
CREATE VIEW public.v_cartera_general WITH (security_invoker=true) AS
 SELECT c.id_cartera,
    s.id_socio,
    s.nombre AS socio_nombre,
    s.documento,
    c.fecha,
    c.concepto,
    c.valor,
    c.estado,
    CURRENT_DATE - c.fecha AS dias_antiguedad,
        CASE
            WHEN c.estado::text = 'pendiente'::text AND (CURRENT_DATE - c.fecha) <= 30 THEN '1-30 días'::text
            WHEN c.estado::text = 'pendiente'::text AND (CURRENT_DATE - c.fecha) <= 60 THEN '31-60 días'::text
            WHEN c.estado::text = 'pendiente'::text AND (CURRENT_DATE - c.fecha) <= 90 THEN '61-90 días'::text
            WHEN c.estado::text = 'pendiente'::text THEN '90+ días'::text
            ELSE 'Pagado'::text
        END AS rango_antiguedad
   FROM cartera c
     JOIN socio s ON c.id_socio = s.id_socio;

-- NOTA (L2a): en el esquema vivo esta vista NO tiene security_invoker (advisor: ERROR security_definer_view).
-- La línea base la deja igual; el arreglo va en una migración propia de L2b.
CREATE VIEW public.v_estado_resultados AS
 SELECT EXTRACT(year FROM fecha) AS anio,
    EXTRACT(month FROM fecha) AS mes,
    sum(
        CASE
            WHEN tipo::text = 'ingreso'::text AND estado::text = 'confirmada'::text THEN monto
            ELSE 0::numeric
        END) AS total_ingresos,
    sum(
        CASE
            WHEN tipo::text = 'gasto'::text AND estado::text = 'confirmada'::text THEN monto
            ELSE 0::numeric
        END) AS total_gastos,
    sum(
        CASE
            WHEN tipo::text = 'ingreso'::text AND estado::text = 'confirmada'::text THEN monto
            WHEN tipo::text = 'gasto'::text AND estado::text = 'confirmada'::text THEN - monto
            ELSE 0::numeric
        END) AS resultado_neto
   FROM transactions
  GROUP BY (EXTRACT(year FROM fecha)), (EXTRACT(month FROM fecha));

CREATE VIEW public.v_mensualidades_socio WITH (security_invoker=true) AS
 SELECT s.id_socio,
    s.nombre,
    s.documento,
    mp.anio,
    mp.mes,
    mp.nombre_mes,
    pm.valor,
    pm.estado,
    pm.fecha_pago,
    pm.fecha_vencimiento,
        CASE
            WHEN pm.fecha_pago IS NOT NULL THEN pm.dias_mora
            ELSE GREATEST(0, CURRENT_DATE - pm.fecha_vencimiento)
        END AS dias_mora,
        CASE
            WHEN pm.estado::text = 'pagado'::text THEN 'Al día'::character varying
            WHEN pm.estado::text = 'moroso'::text THEN 'En mora'::character varying
            WHEN pm.fecha_vencimiento < CURRENT_DATE AND pm.estado::text = 'pendiente'::text THEN 'Vencido'::character varying
            WHEN pm.fecha_vencimiento >= CURRENT_DATE AND pm.estado::text = 'pendiente'::text THEN 'Pendiente'::character varying
            ELSE pm.estado
        END AS estado_actual
   FROM pago_mensual pm
     JOIN socio s ON pm.id_socio = s.id_socio
     JOIN meses_periodo mp ON pm.id_periodo = mp.id_periodo;

CREATE VIEW public.v_reporte_asistencia WITH (security_invoker=true) AS
 SELECT a.id_asistencia,
    s.id_socio,
    s.nombre AS socio_nombre,
    s.documento,
    a.fecha,
    to_char(a.fecha::timestamp with time zone, 'Day'::text) AS dia_semana,
    a.tipo_entrenamiento,
    a.estado,
        CASE a.estado
            WHEN 'Presente'::text THEN '✅'::text
            WHEN 'Tarde'::text THEN '⚠️'::text
            WHEN 'Justificado'::text THEN '📝'::text
            WHEN 'Ausente'::text THEN '❌'::text
            ELSE NULL::text
        END AS icono,
    a.observacion,
    u.full_name AS registrado_por,
    a.created_at
   FROM asistencia a
     JOIN socio s ON a.id_socio = s.id_socio
     LEFT JOIN users u ON a.registrado_by = u.id;

CREATE VIEW public.v_resumen_mensual WITH (security_invoker=true) AS
 SELECT mp.anio,
    mp.mes,
    mp.nombre_mes,
    count(DISTINCT pm.id_socio) AS total_socios,
    count(
        CASE
            WHEN pm.estado::text = 'pagado'::text THEN 1
            ELSE NULL::integer
        END) AS pagados,
    count(
        CASE
            WHEN pm.estado::text = 'pendiente'::text THEN 1
            ELSE NULL::integer
        END) AS pendientes,
    count(
        CASE
            WHEN pm.estado::text = 'moroso'::text THEN 1
            ELSE NULL::integer
        END) AS morosos,
    COALESCE(sum(
        CASE
            WHEN pm.estado::text = ANY (ARRAY['pagado'::character varying::text, 'moroso'::character varying::text]) THEN pm.valor
            ELSE 0::numeric
        END), 0::numeric) AS total_recaudado,
    COALESCE(sum(
        CASE
            WHEN pm.estado::text = 'pendiente'::text THEN pm.valor
            ELSE 0::numeric
        END), 0::numeric) AS total_por_cobrar,
    COALESCE(( SELECT sum(c.valor) AS sum
           FROM cartera c
          WHERE c.estado::text = 'pendiente'::text AND EXTRACT(month FROM c.fecha) = mp.mes::numeric AND EXTRACT(year FROM c.fecha) = mp.anio::numeric), 0::numeric) AS recargos_pendientes
   FROM meses_periodo mp
     LEFT JOIN pago_mensual pm ON mp.id_periodo = pm.id_periodo
  GROUP BY mp.anio, mp.mes, mp.nombre_mes
  ORDER BY mp.anio, mp.mes;

CREATE VIEW public.vista_admins WITH (security_invoker=on) AS
 SELECT u.id,
    u.username,
    u.email,
    u.full_name,
    u.active,
    u.last_login,
    u.created_at,
    ap.cargo,
    ap.permisos,
    ap.creado_por
   FROM users u
     JOIN admin_perfil ap ON ap.user_id = u.id
  WHERE u.role::text = 'admin'::text;

CREATE VIEW public.vista_socios WITH (security_invoker=on) AS
 SELECT u.id,
    u.username,
    u.email,
    u.full_name,
    u.active,
    u.last_login,
    u.created_at,
    sp.telefono,
    sp.email_verified,
    sp.id_socio,
    sp.notificaciones,
    s.documento,
    s.tipo_documento,
    s.tipo_membresia,
    s.nivel_aprendizaje,
    s.estado AS estado_socio,
    s.fecha_ingreso
   FROM users u
     JOIN socio_perfil sp ON sp.user_id = u.id
     LEFT JOIN socio s ON s.id_socio = sp.id_socio
  WHERE u.role::text = 'user'::text;

CREATE VIEW public.vista_usuarios_sin_socio WITH (security_invoker=true) AS
 SELECT u.id,
    u.username,
    u.email,
    u.full_name
   FROM users u
     JOIN socio_perfil sp ON sp.user_id = u.id
  WHERE u.role::text = 'user'::text AND u.active = true AND sp.id_socio IS NULL;

-- Triggers
CREATE TRIGGER trg_admin_perfil_updated_at BEFORE UPDATE ON public.admin_perfil FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_config_mensualidad_updated_at BEFORE UPDATE ON public.config_mensualidad FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_factura_updated_at BEFORE UPDATE ON public.factura FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_actualizar_mora BEFORE UPDATE ON public.pago_mensual FOR EACH ROW EXECUTE FUNCTION tr_actualizar_mora();
CREATE TRIGGER trigger_generar_recargo_mora AFTER UPDATE ON public.pago_mensual FOR EACH ROW EXECUTE FUNCTION tr_generar_recargo_mora();
CREATE TRIGGER trigger_prevenir_pago_duplicado BEFORE INSERT ON public.pago_mensual FOR EACH ROW EXECUTE FUNCTION tr_prevenir_pago_duplicado();
CREATE TRIGGER update_pago_mensual_updated_at BEFORE UPDATE ON public.pago_mensual FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_pagos_pasarela_resolver_socio BEFORE INSERT ON public.pagos_pasarela FOR EACH ROW EXECUTE FUNCTION tr_pagos_pasarela_resolver_socio();
CREATE TRIGGER trg_pagos_pasarela_updated_at BEFORE UPDATE ON public.pagos_pasarela FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_pedido_jersey_unidades AFTER INSERT OR UPDATE OF cantidad, estado, fecha_entrega ON public.pedido_jersey FOR EACH ROW EXECUTE FUNCTION fn_sync_unidades_jersey();
CREATE TRIGGER update_socio_updated_at BEFORE UPDATE ON public.socio FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_socio_perfil_cambio_socio BEFORE UPDATE OF id_socio ON public.socio_perfil FOR EACH ROW EXECUTE FUNCTION tr_socio_perfil_cambio_socio();
CREATE TRIGGER trg_socio_perfil_updated_at BEFORE UPDATE ON public.socio_perfil FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_users_cambio_rol AFTER UPDATE OF role ON public.users FOR EACH ROW WHEN (((old.role)::text IS DISTINCT FROM (new.role)::text)) EXECUTE FUNCTION crear_perfil_por_rol();
CREATE TRIGGER trg_users_crear_perfil AFTER INSERT ON public.users FOR EACH ROW EXECUTE FUNCTION crear_perfil_por_rol();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- RLS: activa en 30 tablas, sin políticas (el backend entra con rol postgres, que ignora RLS).
-- En el esquema vivo NO tienen RLS: alerta_sistema, movimiento_inventario, pago_factura,
-- socio_documento, tipo_cartera (advisor: ERROR rls_disabled_in_public). Se arregla en L2b.
ALTER TABLE public.admin_perfil ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asistencia ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auditoria ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.camerino ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cartera ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categoria_producto ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compra ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.config_mensualidad ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.detalle_compra ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.detalle_factura ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.detalle_transaccion ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.factura ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventario_jersey ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jersey_campana ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.landing_borrador ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.landing_imagen ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.landing_version ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meses_periodo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pago_mensual ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pagos_pasarela ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedido_jersey ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poliza_salud ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proveedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.socio ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.socio_perfil ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Permisos: tablas, vistas y secuencias usan los privilegios por defecto de Supabase.
-- Excepción en el esquema vivo: estas dos funciones solo las ejecutan postgres y service_role.
REVOKE EXECUTE ON FUNCTION public.crear_perfil_por_rol() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;

-- Comentarios existentes (24). Las tablas sin comentario se listan en docs/bd/bd-estandar.md.
COMMENT ON TABLE public.admin_perfil IS 'Datos propios del administrador. Uno a uno con users donde role = admin.';
COMMENT ON TABLE public.asistencia IS 'Control de asistencia a entrenamientos y actividades';
COMMENT ON TABLE public.camerino IS 'Asignación y pago de camerinos o lockers';
COMMENT ON TABLE public.cartera IS 'Registro de cartera morosa y recargos';
COMMENT ON TABLE public.categories IS 'Categorías para clasificar ingresos y gastos';
COMMENT ON TABLE public.compra IS 'Registro de compras y gastos del club';
COMMENT ON COLUMN public.compra.proveedor_nombre IS 'Proveedor como texto libre (opcional). Reemplaza a la antigua tabla proveedores.';
COMMENT ON TABLE public.config_mensualidad IS 'Configuración anual de mensualidades';
COMMENT ON TABLE public.detalle_factura IS 'Líneas de detalle de facturas';
COMMENT ON TABLE public.detalle_transaccion IS 'Detalle de transacciones asociadas a socios';
COMMENT ON TABLE public.factura IS 'Facturación de compras y proveedores';
COMMENT ON COLUMN public.factura.proveedor_nombre IS 'Proveedor como texto libre (opcional). Reemplaza a la antigua tabla proveedores.';
COMMENT ON TABLE public.inventario_jersey IS 'Control de inventario y entregas de indumentaria';
COMMENT ON TABLE public.meses_periodo IS 'Periodos mensuales para control contable';
COMMENT ON TABLE public.pago_mensual IS 'Control de pagos de mensualidades por socio';
COMMENT ON TABLE public.pagos_pasarela IS 'Intentos de pago via pasarela. payload_raw guarda el JSON crudo del webhook para auditoria.';
COMMENT ON COLUMN public.pagos_pasarela.estado IS 'Estado normalizado de la aplicacion, independiente de la pasarela. Solo APPROVED genera asiento en transactions.';
COMMENT ON COLUMN public.pagos_pasarela.estado_proveedor IS 'Estado crudo de la pasarela, sin traducir. PayPal: COMPLETED, DENIED, PENDING, REFUNDED, APPROVED... Se conserva junto al estado normalizado.';
COMMENT ON TABLE public.pedido_jersey IS 'Pedidos de indumentaria deportiva';
COMMENT ON TABLE public.poliza_salud IS 'Pólizas de seguro de salud para socios';
COMMENT ON TABLE public.socio IS 'Información completa de los socios del club';
COMMENT ON TABLE public.socio_perfil IS 'Datos propios del socio del portal. Uno a uno con users donde role = user. id_socio en NULL significa cuenta aun no vinculada a una ficha del club.';
COMMENT ON TABLE public.system_data IS 'Configuración general del club';
COMMENT ON TABLE public.users IS 'Usuarios del sistema con roles diferenciados';
