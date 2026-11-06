-- Genera docs/bd/diccionario.md desde el catálogo de PostgreSQL (esquema public).
-- No editar el .md a mano: regenerarlo después de cada migración.
--   docker exec -i rc_t2_baseline psql -U postgres -d qa_baseline -tA -q < docs/bd/genera_diccionario.sql > docs/bd/diccionario.md
-- Comprobación: cambiar la última línea por "select md5(doc) from documento;" y correrlo en Supabase
-- (execute_sql) y en local: los dos md5 deben ser iguales.
-- Los CHECK de lista (col = ANY (ARRAY[...])) se muestran como "col ∈ {valores}", porque Postgres
-- reescribe su texto al recargar el DDL y así el documento no depende de esa diferencia.
with
t as (
  select c.oid, c.relname, obj_description(c.oid, 'pg_class') com, c.relrowsecurity rls,
         (select count(*) from pg_policy p where p.polrelid = c.oid) politicas
  from pg_class c where c.relnamespace = 'public'::regnamespace and c.relkind = 'r'),
clave as (
  select co.conrelid, k.attnum,
    string_agg(case co.contype
        when 'p' then 'PK' || case when cardinality(co.conkey) > 1 then ' (compuesta)' else '' end
        when 'u' then 'UK' || case when cardinality(co.conkey) > 1 then ' (compuesta)' else '' end
        else 'FK → ' || cf.relname || '.' || af.attname end,
      ', ' order by case co.contype when 'p' then 1 when 'u' then 2 else 3 end, co.conname) clave
  from pg_constraint co
  cross join lateral unnest(co.conkey) with ordinality k(attnum, i)
  left join pg_class cf on cf.oid = co.confrelid
  left join pg_attribute af on af.attrelid = co.confrelid and af.attnum = co.confkey[k.i]
  where co.connamespace = 'public'::regnamespace and co.contype in ('p', 'u', 'f')
  group by co.conrelid, k.attnum),
filas as (
  select a.attrelid, string_agg(format('| %s | %s | %s | %s | %s | %s |',
      a.attname, format_type(a.atttypid, a.atttypmod),
      case when a.attnotnull then 'no' else 'sí' end,
      replace(coalesce(case when a.attgenerated = 's' then 'calculada: ' else '' end || pg_get_expr(d.adbin, d.adrelid), ''), '|', '\|'),
      coalesce(k.clave, ''),
      replace(coalesce(col_description(a.attrelid, a.attnum), ''), '|', '\|')),
    E'\n' order by a.attnum) txt
  from pg_attribute a join t on t.oid = a.attrelid
  left join pg_attrdef d on d.adrelid = a.attrelid and d.adnum = a.attnum
  left join clave k on k.conrelid = a.attrelid and k.attnum = a.attnum
  where a.attnum > 0 and not a.attisdropped
  group by a.attrelid),
chk as (
  select co.conrelid, string_agg(
      case when pg_get_constraintdef(co.oid) like '%ANY%'
        then format('- `%s`: `%s` ∈ {%s}%s', co.conname, a.attname,
               (select string_agg(m[1], ', ') from regexp_matches(pg_get_constraintdef(co.oid), '''([^'']*)''', 'g') m),
               case when pg_get_constraintdef(co.oid) like '%IS NULL%' then ' o NULL' else '' end)
        else format('- `%s`: `%s`', co.conname, pg_get_constraintdef(co.oid)) end,
      E'\n' order by co.conname) txt
  from pg_constraint co left join pg_attribute a on a.attrelid = co.conrelid and a.attnum = co.conkey[1]
  where co.connamespace = 'public'::regnamespace and co.contype = 'c'
  group by co.conrelid),
ix as (
  select i.indrelid, string_agg(format('- `%s` %s%s', ic.relname,
      regexp_replace(pg_get_indexdef(i.indexrelid), '^.* USING \w+ ', ''),
      case when i.indisunique then ' — único' else '' end), E'\n' order by ic.relname) txt
  from pg_index i join pg_class ic on ic.oid = i.indexrelid join t on t.oid = i.indrelid
  where not exists (select 1 from pg_constraint co where co.conindid = i.indexrelid)
  group by i.indrelid),
tg as (
  select tr.tgrelid, string_agg(format('- `%s`: %s', tr.tgname,
      regexp_replace(pg_get_triggerdef(tr.oid), '^CREATE TRIGGER \S+ ', '')), E'\n' order by tr.tgname) txt
  from pg_trigger tr join t on t.oid = tr.tgrelid where not tr.tgisinternal
  group by tr.tgrelid),
