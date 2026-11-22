-- Registro público con verificación de correo (OTP) y alta del socio.
-- 1. socio.estado admite 'pendiente': el socio que se registra solo espera la
--    aprobación del administrador. Las consultas del sistema filtran por
--    estado = 'activo', así que un pendiente no genera mensualidades ni sale en
--    asistencia, jersey o cartera hasta que se apruebe.
-- 2. registro_pendiente guarda el código OTP (hash bcrypt) y, una vez
--    verificado, el token de registro (hash SHA-256) de un correo que todavía no
--    tiene cuenta. users.reset_token no sirve porque aún no existe el usuario.
-- Rollback: 20261121_registro_socio.down.sql

BEGIN;

ALTER TABLE public.socio DROP CONSTRAINT socio_estado_check;
ALTER TABLE public.socio ADD CONSTRAINT socio_estado_check
  CHECK (estado IN ('activo', 'inactivo', 'suspendido', 'pendiente'));

CREATE TABLE public.registro_pendiente (
  email          VARCHAR(100) PRIMARY KEY CHECK (email = lower(email)),
  codigo_hash    TEXT,
  codigo_expira  TIMESTAMP,
  intentos       SMALLINT     NOT NULL DEFAULT 0 CHECK (intentos >= 0),
  token_hash     TEXT,
  token_expira   TIMESTAMP,
  created_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Sin políticas: la API REST de Supabase (anon / authenticated) no ve nada.
-- El backend usa el rol postgres, que tiene BYPASSRLS.
ALTER TABLE public.registro_pendiente ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.registro_pendiente IS 'Verificación de correo antes del registro público: código OTP y token de registro de un correo sin cuenta. La fila se borra al crear la cuenta.';
COMMENT ON COLUMN public.registro_pendiente.email IS 'Correo en minúsculas que se está verificando.';
COMMENT ON COLUMN public.registro_pendiente.codigo_hash IS 'Hash bcrypt del código OTP de 6 dígitos. NULL tras verificarlo o invalidarlo.';
COMMENT ON COLUMN public.registro_pendiente.codigo_expira IS 'Vencimiento del código (10 minutos, reloj LOCALTIMESTAMP).';
COMMENT ON COLUMN public.registro_pendiente.intentos IS 'Intentos fallidos del código actual; a los 3 se invalida.';
COMMENT ON COLUMN public.registro_pendiente.token_hash IS 'Hash SHA-256 del token de registro que se entrega al verificar el código. Un solo uso.';
COMMENT ON COLUMN public.registro_pendiente.token_expira IS 'Vencimiento del token de registro (30 minutos).';
COMMENT ON COLUMN public.socio.estado IS 'activo, inactivo, suspendido o pendiente (registro público sin aprobar).';

COMMIT;
