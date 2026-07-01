import React, { useEffect, useState, useCallback } from 'react';

// ─── TIPOS ────────────────────────────────────────────────────────────────────

interface OverviewData {
  summary: {
    clubBalance:     { raw: number; formatted: string };
    totalBalance:    { raw: number; formatted: string };
    monthlyIncome:   { raw: number; formatted: string };
    monthlyExpenses: { raw: number; formatted: string };
  };
  stats: {
    totalTransactions: number;
    totalMembers:      number;
    activeMembers:     number;
    paidFees:          number;
    pendingFees:       number;
  };
  system: {
    clubName:   string;
    fiscalYear: number;
    currency:   string;
  };
  meta: {
    generatedAt: string;
    month:       number;
    year:        number;
  };
}

interface AdminOverviewProps {
  onNavigate?: (tab: string) => void;
  adminName?:  string;
}

// ─── HOOK PERSONALIZADO — capa de acceso al backend ───────────────────────────
function useOverviewData() {
  const [data,    setData]    = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('clubfinance_token');
      console.log('Token:', token ? 'presente' : 'ausente');

      const apiUrl = import.meta.env.VITE_API_URL || '';
      const res = await fetch(`${apiUrl}/api/admin/overview`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`HTTP ${res.status}: ${errorText}`);
      }
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setData(json.data);
      localStorage.setItem('overviewData', JSON.stringify(json.data));
      sessionStorage.setItem('overviewData', JSON.stringify(json.data));
    } catch (err: any) {
      console.error('Error en useOverviewData:', err);
      setError(err.message ?? 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
} 

// ─── SUBCOMPONENTES ───────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  accent = false,
  trend,
}: {
  label:   string;
  value:   string | number;
  accent?: boolean;
  trend?:  'up' | 'down' | 'neutral';
}) {
  const trendColor = trend === 'up' ? '#10b981' : trend === 'down' ? '#ef4444' : '#6b7280';
  const trendArrow = trend === 'up' ? '↑' : trend === 'down' ? '↓' : '';

  return (
    <div style={{
      background:    'white',
      borderRadius:  '20px',
      padding:       '24px 28px',
      borderLeft:    `4px solid ${accent ? '#10b981' : '#e5e7eb'}`,
      boxShadow:     '0 2px 12px rgba(0,0,0,0.06)',
      transition:    'transform 0.15s, box-shadow 0.15s',
      cursor:        'default',
      position:      'relative',
      overflow:      'hidden',
    }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.transform   = 'translateY(-2px)';
        (e.currentTarget as HTMLElement).style.boxShadow  = '0 6px 20px rgba(0,0,0,0.1)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.transform   = 'translateY(0)';
        (e.currentTarget as HTMLElement).style.boxShadow  = '0 2px 12px rgba(0,0,0,0.06)';
      }}
    >
      {accent && (
        <div style={{
          position:        'absolute',
          top:             0,
          right:           0,
          width:           '80px',
          height:          '80px',
          background:      'radial-gradient(circle at top right, rgba(16,185,129,0.08) 0%, transparent 70%)',
          borderRadius:    '0 20px 0 0',
          pointerEvents:   'none',
        }} />
      )}
      <p style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '0.08em', color: '#9ca3af', margin: '0 0 10px', textTransform: 'uppercase' }}>
        {label}
      </p>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
        <p style={{ fontSize: '26px', fontWeight: 700, margin: 0, color: '#111827', lineHeight: 1 }}>
          {value}
        </p>
        {trend && trend !== 'neutral' && (
          <span style={{ fontSize: '13px', fontWeight: 600, color: trendColor }}>
            {trendArrow}
          </span>
        )}
      </div>
    </div>
  );
}

function InfoRow({ label, value, highlight }: { label: string; value: string | number; highlight?: boolean }) {
  return (
    <div style={{
      display:       'flex',
      justifyContent:'space-between',
      alignItems:    'center',
      padding:       '12px 16px',
      borderRadius:  '10px',
      background:    '#f9fafb',
      marginBottom:  '8px',
    }}>
      <span style={{ fontSize: '14px', color: '#6b7280' }}>{label}</span>
      <strong style={{ fontSize: '14px', color: highlight ? '#10b981' : highlight === false ? '#ef4444' : '#111827' }}>
        {value}
      </strong>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div style={{
      background:   'white',
      borderRadius: '20px',
      padding:      '24px 28px',
      boxShadow:    '0 2px 12px rgba(0,0,0,0.06)',
    }}>
      <div style={{ height: '12px', background: '#f3f4f6', borderRadius: '6px', width: '60%', marginBottom: '16px', animation: 'pulse 1.4s ease-in-out infinite' }} />
      <div style={{ height: '26px', background: '#f3f4f6', borderRadius: '6px', width: '80%', animation: 'pulse 1.4s ease-in-out infinite' }} />
    </div>
  );
}

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────────────────

