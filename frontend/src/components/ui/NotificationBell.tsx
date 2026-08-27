// src/components/ui/NotificationBell.tsx
import React, { useState, useRef, useEffect } from 'react';
import { Bell, RefreshCw } from 'lucide-react';
import { useAlerts, Alert } from '../../hooks/useAlerts';

const CLUB_GREEN = '#10b981';

function formatUpdated(date: Date | null): string {
  if (!date) return 'Sin datos aún';
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 10) return 'Actualizado ahora mismo';
  if (seconds < 60) return `Actualizado hace ${seconds} s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `Actualizado hace ${minutes} min`;
  return `Actualizado a las ${date.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}`;
}

export function NotificationBell() {
  const { alerts, total, dangers, loading, lastUpdated, refresh } = useAlerts();
  const [open, setOpen] = useState(false);
  const ref             = useRef<HTMLDivElement>(null);

  // Con el panel abierto, re-renderiza cada 15 s para que el "hace X" avance.
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!open) return;
    const id = window.setInterval(() => setTick(t => t + 1), 15000);
    return () => window.clearInterval(id);
  }, [open]);

  // Cerrar al hacer clic fuera
  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  const badgeColor = dangers > 0 ? '#ef4444' : CLUB_GREEN;

  return (
    <div ref={ref} style={{ position: 'relative' }}>

      <style>{`
        @keyframes bellRing {
          0%,100% { transform: rotate(0deg); }
          10%      { transform: rotate(14deg); }
          20%      { transform: rotate(-10deg); }
          30%      { transform: rotate(8deg); }
          40%      { transform: rotate(-5deg); }
          50%      { transform: rotate(3deg); }
          60%      { transform: rotate(0deg); }
        }
        @keyframes pulse-badge {
          0%, 100% { box-shadow: 0 0 0 0 rgba(239,68,68,0.5); }
          50%       { box-shadow: 0 0 0 5px rgba(239,68,68,0); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(24px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        .bell-btn:hover .bell-icon {
          animation: bellRing 0.7s ease;
        }
        .bell-refresh:hover {
          background: #f3f4f6;
          color: #374151;
        }
      `}</style>

      {/* ── Botón campana ─────────────────────────────────────── */}
      <button
        className="bell-btn"
        onClick={() => setOpen(p => !p)}
        style={{
          position:        'relative',
          background:      open ? '#f0fdf4' : 'white',
          border:          `1.5px solid ${open ? CLUB_GREEN : '#e5e7eb'}`,
          borderRadius:    '12px',
          width:           '42px',
          height:          '42px',
          display:         'flex',
          alignItems:      'center',
          justifyContent:  'center',
          cursor:          'pointer',
          transition:      'background 0.15s, border-color 0.15s',
          boxShadow:       '0 1px 4px rgba(0,0,0,0.06)',
        }}
      >
        <Bell
          className="bell-icon"
          size={20}
          color={open ? CLUB_GREEN : '#6b7280'}
          style={{ flexShrink: 0 }}
        />

        {/* Badge contador */}
        {total > 0 && (
          <span style={{
            position:        'absolute',
            top:             '-6px',
            right:           '-6px',
            minWidth:        '18px',
            height:          '18px',
            borderRadius:    '9999px',
            backgroundColor: badgeColor,
            color:           'white',
            fontSize:        '10px',
            fontWeight:      800,
            display:         'flex',
            alignItems:      'center',
            justifyContent:  'center',
            padding:         '0 4px',
            border:          '2px solid white',
            animation:       dangers > 0 ? 'pulse-badge 1.5s ease infinite' : 'none',
            lineHeight:      1,
          }}>
            {total > 99 ? '99+' : total}
          </span>
        )}
      </button>

      {/* ── Dropdown ──────────────────────────────────────────── */}
      {open && (
        <div style={{
          position:     'absolute',
          top:          'calc(100% + 10px)',
          right:        0,
          width:        '340px',
          background:   'white',
          borderRadius: '16px',
          boxShadow:    '0 8px 40px rgba(0,0,0,0.14)',
          border:       '1px solid #e5e7eb',
          zIndex:       1000,
          animation:    'fadeUp 0.25s ease',
          overflow:     'hidden',
        }}>

          {/* Cabecera dropdown */}
          <div style={{
            padding:      '16px 20px',
            borderBottom: '1px solid #f3f4f6',
            display:      'flex',
            alignItems:   'center',
            justifyContent: 'space-between',
          }}>
            <div>
              <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#111827' }}>
                Notificaciones
              </h4>
              <p style={{ margin: 0, fontSize: '12px', color: '#9ca3af' }}>
                {total === 0
                  ? 'Sin alertas pendientes'
                  : `${total} alerta${total !== 1 ? 's' : ''} activa${total !== 1 ? 's' : ''}`}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              {total > 0 && (
                <>
                {dangers > 0 && (
                  <span style={{
                    padding: '3px 10px', borderRadius: '9999px',
                    background: '#fef2f2', color: '#dc2626',
                    fontSize: '11px', fontWeight: 700,
                  }}>
                    {dangers} vencida{dangers !== 1 ? 's' : ''}
                  </span>
                )}
                {(total - dangers) > 0 && (
                  <span style={{
                    padding: '3px 10px', borderRadius: '9999px',
                    background: '#fffbeb', color: '#d97706',
                    fontSize: '11px', fontWeight: 700,
                  }}>
                    {total - dangers} pendiente{(total - dangers) !== 1 ? 's' : ''}
                  </span>
                )}
                </>
              )}

              <button
                className="bell-refresh"
                onClick={refresh}
                disabled={loading}
                title="Actualizar notificaciones"
                aria-label="Actualizar notificaciones"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: '28px', height: '28px', borderRadius: '8px',
                  border: '1px solid #e5e7eb', background: 'white',
                  color: '#9ca3af', cursor: loading ? 'default' : 'pointer',
                  transition: 'background 0.15s, color 0.15s',
                }}
              >
                <RefreshCw size={14} style={{ animation: loading ? 'spin 0.9s linear infinite' : 'none' }} />
              </button>
            </div>
          </div>

          {/* Lista de alertas */}
          <div style={{ maxHeight: '360px', overflowY: 'auto' }}>
            {total === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                <div style={{ fontSize: '32px', marginBottom: '10px' }}>✅</div>
                <p style={{ margin: 0, fontSize: '14px', color: '#6b7280', fontWeight: 500 }}>
                  Todo al día
                </p>
                <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#9ca3af' }}>
                  No hay pagos pendientes ni vencidos
                </p>
              </div>
            ) : (
              alerts.map((alert, i) => (
                <AlertRow key={alert.id} alert={alert} delay={i * 0.04} />
              ))
            )}
          </div>

          {/* Footer */}
          <div style={{
            padding:     '10px 20px',
            borderTop:   '1px solid #f3f4f6',
            textAlign:   'center',
          }}>
            {total > 0 && (
              <p style={{ margin: '0 0 4px', fontSize: '12px', color: '#9ca3af' }}>
                Ve a <strong style={{ color: '#374151' }}>Mensualidades</strong> para gestionar los pagos
              </p>
            )}
            <p style={{ margin: 0, fontSize: '11px', color: '#d1d5db' }}>
              {formatUpdated(lastUpdated)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Fila de alerta ───────────────────────────────────────────────────────────
function AlertRow({ alert, delay }: { alert: Alert; delay: number }) {
  const isDanger = alert.severity === 'danger';

  return (
    <div style={{
      display:      'flex',
      alignItems:   'flex-start',
      gap:          '12px',
      padding:      '14px 20px',
      borderBottom: '1px solid #f9fafb',
      animation:    `slideIn 0.25s ease ${delay}s both`,
      transition:   'background 0.15s',
      cursor:       'default',
    }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#fafafa'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
    >
      {/* Ícono */}
      <div style={{
        width:          '34px',
        height:         '34px',
        borderRadius:   '50%',
        backgroundColor: isDanger ? '#fef2f2' : '#fffbeb',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        fontSize:       '16px',
        flexShrink:     0,
      }}>
        {isDanger ? '🔴' : '🟡'}
      </div>

      {/* Texto */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
          <span style={{
            fontSize: '11px', fontWeight: 700,
            color: isDanger ? '#dc2626' : '#d97706',
            textTransform: 'uppercase', letterSpacing: '0.05em',
          }}>
            {alert.title}
          </span>
        </div>
        <p style={{
          margin: 0, fontSize: '13px', color: '#374151',
          fontWeight: 500, lineHeight: 1.4,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {alert.message}
        </p>
      </div>

      {/* Indicador lateral */}
      <div style={{
        width:           '4px',
        alignSelf:       'stretch',
        borderRadius:    '9999px',
        backgroundColor: isDanger ? '#ef4444' : '#f59e0b',
        flexShrink:      0,
      }} />
    </div>
  );
}