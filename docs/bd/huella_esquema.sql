-- Huella del esquema public: un md5 por sección.
-- Uso: correrlo igual en Supabase (execute_sql) y en una base donde se cargó
-- backend/migrations/0000_baseline.sql; las 10 filas deben coincidir.
-- También sirve en L2b: tras cada migración, solo deben cambiar las secciones que esa migración toca.
-- Normalizaciones (no cambian el significado):
--   * orden con COLLATE "C" para no depender del locale;
--   * CHECK: se quitan casts ::character varying/::text/::text[], paréntesis y espacios,
--     porque Postgres reescribe ANY((ARRAY[...])::text[]) al recargar el DDL;
--   * comentarios de columna se identifican por nombre, no por attnum (hay columnas borradas en vivo);
--   * cuerpos de función sin comentarios ni espacios.
with
cols as (select string_agg(x, '|' order by x collate "C") s from (
  select c.relname||'.'||a.attname||':'||format_type(a.atttypid,a.atttypmod)||':'||coalesce(pg_get_expr(d.adbin,d.adrelid),'')||':'||a.attnotnull||':'||a.attgenerated::text x
  from pg_class c join pg_namespace n on n.oid=c.relnamespace join pg_attribute a on a.attrelid=c.oid and a.attnum>0 and not a.attisdropped
  left join pg_attrdef d on d.adrelid=c.oid and d.adnum=a.attnum where n.nspname='public' and c.relkind='r') t),
cons as (select string_agg(x, '|' order by x collate "C") s from (
  select c.relname||'.'||co.conname||':'||regexp_replace(pg_get_constraintdef(co.oid), '::(character varying|text\[\]|text)|[()[:space:]]', '', 'g') x
  from pg_constraint co join pg_class c on c.oid=co.conrelid join pg_namespace n on n.oid=c.relnamespace where n.nspname='public') t),
idx as (select string_agg(x, '|' order by x collate "C") s from (
  select pg_get_indexdef(i.indexrelid) x from pg_index i join pg_class c on c.oid=i.indrelid join pg_namespace n on n.oid=c.relnamespace where n.nspname='public') t),
vis as (select string_agg(x, '|' order by x collate "C") s from (
  select c.relname||':'||coalesce(array_to_string(c.reloptions,','),'')||':'||pg_get_viewdef(c.oid,true) x
  from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='v') t),
fun as (select string_agg(x, '|' order by x collate "C") s from (
  select p.proname||'('||pg_get_function_identity_arguments(p.oid)||'):'||pg_get_function_result(p.oid)||':'||l.lanname||':'||p.prosecdef||':'||p.provolatile::text||':'||coalesce(array_to_string(p.proconfig,','),'')||':'||md5(regexp_replace(regexp_replace(p.prosrc,'--[^\n]*','','g'),'\s+','','g')) x
  from pg_proc p join pg_namespace n on n.oid=p.pronamespace join pg_language l on l.oid=p.prolang
  where n.nspname='public' and not exists (select 1 from pg_depend d where d.objid=p.oid and d.deptype='e')) t),
trg as (select string_agg(x, '|' order by x collate "C") s from (
  select pg_get_triggerdef(t.oid) x from pg_trigger t join pg_class c on c.oid=t.tgrelid join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and not t.tgisinternal) t),
rls as (select string_agg(x, '|' order by x collate "C") s from (
  select c.relname||':'||c.relrowsecurity||':'||c.relforcerowsecurity x from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='r') t),
com as (select string_agg(x, '|' order by x collate "C") s from (
  select c.relname||'.'||coalesce(a.attname,'')||':'||d.description x from pg_description d join pg_class c on c.oid=d.objoid and d.classoid='pg_class'::regclass
  join pg_namespace n on n.oid=c.relnamespace left join pg_attribute a on a.attrelid=c.oid and a.attnum=d.objsubid and d.objsubid>0 where n.nspname='public') t),
seq as (select string_agg(x, '|' order by x collate "C") s from (
  select sequencename||':'||data_type||':'||start_value||':'||increment_by||':'||min_value||':'||max_value||':'||cache_size||':'||cycle x from pg_sequences where schemaname='public') t),
acl as (select string_agg(x, '|' order by x collate "C") s from (
  select p.proname||':anon='||has_function_privilege('anon',p.oid,'EXECUTE')||':auth='||has_function_privilege('authenticated',p.oid,'EXECUTE') x
  from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and not exists (select 1 from pg_depend d where d.objid=p.oid and d.deptype='e')) t)
select 'columnas' seccion, md5(s) huella from cols union all select 'constraints', md5(s) from cons union all select 'indices', md5(s) from idx
union all select 'vistas', md5(s) from vis union all select 'funciones', md5(s) from fun union all select 'triggers', md5(s) from trg
union all select 'rls', md5(s) from rls union all select 'comentarios', md5(s) from com union all select 'secuencias', md5(s) from seq
union all select 'permisos_funciones', md5(s) from acl;
