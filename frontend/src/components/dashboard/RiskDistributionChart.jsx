import React from 'react';

export default function RiskDistributionChart({ distribution = [] }) {
  const maxCount = Math.max(...distribution.map(d => d.count), 1);

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-card">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="text-sm font-bold text-brand-900">Risk Score Distribution</h4>
          <p className="text-xs text-slate-500">Document volume grouped by risk severity</p>
        </div>
        <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-600">
          5 Brackets
        </span>
      </div>

      <div className="space-y-3 pt-2">
        {distribution.map((item, idx) => {
          const percent = Math.round((item.count / maxCount) * 100);
          
          let barColor = 'bg-emerald-500';
          if (idx === 2) barColor = 'bg-amber-500';
          else if (idx >= 3) barColor = 'bg-rose-500';

          return (
            <div key={item.range} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700">{item.range}</span>
                <span className="font-bold text-brand-900 font-mono">{item.count} docs</span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${barColor} rounded-full transition-all duration-500`}
                  style={{ width: `${Math.max(item.count > 0 ? 8 : 0, percent)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
