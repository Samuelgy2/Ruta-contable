-- Rollback de 20261105_search_path_fn_sync_unidades_jersey.up.sql. Deja la función sin
-- search_path fijo (estado previo): solo para deshacer un despliegue.

BEGIN;

ALTER FUNCTION public.fn_sync_unidades_jersey() RESET search_path;

COMMIT;
