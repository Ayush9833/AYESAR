import React from 'react';
import { ShieldAlert, AlertTriangle, CheckCircle2, ChevronRight, HelpCircle } from 'lucide-react';

export default function RiskBreakdown({ riskBreakdown = [], reasons = [], status }) {
  const isSuspicious = status === 'SUSPICIOUS';
  const isReview = status === 'REVIEW REQUIRED';

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-card space-y-6">
      {/* Top: Explanatory Risk Reasons */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          {isSuspicious ? (
            <ShieldAlert className="text-rose-600" size={18} />
          ) : isReview ? (
            <AlertTriangle className="text-amber-600" size={18} />
          ) : (
            <CheckCircle2 className="text-emerald-600" size={18} />
          )}
          <h4 className="text-sm font-bold text-brand-900">
            {isSuspicious 
              ? 'Fraud Detection Engine Findings' 
              : isReview 
              ? 'Review Triggers & Discrepancies' 
              : 'Verification Confirmation Factors'}
          </h4>
        </div>
        <p className="text-xs text-slate-500 mb-3">
          Automated multi-signal synthesis generated for regulatory compliance:
        </p>

        <ul className="space-y-2">
          {reasons.map((reason, idx) => (
            <li
              key={idx}
              className={`p-3 rounded-xl border text-xs font-medium flex items-start gap-2.5 ${
                isSuspicious
                  ? 'bg-rose-50/50 border-rose-200 text-rose-900'
                  : isReview
                  ? 'bg-amber-50/50 border-amber-200 text-amber-900'
                  : 'bg-emerald-50/50 border-emerald-200 text-emerald-900'
              }`}
            >
              <span className="font-bold text-[11px] font-mono mt-0.5">•</span>
              <span>{reason}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Bottom: Weighted Multi-Signal Composition Table */}
      <div className="pt-4 border-t border-slate-100">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Multi-Signal Weighting Matrix
            </h5>
            <p className="text-[11px] text-slate-400">
              Primary USP: Multi-Signal Verification Instead of Single-Point Verification
            </p>
          </div>
          <span className="text-[10px] font-mono font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-600">
            100% Weight Sum
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                <th className="pb-2">Signal Stream</th>
                <th className="pb-2">Weight</th>
                <th className="pb-2">Signal Health</th>
                <th className="pb-2 text-right">Risk Contribution</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {riskBreakdown.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-2.5 font-bold text-slate-800 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
                    {item.factor}
                  </td>
                  <td className="py-2.5 font-mono text-slate-500 font-semibold">{item.weight}</td>
                  <td className="py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${
                            item.score >= 80 ? 'bg-emerald-500' : item.score >= 60 ? 'bg-amber-500' : 'bg-rose-500'
                          }`}
                          style={{ width: `${item.score}%` }}
                        />
                      </div>
                      <span className="font-mono text-[11px] font-bold text-slate-700">{item.score}%</span>
                    </div>
                  </td>
                  <td className="py-2.5 text-right font-semibold">
                    <span className={`px-2 py-0.5 rounded text-[10px] ${
                      item.contribution === 'Low Risk' 
                        ? 'bg-emerald-50 text-emerald-700' 
                        : item.contribution.includes('Moderate') 
                        ? 'bg-amber-50 text-amber-700' 
                        : 'bg-rose-50 text-rose-700'
                    }`}>
                      {item.contribution}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
