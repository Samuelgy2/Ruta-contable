-- L2b paso 5. Índice para las 17 FK que el advisor de rendimiento marca sin índice
-- (0001 unindexed_foreign_keys, 5 nov). Nombre según la regla N8: idx_<tabla>_<columna>.
-- Tablas pequeñas (0 a 18 filas): CREATE INDEX normal, sin CONCURRENTLY.

BEGIN;

CREATE INDEX idx_admin_perfil_creado_por              ON public.admin_perfil (creado_por);
CREATE INDEX idx_auditoria_usuario_id                 ON public.auditoria (usuario_id);
CREATE INDEX idx_cartera_id_tipo_cartera              ON public.cartera (id_tipo_cartera);
CREATE INDEX idx_detalle_compra_id_producto           ON public.detalle_compra (id_producto);
CREATE INDEX idx_factura_id_socio                     ON public.factura (id_socio);
CREATE INDEX idx_jersey_campana_created_by            ON public.jersey_campana (created_by);
CREATE INDEX idx_landing_borrador_updated_by          ON public.landing_borrador (updated_by);
CREATE INDEX idx_landing_imagen_created_by            ON public.landing_imagen (created_by);
CREATE INDEX idx_landing_version_publicado_by         ON public.landing_version (publicado_by);
CREATE INDEX idx_movimiento_inventario_created_by     ON public.movimiento_inventario (created_by);
CREATE INDEX idx_movimiento_inventario_id_compra      ON public.movimiento_inventario (id_compra);
CREATE INDEX idx_movimiento_inventario_registrado_by  ON public.movimiento_inventario (registrado_by);
CREATE INDEX idx_pago_factura_created_by              ON public.pago_factura (created_by);
CREATE INDEX idx_pago_factura_id_transaccion          ON public.pago_factura (id_transaccion);
CREATE INDEX idx_pago_factura_registrado_by           ON public.pago_factura (registrado_by);
CREATE INDEX idx_pagos_pasarela_transaction_id        ON public.pagos_pasarela (transaction_id);
CREATE INDEX idx_socio_documento_created_by           ON public.socio_documento (created_by);

COMMIT;