ref as (
  select co.confrelid, string_agg(format('`%s.%s` (ON DELETE %s)', c.relname, a.attname,
      case co.confdeltype when 'a' then 'NO ACTION' when 'r' then 'RESTRICT' when 'c' then 'CASCADE' when 'n' then 'SET NULL' else 'SET DEFAULT' end),
    ', ' order by c.relname, a.attname) txt
  from pg_constraint co join pg_class c on c.oid = co.conrelid
  join pg_attribute a on a.attrelid = co.conrelid and a.attnum = co.conkey[1]
  where co.connamespace = 'public'::regnamespace and co.contype = 'f'
  group by co.confrelid),
tablas as (
  select string_agg(format(E'### %s\n\n%s\n\nRLS: %s.\n\n| Columna | Tipo | Nulo | Por defecto | Clave | Descripción |\n|---|---|---|---|---|---|\n%s%s%s%s%s',
      t.relname, coalesce(t.com, '_Sin comentario._'),
      case when not t.rls then 'inactivo' when t.politicas = 0 then 'activo, sin políticas' else 'activo, ' || t.politicas || ' políticas' end,
      f.txt,
      coalesce(E'\n\nRestricciones CHECK:\n\n' || chk.txt, ''),
      coalesce(E'\n\nÍndices (además de los de PK y UK):\n\n' || ix.txt, ''),
      coalesce(E'\n\nTriggers:\n\n' || tg.txt, ''),
      coalesce(E'\n\nReferenciada por: ' || ref.txt || '.', '')),
    E'\n\n' order by t.relname) txt
  from t join filas f on f.attrelid = t.oid
  left join chk on chk.conrelid = t.oid left join ix on ix.indrelid = t.oid
  left join tg on tg.tgrelid = t.oid left join ref on ref.confrelid = t.oid),
vistas as (
  select count(*) n, string_agg(format(E'### %s\n\n%s\n\nOpciones: %s.\n\nColumnas: %s.',
      c.relname, coalesce(obj_description(c.oid, 'pg_class'), '_Sin comentario._'),
      coalesce(array_to_string(c.reloptions, ', '), 'ninguna'),
      (select string_agg(format('`%s` %s', a.attname, format_type(a.atttypid, a.atttypmod)), ', ' order by a.attnum)
         from pg_attribute a where a.attrelid = c.oid and a.attnum > 0)),
    E'\n\n' order by c.relname) txt
  from pg_class c where c.relnamespace = 'public'::regnamespace and c.relkind = 'v'),
funciones as (
  select count(*) n, string_agg(format('- `%s(%s)` → `%s` · %s%s · search_path: %s',
      p.proname, pg_get_function_identity_arguments(p.oid), pg_get_function_result(p.oid), l.lanname,
      case when p.prosecdef then ' · SECURITY DEFINER' else '' end,
      coalesce(array_to_string(p.proconfig, ', '), 'sin fijar')), E'\n' order by p.proname) txt
  from pg_proc p join pg_language l on l.oid = p.prolang
  where p.pronamespace = 'public'::regnamespace and not exists (select 1 from pg_depend d where d.objid = p.oid and d.deptype = 'e')),
documento as (
  select format(E'# Diccionario de datos — Ruta Contable\n\nGenerado desde el catálogo de PostgreSQL con `docs/bd/genera_diccionario.sql`. No se edita a mano: se regenera después de cada migración. Esquema `public`: %s tablas, %s vistas y %s funciones.\n\nReglas de nombres, equivalencias y hallazgos por tabla (filas reales, uso en código): `docs/bd/bd-estandar.md`. Diagrama entidad-relación: `docs/bd/er.md`. Historial de cambios: `docs/bd/CAMBIOS.md`.\n\nConvenciones: **Nulo** = ¿admite NULL? · **Clave**: PK primaria, UK única, FK → tabla.columna referida.\n\nTablas: %s.\n\n## Tablas\n\n%s\n\n## Vistas\n\n%s\n\n## Funciones\n\n%s\n',
    (select count(*) from t), v.n, fn.n,
    (select string_agg(format('[%s](#%s)', relname, relname), ', ' order by relname) from t),
    tb.txt, v.txt, fn.txt) doc
  from tablas tb, vistas v, funciones fn)
select doc from documento;
