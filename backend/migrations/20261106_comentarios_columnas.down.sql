-- Rollback de 20261106_comentarios_columnas.up.sql: quita los comentarios de columna que agregó.

BEGIN;

COMMENT ON COLUMN public.users.password IS NULL;
COMMENT ON COLUMN public.users.failed_attempts IS NULL;
COMMENT ON COLUMN public.users.locked_until IS NULL;
COMMENT ON COLUMN public.compra.categoria_id IS NULL;
COMMENT ON COLUMN public.transactions.categoria_id IS NULL;
COMMENT ON COLUMN public.products.categoria_id IS NULL;
COMMENT ON COLUMN public.pagos_pasarela.transaction_id IS NULL;
COMMENT ON COLUMN public.pagos_pasarela.user_id IS NULL;
COMMENT ON COLUMN public.auditoria.usuario_id IS NULL;
COMMENT ON COLUMN public.admin_perfil.creado_por IS NULL;
COMMENT ON COLUMN public.asistencia.registrado_by IS NULL;
COMMENT ON COLUMN public.inventario_jersey.recibido_by IS NULL;
COMMENT ON COLUMN public.meses_periodo.cerrado_by IS NULL;
COMMENT ON COLUMN public.landing_version.publicado_by IS NULL;
COMMENT ON COLUMN public.landing_borrador.updated_by IS NULL;
COMMENT ON COLUMN public.compra.approved_by IS NULL;
COMMENT ON COLUMN public.compra.approved_at IS NULL;
COMMENT ON COLUMN public.compra.factura IS NULL;
COMMENT ON COLUMN public.factura.nro_factura IS NULL;
COMMENT ON COLUMN public.factura.numero_factura IS NULL;
COMMENT ON COLUMN public.factura.fecha_emision IS NULL;
COMMENT ON COLUMN public.pago_factura.fecha_pago IS NULL;
COMMENT ON COLUMN public.pago_factura.registrado_by IS NULL;
COMMENT ON COLUMN public.movimiento_inventario.registrado_by IS NULL;
COMMENT ON COLUMN public.cartera.forma_pago IS NULL;
COMMENT ON COLUMN public.pago_mensual.dias_mora IS NULL;
COMMENT ON COLUMN public.cartera.id_pago_mensual IS NULL;
COMMENT ON COLUMN public.detalle_compra.valor_total IS NULL;
COMMENT ON COLUMN public.detalle_factura.valor_total IS NULL;
COMMENT ON COLUMN public.transactions.referencia IS NULL;
COMMENT ON COLUMN public.system_data.id IS NULL;
COMMENT ON COLUMN public.landing_borrador.id IS NULL;

COMMIT;
