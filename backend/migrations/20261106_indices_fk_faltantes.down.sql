-- Rollback de 20261106_indices_fk_faltantes.up.sql: quita solo los 17 índices que creó.

BEGIN;

DROP INDEX public.idx_admin_perfil_creado_por;
DROP INDEX public.idx_auditoria_usuario_id;
DROP INDEX public.idx_cartera_id_tipo_cartera;
DROP INDEX public.idx_detalle_compra_id_producto;
DROP INDEX public.idx_factura_id_socio;
DROP INDEX public.idx_jersey_campana_created_by;
DROP INDEX public.idx_landing_borrador_updated_by;
DROP INDEX public.idx_landing_imagen_created_by;
DROP INDEX public.idx_landing_version_publicado_by;
DROP INDEX public.idx_movimiento_inventario_created_by;
DROP INDEX public.idx_movimiento_inventario_id_compra;
DROP INDEX public.idx_movimiento_inventario_registrado_by;
DROP INDEX public.idx_pago_factura_created_by;
DROP INDEX public.idx_pago_factura_id_transaccion;
DROP INDEX public.idx_pago_factura_registrado_by;
DROP INDEX public.idx_pagos_pasarela_transaction_id;
DROP INDEX public.idx_socio_documento_created_by;

COMMIT;
