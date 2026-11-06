-- Rollback de 20261106_comentarios_tablas.up.sql: quita los 14 comentarios de tabla.

BEGIN;

COMMENT ON TABLE public.alerta_sistema IS NULL;
COMMENT ON TABLE public.auditoria IS NULL;
COMMENT ON TABLE public.categoria_producto IS NULL;
COMMENT ON TABLE public.detalle_compra IS NULL;
COMMENT ON TABLE public.jersey_campana IS NULL;
COMMENT ON TABLE public.landing_borrador IS NULL;
COMMENT ON TABLE public.landing_imagen IS NULL;
COMMENT ON TABLE public.landing_version IS NULL;
COMMENT ON TABLE public.movimiento_inventario IS NULL;
COMMENT ON TABLE public.pago_factura IS NULL;
COMMENT ON TABLE public.products IS NULL;
COMMENT ON TABLE public.socio_documento IS NULL;
COMMENT ON TABLE public.tipo_cartera IS NULL;
COMMENT ON TABLE public.transactions IS NULL;

COMMIT;
