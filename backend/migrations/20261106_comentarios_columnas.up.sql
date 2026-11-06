-- L2b paso 4b. Comentarios en columnas no obvias (regla N13 de docs/bd/bd-estandar.md):
-- FK con nombre atípico, columnas duplicadas, columnas calculadas o que llena un trigger, tablas de una fila.
-- No toca los comentarios que ya existían (compra.proveedor_nombre, factura.proveedor_nombre,
-- pagos_pasarela.estado, pagos_pasarela.estado_proveedor).

BEGIN;

-- users
COMMENT ON COLUMN public.users.password IS 'Hash bcrypt de la contraseña; nunca se guarda en claro.';
COMMENT ON COLUMN public.users.failed_attempts IS 'Intentos de inicio de sesión fallidos consecutivos; vuelve a 0 al entrar con éxito.';
COMMENT ON COLUMN public.users.locked_until IS 'Hasta cuándo la cuenta queda bloqueada por intentos fallidos; NULL = sin bloqueo.';

-- FK con nombre atípico
COMMENT ON COLUMN public.compra.categoria_id IS 'FK a categories.id: categoría financiera de la compra.';
COMMENT ON COLUMN public.transactions.categoria_id IS 'FK a categories.id: categoría financiera del asiento.';
COMMENT ON COLUMN public.products.categoria_id IS 'FK a categoria_producto.id.';
COMMENT ON COLUMN public.pagos_pasarela.transaction_id IS 'FK a transactions.id: asiento contable generado cuando el pago queda APPROVED.';
COMMENT ON COLUMN public.pagos_pasarela.user_id IS 'FK a users.id: usuario del portal que inició el pago. Si id_socio llega vacío, el trigger tr_pagos_pasarela_resolver_socio lo toma de socio_perfil.';
COMMENT ON COLUMN public.auditoria.usuario_id IS 'FK a users.id: usuario que hizo la acción.';
COMMENT ON COLUMN public.admin_perfil.creado_por IS 'FK a users.id: usuario que creó el perfil de administrador.';
COMMENT ON COLUMN public.asistencia.registrado_by IS 'FK a users.id: usuario que registró la asistencia.';
COMMENT ON COLUMN public.inventario_jersey.recibido_by IS 'FK a users.id: usuario que registró la entrega de la unidad.';
COMMENT ON COLUMN public.meses_periodo.cerrado_by IS 'FK a users.id: usuario que cerró el periodo; NULL cuando lo cerró el proceso automático.';
COMMENT ON COLUMN public.landing_version.publicado_by IS 'FK a users.id: usuario que publicó la versión.';
COMMENT ON COLUMN public.landing_borrador.updated_by IS 'FK a users.id: último usuario que guardó el borrador.';
COMMENT ON COLUMN public.compra.approved_by IS 'FK a users.id: usuario que aprobó la compra (estado aprobada).';
COMMENT ON COLUMN public.compra.approved_at IS 'Fecha y hora de la aprobación de la compra.';

-- Columnas duplicadas o que se confunden
COMMENT ON COLUMN public.compra.factura IS 'Número de la factura del proveedor, como texto. No es FK a la tabla factura.';
COMMENT ON COLUMN public.factura.nro_factura IS 'Mismo propósito que numero_factura (columnas duplicadas). Ninguna de las dos se usa en el backend al 6 nov 2026.';
COMMENT ON COLUMN public.factura.numero_factura IS 'Mismo propósito que nro_factura (columnas duplicadas). Ninguna de las dos se usa en el backend al 6 nov 2026.';
COMMENT ON COLUMN public.factura.fecha_emision IS 'Mismo propósito que fecha (columnas duplicadas).';
COMMENT ON COLUMN public.pago_factura.fecha_pago IS 'Mismo propósito que fecha (columnas duplicadas).';
COMMENT ON COLUMN public.pago_factura.registrado_by IS 'FK a users.id. Mismo propósito que created_by (columnas duplicadas).';
COMMENT ON COLUMN public.movimiento_inventario.registrado_by IS 'FK a users.id. Mismo propósito que created_by (columnas duplicadas).';
COMMENT ON COLUMN public.cartera.forma_pago IS 'Forma de pago. Sin uso en el backend al 6 nov 2026; las demás tablas usan metodo_pago.';

-- Calculadas o llenadas por triggers
COMMENT ON COLUMN public.pago_mensual.dias_mora IS 'Días de atraso respecto a fecha_vencimiento; lo calcula el trigger tr_actualizar_mora.';
COMMENT ON COLUMN public.cartera.id_pago_mensual IS 'Mensualidad que originó el recargo por mora; lo inserta el trigger tr_generar_recargo_mora.';
COMMENT ON COLUMN public.detalle_compra.valor_total IS 'Columna calculada: cantidad * valor_unitario.';
COMMENT ON COLUMN public.detalle_factura.valor_total IS 'Columna calculada: cantidad * valor_unitario. No aplica iva ni descuento.';
COMMENT ON COLUMN public.transactions.referencia IS 'Referencia externa del pago; única cuando no es NULL (índice idx_transactions_referencia).';

-- Tablas de una sola fila
COMMENT ON COLUMN public.system_data.id IS 'Siempre 1: tabla de una sola fila.';
COMMENT ON COLUMN public.landing_borrador.id IS 'Siempre 1: tabla de una sola fila.';

COMMIT;
