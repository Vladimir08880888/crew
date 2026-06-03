import { createContext, useCallback, useContext, useState } from 'react';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

let nextId = 1;

const ICONS = {
  success: CheckCircle2,
  error:   XCircle,
  info:    Info,
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const push = useCallback((type, message, duration = 4000) => {
    const id = nextId++;
    setToasts((t) => [...t, { id, type, message }]);
    if (duration > 0) setTimeout(() => dismiss(id), duration);
  }, [dismiss]);

  const api = {
    success: (msg, d) => push('success', msg, d),
    error:   (msg, d) => push('error',   msg, d),
    info:    (msg, d) => push('info',    msg, d),
    fromError(err) {
      if (!err) return;
      const msg = err.message || String(err);
      if (err.details) {
        const fieldMsgs = Object.entries(err.details).map(([k, v]) => `${k}: ${v}`).join(' · ');
        push('error', `${msg} — ${fieldMsgs}`, 6000);
      } else {
        push('error', msg, 5000);
      }
    },
  };

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="toast-stack" role="status" aria-live="polite">
        {toasts.map((t) => {
          const Icon = ICONS[t.type];
          return (
            <div key={t.id} className={`toast ${t.type}`}>
              <span className="toast-icon"><Icon size={18} /></span>
              <span className="toast-body">{t.message}</span>
              <button className="toast-close" onClick={() => dismiss(t.id)} aria-label="Fermer">
                <X size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
