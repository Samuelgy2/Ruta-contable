-- Genera docs/bd/er.md (diagrama entidad-relación en Mermaid) desde el catálogo de PostgreSQL.
-- No editar el .md a mano: regenerarlo después de cada migración.
--   docker exec -i rc_t2_baseline psql -U postgres -d qa_baseline -tA -q < docs/bd/genera_er.sql > docs/bd/er.md
-- Comprobación: cambiar la última línea por "select md5(doc) from documento;" y comparar con Supabase.
-- Tipos simplificados para Mermaid (sin largo ni precisión). Cardinalidad: lado padre || si la FK es NOT NULL
-- y |o si admite NULL; lado hijo o| si la columna FK es única (uno a uno) y o{ si no.
with
t as (select c.oid, c.relname from pg_class c where c.relnamespace = 'public'::regnamespace and c.relkind = 'r'),
marca as (
  select co.conrelid, k.attnum,
    string_agg(distinct case co.contype when 'p' then 'PK' when 'f' then 'FK' else 'UK' end, ', ') m
  from pg_constraint co cross join lateral unnest(co.conkey) k(attnum)
  where co.connamespace = 'public'::regnamespace and co.contype in ('p', 'f', 'u')
    and (co.contype <> 'u' or cardinality(co.conkey) = 1)
  group by co.conrelid, k.attnum),
entidades as (
  select string_agg(format(E'  %s {\n%s\n  }', t.relname,
      (select string_agg(format('    %s %s%s',
          regexp_replace(replace(replace(format_type(a.atttypid, a.atttypmod), 'character varying', 'varchar'),
                                 'timestamp without time zone', 'timestamp'), '\(.*\)', ''),
          a.attname, coalesce(' ' || replace(mk.m, 'FK, PK', 'PK, FK'), '')), E'\n' order by a.attnum)
       from pg_attribute a left join marca mk on mk.conrelid = a.attrelid and mk.attnum = a.attnum
       where a.attrelid = t.oid and a.attnum > 0 and not a.attisdropped)),
    E'\n' order by t.relname) txt
  from t),
relaciones as (
  select count(*) n, string_agg(format('  %s %s--%s %s : "%s"', p.relname,
      case when a.attnotnull then '||' else '|o' end,
      case when exists (select 1 from pg_constraint u where u.conrelid = co.conrelid and u.contype in ('p', 'u') and u.conkey = co.conkey)
           then 'o|' else 'o{' end,
      h.relname, a.attname), E'\n' order by p.relname, h.relname, a.attname) txt
  from pg_constraint co
  join pg_class p on p.oid = co.confrelid join pg_class h on h.oid = co.conrelid
  join pg_attribute a on a.attrelid = co.conrelid and a.attnum = co.conkey[1]
  where co.connamespace = 'public'::regnamespace and co.contype = 'f'),
documento as (
  select format(E'# Diagrama entidad-relación — Ruta Contable\n\nGenerado desde el catálogo de PostgreSQL con `docs/bd/genera_er.sql`. No se edita a mano: se regenera después de cada migración. %s tablas y %s relaciones (FK). Cada relación lleva como etiqueta la columna FK de la tabla hija. Detalle de columnas, tipos completos y restricciones: `docs/bd/diccionario.md`.\n\n```mermaid\nerDiagram\n%s\n\n%s\n```\n',
    (select count(*) from t), r.n, e.txt, r.txt) doc
  from entidades e, relaciones r)
select doc from documento;
