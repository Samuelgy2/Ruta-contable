-- Eliminación de la tabla `proveedores` — FASE 2 de 2.
-- Requisito: fase 1 aplicada y backend nuevo desplegado (el viejo hace JOIN a proveedores).
-- Antes de borrar deja una copia en el esquema `respaldo` (no expuesto por la API
-- REST); el .down.sql reconstruye tabla, claves e índices desde esa copia.

BEGIN;

CREATE SCHEMA IF NOT EXISTS respaldo;

CREATE TABLE respaldo.proveedores_final       AS TABLE public.proveedores;
CREATE TABLE respaldo.compra_proveedor_final  AS SELECT id_compra,  id_proveedor FROM public.compra  WHERE id_proveedor IS NOT NULL;
CREATE TABLE respaldo.factura_proveedor_final AS SELECT id_factura, id_proveedor FROM public.factura WHERE id_proveedor IS NOT NULL;
ALTER TABLE respaldo.proveedores_final       ENABLE ROW LEVEL SECURITY;
ALTER TABLE respaldo.compra_proveedor_final  ENABLE ROW LEVEL SECURITY;
ALTER TABLE respaldo.factura_proveedor_final ENABLE ROW LEVEL SECURITY;

-- Por si se registró algo con id_proveedor entre la fase 1 y esta fase.
UPDATE public.compra c
   SET proveedor_nombre = p.nombre
  FROM public.proveedores p
 WHERE p.id_proveedor = c.id_proveedor AND c.proveedor_nombre IS NULL;

UPDATE public.factura f
   SET proveedor_nombre = p.nombre
  FROM public.proveedores p
 WHERE p.id_proveedor = f.id_proveedor AND f.proveedor_nombre IS NULL;

-- Al quitar la columna desaparecen también compra_id_proveedor_fkey, factura_id_proveedor_fkey
-- y los índices idx_compra_id_proveedor / idx_factura_id_proveedor.
ALTER TABLE public.compra  DROP COLUMN id_proveedor;
ALTER TABLE public.factura DROP COLUMN id_proveedor;

DROP TABLE public.proveedores;

COMMIT;
