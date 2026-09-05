import React, { useState, useCallback, useEffect } from 'react';
import { useCategories } from '../../hooks/useCategories';
import { formatCurrency, formatDateShort } from '../../utils/format';
import { emitDataChanged } from '../../lib/dataEvents';
import { API_URL } from '../../services/apiConfig';

interface AdminTransactionsProps {
  onNavigate?: (tab: string) => void;
}

// ─── Config ───────────────────────────────────────────────────────────────────
const CLUB_GREEN = '#10b981';

function getToken(): string {
  return localStorage.getItem('clubfinance_token') ?? '';
}

// ─── Toast ────────────────────────────────────────────────────────────────────
type ToastType = 'success' | 'error' | 'warning';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const show = useCallback((message: string, type: ToastType = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  }, []);

  return { toasts, show };
}

function ToastContainer({ toasts }: { toasts: Toast[] }) {
  const colors: Record<ToastType, { bg: string; border: string; icon: string }> = {
    success: { bg: '#f0fdf4', border: '#10b981', icon: '✓' },
    error:   { bg: '#fef2f2', border: '#ef4444', icon: '✕' },
    warning: { bg: '#fffbeb', border: '#f59e0b', icon: '⚠' },
  };

  return (
    <div style={{ position: 'fixed', top: '24px', right: '24px', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {toasts.map(t => {
        const c = colors[t.type];
        return (
          <div key={t.id} style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            backgroundColor: c.bg, border: `1px solid ${c.border}`,
            borderLeft: `4px solid ${c.border}`, borderRadius: '10px',
            padding: '14px 18px', boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
            minWidth: '280px', maxWidth: '360px', animation: 'slideIn 0.25s ease',
          }}>
            <span style={{
              width: '22px', height: '22px', borderRadius: '50%',
              backgroundColor: c.border, color: 'white',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '13px', fontWeight: '700', flexShrink: 0,
            }}>{c.icon}</span>
            <span style={{ fontSize: '14px', color: '#1f2937', fontWeight: '500' }}>{t.message}</span>
          </div>
        );
      })}
      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(24px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────
function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  React.useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        backgroundColor: 'rgba(0,0,0,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px', animation: 'fadeOverlay 0.2s ease',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          backgroundColor: 'white', borderRadius: '20px',
          padding: '32px', width: '100%', maxWidth: '680px',
          maxHeight: '90vh', overflowY: 'auto',
          boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
          animation: 'popIn 0.25s cubic-bezier(0.34,1.56,0.64,1)',
        }}
      >
        {children}
      </div>
      <style>{`
        @keyframes fadeOverlay { from { opacity: 0; } to { opacity: 1; } }
        @keyframes popIn {
          from { opacity: 0; transform: scale(0.93) translateY(12px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}

// ─── Formulario vacío ─────────────────────────────────────────────────────────
const emptyForm = {
  type:        'income' as 'income' | 'expense',
  amount:      '',
  categoryId:  '',
  description: '',
  date:        new Date().toISOString().split('T')[0],
  metodoPago:  'efectivo' as 'efectivo' | 'transferencia' | 'tarjeta' | 'cheque',
};

type FormState = typeof emptyForm;

// ─── Tipo para fila de BD ─────────────────────────────────────────────────────
interface DBTransaction {
  id: number;
  tipo: string;
  monto: string;
  fecha: string;
  descripcion: string | null;
  categoria_nombre: string | null;
  metodo_pago: string | null;
  creado_por_username: string | null;
  created_at: string;
  // Origen del movimiento: 'pasarela' si llegó por un pago en línea, 'manual' si
  // lo cargó un administrador a mano.
  origen: 'pasarela' | 'manual';
  pago_id: number | null;
  pago_referencia: string | null;
  pago_estado: string | null;
  pago_proveedor: string | null;
}

// Detalle de auditoría del pago asociado a una transacción de la pasarela.
interface PagoDetalle {
  referencia: string;
  proveedor: string;
  orden_id: string | null;
  proveedor_id: string | null;
  concepto: string | null;
  monto: string;
  moneda: string;
  // Estado propio de la aplicación; estado_proveedor es el crudo de la pasarela.
  estado: string;
  estado_proveedor: string | null;
  metodo_pago: string | null;
  created_at: string;
  finalized_at: string | null;
  payload_raw: unknown;
}

// ─── Utilidades fecha dd/mm/aaaa ───────────────────────────────────────────────
function formatFechaMask(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 8); // solo números, máx 8 dígitos
  if (digits.length > 4) return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
  if (digits.length > 2) return `${digits.slice(0, 2)}/${digits.slice(2, 4)}`;
  return digits;
}

function parseFechaInput(value: string): string | null {
  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return null;
  const [, dd, mm, aaaa] = match;
  return `${aaaa}-${mm}-${dd}`; // 'YYYY-MM-DD', comparable con t.fecha
}

// ─── Componente principal ─────────────────────────────────────────────────────
export function AdminTransactions({ onNavigate }: AdminTransactionsProps) {
  const { categories } = useCategories();
  const [transactions, setTransactions] = useState<DBTransaction[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [searchTerm,   setSearchTerm]   = useState('');
  const [filterType,   setFilterType]   = useState<'all' | 'income' | 'expense'>('all');
  const [fechaInicio,  setFechaInicio]  = useState('');
  const [fechaFin,     setFechaFin]     = useState('');
  const [showForm,     setShowForm]     = useState(false);
  const [form,         setForm]         = useState<FormState>(emptyForm);
  const [submitting,   setSubmitting]   = useState(false);
  const [pagoDetalle,  setPagoDetalle]  = useState<PagoDetalle | null>(null);
  const [cargandoPago, setCargandoPago] = useState(false);
  const { toasts, show: showToast }     = useToast();

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px',
    border: '1.5px solid #e5e7eb', borderRadius: '8px',
    fontSize: '14px', outline: 'none', boxSizing: 'border-box',
    backgroundColor: 'white',
  };

  // ── Cargar transacciones desde la BD ────────────────────────────────────────
  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/transactions`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const json = await res.json();
      if (json.success) {
        setTransactions(json.data);
      } else {
        showToast('Error al cargar transacciones', 'error');
      }
    } catch {
      showToast('No se pudo conectar con el servidor', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetchTransactions(); }, [fetchTransactions]);

  // ── Detalle del pago de la pasarela (payload_raw) ───────────────────────────
  const verDetallePago = async (referencia: string) => {
    setCargandoPago(true);
    try {
      const res = await fetch(`${API_URL}/pagos/${encodeURIComponent(referencia)}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const json = await res.json();
      if (json.success) {
        setPagoDetalle(json.data as PagoDetalle);
      } else {
        showToast(json.message ?? 'No se pudo cargar el pago', 'error');
      }
    } catch {
      showToast('No se pudo conectar con el servidor', 'error');
    } finally {
      setCargandoPago(false);
    }
  };

  const closeForm = () => { setShowForm(false); setForm(emptyForm); };

  // ── Helper campo formulario ────────────────────────────────────────────────
  const f = (label: string, children: React.ReactNode, required = false): JSX.Element => (
    <div>
      <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#374151', fontSize: '13px' }}>
        {label}{required && <span style={{ color: '#ef4444' }}> *</span>}
      </label>
      {children}
    </div>
  );

  // ── Filtros ────────────────────────────────────────────────────────────────
  const filteredTransactions = transactions
    .filter(t => {
      if (filterType === 'all') return true;
      const tipoFront = t.tipo === 'ingreso' ? 'income' : 'expense';
      return tipoFront === filterType;
    })
    .filter(t =>
      (t.descripcion ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.categoria_nombre ?? '').toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter(t => {
      // RF-017: consultar transacciones por rango de fechas (dd/mm/aaaa)
      const fechaTransaccion = t.fecha.slice(0, 10); // 'YYYY-MM-DD'
      const inicioISO = parseFechaInput(fechaInicio);
      const finISO    = parseFechaInput(fechaFin);
      if (inicioISO && fechaTransaccion < inicioISO) return false;
      if (finISO    && fechaTransaccion > finISO)    return false;
      return true;
    });

  const availableCategories = categories.filter(c => c.active && c.type === form.type);

  // ── Submit → POST /api/transactions ────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!form.amount || !form.categoryId || !form.description) {
      showToast('Monto, categoría y descripción son obligatorios', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/transactions`, {
        method: 'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          tipo:        form.type,
          monto:       parseFloat(form.amount),
          categoriaId: Number(form.categoryId),
          descripcion: form.description,
          fecha:       form.date,
          metodoPago:  form.metodoPago,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message ?? 'Error del servidor');
      }
      showToast('Transacción registrada correctamente', 'success');
      closeForm();
      void fetchTransactions(); // recargar tabla
      // Esta vista no pasa por el cliente axios, así que avisa a mano al bus
      // para que el resumen y las notificaciones se actualicen.
      emitDataChanged('transactions');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al guardar';
      showToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Badge tipo ─────────────────────────────────────────────────────────────
  const tipoBadge = (tipo: string): JSX.Element => {
    const isIngreso = tipo === 'ingreso' || tipo === 'income';
    return (
      <span style={{
        padding: '4px 12px', borderRadius: '9999px',
        fontSize: '12px', fontWeight: '600',
        backgroundColor: isIngreso ? '#d1fae5' : '#fee2e2',
        color:           isIngreso ? '#065f46' : '#991b1b',
      }}>
        {isIngreso ? 'Ingreso' : 'Gasto'}
      </span>
    );
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="app">
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fadeUp 0.4s ease both; }
      `}</style>

      <ToastContainer toasts={toasts} />

      {showForm && (
        <Modal onClose={closeForm}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#1f2937' }}>
              ➕ Nueva Transacción
            </h3>
            <button
              onClick={closeForm}
              style={{
                background: '#f3f4f6', border: 'none', borderRadius: '8px',
                width: '34px', height: '34px', cursor: 'pointer',
                fontSize: '18px', color: '#6b7280',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >×</button>
          </div>

          <form onSubmit={(e) => { void handleSubmit(e); }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '16px' }}>

              {f('Tipo', (
                <select
                  value={form.type}
                  onChange={e => setForm({ ...form, type: e.target.value as FormState['type'], categoryId: '' })}
                  style={inputStyle}
                >
                  <option value="income">Ingreso</option>
                  <option value="expense">Gasto</option>
                </select>
              ), true)}

              {f('Monto', (
                <input
                  type="number"
                  value={form.amount}
                  onChange={e => setForm({ ...form, amount: e.target.value })}
                  onKeyDown={e => { if (e.key === 'e' || e.key === 'E') e.preventDefault(); }}
                  placeholder="0"
                  style={inputStyle}
                  required
                />
              ), true)}

              {f('Categoría', (
                <select
                  value={form.categoryId}
                  onChange={e => setForm({ ...form, categoryId: e.target.value })}
                  style={inputStyle}
                  required
                >
                  <option value="">Seleccionar...</option>
                  {availableCategories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              ), true)}

              {f('Fecha', (
                <input
                  type="date"
                  value={form.date}
                  onChange={e => setForm({ ...form, date: e.target.value })}
                  max={new Date().toISOString().split('T')[0]}
                  style={inputStyle}
                  required
                />
              ), true)}

              {f('Método de Pago', (
                <select
                  value={form.metodoPago}
                  onChange={e => setForm({ ...form, metodoPago: e.target.value as FormState['metodoPago'] })}
                  style={inputStyle}
                >
                  <option value="efectivo">Efectivo</option>
                  <option value="transferencia">Transferencia</option>
                  <option value="tarjeta">Tarjeta</option>
                  <option value="cheque">Cheque</option>
                </select>
              ), true)}

            </div>

            {f('Descripción', (
              <input
                type="text"
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                placeholder="Descripción de la transacción"
                style={inputStyle}
                required
              />
            ), true)}

            <div style={{
              display: 'flex', gap: '12px', justifyContent: 'flex-end',
              paddingTop: '16px', borderTop: '1px solid #f3f4f6', marginTop: '16px',
            }}>
              <button
                type="button"
                onClick={closeForm}
                disabled={submitting}
                style={{
                  padding: '11px 24px', borderRadius: '8px', border: '1.5px solid #e5e7eb',
                  backgroundColor: 'white', color: '#374151', fontSize: '14px',
                  fontWeight: '500', cursor: 'pointer',
                }}
              >Cancelar</button>
              <button
                type="submit"
                disabled={submitting}
                style={{
                  padding: '11px 28px', borderRadius: '8px', border: 'none',
                  backgroundColor: submitting ? '#6ee7b7' : CLUB_GREEN,
                  color: 'white', fontSize: '14px', fontWeight: '600',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  boxShadow: '0 2px 8px rgba(16,185,129,0.35)',
                }}
              >
                {submitting ? 'Guardando...' : 'Guardar Transacción'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Detalle del pago de la pasarela ─────────────────────────── */}
      {pagoDetalle && (
        <Modal onClose={() => setPagoDetalle(null)}>
          <h3 style={{ margin: '0 0 4px', fontSize: '20px', fontWeight: '700', color: '#1f2937' }}>
            Pago de la pasarela
          </h3>
          <p style={{ margin: '0 0 20px', color: '#6b7280', fontSize: '14px' }}>
            Referencia {pagoDetalle.referencia} · {pagoDetalle.proveedor}
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
            {[
              ['Estado', pagoDetalle.estado],
              ['Estado en la pasarela', pagoDetalle.estado_proveedor ?? '—'],
              ['Monto', `${pagoDetalle.moneda} ${parseFloat(pagoDetalle.monto).toLocaleString('es-CO')}`],
              ['Método', pagoDetalle.metodo_pago ?? '—'],
              ['Concepto', pagoDetalle.concepto ?? '—'],
              ['Orden', pagoDetalle.orden_id ?? '—'],
              ['Captura', pagoDetalle.proveedor_id ?? '—'],
              ['Finalizado', pagoDetalle.finalized_at ? formatDateShort(pagoDetalle.finalized_at) : '—'],
            ].map(([etiqueta, valor]) => (
              <div key={etiqueta as string}>
                <p style={{ margin: 0, fontSize: '12px', color: '#6b7280', fontWeight: 600 }}>{etiqueta}</p>
                <p style={{ margin: '2px 0 0', fontSize: '14px', color: '#1f2937' }}>{valor}</p>
              </div>
            ))}
          </div>

          <p style={{ margin: '0 0 8px', fontSize: '13px', fontWeight: 600, color: '#374151' }}>
            Evento recibido de PayPal (payload_raw)
          </p>
          <pre style={{
            margin: 0, padding: '14px', borderRadius: '10px',
            backgroundColor: '#f9fafb', border: '1px solid #e5e7eb',
            fontSize: '12px', maxHeight: '320px', overflow: 'auto', whiteSpace: 'pre-wrap',
          }}>
            {pagoDetalle.payload_raw
              ? JSON.stringify(pagoDetalle.payload_raw, null, 2)
              : 'Todavía no se ha recibido ningún evento para este pago.'}
          </pre>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
            <button
              type="button"
              onClick={() => setPagoDetalle(null)}
              style={{
                padding: '11px 24px', borderRadius: '8px', border: '1.5px solid #e5e7eb',
                backgroundColor: 'white', color: '#374151', fontSize: '14px',
                fontWeight: '500', cursor: 'pointer',
              }}
            >Cerrar</button>
          </div>
        </Modal>
      )}

      <div className="container">

        {/* ── Header ──────────────────────────────────────────────── */}
        <div style={{
          marginBottom: '28px', display: 'flex', alignItems: 'flex-end',
          justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px',
        }}>
          <div>
            <h3 style={{ margin: 0, marginBottom: '4px', fontSize: '24px', fontWeight: '700', color: '#1f2937' }}>
              Gestión de Transacciones
            </h3>
            <p style={{ color: '#6b7280', margin: 0, fontSize: '14px' }}>
              {filteredTransactions.length} transacciones registradas en el sistema
            </p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            style={{
              backgroundColor: CLUB_GREEN, color: 'white', border: 'none',
              padding: '12px 22px', borderRadius: '10px', fontSize: '14px', fontWeight: '600',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
              boxShadow: '0 2px 8px rgba(16,185,129,0.35)',
            }}
          >
            <span style={{ fontSize: '18px', lineHeight: 1 }}>+</span> Nueva Transacción
          </button>
        </div>

        {/* ── Filtros ──────────────────────────────────────────────── */}
        <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
            <span style={{
              position: 'absolute', left: '14px', top: '50%',
              transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none',
            }}>🔍</span>
            <input
              type="text"
              placeholder="Buscar por descripción o categoría..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{
                width: '100%', padding: '10px 14px 10px 40px',
                border: '1.5px solid #e5e7eb', borderRadius: '10px',
                fontSize: '14px', outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value as 'all' | 'income' | 'expense')}
            style={{
              padding: '10px 14px', border: '1.5px solid #e5e7eb', borderRadius: '10px',
              fontSize: '14px', outline: 'none', backgroundColor: 'white',
              color: '#374151', cursor: 'pointer', minWidth: '160px',
            }}
          >
            <option value="all">Todos los tipos</option>
            <option value="income">Solo ingresos</option>
            <option value="expense">Solo gastos</option>
          </select>

          {/* RF-017: filtro por rango de fechas (dd/mm/aaaa) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '12px', color: '#6b7280', fontWeight: 600 }}>Desde</label>
            <input
              type="text"
              inputMode="numeric"
              placeholder="dd/mm/aaaa"
              maxLength={10}
              value={fechaInicio}
              onChange={e => setFechaInicio(formatFechaMask(e.target.value))}
              style={{
                padding: '9px 14px', border: '1.5px solid #e5e7eb', borderRadius: '10px',
                fontSize: '14px', outline: 'none', backgroundColor: 'white', color: '#374151',
                width: '130px',
              }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '12px', color: '#6b7280', fontWeight: 600 }}>Hasta</label>
            <input
              type="text"
              inputMode="numeric"
              placeholder="dd/mm/aaaa"
              maxLength={10}
              value={fechaFin}
              onChange={e => setFechaFin(formatFechaMask(e.target.value))}
              style={{
                padding: '9px 14px', border: '1.5px solid #e5e7eb', borderRadius: '10px',
                fontSize: '14px', outline: 'none', backgroundColor: 'white', color: '#374151',
                width: '130px',
              }}
            />
          </div>
          {(fechaInicio || fechaFin) && (
            <button
              type="button"
              onClick={() => { setFechaInicio(''); setFechaFin(''); }}
              style={{
                padding: '9px 14px', border: '1.5px solid #e5e7eb', borderRadius: '10px',
                fontSize: '13px', backgroundColor: 'white', color: '#6b7280', cursor: 'pointer',
              }}
            >
              Limpiar fechas
            </button>
          )}
        </div>

        {/* ── Tabla ────────────────────────────────────────────────── */}
        <div style={{
          backgroundColor: 'white', borderRadius: '16px',
          boxShadow: '0 1px 4px rgba(0,0,0,0.08)', overflow: 'hidden',
        }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '48px', color: '#9ca3af' }}>
              <div style={{ fontSize: '24px' }}>⏳</div>
              <p style={{ margin: '8px 0 0', fontSize: '14px' }}>Cargando transacciones...</p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                    {['Fecha', 'Tipo', 'Categoría', 'Monto', 'Descripción', 'Método', 'Registrado por', 'Origen'].map((h, i) => (
                    <th
                      key={i}
                      style={{
                        textAlign: 'left', padding: '14px 16px',
                        color: '#6b7280', fontWeight: '600', fontSize: '13px', whiteSpace: 'nowrap',
                      }}
                    >{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '48px', color: '#9ca3af' }}>
                      <div style={{ fontSize: '24px' }}>📭</div>
                      <p style={{ margin: '8px 0 0', fontSize: '14px' }}>No hay transacciones que mostrar</p>
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map(t => (
                    <tr
                      key={t.id}
                      style={{ borderBottom: '1px solid #f3f4f6' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.backgroundColor = '#fafafa'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.backgroundColor = 'transparent'; }}
                    >
                      <td style={{ padding: '14px 16px', color: '#6b7280', fontSize: '14px', whiteSpace: 'nowrap' }}>
                        {formatDateShort(t.fecha)}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        {tipoBadge(t.tipo)}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{
                          padding: '3px 10px', borderRadius: '6px',
                          backgroundColor: '#eff6ff', color: '#1d4ed8',
                          fontWeight: '500', fontSize: '13px',
                        }}>
                          {t.categoria_nombre ?? '—'}
                        </span>
                      </td>
                      <td style={{
                        padding: '14px 16px', fontSize: '14px', fontWeight: '600',
                        color: (t.tipo === 'ingreso' || t.tipo === 'income') ? '#059669' : '#dc2626',
                      }}>
                        {(t.tipo === 'ingreso' || t.tipo === 'income') ? '+' : '−'}{formatCurrency(parseFloat(t.monto), 'COP')}
                      </td>
                      <td style={{ padding: '14px 16px', color: '#374151', fontSize: '14px' }}>
                        {t.descripcion ?? '—'}
                      </td>
                      <td style={{ padding: '14px 16px', color: '#6b7280', fontSize: '13px' }}>
                        <span style={{
                          padding: '3px 10px', borderRadius: '6px',
                          backgroundColor: '#f3f4f6', color: '#374151',
                          fontWeight: '500', fontSize: '12px',
                        }}>
                          {t.metodo_pago ?? '—'}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', color: '#6b7280', fontSize: '13px' }}>
                        {t.creado_por_username ?? '—'}
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: '13px', whiteSpace: 'nowrap' }}>
                        {t.origen === 'pasarela' ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{
                              padding: '3px 10px', borderRadius: '6px',
                              backgroundColor: '#ecfdf5', color: '#047857',
                              fontWeight: '600', fontSize: '12px',
                            }}>
                              Pasarela
                            </span>
                            {t.pago_referencia && (
                              <button
                                type="button"
                                onClick={() => void verDetallePago(t.pago_referencia as string)}
                                disabled={cargandoPago}
                                style={{
                                  padding: '3px 10px', borderRadius: '6px',
                                  border: '1px solid #d1d5db', backgroundColor: 'white',
                                  color: '#374151', fontSize: '12px', cursor: 'pointer',
                                }}
                              >
                                Ver detalle
                              </button>
                            )}
                          </span>
                        ) : (
                          <span style={{
                            padding: '3px 10px', borderRadius: '6px',
                            backgroundColor: '#f3f4f6', color: '#6b7280',
                            fontWeight: '500', fontSize: '12px',
                          }}>
                            Manual
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}