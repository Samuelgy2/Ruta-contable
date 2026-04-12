import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "./utils";

// ============================================
// ALERT BASE (sin cambios — se mantienen los defaults)
// ============================================

const alertVariants = cva(
  "relative w-full rounded-lg border px-4 py-3 text-sm grid has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] grid-cols-[0_1fr] has-[>svg]:gap-x-3 gap-y-0.5 items-start [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current",
  {
    variants: {
      variant: {
        default: "bg-card text-card-foreground",
        destructive:
          "text-destructive bg-card [&>svg]:text-current *:data-[slot=alert-description]:text-destructive/90",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Alert({
  className,
  variant,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
  return (
    <div
      data-slot="alert"
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  );
}

function AlertTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-title"
      className={cn(
        "col-start-2 line-clamp-1 min-h-4 font-medium tracking-tight",
        className,
      )}
      {...props}
    />
  );
}

function AlertDescription({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-description"
      className={cn(
        "text-muted-foreground col-start-2 grid justify-items-start gap-1 text-sm [&_p]:leading-relaxed",
        className,
      )}
      {...props}
    />
  );
}

export { Alert, AlertTitle, AlertDescription };


// ============================================
// TOAST SYSTEM — alertas estéticas animadas
// ============================================

type ToastType = "info" | "success" | "error" | "warning";

interface ToastItem {
  id: string;
  title: string;
  description?: string;
  type: ToastType;
  visible: boolean;
}

interface ToastContextValue {
  show: (title: string, description?: string, type?: ToastType) => void;
}

const ToastContext = React.createContext<ToastContextValue | null>(null);

// Hook para usar en cualquier componente
export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error("useToast debe usarse dentro de <ToastProvider>");
  return ctx;
}

// Iconos SVG inline por tipo
const icons: Record<ToastType, React.ReactNode> = {
  info: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 7v4M8 5.5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  success: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5 8.5l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  error: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
      <path d="M6 6l4 4M10 6l-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  warning: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M8 2L14.5 13H1.5L8 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M8 6v3.5M8 11v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
};

// Colores por tipo (todos grises con acento sutil)
const typeStyles: Record<ToastType, string> = {
  info:    "border-zinc-200 bg-white text-zinc-700 [&_[data-icon]]:text-zinc-400",
  success: "border-zinc-200 bg-white text-zinc-700 [&_[data-icon]]:text-zinc-500",
  error:   "border-zinc-200 bg-white text-zinc-700 [&_[data-icon]]:text-zinc-400",
  warning: "border-zinc-200 bg-white text-zinc-700 [&_[data-icon]]:text-zinc-400",
};

// Barra de progreso por tipo
const progressColor: Record<ToastType, string> = {
  info:    "bg-zinc-300",
  success: "bg-zinc-400",
  error:   "bg-zinc-300",
  warning: "bg-zinc-300",
};

// Estilos de animación globales (inyectados una sola vez)
const STYLES = `
  @keyframes toast-in {
    from { opacity: 0; transform: translateX(110%); }
    to   { opacity: 1; transform: translateX(0); }
  }
  @keyframes toast-out {
    from { opacity: 1; transform: translateX(0); }
    to   { opacity: 0; transform: translateX(110%); }
  }
  @keyframes progress {
    from { width: 100%; }
    to   { width: 0%; }
  }
  .toast-enter { animation: toast-in 0.35s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
  .toast-exit  { animation: toast-out 0.3s cubic-bezier(0.55, 0, 1, 0.45) forwards; }
  .toast-progress { animation: progress 4s linear forwards; }
`;

function StyleInjector() {
  React.useEffect(() => {
    if (document.getElementById("toast-styles")) return;
    const tag = document.createElement("style");
    tag.id = "toast-styles";
    tag.textContent = STYLES;
    document.head.appendChild(tag);
  }, []);
  return null;
}

// Componente individual de toast
function ToastCard({ toast, onRemove }: { toast: ToastItem; onRemove: (id: string) => void }) {
  return (
    <div
      role="alert"
      className={cn(
        "relative overflow-hidden w-80 rounded-xl border shadow-lg shadow-black/5 px-4 py-3",
        "flex items-start gap-3 cursor-pointer select-none",
        typeStyles[toast.type],
        toast.visible ? "toast-enter" : "toast-exit",
      )}
      onClick={() => onRemove(toast.id)}
    >
      {/* Icono */}
      <span data-icon className="mt-0.5 shrink-0">
        {icons[toast.type]}
      </span>

      {/* Contenido */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium leading-snug text-zinc-800">{toast.title}</p>
        {toast.description && (
          <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">{toast.description}</p>
        )}
      </div>

      {/* Botón cerrar */}
      <button
        onClick={(e) => { e.stopPropagation(); onRemove(toast.id); }}
        className="shrink-0 mt-0.5 text-zinc-300 hover:text-zinc-500 transition-colors"
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>

      {/* Barra de progreso */}
      <span
        className={cn("absolute bottom-0 left-0 h-0.5 toast-progress", progressColor[toast.type])}
      />
    </div>
  );
}

// Provider que envuelve la app
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);

  const remove = React.useCallback((id: string) => {
    // Primero marcar como invisible para animación de salida
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, visible: false } : t))
    );
    // Luego eliminar del DOM
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 350);
  }, []);

  const show = React.useCallback(
    (title: string, description?: string, type: ToastType = "info") => {
      const id = Math.random().toString(36).slice(2);
      setToasts((prev) => [...prev, { id, title, description, type, visible: true }]);
      setTimeout(() => remove(id), 4000);
    },
    [remove]
  );

  return (
    <ToastContext.Provider value={{ show }}>
      <StyleInjector />
      {children}

      {/* Contenedor esquina superior derecha */}
      <div
        aria-live="polite"
        className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none"
      >
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <ToastCard toast={toast} onRemove={remove} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}