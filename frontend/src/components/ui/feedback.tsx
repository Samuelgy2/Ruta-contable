// Avisos emergentes de toda la app: un solo estilo de toast y de confirmación.
// Reemplaza a alert()/confirm() del navegador y a las copias que tenía cada página.
//
//   toast('Guardado')                       → aviso verde arriba a la derecha
//   toast('Falló', 'error')
//   if (await confirmar({ title, message })) { ... }
//
// <FeedbackHost /> se monta una sola vez en App.tsx.
import { useEffect, useState } from 'react';

export type ToastType = 'success' | 'error' | 'warning';
export interface Toast { id: number; message: string; type: ToastType; }

export interface ConfirmOptions {
  title: string;
  message?: string;
  icon?: string;
  confirmLabel?: string;
  confirmColor?: string;
}

interface PendingConfirm extends ConfirmOptions { resolve: (ok: boolean) => void; }

// ─── Estado global ────────────────────────────────────────────────────────────
let toasts: Toast[] = [];
let pending: PendingConfirm | null = null;
let nextId = 1;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach(fn => fn());

export function toast(message: string, type: ToastType = 'success', ms = 3500): void {
  const id = nextId++;
  toasts = [...toasts, { id, message, type }];
  emit();
  setTimeout(() => {
    toasts = toasts.filter(t => t.id !== id);
    emit();
  }, ms);
}

/** Pide confirmación con el diálogo de la app. Resuelve true si el usuario acepta. */
export function confirmar(options: ConfirmOptions): Promise<boolean> {
  pending?.resolve(false);
  return new Promise(resolve => {
    pending = { ...options, resolve };
    emit();
  });
}

function cerrarConfirm(ok: boolean): void {
  const p = pending;
  pending = null;
  emit();
  p?.resolve(ok);
}

/** Compatibilidad con las páginas que usaban `const { show } = useToast()`. */
export function useToast() {
  return { show: toast };
}

// ─── Vista ────────────────────────────────────────────────────────────────────
const COLORS: Record<ToastType, { bg: string; border: string; icon: string }> = {
  success: { bg: '#f0fdf4', border: '#10b981', icon: '✓' },
  error:   { bg: '#fef2f2', border: '#ef4444', icon: '✕' },
  warning: { bg: '#fffbeb', border: '#f59e0b', icon: '⚠' },
};

export function ConfirmDialog({
  title, message, onConfirm, onCancel,
  icon = '🗑️', confirmLabel = 'Eliminar', confirmColor = '#ef4444',
}: ConfirmOptions & { onConfirm: () => void; onCancel: () => void }) {
  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [onCancel]);

  return (
    <div role="alertdialog" aria-modal="true" aria-label={title} onClick={onCancel} style={{ position: 'fixed', inset: 0, zIndex: 2000, backgroundColor: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', animation: 'fbFade 0.2s ease' }}>
      <div onClick={e => e.stopPropagation()} style={{ backgroundColor: 'white', borderRadius: '16px', padding: '28px 32px', width: '100%', maxWidth: '380px', boxShadow: '0 20px 60px rgba(0,0,0,0.25)', textAlign: 'center', animation: 'fbPop 0.25s cubic-bezier(0.34,1.56,0.64,1)' }}>
        <div style={{ fontSize: '36px', marginBottom: '12px' }} aria-hidden="true">{icon}</div>
        <h3 style={{ margin: '0 0 8px', color: '#1f2937', fontSize: '17px' }}>{title}</h3>
        {message && <p style={{ margin: '0 0 24px', color: '#6b7280', fontSize: '14px' }}>{message}</p>}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: message ? 0 : '16px' }}>
          <button onClick={onCancel} style={{ padding: '10px 24px', borderRadius: '8px', border: '1px solid #d1d5db', backgroundColor: 'white', color: '#374151', fontSize: '14px', fontWeight: '500', cursor: 'pointer' }}>Cancelar</button>
          <button onClick={onConfirm} autoFocus style={{ padding: '10px 24px', borderRadius: '8px', border: 'none', backgroundColor: confirmColor, color: 'white', fontSize: '14px', fontWeight: '500', cursor: 'pointer' }}>{confirmLabel}</button>
        </div>
      </div>
      <style>{`
        @keyframes fbFade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fbPop { from { opacity: 0; transform: scale(0.93) translateY(12px); } to { opacity: 1; transform: scale(1) translateY(0); } }
      `}</style>
    </div>
  );
}

export function FeedbackHost() {
  const [, setTick] = useState(0);
  useEffect(() => {
    const fn = () => setTick(t => t + 1);
    listeners.add(fn);
    return () => { listeners.delete(fn); };
  }, []);

  return (
    <>
      <div role="status" aria-live="polite" style={{ position: 'fixed', top: '24px', right: '24px', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {toasts.map(t => {
          const c = COLORS[t.type];
          return (
            <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: c.bg, border: `1px solid ${c.border}`, borderLeft: `4px solid ${c.border}`, borderRadius: '10px', padding: '14px 18px', boxShadow: '0 4px 16px rgba(0,0,0,0.10)', minWidth: '280px', maxWidth: '360px', animation: 'fbSlide 0.25s ease' }}>
              <span style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: c.border, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '700', flexShrink: 0 }}>{c.icon}</span>
              <span style={{ fontSize: '14px', color: '#1f2937', fontWeight: '500' }}>{t.message}</span>
            </div>
          );
        })}
        <style>{`@keyframes fbSlide { from { opacity: 0; transform: translateX(24px); } to { opacity: 1; transform: translateX(0); } }`}</style>
      </div>
      {pending && (
        <ConfirmDialog
          {...pending}
          onConfirm={() => cerrarConfirm(true)}
          onCancel={() => cerrarConfirm(false)}
        />
      )}
    </>
  );
}
