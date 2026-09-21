import React from 'react';
import { CheckCircle2, Loader2, Circle, XCircle } from 'lucide-react';

export default function ProcessingStep({ stepNumber, title, description, status }) {
  // status: 'pending' | 'processing' | 'completed' | 'failed'

  const isCompleted = status === 'completed';
  const isProcessing = status === 'processing';
  const isPending = status === 'pending';
  const isFailed = status === 'failed';

  let statusBg = 'bg-slate-50 text-slate-400 border-slate-200';
  let Icon = Circle;

  if (isCompleted) {
    statusBg = 'bg-emerald-50 text-emerald-600 border-emerald-300';
    Icon = CheckCircle2;
  } else if (isProcessing) {
    statusBg = 'bg-cyan-50 text-cyan-600 border-cyan-400 ring-2 ring-cyan-500/20';
    Icon = Loader2;
  } else if (isFailed) {
    statusBg = 'bg-rose-50 text-rose-600 border-rose-300';
    Icon = XCircle;
  }

  return (
    <div className={`
      flex items-start gap-3.5 p-3.5 rounded-xl border transition-all duration-300
      ${isProcessing ? 'bg-white shadow-md border-cyan-300 -translate-y-0.5' : 'bg-white/80 border-slate-200/80'}
    `}>
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${statusBg}`}>
        <Icon size={18} className={isProcessing ? 'animate-spin' : ''} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <h4 className={`text-xs font-bold tracking-tight ${isProcessing ? 'text-brand-900' : isCompleted ? 'text-slate-800' : 'text-slate-500'}`}>
            <span className="text-slate-400 font-mono mr-1.5">{stepNumber}.</span>
            {title}
          </h4>
          <span className={`text-[10px] font-bold uppercase tracking-wider ${
            isCompleted ? 'text-emerald-600' : isProcessing ? 'text-cyan-600 animate-pulse' : 'text-slate-400'
          }`}>
            {status}
          </span>
        </div>
        {description && (
          <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{description}</p>
        )}
      </div>
    </div>
  );
}
