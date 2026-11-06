-- L2b paso 6. Renombra 15 índices para cumplir la regla N8 de docs/bd/bd-estandar.md:
-- idx_<tabla>_<columna1>[_<columna2>], con nombres completos de tabla y columna.
-- Solo cambia el nombre; la definición no se toca. El backend no menciona ninguno de estos nombres
-- (grep idx_ en backend/: solo idx_socio_documento e idx_socio_nombre en server.js, que no se tocan).

BEGIN;

ALTER INDEX public.idx_movimiento_inv_producto    RENAME TO idx_movimiento_inventario_id_producto;
ALTER INDEX public.idx_poliza_vencimiento         RENAME TO idx_poliza_salud_fecha_vencimiento;
ALTER INDEX public.idx_cartera_socio              RENAME TO idx_cartera_id_socio;
ALTER INDEX public.idx_pago_factura_factura       RENAME TO idx_pago_factura_id_factura;
ALTER INDEX public.idx_pago_mensual_periodo       RENAME TO idx_pago_mensual_id_periodo;
ALTER INDEX public.idx_pagos_pasarela_orden       RENAME TO idx_pagos_pasarela_orden_id;
ALTER INDEX public.idx_pagos_pasarela_socio       RENAME TO idx_pagos_pasarela_id_socio;
ALTER INDEX public.idx_pagos_pasarela_user        RENAME TO idx_pagos_pasarela_user_id;
ALTER INDEX public.idx_pedido_jersey_campana      RENAME TO idx_pedido_jersey_id_campana;
ALTER INDEX public.idx_pedido_jersey_socio        RENAME TO idx_pedido_jersey_id_socio;
ALTER INDEX public.idx_detalle_transaccion_socio  RENAME TO idx_detalle_transaccion_id_socio;
ALTER INDEX public.idx_socio_documento_socio      RENAME TO idx_socio_documento_id_socio;
ALTER INDEX public.idx_auditoria_entidad          RENAME TO idx_auditoria_entidad_created_at;
ALTER INDEX public.idx_jersey_campana_activa      RENAME TO idx_jersey_campana_activa_fecha_fin;
ALTER INDEX public.idx_pago_mensual_estado_fecha  RENAME TO idx_pago_mensual_estado_fecha_vencimiento;

COMMIT;
