import React, { useEffect } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const NotificationToast: React.FC = () => {
  const { activeToast, clearToast } = useApp();
  const reducedMotion = useReducedMotion();
  useEffect(() => {
    if (!activeToast || activeToast.type === 'warning') return;
    const timer = setTimeout(clearToast, 7000);
    return () => clearTimeout(timer);
  }, [activeToast, clearToast]);
  const Icon = activeToast?.type === 'success' ? CheckCircle2 : activeToast?.type === 'warning' ? AlertCircle : Info;
  const color = activeToast?.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-950' : activeToast?.type === 'warning' ? 'border-amber-300 bg-amber-50 text-amber-950' : 'border-teal-200 bg-teal-50 text-teal-950';
  return <AnimatePresence>{activeToast && <motion.aside
    key="system-toast" id="app-toast-alert" role={activeToast.type === 'warning' ? 'alert' : 'status'} aria-label="اعلان سیستم"
    initial={{ opacity: 0, y: reducedMotion ? 0 : 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: reducedMotion ? 0 : 8 }} transition={{ duration: reducedMotion ? 0 : 0.18 }}
    className={`fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom,0px)+5.5rem)] md:inset-x-auto md:end-6 md:bottom-6 z-[120] md:w-96 p-3 rounded-2xl border shadow-lg flex items-start gap-2 ${color}`}
  >
    <Icon className="size-5 shrink-0 mt-2" />
    <div className="flex-1 min-w-0 py-1"><h4 className="text-sm font-bold">{activeToast.title}</h4><p className="text-xs leading-6 break-words mt-1">{activeToast.message}</p></div>
    <button id="dismiss-toast-btn" onClick={clearToast} aria-label="بستن اعلان" className="min-w-11 min-h-11 rounded-xl flex items-center justify-center hover:bg-black/5"><X className="size-4" /></button>
  </motion.aside>}</AnimatePresence>;
};
