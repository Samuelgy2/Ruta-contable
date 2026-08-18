// src/hooks/useAlerts.ts
import { useEffect, useMemo, useState } from 'react';
import { pagoMensualService } from '../services/pagoMensualService';
import { PagoMensualItem } from './usePagosMensuales';

export type AlertSeverity = 'danger' | 'warning';

export interface Alert {
  id:        string;
  severity:  AlertSeverity;
  title:     string;
  message:   string;
  memberId?: string;
}

/**
 * Calcula alertas de pagos pendientes y vencidos (RF-025)
 * directamente desde pago_mensual (pendiente / moroso).
 */
export function useAlerts(): { alerts: Alert[]; total: number; dangers: number; warnings: number } {
  const [pagos, setPagos] = useState<PagoMensualItem[]>([]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [pendientes, morosos] = await Promise.all([
          pagoMensualService.getAll({ estado: 'pendiente' }),
          pagoMensualService.getAll({ estado: 'moroso' }),
        ]);
        if (!active) return;
        const data = [
          ...(pendientes.success ? pendientes.data || [] : []),
          ...(morosos.success ? morosos.data || [] : []),
        ];
        setPagos(data);
      } catch {
        if (active) setPagos([]);
      }
    })();
    return () => { active = false; };
  }, []);

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
  };
}