# Seguridad de acceso a datos

## Por qué las políticas RLS de Supabase no son la capa de autorización real

`backend/db.js` conecta a Postgres directo con `pg.Pool` usando las credenciales
`DB_HOST`/`DB_USER`/... de `backend/.env` — **no** se usa `@supabase/supabase-js`
en ningún punto del backend. El frontend (Vite/React) tampoco importa ningún
cliente de Supabase: toda la aplicación pasa exclusivamente por este backend
Express.

Verificado el 2026-08-16 contra el proyecto `hfibhmntifttdududwpw`:

```sql
SELECT rolname, rolsuper, rolbypassrls FROM pg_roles WHERE rolname = 'postgres';
-- rolname=postgres  rolsuper=false  rolbypassrls=true
```

El rol `postgres.<project-ref>` usado por el pool (formato pooler de Supabase)
tiene `rolbypassrls = true`: **bypasea RLS siempre**, sin importar cuántas
políticas existan. Por lo tanto, aunque el advisor de seguridad marca las 18
tablas con "RLS enabled, no policy", escribir políticas ahí no añadiría
ninguna protección real, porque el único cliente que existe hoy nunca las
evalúa.

La capa de autorización real de esta app vive en el middleware de Express
(`backend/middleware/`, JWT + roles). Es ahí donde hay que revisar/reforzar
permisos, no en RLS.

## Si esto cambia en el futuro

Si en algún momento se agrega un cliente que hable directo con Supabase
(frontend con `@supabase/supabase-js`, un edge function, un service externo
con una API key `anon`/`service_role` distinta del rol del pool), **esta
decisión debe revisarse**: en ese escenario RLS sí sería la única barrera
entre ese cliente nuevo y los datos, y las 18 tablas necesitarían políticas
reales antes de exponer esa vía de acceso.
