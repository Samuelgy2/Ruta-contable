import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "./utils";

// ============================================
// ALERT ORIGINAL (sin cambios)
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

// ============================================
// TOAST — Alerta estética con animación lateral
// ============================================

type ToastType = "success" | "error" | "warning" | "info";

interface ToastData {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
}

const ToastIcons: Record<ToastType, React.ReactNode> = {
  success: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5 8l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  error: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5.5 5.5l5 5M10.5 5.5l-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  warning: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M8 2L14.5 13H1.5L8 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M8 6v3M8 11v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  info: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 7v4M8 5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
};

const toastIconColors: Record<ToastType, string> = {
  success: "text-emerald-600 dark:text-emerald-400",
  error:   "text-rose-600 dark:text-rose-400",
  warning: "text-amber-600 dark:text-amber-400",
  info:    "text-sky-600 dark:text-sky-400",
};

const toastAccentColors: Record<ToastType, string> = {
  success: "bg-emerald-500",
  error:   "bg-rose-500",
  warning: "bg-amber-500",
  info:    "bg-sky-500",
};

// Inyectar keyframes una sola vez en el DOM
const TOAST_STYLE_ID = "toast-keyframes";

function injectToastStyles() {
  if (typeof document === "undefined") return;
  if (document.getElementById(TOAST_STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = TOAST_STYLE_ID;
  style.textContent = `
    @keyframes toast-in {
      from { transform: translateX(110%); opacity: 0; }
      to   { transform: translateX(0);    opacity: 1; }
    }
    @keyframes toast-out {
      from { transform: translateX(0);    opacity: 1; max-height: 120px; margin-bottom: 8px; }
      to   { transform: translateX(110%); opacity: 0; max-height: 0;     margin-bottom: 0;  }
    }
    .toast-enter { animation: toast-in  0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
    .toast-exit  { animation: toast-out 0.28s cubic-bezier(0.4, 0, 1, 1) forwards; }
  `;
  document.head.appendChild(style);
}

// Item individual
function ToastItem({
  toast,
  onRemove,
}: {
  toast: ToastData;
  onRemove: (id: string) => void;
}) {
  const [exiting, setExiting] = React.useState(false);

  const handleClose = React.useCallback(() => {
    setExiting(true);
    setTimeout(() => onRemove(toast.id), 260);
  }, [toast.id, onRemove]);

  React.useEffect(() => {
    const timer = setTimeout(handleClose, 4000);
    return () => clearTimeout(timer);
  }, [handleClose]);

  return (
    <div
      role="alert"
      className={cn(
        exiting ? "toast-exit" : "toast-enter",
        "relative flex items-start gap-3",
        "w-80 rounded-xl border border-zinc-200 dark:border-zinc-700",
        "bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm",
        "px-4 py-3 shadow-lg shadow-zinc-200/50 dark:shadow-black/40",
        "overflow-hidden",
      )}
    >
      {/* Barra de acento izquierda */}
      <span
        className={cn(
          "absolute left-0 top-0 bottom-0 w-[3px] rounded-l-xl",
          toastAccentColors[toast.type],
        )}
      />

      {/* Ícono */}
      <span className={cn("mt-0.5 shrink-0", toastIconColors[toast.type])}>
        {ToastIcons[toast.type]}
      </span>

      {/* Texto */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 leading-snug">
          {toast.title}
        </p>
        {toast.description && (
          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
            {toast.description}
          </p>
        )}
      </div>

      {/* Botón cerrar */}
      <button
        onClick={handleClose}
        aria-label="Cerrar notificación"
        className="shrink-0 mt-0.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}

// Contenedor fijo esquina superior derecha
function ToastContainer({
  toasts,
  onRemove,
}: {
  toasts: ToastData[];
  onRemove: (id: string) => void;
}) {
  React.useEffect(() => {
    injectToastStyles();
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="fixed top-4 right-4 z-50 flex flex-col gap-2 items-end pointer-events-none"
    >
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto">
          <ToastItem toast={t} onRemove={onRemove} />
        </div>
      ))}
    </div>
  );
}

// Hook para disparar toasts desde cualquier componente
function useToast() {
  const [toasts, setToasts] = React.useState<ToastData[]>([]);

  const addToast = React.useCallback(
    (type: ToastType, title: string, description?: string) => {
      const id = Math.random().toString(36).slice(2, 9);
      setToasts((prev) => [...prev, { id, type, title, description }]);
    },
    [],
  );

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = React.useMemo(
    () => ({
      success: (title: string, description?: string) =>
        addToast("success", title, description),
      error: (title: string, description?: string) =>
        addToast("error", title, description),
      warning: (title: string, description?: string) =>
        addToast("warning", title, description),
      info: (title: string, description?: string) =>
        addToast("info", title, description),
    }),
    [addToast],
  );

  return { toasts, removeToast, toast };
}

export {
  // Originales — sin cambios
  Alert,
  AlertTitle,
  AlertDescription,
  // Nuevos
  ToastContainer,
  useToast,
  type ToastType,
  type ToastData,
};