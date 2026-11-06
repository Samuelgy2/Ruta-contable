-- L2b paso 1a. Corrige el ERROR 0013 (rls_disabled_in_public) del advisor de Supabase.
-- Antes de esta migración la clave anon leía estas tablas por la Data API
-- (comprobado el 5 nov: 5 filas de movimiento_inventario, 5 de tipo_cartera y 2 de alerta_sistema).
-- Sin políticas: la API REST (anon / authenticated) no ve ni modifica nada.
-- El backend no se entera: el pool usa el rol postgres, que tiene BYPASSRLS.

BEGIN;

ALTER TABLE public.socio_documento       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movimiento_inventario ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tipo_cartera          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pago_factura          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerta_sistema        ENABLE ROW LEVEL SECURITY;

COMMIT;
