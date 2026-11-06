-- Rollback de 20261105_vista_estado_resultados_invoker.up.sql. Deja la vista sin la
-- opción (estado previo) y vuelve a exponer sus datos a la API REST: solo para deshacer un despliegue.

BEGIN;

ALTER VIEW public.v_estado_resultados RESET (security_invoker);

COMMIT;
