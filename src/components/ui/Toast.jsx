import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';

// Toast Context for global toast management
export const ToastContext = React.createContext(null);

// Toast Provider Component
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'info', duration = 5000) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type, duration }]);
    return id;
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const toast = {
    success: (message, duration) => addToast(message, 'success', duration),
    error: (message, duration) => addToast(message, 'error', duration),
    warning: (message, duration) => addToast(message, 'warning', duration),
    info: (message, duration) => addToast(message, 'info', duration),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
};

// Hook to use toast
export const useToast = () => {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

// Individual Toast Component
const Toast = ({ id, message, type, duration, onRemove }) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => onRemove(id), 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [id, duration, onRemove]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => onRemove(id), 300);
  };

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-success-600" aria-hidden="true" />,
    error: <AlertCircle className="w-5 h-5 text-error-600" aria-hidden="true" />,
    warning: <AlertTriangle className="w-5 h-5 text-warning-600" aria-hidden="true" />,
    info: <Info className="w-5 h-5 text-info-600" aria-hidden="true" />,
  };

  const styles = {
    success: 'bg-success-50 border-success-200 text-success-900',
    error: 'bg-error-50 border-error-200 text-error-900',
    warning: 'bg-warning-50 border-warning-200 text-warning-900',
    info: 'bg-info-50 border-info-200 text-info-900',
  };

  return (
    <div
      role="alert"
      aria-live="polite"
      className={`
        flex items-start gap-3 px-4 py-3 rounded-xl border shadow-lg
        min-w-[320px] max-w-md
        transition-all duration-300 ease-out-expo
        ${styles[type]}
        ${isExiting ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0'}
      `}
    >
      <div className="flex-shrink-0 mt-0.5">
        {icons[type]}
      </div>
      <div className="flex-1 text-sm font-medium">
        {message}
      </div>
      <button
        onClick={handleClose}
        className="flex-shrink-0 p-1 rounded-lg hover:bg-black/5 transition-colors"
        aria-label="Fermer la notification"
      >
        <X className="w-4 h-4 opacity-60 hover:opacity-100" />
      </button>
    </div>
  );
};

// Toast Container
const ToastContainer = ({ toasts, onRemove }) => {
  return createPortal(
    <div
      className="fixed top-4 right-4 z-[9999] flex flex-col gap-3"
      aria-live="polite"
      aria-atomic="true"
    >
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          {...toast}
          onRemove={onRemove}
        />
      ))}
    </div>,
    document.body
  );
};

export default Toast;
