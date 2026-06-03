import { createContext, useCallback, useContext, useRef, useState } from 'react';

const ConfirmContext = createContext(null);

export function ConfirmProvider({ children }) {
  const [state, setState] = useState(null);
  const resolveRef = useRef(null);

  const confirm = useCallback((opts) => {
    return new Promise((resolve) => {
      resolveRef.current = resolve;
      setState({
        title: opts.title || 'Confirmer',
        message: opts.message || 'Êtes-vous sûr ?',
        confirmLabel: opts.confirmLabel || 'Confirmer',
        cancelLabel: opts.cancelLabel || 'Annuler',
        danger: !!opts.danger,
      });
    });
  }, []);

  function close(result) {
    setState(null);
    if (resolveRef.current) resolveRef.current(result);
    resolveRef.current = null;
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {state && (
        <div className="modal-backdrop" onClick={() => close(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{state.title}</h3>
            <p className="muted">{state.message}</p>
            <div className="modal-actions">
              <button className="secondary" onClick={() => close(false)}>
                {state.cancelLabel}
              </button>
              <button
                className={state.danger ? 'danger' : ''}
                onClick={() => close(true)}
                autoFocus
              >
                {state.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export const useConfirm = () => useContext(ConfirmContext);
