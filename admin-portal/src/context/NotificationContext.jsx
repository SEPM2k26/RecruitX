import { createContext, useContext, useState, useCallback } from 'react';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), duration);
  }, []);

  const success = useCallback((msg) => addToast(msg, 'success'), [addToast]);
  const error = useCallback((msg) => addToast(msg, 'error'), [addToast]);
  const info = useCallback((msg) => addToast(msg, 'info'), [addToast]);
  const warning = useCallback((msg) => addToast(msg, 'warning'), [addToast]);

  return (
    <NotificationContext.Provider value={{ success, error, info, warning }}>
      {children}
      <ToastContainer toasts={toasts} />
    </NotificationContext.Provider>
  );
}

function ToastContainer({ toasts }) {
  if (!toasts.length) return null;
  return (
    <div style={{
      position: 'fixed', bottom: '24px', right: '24px',
      display: 'flex', flexDirection: 'column', gap: '12px', zIndex: 9999,
    }}>
      {toasts.map((t) => (
        <div key={t.id} className={`notification-toast toast-${t.type}`}>
          <div className="tape-strip" style={{ width: 50, height: 14, top: -8 }} />
          <span style={{
            width: 24, height: 24, borderRadius: '50%', border: '2px solid #2d2d2d',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 'bold', fontSize: '13px', background: t.type === 'success' ? '#dcfce7' : '#fee2e2',
            flexShrink: 0
          }}>
            {t.type === 'success' ? '✓' : t.type === 'error' ? '✕' : t.type === 'warning' ? '⚠' : 'ℹ'}
          </span>
          <span style={{ fontFamily: 'var(--font-heading)', fontSize: '15px' }}>{t.message}</span>
        </div>
      ))}
    </div>
  );
}

export const useNotification = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotification must be used within NotificationProvider');
  return ctx;
};
