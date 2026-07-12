import { useCallback, useState } from 'react';

/**
 * useToasts — minimal, self-contained toast manager (no context needed).
 * Returns { toasts, notify, dismiss }. The orchestrator renders <ToastStack/>.
 *
 * notify(message, kind='info') where kind ∈ 'success' | 'error' | 'warning' | 'info'.
 * Auto-dismisses after 4.5s.
 */
export function useToasts() {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const notify = useCallback((message, kind = 'info') => {
    const id = `t-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts((prev) => [...prev, { id, message, kind }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  return { toasts, notify, dismiss };
}
