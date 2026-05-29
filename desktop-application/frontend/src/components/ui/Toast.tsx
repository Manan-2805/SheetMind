import { X } from "lucide-react";
import { createPortal } from "react-dom";

import { type Toast, type ToastType, useToast } from "@/hooks/useToast";
import { cn } from "@/utils/cn";

const TYPE_COLORS: Record<ToastType, string> = {
  success: "var(--color-success)",
  error: "var(--color-destructive)",
  warning: "var(--color-warning)",
  info: "var(--color-accent)",
};

interface ToastItemProps {
  toast: Toast;
  onRemove: (id: string) => void;
}

function ToastItem({ toast, onRemove }: ToastItemProps) {
  return (
    <div
      className={cn(
        "flex w-80 overflow-hidden rounded-lg shadow-lg",
        "transition-all duration-300",
        toast.exiting ? "toast-slide-out" : "animate-in slide-in-from-right-4"
      )}
      style={{
        backgroundColor: "var(--color-bg-elevated)",
        border: "1px solid var(--color-border-default)",
      }}
      role="alert"
    >
      <div
        className="w-1 shrink-0 rounded-l-lg"
        style={{ backgroundColor: TYPE_COLORS[toast.type] }}
      />
      <div className="flex flex-1 items-start gap-3 p-3">
        <div className="flex-1">
          <p className="text-body-em" style={{ color: "var(--color-text-primary)" }}>
            {toast.title}
          </p>
          {toast.description && (
            <p className="mt-0.5 text-body" style={{ color: "var(--color-text-secondary)" }}>
              {toast.description}
            </p>
          )}
        </div>
        <button
          onClick={() => onRemove(toast.id)}
          className="shrink-0 rounded p-0.5 transition-colors duration-[120ms]"
          style={{ color: "var(--color-text-tertiary)" }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = "var(--color-text-primary)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = "var(--color-text-tertiary)";
          }}
          aria-label="Dismiss notification"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}

export function Toast() {
  const { toasts, removeToast } = useToast();

  return createPortal(
    <div
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2"
      aria-live="polite"
      aria-label="Notifications"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
      ))}
    </div>,
    document.body
  );
}
