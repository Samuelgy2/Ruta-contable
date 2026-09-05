-- Corrección de triggers de pago_mensual. Aplicada en Supabase (proyecto Ruta-contable) el 2026-09-05.
--
-- Problema: tr_actualizar_mora (BEFORE UPDATE en pago_mensual) forzaba
-- estado = 'moroso' siempre que fecha_pago > fecha_vencimiento, pisando el
-- 'pagado' enviado por PUT /api/pagos-mensuales/:id. "Registrar Pago" sobre una
-- cuota vencida respondía éxito, pero la fila seguía morosa y la campana de
-- notificaciones seguía mostrando el pago como vencido.
--
-- Ahora el trigger solo calcula dias_mora y auto-marca 'pagado' cuando quien
-- actualiza NO cambió el estado explícitamente.

CREATE OR REPLACE FUNCTION public.tr_actualizar_mora()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
    IF NEW.fecha_pago IS NOT NULL THEN
        NEW.dias_mora = GREATEST(NEW.fecha_pago - NEW.fecha_vencimiento, 0);
        -- Pago registrado sin cambio explícito de estado: pasa a pagado.
        IF NEW.estado = OLD.estado AND NEW.estado IN ('pendiente', 'moroso') THEN
            NEW.estado = 'pagado';
        END IF;
    ELSIF NEW.estado = 'moroso' THEN
        NEW.dias_mora = GREATEST(CURRENT_DATE - NEW.fecha_vencimiento, 0);
    END IF;
    RETURN NEW;
END;
$function$;

-- tr_generar_recargo_mora: protege contra porcentaje_mora NULL / recargo cero.
CREATE OR REPLACE FUNCTION public.tr_generar_recargo_mora()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
    v_recargo DECIMAL(10,2);
    v_porcentaje_mora DECIMAL(5,2);
    v_nombre_mes VARCHAR(20);
BEGIN
    IF NEW.estado = 'pagado' AND OLD.estado <> 'pagado'
       AND NEW.fecha_pago IS NOT NULL AND NEW.fecha_pago > NEW.fecha_vencimiento THEN
        SELECT COALESCE(porcentaje_mora, 0) INTO v_porcentaje_mora FROM system_data WHERE id = 1;
        v_recargo = NEW.valor * (COALESCE(v_porcentaje_mora, 0) / 100);

        IF v_recargo > 0 THEN
            SELECT nombre_mes INTO v_nombre_mes
            FROM meses_periodo
            WHERE id_periodo = NEW.id_periodo;

            INSERT INTO cartera (id_socio, id_pago_mensual, fecha, concepto, valor, estado)
            VALUES (
                NEW.id_socio,
                NEW.id_pago,
                NEW.fecha_pago,
                'Recargo por mora - Mensualidad ' || COALESCE(v_nombre_mes, ''),
                v_recargo,
                'pendiente'
            );
        END IF;
    END IF;
    RETURN NEW;
END;
$function$;
