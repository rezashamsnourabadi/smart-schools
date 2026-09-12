import React from 'react';
import { useApp } from '../context/AppContext';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export const NotificationToast: React.FC = () => {
  const { activeToast, clearToast } = useApp();

  if (!activeToast) return null;

  const getIcon = () => {
    switch (activeToast.type) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />;
      case 'info':
      default:
        return <Info className="w-5 h-5 text-teal-600 shrink-0" />;
    }
  };

  const getBorderBg = () => {
    switch (activeToast.type) {
      case 'success':
        return 'border-emerald-200 bg-emerald-50/95';
      case 'warning':
        return 'border-amber-200 bg-amber-50/95';
      case 'info':
      default:
        return 'border-teal-200 bg-teal-50/95';
    }
  };

  return (
    <aside
      id="app-toast-alert"
      aria-label="اعلان سیستم"
      className={`fixed bottom-5 left-5 z-50 max-w-md w-full p-4 rounded-xl border shadow-lg backdrop-blur-xs flex items-start gap-3 transition-all animate-in fade-in slide-in-from-bottom-5 ${getBorderBg()}`}
    >
      {getIcon()}
      <div className="flex-1 text-right">
        <h4 className="text-xs font-bold text-slate-900">{activeToast.title}</h4>
        <p className="text-xs text-slate-700 mt-0.5 leading-relaxed">{activeToast.message}</p>
      </div>
      <button
        id="dismiss-toast-btn"
        onClick={clearToast}
        className="text-slate-400 hover:text-slate-700 p-1 rounded-md transition-colors"
        aria-label="بستن اعلان"
      >
        <X className="w-4 h-4" />
      </button>
    </aside>
  );
};
