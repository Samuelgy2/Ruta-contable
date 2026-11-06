-- Rollback de 20261106_renombrar_indices.up.sql: devuelve los 15 índices a su nombre anterior.

BEGIN;

ALTER INDEX public.idx_movimiento_inventario_id_producto RENAME TO idx_movimiento_inv_producto;
ALTER INDEX public.idx_poliza_salud_fecha_vencimiento RENAME TO idx_poliza_vencimiento;
ALTER INDEX public.idx_cartera_id_socio RENAME TO idx_cartera_socio;
ALTER INDEX public.idx_pago_factura_id_factura RENAME TO idx_pago_factura_factura;
ALTER INDEX public.idx_pago_mensual_id_periodo RENAME TO idx_pago_mensual_periodo;
ALTER INDEX public.idx_pagos_pasarela_orden_id RENAME TO idx_pagos_pasarela_orden;
ALTER INDEX public.idx_pagos_pasarela_id_socio RENAME TO idx_pagos_pasarela_socio;
ALTER INDEX public.idx_pagos_pasarela_user_id RENAME TO idx_pagos_pasarela_user;
ALTER INDEX public.idx_pedido_jersey_id_campana RENAME TO idx_pedido_jersey_campana;
ALTER INDEX public.idx_pedido_jersey_id_socio RENAME TO idx_pedido_jersey_socio;
ALTER INDEX public.idx_detalle_transaccion_id_socio RENAME TO idx_detalle_transaccion_socio;
ALTER INDEX public.idx_socio_documento_id_socio RENAME TO idx_socio_documento_socio;
ALTER INDEX public.idx_auditoria_entidad_created_at RENAME TO idx_auditoria_entidad;
ALTER INDEX public.idx_jersey_campana_activa_fecha_fin RENAME TO idx_jersey_campana_activa;
ALTER INDEX public.idx_pago_mensual_estado_fecha_vencimiento RENAME TO idx_pago_mensual_estado_fecha;

COMMIT;
