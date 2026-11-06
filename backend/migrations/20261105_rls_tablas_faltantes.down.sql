-- Rollback de 20261105_rls_tablas_faltantes.up.sql. Vuelve a exponer las 5 tablas
-- por la API REST de Supabase: solo para deshacer un despliegue.

BEGIN;

ALTER TABLE public.socio_documento       DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.movimiento_inventario DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.tipo_cartera          DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.pago_factura          DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerta_sistema        DISABLE ROW LEVEL SECURITY;

COMMIT;
