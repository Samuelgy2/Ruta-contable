-- L2b paso 1b. Corrige el ERROR 0010 (security_definer_view) del advisor de Supabase.
-- Sin security_invoker la vista corría con los permisos de su dueño (postgres, que no
-- está sujeto a RLS), así que la clave anon veía los totales de transactions por la Data API.
-- Con security_invoker aplica el RLS de quien consulta. Las otras 7 vistas ya lo tenían.
-- Ningún código del backend usa esta vista (grep v_estado_resultados en backend/: sin resultados).

BEGIN;

ALTER VIEW public.v_estado_resultados SET (security_invoker = true);

COMMIT;
