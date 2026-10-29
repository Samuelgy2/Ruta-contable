-- Gestión de la landing page (RF-088 a RF-097).
-- Borrador único editable, versiones publicadas inmutables, imágenes en BD
-- (Render tiene disco efímero) y bitácora de auditoría.
-- Rollback: 20261028_landing.down.sql

BEGIN;

-- Borrador: fila única (id = 1). contenido = { secciones: [...], contacto: {...} }
CREATE TABLE IF NOT EXISTS landing_borrador (
  id          INTEGER     PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  contenido   JSONB       NOT NULL,
  updated_by  INTEGER     REFERENCES users(id) ON DELETE SET NULL,
  updated_at  TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Cada publicación crea una versión. La publicada es la de mayor número.
-- Se conservan todas (RF-095 exige al menos las últimas 10).
CREATE TABLE IF NOT EXISTS landing_version (
  numero        INTEGER     PRIMARY KEY CHECK (numero > 0),
  contenido     JSONB       NOT NULL,
  publicado_by  INTEGER     REFERENCES users(id) ON DELETE SET NULL,
  publicado_at  TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS landing_imagen (
  id          SERIAL       PRIMARY KEY,
  mime        VARCHAR(20)  NOT NULL CHECK (mime IN ('image/jpeg', 'image/png', 'image/webp')),
  datos       BYTEA        NOT NULL,
  bytes       INTEGER      NOT NULL CHECK (bytes > 0 AND bytes <= 2097152),
  alt         VARCHAR(150) NOT NULL CHECK (length(trim(alt)) > 0),
  created_by  INTEGER      REFERENCES users(id) ON DELETE SET NULL,
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Bitácora general. La usa el módulo de landing; otros módulos pueden sumarse.
CREATE TABLE IF NOT EXISTS auditoria (
  id          SERIAL       PRIMARY KEY,
  usuario_id  INTEGER      REFERENCES users(id) ON DELETE SET NULL,
  accion      VARCHAR(50)  NOT NULL,
  entidad     VARCHAR(50)  NOT NULL,
  detalle     JSONB,
  ip          VARCHAR(64),
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_auditoria_entidad ON auditoria (entidad, created_at DESC);

-- El pool usa un rol con BYPASSRLS; se activa RLS por coherencia con el resto
-- del esquema de Supabase (ver README, sección Seguridad).
ALTER TABLE landing_borrador ENABLE ROW LEVEL SECURITY;
ALTER TABLE landing_version  ENABLE ROW LEVEL SECURITY;
ALTER TABLE landing_imagen   ENABLE ROW LEVEL SECURITY;
ALTER TABLE auditoria        ENABLE ROW LEVEL SECURITY;

COMMIT;
