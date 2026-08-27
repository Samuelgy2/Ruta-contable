// src/hooks/useAlerts.ts
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { pagoMensualService } from '../services/pagoMensualService';
import { PagoMensualItem } from './usePagosMensuales';
import { useAutoRefresh } from './useAutoRefresh';

export type AlertSeverity = 'danger' | 'warning';

export interface Alert {
  id:        string;
  severity:  AlertSeverity;
  title:     string;
  message:   string;
  memberId?: string;
}

export interface UseAlertsResult {
  alerts:      Alert[];
  total:       number;
  dangers:     number;
  warnings:    number;
  loading:     boolean;
  /** Momento de la última carga correcta. */
  lastUpdated: Date | null;
  refresh:     () => void;
}

/**
 * Calcula alertas de pagos pendientes y vencidos (RF-025)
 * directamente desde pago_mensual (pendiente / moroso).
 *
 * Se mantiene al día sola: reacciona a cualquier mutación de pagos, al volver
 * el foco a la pestaña y a un sondeo periódico.
 */
export function useAlerts(): UseAlertsResult {
  const [pagos,       setPagos]       = useState<PagoMensualItem[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Evita que una respuesta lenta pise a otra más reciente y que se actualice
  // el estado tras desmontar el componente.
  const requestId = useRef(0);
  const mounted   = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  const fetchAlerts = useCallback(async () => {
    const id = ++requestId.current;
    try {
      const [pendientes, morosos] = await Promise.all([
        pagoMensualService.getAll({ estado: 'pendiente' }),
        pagoMensualService.getAll({ estado: 'moroso' }),
      ]);
      if (!mounted.current || id !== requestId.current) return;
      setPagos([
        ...(pendientes.success ? pendientes.data || [] : []),
        ...(morosos.success ? morosos.data || [] : []),
      ]);
      setLastUpdated(new Date());
    } catch {
      if (mounted.current && id === requestId.current) setPagos([]);
    } finally {
      if (mounted.current && id === requestId.current) setLoading(false);
    }
  }, []);

  useEffect(() => { void fetchAlerts(); }, [fetchAlerts]);

  const refresh = useCallback(() => { void fetchAlerts(); }, [fetchAlerts]);

  // Los pagos cambian de estado desde Mensualidades y desde Cartera; las
  // transacciones pueden saldar una cuota, así que también cuentan.
  useAutoRefresh(refresh, {
    resources: ['pagos-mensuales', 'cartera', 'transactions', 'periodos'],
    pollMs:    60000,
  });

  const alerts = useMemo<Alert[]>(() => {
    const result: Alert[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    pagos.forEach(pago => {
      const name = pago.socio_nombre ?? `Socio #${pago.id_socio}`;

      if (pago.estado === 'moroso') {
        const dias = pago.dias_mora || Math.floor((today.getTime() - new Date(pago.fecha_vencimiento).getTime()) / (1000 * 60 * 60 * 24));
        result.push({
          id:       `moroso-${pago.id_pago}`,
          severity: 'danger',
          title:    'Pago vencido',
          message:  `${name} lleva ${dias} día${dias !== 1 ? 's' : ''} con cuota vencida`,
          memberId: String(pago.id_socio),
        });
      } else if (pago.estado === 'pendiente') {
        const due      = new Date(pago.fecha_vencimiento);
        const daysLeft = Math.floor((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        result.push({
          id:       `pendiente-${pago.id_pago}`,
          severity: 'warning',
          title:    'Pago pendiente',
          message:  daysLeft < 0
            ? `${name} tiene cuota pendiente vencida`
            : daysLeft === 0
              ? `${name} tiene cuota que vence hoy`
              : `${name} tiene cuota que vence en ${daysLeft} día${daysLeft !== 1 ? 's' : ''}`,
          memberId: String(pago.id_socio),
        });
      }
    });

    // Ordenar: primero danger, luego warning
    return result.sort((a, b) => {
      if (a.severity === 'danger' && b.severity !== 'danger') return -1;
      if (b.severity === 'danger' && a.severity !== 'danger') return  1;
      return 0;
    });
  }, [pagos]);

  return {
    alerts,
    total:    alerts.length,
    dangers:  alerts.filter(a => a.severity === 'danger').length,
    warnings: alerts.filter(a => a.severity === 'warning').length,
    loading,
    lastUpdated,
    refresh,
  };
}
