import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'success', duration = 3500) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 items-end" aria-live="polite">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

const ToastItem = ({ toast, onClose }) => {
  const configs = {
    success: {
      icon: <CheckCircle className="w-5 h-5 shrink-0" />,
      cls: 'bg-white border-l-4 border-emerald-500 text-slate-900',
      iconCls: 'text-emerald-600',
    },
    error: {
      icon: <XCircle className="w-5 h-5 shrink-0" />,
      cls: 'bg-white border-l-4 border-rose-500 text-slate-900',
      iconCls: 'text-rose-600',
    },
    warning: {
      icon: <AlertTriangle className="w-5 h-5 shrink-0" />,
      cls: 'bg-white border-l-4 border-amber-500 text-slate-900',
      iconCls: 'text-amber-600',
    },
    info: {
      icon: <Info className="w-5 h-5 shrink-0" />,
      cls: 'bg-white border-l-4 border-blue-500 text-slate-900',
      iconCls: 'text-blue-600',
    }
  };

  const config = configs[toast.type] || configs.info;

  return (
    <div
      className={`relative flex items-start gap-3 pl-4 pr-10 py-3 rounded-lg shadow-lg min-w-[280px] max-w-sm overflow-hidden ${config.cls} border border-slate-200 animate-fade-in-up`}
    >
      <span className={config.iconCls}>{config.icon}</span>
      <p className="text-sm font-medium leading-snug pt-0.5">{toast.message}</p>
      <button
        onClick={onClose}
        className="absolute top-2 right-2.5 text-slate-400 hover:text-slate-600 transition-colors duration-100"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export const useToast = () => useContext(ToastContext);