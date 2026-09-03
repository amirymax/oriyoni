"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

/**
 * Corner notifications for the admin panel.
 *
 * The admin forms are long enough that a message rendered at the top of the
 * form is off-screen by the time the save button is pressed, so the outcome
 * of a save is reported here instead — pinned to the top-right corner of the
 * viewport, above whatever the page is scrolled to.
 *
 * A success message clears itself; a failure does not. An error is something
 * the operator still has to act on, and having it vanish mid-read (taking the
 * only copy of "SKU уже занят" with it) is exactly the wrong moment to be
 * tidy. Errors stay until their ✕ is clicked.
 */

export type ToastTone = "success" | "error";

export type ToastInput = {
  tone: ToastTone;
  title: string;
  /** Extra lines listed under the title — field errors, mostly. */
  details?: string[];
};

type Toast = ToastInput & { id: number };

/** How long a success message stays up. Errors ignore this. */
const SUCCESS_TIMEOUT_MS = 4000;

type ToastApi = {
  /** Shows a notification and returns its id, for `dismissToast`. */
  showToast: (toast: ToastInput) => number;
  dismissToast: (id: number) => void;
};

const ToastContext = createContext<ToastApi | null>(null);

export function useToast(): ToastApi {
  const api = useContext(ToastContext);
  if (!api) throw new Error("useToast must be used inside <ToastProvider>.");
  return api;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  // Ids only have to be unique within this mount, and a counter avoids
  // Date.now() collisions when two toasts are queued in the same tick.
  const nextId = useRef(1);

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback((toast: ToastInput) => {
    const id = nextId.current++;
    setToasts((prev) => [...prev, { ...toast, id }]);
    return id;
  }, []);

  const api = useMemo(() => ({ showToast, dismissToast }), [showToast, dismissToast]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      {/* `pointer-events-none` on the stack so the empty space beside a narrow
          toast doesn't sit on top of the page; each card opts back in. */}
      <div
        aria-live="polite"
        className="pointer-events-none fixed right-4 top-4 z-50 flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2 sm:right-6 sm:top-6"
      >
        {toasts.map((toast) => (
          <ToastCard key={toast.id} toast={toast} onDismiss={dismissToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastCard({ toast, onDismiss }: { toast: Toast; onDismiss: (id: number) => void }) {
  const isError = toast.tone === "error";

  useEffect(() => {
    if (isError) return;
    const timer = window.setTimeout(() => onDismiss(toast.id), SUCCESS_TIMEOUT_MS);
    return () => window.clearTimeout(timer);
  }, [isError, toast.id, onDismiss]);

  return (
    <div
      role={isError ? "alert" : "status"}
      className={`toast-enter pointer-events-auto flex items-start gap-3 border px-4 py-3 shadow-[0_10px_30px_rgb(10_10_10/0.12)] ${
        isError
          ? "border-red-700/30 bg-red-50 text-red-800"
          : "border-green-700/30 bg-green-50 text-green-900"
      }`}
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{toast.title}</p>
        {toast.details && toast.details.length > 0 ? (
          <ul className="mt-1.5 space-y-1 text-xs leading-relaxed">
            {toast.details.map((line, index) => (
              <li key={index} className="break-words">
                {line}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        aria-label="Закрыть уведомление"
        className={`-mr-1 -mt-0.5 shrink-0 cursor-pointer px-1 text-sm leading-none opacity-60 transition-opacity hover:opacity-100 ${
          isError ? "text-red-800" : "text-green-900"
        }`}
      >
        ✕
      </button>
    </div>
  );
}