export function AdminOverview({ onNavigate, adminName = 'Samuel Gutiérrez' }: AdminOverviewProps) {
  const { data, loading, error, refetch } = useOverviewData();

  const MONTH_NAMES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
  const currentMonthName = MONTH_NAMES[new Date().getMonth()];

  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6', padding: '32px 24px' }}>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.5; }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fadeUp 0.4s ease both; }
      `}</style>

      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>

        {/* ── Encabezado ─────────────────────────────────────────── */}
        <div className="fade-up" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <div style={{
                width: '10px', height: '10px', borderRadius: '50%',
                background: '#10b981', boxShadow: '0 0 0 3px rgba(16,185,129,0.2)',
              }} />
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#10b981', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                En línea
              </span>
            </div>
            <h1 style={{ fontSize: '30px', fontWeight: 800, color: '#111827', margin: '0 0 6px', letterSpacing: '-0.5px' }}>
              Panel Gestor
            </h1>
            <p style={{ color: '#6b7280', margin: 0, fontSize: '15px' }}>
              Bienvenido de vuelta, <strong style={{ color: '#374151' }}>{adminName}</strong>
              {' · '}
              <span style={{ color: '#9ca3af' }}>
                {currentMonthName.charAt(0).toUpperCase() + currentMonthName.slice(1)} {new Date().getFullYear()}
              </span>
            </p>
          </div>

          <button
            onClick={refetch}
            disabled={loading}
            style={{
              display:       'flex',
              alignItems:    'center',
              gap:           '6px',
              padding:       '10px 18px',
              background:    loading ? '#f3f4f6' : '#111827',
              color:         loading ? '#9ca3af' : 'white',
              border:        'none',
              borderRadius:  '12px',
              fontSize:      '13px',
              fontWeight:    600,
              cursor:        loading ? 'not-allowed' : 'pointer',
              transition:    'background 0.15s',
            }}
          >
            <span style={{ fontSize: '15px', display: 'inline-block', transform: loading ? 'rotate(360deg)' : 'none', transition: 'transform 0.6s' }}>
              ↻
            </span>
            {loading ? 'Cargando…' : 'Actualizar'}
          </button>
        </div>

        {/* ── Error ──────────────────────────────────────────────── */}
        {error && (
          <div style={{
            background:   '#fef2f2',
            border:       '1px solid #fecaca',
            borderRadius: '14px',
            padding:      '16px 20px',
            marginBottom: '24px',
            color:        '#b91c1c',
            fontSize:     '14px',
          }}>
            ⚠ Error al cargar datos: {error}
          </div>
        )}

        {/* ── Tarjetas de resumen ────────────────────────────────── */}
        <div style={{
          display:             'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
          gap:                 '20px',
          marginBottom:        '28px',
        }}>
          {loading ? (
            [0,1,2,3].map(i => <SkeletonCard key={i} />)
          ) : data ? (
            <>
              <div className="fade-up" style={{ animationDelay: '0.05s' }}>
                <StatCard label="Saldo del club"   value={data.summary.clubBalance.formatted}     accent trend="neutral" />
              </div>
              <div className="fade-up" style={{ animationDelay: '0.1s' }}>
                <StatCard label="Balance total"    value={data.summary.totalBalance.formatted}    accent={data.summary.totalBalance.raw >= 0} />
              </div>
              <div className="fade-up" style={{ animationDelay: '0.15s' }}>
                <StatCard label={`Ingresos · ${currentMonthName}`} value={data.summary.monthlyIncome.formatted}   trend="up" />
              </div>
              <div className="fade-up" style={{ animationDelay: '0.2s' }}>
                <StatCard label={`Gastos · ${currentMonthName}`}   value={data.summary.monthlyExpenses.formatted} trend="down" />
              </div>
            </>
          ) : null}
        </div>

        {/* ── Secciones inferiores ───────────────────────────────── */}
        {!loading && data && (
          <div style={{
            display:             'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap:                 '20px',
          }}>

            {/* Estadísticas generales */}
            <div className="fade-up" style={{ animationDelay: '0.25s', background: 'white', borderRadius: '20px', padding: '28px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                  📊
                </div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: '#111827' }}>
                  Estadísticas Generales
                </h3>
              </div>
              <InfoRow label="Total transacciones" value={data.stats.totalTransactions} />
              <InfoRow label="Total socios"         value={data.stats.totalMembers} />
              <InfoRow label="Cuotas pagadas"       value={data.stats.paidFees}    highlight={true} />
              <InfoRow label="Cuotas pendientes"    value={data.stats.pendingFees} highlight={false} />
            </div>

            {/* Información del club */}
            <div className="fade-up" style={{ animationDelay: '0.3s', background: 'white', borderRadius: '20px', padding: '28px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                  🏛
                </div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: '#111827' }}>
                  Información del Club
                </h3>
              </div>
              <InfoRow label="Club"            value={data.system.clubName || 'Sin nombre'} />
              <InfoRow label="Año fiscal"      value={data.system.fiscalYear} />
              <InfoRow label="Moneda"          value={data.system.currency} />
              <InfoRow label="Usuarios activos" value={`${data.stats.activeMembers} de ${data.stats.totalMembers}`} />
            </div>

          </div>
        )}

        {/* ── Pie: timestamp ────────────────────────────────────── */}
        {data && (
          <p style={{ textAlign: 'center', marginTop: '28px', fontSize: '12px', color: '#d1d5db' }}>
            Última actualización: {new Date(data.meta.generatedAt).toLocaleString('es-CO')}
          </p>
        )}
      </div>
    </div>
  );
}