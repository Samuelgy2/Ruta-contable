-- Módulo Jersey: campañas y pedidos desde el portal.
--
-- Contexto: pedido_jersey e inventario_jersey existían vacías y sin backend.
-- El admin abre una "campaña" (modelo de jersey con precio y tallas); cada
-- socio hace como máximo un pedido por campaña desde su portal. Los pedidos
-- manuales del admin pueden no tener campaña (id_campana NULL).
--
-- Idempotente. No aplicada en Supabase: pendiente de revisión.

-- 1. Campañas
CREATE TABLE IF NOT EXISTS public.jersey_campana (
  id            serial PRIMARY KEY,
  titulo        varchar(120)  NOT NULL,
  descripcion   text,
  tallas        jsonb         NOT NULL DEFAULT '["XS","S","M","L","XL","XXL"]'::jsonb,
  valor         numeric(12,2) NOT NULL,
  fecha_inicio  date          NOT NULL DEFAULT CURRENT_DATE,
  fecha_fin     date,
  activa        boolean       NOT NULL DEFAULT true,
  created_by    integer       REFERENCES public.users(id),
  created_at    timestamp     DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.jersey_campana'::regclass AND conname = 'jersey_campana_valor_check'
  ) THEN
    ALTER TABLE public.jersey_campana
      ADD CONSTRAINT jersey_campana_valor_check CHECK (valor > 0);
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_jersey_campana_activa
  ON public.jersey_campana (activa, fecha_fin);

-- 2. pedido_jersey: campaña, cantidad y estampado (nombre y número).
ALTER TABLE public.pedido_jersey
  ADD COLUMN IF NOT EXISTS id_campana integer REFERENCES public.jersey_campana(id);

ALTER TABLE public.pedido_jersey
  ADD COLUMN IF NOT EXISTS cantidad integer NOT NULL DEFAULT 1;

ALTER TABLE public.pedido_jersey
  ADD COLUMN IF NOT EXISTS estampado varchar(60);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.pedido_jersey'::regclass AND conname = 'pedido_jersey_cantidad_check'
  ) THEN
    ALTER TABLE public.pedido_jersey
      ADD CONSTRAINT pedido_jersey_cantidad_check CHECK (cantidad > 0);
  END IF;
END
$$;

-- Un pedido por socio y campaña. Los pedidos manuales (id_campana NULL) no
-- colisionan entre sí porque los NULL no participan en el UNIQUE.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.pedido_jersey'::regclass
      AND conname = 'pedido_jersey_id_campana_id_socio_key'
  ) THEN
    ALTER TABLE public.pedido_jersey
      ADD CONSTRAINT pedido_jersey_id_campana_id_socio_key UNIQUE (id_campana, id_socio);
  END IF;
END
$$;

-- 3. CHECK de estado (Supabase ya lo tiene como pedido_jersey_estado_check).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.pedido_jersey'::regclass AND conname = 'pedido_jersey_estado_check'
  ) THEN
    ALTER TABLE public.pedido_jersey
      ADD CONSTRAINT pedido_jersey_estado_check
      CHECK (estado IN ('Solicitado', 'En producción', 'Listo', 'Entregado', 'Cancelado'));
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_pedido_jersey_campana
  ON public.pedido_jersey (id_campana);

CREATE INDEX IF NOT EXISTS idx_pedido_jersey_socio
  ON public.pedido_jersey (id_socio);
