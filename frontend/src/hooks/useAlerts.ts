// src/hooks/useAlerts.ts
import { useMemo } from 'react';
import { useData } from '../contexts/DataContext';

export type AlertSeverity = 'danger' | 'warning';

export interface Alert {
  id:        string;
  severity:  AlertSeverity;
  title:     string;
  message:   string;
  memberId?: string;
}

/**
 * Calcula alertas de pagos pendientes y vencidos
 * directamente desde el DataContext (fees + members).
 */
export function useAlerts(): { alerts: Alert[]; total: number; dangers: number; warnings: number } {
  const { fees, members } = useData();

  const alerts = useMemo<Alert[]>(() => {
    const result: Alert[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    fees.forEach(fee => {
      const member = members.find(m => m.id === fee.memberId);
      const name   = member?.name ?? `Socio #${fee.memberId}`;

      if (fee.status === 'overdue') {
        const due  = new Date(fee.dueDate);
        const days = Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
        result.push({
          id:       `overdue-${fee.id}`,
          severity: 'danger',
          title:    'Pago vencido',
          message:  `${name} lleva ${days} día${days !== 1 ? 's' : ''} con cuota vencida`,
          memberId: fee.memberId,
        });
      } else if (fee.status === 'pending') {
        const due        = new Date(fee.dueDate);
        const daysLeft   = Math.floor((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        const isUrgent   = daysLeft <= 3;
        result.push({
          id:       `pending-${fee.id}`,
          severity: isUrgent ? 'warning' : 'warning',
          title:    'Pago pendiente',
          message:  daysLeft < 0
            ? `${name} tiene cuota pendiente vencida`
            : daysLeft === 0
              ? `${name} tiene cuota que vence hoy`
              : `${name} tiene cuota que vence en ${daysLeft} día${daysLeft !== 1 ? 's' : ''}`,
          memberId: fee.memberId,
        });
      }
    });

    // Ordenar: primero danger, luego warning
    return result.sort((a, b) => {
      if (a.severity === 'danger' && b.severity !== 'danger') return -1;
      if (b.severity === 'danger' && a.severity !== 'danger') return  1;
      return 0;
    });
  }, [fees, members]);

  return {
    alerts,
    total:    alerts.length,
    dangers:  alerts.filter(a => a.severity === 'danger').length,
    warnings: alerts.filter(a => a.severity === 'warning').length,
  };
}