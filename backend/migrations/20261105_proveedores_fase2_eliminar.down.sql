-- Rollback de la FASE 2: recrea `proveedores` con su estructura original y la
-- repuebla desde respaldo.proveedores_final; restaura id_proveedor en compra y factura.
-- Las tablas del esquema `respaldo` se conservan (bórralas a mano cuando ya no hagan falta).

BEGIN;

CREATE TABLE public.proveedores (
  id_proveedor  SERIAL PRIMARY KEY,
  nombre        VARCHAR NOT NULL UNIQUE,
  nit           VARCHAR,
  telefono      VARCHAR,
  email         VARCHAR,
  direccion     VARCHAR,
  estado        VARCHAR NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo')),
  observaciones TEXT,
  created_by    INTEGER REFERENCES public.users(id),
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_proveedores_created_by ON public.proveedores (created_by);
ALTER TABLE public.proveedores ENABLE ROW LEVEL SECURITY;

INSERT INTO public.proveedores SELECT * FROM respaldo.proveedores_final;
SELECT setval(pg_get_serial_sequence('public.proveedores', 'id_proveedor'),
              COALESCE(MAX(id_proveedor), 1), MAX(id_proveedor) IS NOT NULL)
  FROM public.proveedores;

ALTER TABLE public.compra  ADD COLUMN id_proveedor INTEGER;
ALTER TABLE public.factura ADD COLUMN id_proveedor INTEGER;

UPDATE public.compra c  SET id_proveedor = r.id_proveedor FROM respaldo.compra_proveedor_final  r WHERE r.id_compra  = c.id_compra;
UPDATE public.factura f SET id_proveedor = r.id_proveedor FROM respaldo.factura_proveedor_final r WHERE r.id_factura = f.id_factura;

ALTER TABLE public.compra  ADD CONSTRAINT compra_id_proveedor_fkey  FOREIGN KEY (id_proveedor) REFERENCES public.proveedores (id_proveedor);
ALTER TABLE public.factura ADD CONSTRAINT factura_id_proveedor_fkey FOREIGN KEY (id_proveedor) REFERENCES public.proveedores (id_proveedor);
CREATE INDEX idx_compra_id_proveedor  ON public.compra  (id_proveedor);
CREATE INDEX idx_factura_id_proveedor ON public.factura (id_proveedor);

COMMIT;
