-- L2b paso 4a. Comentario en las 14 tablas de public que no tenían (regla N13 de docs/bd/bd-estandar.md).
-- proveedores no se comenta: la elimina 20261105_proveedores_fase2_eliminar.
-- "Sin uso en el backend": grep del nombre en backend/ y frontend/src/ sin resultados al 6 nov 2026.

BEGIN;

COMMENT ON TABLE public.alerta_sistema IS 'Alertas internas del sistema: tipo, mensaje, detalle JSON y marca de leída. Sin uso en el backend al 6 nov 2026.';
COMMENT ON TABLE public.auditoria IS 'Registro de acciones de usuarios: acción, entidad, detalle JSON e IP. Al 6 nov 2026 solo la escribe el módulo de landing.';
COMMENT ON TABLE public.categoria_producto IS 'Categorías de los productos del inventario (products.categoria_id).';
COMMENT ON TABLE public.detalle_compra IS 'Líneas de una compra: concepto, cantidad, valor unitario y producto opcional. valor_total es una columna calculada.';
COMMENT ON TABLE public.jersey_campana IS 'Campañas de pedido de jersey: título, tallas disponibles, valor y rango de fechas. Los socios piden dentro de una campaña (pedido_jersey.id_campana).';
COMMENT ON TABLE public.landing_borrador IS 'Borrador del contenido editable de la landing page. Tabla de una sola fila (id = 1).';
COMMENT ON TABLE public.landing_imagen IS 'Imágenes subidas para la landing page, guardadas en bytea: jpeg, png o webp, máximo 2 MiB, con texto alternativo obligatorio.';
COMMENT ON TABLE public.landing_version IS 'Versiones publicadas del contenido de la landing page, numeradas desde 1.';
COMMENT ON TABLE public.movimiento_inventario IS 'Movimientos de stock de productos (entrada, salida o ajuste) con stock anterior y nuevo. Sin uso en el backend al 6 nov 2026.';
COMMENT ON TABLE public.pago_factura IS 'Pagos aplicados a una factura. Sin uso en el backend al 6 nov 2026.';
COMMENT ON TABLE public.products IS 'Productos del inventario: código único, nombre, precio, stock y categoría.';
COMMENT ON TABLE public.socio_documento IS 'Archivos de documentos de un socio guardados en bytea, máximo 5 MiB. Datos personales: RLS activo y sin políticas. Sin uso en el backend al 6 nov 2026.';
COMMENT ON TABLE public.tipo_cartera IS 'Catálogo de tipos de cartera, referido por cartera.id_tipo_cartera. Sin uso en el backend al 6 nov 2026.';
COMMENT ON TABLE public.transactions IS 'Asientos contables: ingresos y gastos con estado pendiente, confirmada o anulada. Los pagos de mensualidades, de cartera y de la pasarela generan aquí su asiento.';

COMMIT;
