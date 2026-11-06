-- Corrige dos errores del linter de Supabase (0010 y 0013). El backend no se
-- entera: el pool usa un rol con BYPASSRLS. Esto cierra el acceso por la API
-- REST de Supabase (roles anon / authenticated).

BEGIN;

-- La vista aplica los permisos y el RLS de quien consulta, no los de su creador.
ALTER VIEW public.vista_usuarios_sin_socio SET (security_invoker = true);

-- Sin políticas: la API REST no ve ni modifica nada.
ALTER TABLE public.jersey_campana ENABLE ROW LEVEL SECURITY;

COMMIT;
