import React from 'react';
import { CheckCircle2, AlertTriangle, AlertOctagon } from 'lucide-react';

export default function ActivityChart({ distribution = [] }) {
  const total = distribution.reduce((sum, item) => sum + item.count, 0) || 1;

  const verified = distribution.find(d => d.name === 'Verified')?.count || 0;
  const review = distribution.find(d => d.name === 'Review Required')?.count || 0;
  const suspicious = distribution.find(d => d.name === 'Suspicious')?.count || 0;

  const verifiedPct = Math.round((verified / total) * 100);
  const reviewPct = Math.round((review / total) * 100);
  const suspiciousPct = Math.round((suspicious / total) * 100);

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-card flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="text-sm font-bold text-brand-900">Verification Outcome Ratio</h4>
            <p className="text-xs text-slate-500">Breakdown of screening decisions</p>
          </div>
          <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-brand-50 text-brand-700">
            Total {total}
          </span>
        </div>

        {/* Multi-segment Progress Bar */}
        <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden flex gap-0.5 p-0.5 border border-slate-200">
          <div 
            style={{ width: `${verifiedPct}%` }} 
            className="h-full bg-emerald-500 rounded-l-full transition-all duration-500" 
            title={`Verified: ${verifiedPct}%`}
          />
          <div 
            style={{ width: `${reviewPct}%` }} 
            className="h-full bg-amber-500 transition-all duration-500" 
            title={`Review Required: ${reviewPct}%`}
          />
          <div 
            style={{ width: `${suspiciousPct}%` }} 
            className="h-full bg-rose-500 rounded-r-full transition-all duration-500" 
            title={`Suspicious: ${suspiciousPct}%`}
          />
        </div>

        {/* Detailed Legend */}
        <div className="grid grid-cols-3 gap-3 mt-5 pt-4 border-t border-slate-100">
          <div className="bg-emerald-50/60 rounded-lg p-3 border border-emerald-100">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800 mb-1">
              <CheckCircle2 size={14} className="text-emerald-600" />
              <span>Verified</span>
            </div>
            <p className="text-xl font-bold text-emerald-900 font-mono">{verified}</p>
            <p className="text-[11px] text-emerald-700/80 font-medium">{verifiedPct}% of total</p>
          </div>

          <div className="bg-amber-50/60 rounded-lg p-3 border border-amber-100">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-800 mb-1">
              <AlertTriangle size={14} className="text-amber-600" />
              <span>Review Req.</span>
            </div>
            <p className="text-xl font-bold text-amber-900 font-mono">{review}</p>
            <p className="text-[11px] text-amber-700/80 font-medium">{reviewPct}% of total</p>
          </div>

          <div className="bg-rose-50/60 rounded-lg p-3 border border-rose-100">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-800 mb-1">
              <AlertOctagon size={14} className="text-rose-600" />
              <span>Suspicious</span>
            </div>
            <p className="text-xl font-bold text-rose-900 font-mono">{suspicious}</p>
            <p className="text-[11px] text-rose-700/80 font-medium">{suspiciousPct}% of total</p>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
        <span>Autonomous Decision Rate</span>
        <span className="font-bold text-brand-900 font-mono">
          {Math.round(((verified + suspicious) / total) * 100)}%
        </span>
      </div>
    </div>
  );
}
