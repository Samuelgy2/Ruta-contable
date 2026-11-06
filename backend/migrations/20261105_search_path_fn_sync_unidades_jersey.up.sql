-- L2b paso 1c. Corrige el WARN 0011 (function_search_path_mutable) del advisor de Supabase.
-- fn_sync_unidades_jersey (trigger trg_pedido_jersey_unidades de pedido_jersey) era la única
-- función de public sin search_path fijo; las demás usan SET search_path TO 'public'.
-- El cuerpo usa inventario_jersey sin esquema, así que se fija a public y el comportamiento no cambia.

BEGIN;

ALTER FUNCTION public.fn_sync_unidades_jersey() SET search_path TO 'public';

COMMIT;
