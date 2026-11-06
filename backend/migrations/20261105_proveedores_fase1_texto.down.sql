-- Rollback de la FASE 1. Solo sirve si la fase 2 NO se aplicó (o ya se revirtió
-- con 20261105_proveedores_fase2_eliminar.down.sql): borra el texto libre.

BEGIN;

ALTER TABLE public.compra  DROP COLUMN IF EXISTS proveedor_nombre;
ALTER TABLE public.factura DROP COLUMN IF EXISTS proveedor_nombre;

COMMIT;
