import React from 'react';
import { CheckCircle2, AlertTriangle, AlertOctagon, X } from 'lucide-react';

export default function Toast({ message, type = 'info', onClose }) {
  if (!message) return null;

  const isSuccess = type === 'success';
  const isError = type === 'error';
  const isWarning = type === 'warning';

  let borderClasses = 'border-blue-200 bg-blue-50 text-blue-900';
  let Icon = AlertTriangle;

  if (isSuccess) {
    borderClasses = 'border-emerald-200 bg-emerald-50 text-emerald-900';
    Icon = CheckCircle2;
  } else if (isError) {
    borderClasses = 'border-rose-200 bg-rose-50 text-rose-900';
    Icon = AlertOctagon;
  }

  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 p-4 rounded-xl border shadow-elevated ${borderClasses} max-w-md animate-in slide-in-from-bottom-5 duration-200`}>
      <Icon size={20} className="shrink-0" />
      <p className="text-xs font-semibold flex-1 leading-snug">{message}</p>
      <button onClick={onClose} className="p-1 hover:opacity-75 rounded">
        <X size={16} />
      </button>
    </div>
  );
}
