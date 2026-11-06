-- Rollback de 20261029_rls_jersey_vista.up.sql. Vuelve a exponer la tabla y la
-- vista por la API REST de Supabase: sólo para deshacer un despliegue.

BEGIN;

ALTER TABLE public.jersey_campana DISABLE ROW LEVEL SECURITY;
ALTER VIEW public.vista_usuarios_sin_socio SET (security_invoker = false);

COMMIT;
