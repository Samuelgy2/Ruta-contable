-- Rollback de 20261028_landing.up.sql. Borra el contenido editable de la
-- landing, sus versiones, imágenes y la bitácora: la landing pública vuelve al
-- contenido por defecto del frontend.

BEGIN;

DROP TABLE IF EXISTS landing_version;
DROP TABLE IF EXISTS landing_borrador;
DROP TABLE IF EXISTS landing_imagen;
DROP TABLE IF EXISTS auditoria;

COMMIT;
