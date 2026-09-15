import { useEffect, useRef } from 'react';
import { useSession } from '../../context/SessionContext';

const TOAST_DURATION = 3500;
const MAX_TOASTS = 4;

export default function ToastContainer() {
  const { toasts, dispatch } = useSession();
  const timersRef = useRef({});

  // Auto-dismiss toasts
  useEffect(() => {
    toasts.forEach((toast) => {
      if (!timersRef.current[toast.id]) {
        timersRef.current[toast.id] = setTimeout(() => {
          dispatch({ type: 'REMOVE_TOAST', id: toast.id });
          delete timersRef.current[toast.id];
        }, TOAST_DURATION);
      }
    });

    // Cleanup stale timers
    const toastIds = new Set(toasts.map((t) => t.id));
    Object.keys(timersRef.current).forEach((id) => {
      if (!toastIds.has(id)) {
        clearTimeout(timersRef.current[id]);
        delete timersRef.current[id];
      }
    });
  }, [toasts, dispatch]);

  // Cleanup on unmount
  useEffect(() => {
    const currentTimers = timersRef.current;
    return () => {
      Object.values(currentTimers).forEach(clearTimeout);
    };
  }, []);

  const visibleToasts = toasts.slice(-MAX_TOASTS);

  if (visibleToasts.length === 0) return null;

  return (
    <div className="toast-container">
      {visibleToasts.map((toast) => (
        <div
          key={toast.id}
          className={`toast toast-${toast.variant || 'info'}`}
        >
          <div className="toast-accent" />
          <div className="toast-body">
            <span className="toast-icon">{toast.icon || '📡'}</span>
            <span className="toast-message">{toast.message}</span>
          </div>
          <button
            className="toast-close"
            onClick={() => dispatch({ type: 'REMOVE_TOAST', id: toast.id })}
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
