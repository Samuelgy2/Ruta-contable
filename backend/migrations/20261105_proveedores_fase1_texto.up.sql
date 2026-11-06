-- Eliminación de la tabla `proveedores` — FASE 1 de 2 (no rompe el backend actual).
-- Agrega el proveedor como texto libre en compra y factura y copia el nombre del
-- proveedor vinculado. El código viejo sigue funcionando porque id_proveedor aún existe.
-- La fase 2 (20261105_proveedores_fase2_eliminar) borra la tabla: aplicarla solo
-- cuando el backend nuevo (sin ProveedorController ni JOIN a proveedores) esté desplegado.

BEGIN;

ALTER TABLE public.compra  ADD COLUMN IF NOT EXISTS proveedor_nombre VARCHAR(150);
ALTER TABLE public.factura ADD COLUMN IF NOT EXISTS proveedor_nombre VARCHAR(150);

UPDATE public.compra c
   SET proveedor_nombre = p.nombre
  FROM public.proveedores p
 WHERE p.id_proveedor = c.id_proveedor AND c.proveedor_nombre IS NULL;

UPDATE public.factura f
   SET proveedor_nombre = p.nombre
  FROM public.proveedores p
 WHERE p.id_proveedor = f.id_proveedor AND f.proveedor_nombre IS NULL;

COMMENT ON COLUMN public.compra.proveedor_nombre  IS 'Proveedor como texto libre (opcional). Reemplaza a la antigua tabla proveedores.';
COMMENT ON COLUMN public.factura.proveedor_nombre IS 'Proveedor como texto libre (opcional). Reemplaza a la antigua tabla proveedores.';

COMMIT;
