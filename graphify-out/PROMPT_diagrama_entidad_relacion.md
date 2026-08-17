# Prompt: Diagrama entidad-relación del estado actual — Ruta Contable

Pega esto en Claude (o cualquier herramienta de diseño/diagramación) para que genere el diagrama ER del proyecto **tal como está hoy** en producción (Supabase, proyecto `hfibhmntifttdududwpw`, Postgres 17.6), no una versión propuesta o corregida. Es autocontenido — el esquema fue extraído en vivo por MCP, no de documentación.

---

Actuá como diseñador de bases de datos. Generá un diagrama entidad-relación (notación pata de gallo / crow's foot, o UML de clases si preferís) del siguiente esquema real de Postgres, agrupando visualmente las entidades por dominio de negocio y usando color para distinguir grupos. El esquema tiene 21 tablas en el schema `public`. Reproducilo fielmente, **incluyendo las duplicaciones e inconsistencias que existen hoy** (no las corrijas ni las fusiones — este diagrama es un diagnóstico visual del estado actual, no una propuesta).

## Dominios sugeridos para agrupar (colorealos distinto)

- **Identidad / acceso**: `users`
- **Socios**: `socio`
- **Configuración del club (duplicada)**: `club_config`, `system_data`
- **Periodos contables (duplicado)**: `periodos`, `meses_periodo`
- **Financiero / libro mayor**: `transactions`, `detalle_transaccion`, `categories`
- **Cuotas y cartera**: `config_mensualidad`, `pago_mensual`, `cartera`
- **Compras y facturación**: `compra`, `factura`, `detalle_factura`
- **Inventario / indumentaria**: `products`, `pedido_jersey`, `inventario_jersey`
- **Servicios a socios**: `poliza_salud`, `camerino`
- **Asistencia**: `asistencia`

## Entidades, atributos y llaves

Formato por tabla: `columna : tipo` — `PK` = primary key, `FK -> tabla.columna` = foreign key, `UNIQUE`, `CHECK(...)` cuando aplica, `NULL` cuando es nullable (si no se indica, es NOT NULL).

### users
- id : integer, PK
- username : varchar, UNIQUE
- password : varchar
- email : varchar, UNIQUE
- full_name : varchar
- role : varchar, default 'user' (sin CHECK — valores libres, hoy solo se usan 'admin' y 'user' en código)
- active : boolean, default true
- last_login : timestamp, NULL
- created_at, updated_at : timestamp
- failed_attempts : integer, default 0, NULL
- locked_until : timestamp, NULL
- reset_token : varchar, NULL
- reset_token_expires : timestamp, NULL
- otp_attempts : integer, default 0, NULL

### socio
- id_socio : integer, PK
- nombre : varchar
- documento : varchar, UNIQUE
- tipo_documento : varchar, CHECK IN ('CC','TI','CE','PAS'), default 'CC', NULL
- email, telefono, direccion : varchar, NULL
- fecha_nacimiento : date, NULL
- fecha_ingreso : date
- tipo_membresia : varchar, CHECK IN ('Completa','Básica','Premium','Honoraria'), default 'Básica', NULL
- estado : varchar, CHECK IN ('activo','inactivo','suspendido'), default 'activo', NULL
- foto : varchar, NULL
- observaciones : text, NULL
- created_at, updated_at : timestamp
- created_by : integer, FK -> users.id, NULL

### club_config  ⚠ duplica system_data
- id : integer, PK, default 1
- club_name : varchar
- tax_id, adress, phone, email, concurrency, fiscal_year : varchar, NULL
- dia_vencimiento : integer, NULL
- porcentaje_mora : numeric, NULL

### system_data  ⚠ duplica club_config
- id : integer, PK, CHECK(id = 1)
- club_nombre : varchar, default 'Mi Club'
- nit, direccion, telefono, email, logo_url : varchar, NULL
- moneda : varchar, default 'COP'
- dia_vencimiento_default : smallint, default 15, NULL
- porcentaje_mora : numeric, default 10.00, NULL
- created_at, updated_at : timestamp

### periodos  ⚠ duplica meses_periodo (y tiene columnas duplicadas dentro de sí misma)
- id : integer, PK
- anio, mes : integer
- nombremes : varchar, NULL — duplicado por nombre_mes : varchar, default ''
- fechainicio, fechafin : date, NULL — duplicados por fecha_inicio, fecha_fin : date, NULL
- activo : boolean, default true, NULL
- cerrado : boolean, default false, NULL
- fechacierre : timestamp, NULL — duplicado por fecha_cierre : timestamp, NULL
- observaciones : text, NULL
- cerradoby : varchar, NULL — duplicado por cerrado_by : varchar, NULL (ninguno de los dos es FK real a users)
- created_at : timestamp, NULL
- total_ingresos, total_gastos, balance : numeric, default 0.00, NULL

### meses_periodo  ⚠ duplica periodos
- id_periodo : integer, PK
- anio : integer, CHECK(anio >= 2000)
- mes : smallint, CHECK(mes BETWEEN 1 AND 12)
- nombre_mes : varchar
- fecha_inicio, fecha_fin : date
- activo : boolean, default true, NULL
- cerrado : boolean, default false, NULL
- fecha_cierre : date, NULL
- observaciones : text, NULL
- cerrado_by : integer, FK -> users.id, NULL

### categories
- id : integer, PK
- name : varchar
- type : varchar, CHECK IN ('income','expense')
- description : text, NULL
- active : boolean, default true
- created_at, updated_at : timestamp

### transactions  ⚠ columnas legacy paralelas a FKs reales
- id : integer, PK
- tipo : varchar, CHECK IN ('ingreso','gasto')
- monto : numeric
- fecha : date
- descripcion : text, NULL
- created_at : timestamp, NULL
- categoria : varchar, NULL — ⚠ texto libre, coexiste con categoria_id
- metodo_pago : varchar, CHECK IN ('efectivo','transferencia','tarjeta','cheque'), NULL
- creado_por : varchar, NULL — ⚠ texto libre, coexiste con created_by
- categoria_id : integer, FK -> categories.id, NULL
- referencia : varchar, NULL
- created_by : integer, FK -> users.id, NULL

### detalle_transaccion
- id_detalle : integer, PK
- id_transaccion : integer, FK -> transactions.id
- id_socio : integer, FK -> socio.id_socio, NULL
- monto : numeric
- concepto : varchar, NULL

### config_mensualidad
- id_config : integer, PK
- anio : integer, UNIQUE, CHECK(anio >= 2000)
- valor_mensual : numeric
- fecha_vencimiento_default : smallint, default 15, NULL
- activo : boolean, default true, NULL
- observaciones : text, NULL
- created_at, updated_at : timestamp
- created_by : integer, FK -> users.id, NULL

### pago_mensual
- id_pago : integer, PK
- id_socio : integer, FK -> socio.id_socio
- id_periodo : integer, FK -> meses_periodo.id_periodo
- valor : numeric
- fecha_vencimiento : date
- fecha_pago : date, NULL
- estado : varchar, CHECK IN ('pendiente','pagado','moroso','exento','cancelado'), default 'pendiente', NULL
- id_transaccion : integer, FK -> transactions.id, NULL
- dias_mora : integer, default 0, NULL
- observaciones : text, NULL
- created_at, updated_at : timestamp

### cartera
- id_cartera : integer, PK
- id_socio : integer, FK -> socio.id_socio
- id_pago_mensual : integer, FK -> pago_mensual.id_pago, NULL
- fecha : date
- concepto : varchar
- valor : numeric
- estado : varchar, CHECK IN ('pendiente','pagado','anulado'), default 'pendiente', NULL
- fecha_pago : date, NULL
- id_transaccion : integer, FK -> transactions.id, NULL
- observaciones : text, NULL
- created_at : timestamp

### compra  ⚠ proveedor es texto libre, sin tabla propia; sin líneas de detalle
- id_compra : integer, PK
- concepto : varchar
- tipo : varchar, NULL
- cantidad : integer, default 1, NULL
- valor_unitario : numeric
- valor_total : numeric, GENERATED = cantidad * valor_unitario, NULL
- fecha : date
- proveedor : varchar, NULL — ⚠ texto libre, no hay tabla `proveedores`
- factura : varchar, NULL
- categoria_id : integer, FK -> categories.id, NULL
- id_transaccion : integer, FK -> transactions.id, NULL
- observaciones : text, NULL
- created_by : integer, FK -> users.id, NULL
- created_at : timestamp

### factura
- id_factura : integer, PK
- fecha : date
- concepto : varchar
- valor_total : numeric
- proveedor : varchar, NULL — ⚠ texto libre, mismo problema que en `compra`
- nit_proveedor : varchar, NULL
- numero_factura : varchar, NULL
- fecha_recepcion : date, NULL
- estado : varchar, CHECK IN ('Pendiente','Pagada','Anulada'), default 'Pendiente', NULL
- id_compra : integer, FK -> compra.id_compra, NULL
- id_transaccion : integer, FK -> transactions.id, NULL
- observaciones : text, NULL
- created_by : integer, FK -> users.id, NULL
- created_at, updated_at : timestamp

### detalle_factura
- id_factura : integer, FK -> factura.id_factura, PK (compuesta)
- nro_linea : integer, PK (compuesta)
- servicio : varchar
- descripcion : text, NULL
- cantidad : integer, default 1, NULL
- valor_unitario : numeric
- valor_total : numeric, GENERATED = cantidad * valor_unitario, NULL
- iva, descuento : numeric, default 0, NULL
- observaciones : varchar, NULL

### products  ⚠ category es texto libre, no FK; sin relación con inventario_jersey
- id : integer, PK
- name : varchar
- price : numeric
- description : text, NULL
- category : varchar, NULL
- stock : integer, default 0, NULL
- created_at, updated_at : timestamp, NULL

### pedido_jersey
- id_pedido : integer, PK
- id_socio : integer, FK -> socio.id_socio
- fecha : date
- tipo : varchar, CHECK IN ('Jersey','Short','Medias','Chaqueta'), default 'Jersey', NULL
- talla, aplique : varchar, NULL
- valor : numeric
- estado : varchar, CHECK IN ('Solicitado','En producción','Listo','Entregado','Cancelado'), default 'Solicitado', NULL
- fecha_entrega : date, NULL
- observaciones : text, NULL
- created_at, updated_at : timestamp

### inventario_jersey
- id_inventario : integer, PK
- id_pedido : integer, FK -> pedido_jersey.id_pedido
- nro_item : integer
- estado_entrega : varchar, CHECK IN ('Pendiente','Entregado','Devuelto'), default 'Pendiente', NULL
- fecha_entrega : date, NULL
- recibido_by : integer, FK -> users.id, NULL
- observaciones : varchar, NULL

### poliza_salud
- id_poliza : integer, PK
- id_socio : integer, FK -> socio.id_socio
- tipo : varchar, CHECK IN ('Básica','Premium','Familiar')
- numero_poliza : varchar, NULL
- fecha_contratacion, fecha_vencimiento : date
- fecha_pago : date, NULL
- valor : numeric
- estado : varchar, CHECK IN ('Activa','Vencida','Cancelada'), default 'Activa', NULL
- id_transaccion : integer, FK -> transactions.id, NULL
- observaciones : text, NULL

### camerino
- id_camerino : integer, PK
- id_socio : integer, FK -> socio.id_socio
- numero_camerino : varchar
- anio : integer, CHECK(anio >= 2000)
- valor : numeric
- fecha_asignacion : date
- fecha_pago : date, NULL
- estado : varchar, CHECK IN ('Asignado','Pagado','Vencido','Liberado'), default 'Asignado', NULL
- id_transaccion : integer, FK -> transactions.id, NULL
- observaciones : text, NULL

### asistencia
- id_asistencia : integer, PK
- id_socio : integer, FK -> socio.id_socio
- fecha : date
- tipo_entrenamiento : varchar, NULL
- estado : varchar, CHECK IN ('Presente','Ausente','Justificado','Tarde')
- observacion : varchar, NULL
- registrado_by : integer, FK -> users.id, NULL
- created_at : timestamp

## Notas para el diagrama

1. `transactions` es el nodo central: seis tablas distintas (`camerino`, `cartera`, `compra`, `factura`, `pago_mensual`, `poliza_salud`) tienen una FK opcional hacia ella — dibujalo como el eje del libro mayor del que cuelgan todos los módulos que mueven dinero.
2. Marcá visualmente (por ejemplo con un ícono ⚠ o un borde distinto) las 4 zonas de duplicación/inconsistencia: `club_config`↔`system_data`, `periodos`↔`meses_periodo`, `transactions.categoria`↔`categoria_id`, `transactions.creado_por`↔`created_by` — y las columnas `proveedor`/`nit_proveedor` en `compra`/`factura` que deberían ser una FK y son texto libre.
3. `role` en `users` no tiene `CHECK` — anotalo como "valores libres, sin enum" en vez de listar opciones fijas.
4. No existe tabla `proveedores` — no dibujes una entidad que no existe; en su lugar marcá `compra.proveedor` y `factura.proveedor` como atributos de texto sin relación, para que el diagrama delate visualmente el hueco.
5. `camerino` y `poliza_salud` no tienen correlato en la matriz de requisitos del proyecto — podés anotarlos como "fuera de alcance documentado" si el formato lo permite.
