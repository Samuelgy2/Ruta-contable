-- Rollback de 20261121_registro_socio.up.sql.
-- Los socios en estado 'pendiente' pasan a 'inactivo' para que el CHECK
-- anterior vuelva a cumplirse.

BEGIN;

DROP TABLE public.registro_pendiente;

UPDATE public.socio SET estado = 'inactivo' WHERE estado = 'pendiente';
ALTER TABLE public.socio DROP CONSTRAINT socio_estado_check;
ALTER TABLE public.socio ADD CONSTRAINT socio_estado_check
  CHECK (estado IN ('activo', 'inactivo', 'suspendido'));
COMMENT ON COLUMN public.socio.estado IS NULL;

COMMIT;
