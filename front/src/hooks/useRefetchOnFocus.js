import { useEffect, useRef } from 'react';

/**
 * Réexécute `load()` quand :
 *   - l'onglet redevient visible (visibilitychange)
 *   - la fenêtre récupère le focus (focus)
 *
 * Throttle interne : pas plus d'un appel toutes les `minIntervalMs` ms
 * pour éviter les rafales si l'utilisateur change vite d'onglet.
 */
export function useRefetchOnFocus(load, { minIntervalMs = 2000 } = {}) {
  const lastRunRef = useRef(0);

  useEffect(() => {
    function maybeRun() {
      const now = Date.now();
      if (now - lastRunRef.current < minIntervalMs) return;
      lastRunRef.current = now;
      load();
    }

    function onVisible() {
      if (document.visibilityState === 'visible') maybeRun();
    }

    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', maybeRun);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', maybeRun);
    };
  }, [load, minIntervalMs]);
}
