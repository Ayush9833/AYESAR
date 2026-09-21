import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, ShieldCheck, Database, Calendar, Clock, ShieldAlert } from 'lucide-react';

export default function ValidationCard({ validationResults }) {
  const { 
    valid, 
    passedChecks = [], 
    warnings = [], 
    failedChecks = [], 
    score = 95,
    watchlistStatus = "CLEAN (Zero LOC / Interpol Hits)",
    expiryStatus = "VALID"
  } = validationResults || {};

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-card">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
              MODULE 2: DOCUMENT VALIDATION
            </span>
            <span className="text-[10px] font-mono text-slate-400">Verhoeff D₅ • ICAO-9303 Mod-7 • MHA LOC Database</span>
          </div>
          <h4 className="text-base font-bold text-brand-900">Algorithmic, Expiration & Database Validation</h4>
          <p className="text-xs text-slate-500">
            Cross-references mathematical checksums, travel document expiration, and MHA / Interpol blacklists
          </p>
        </div>
        <div className={`px-2.5 py-1 rounded-full text-xs font-bold border self-start sm:self-auto ${
          valid ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
        }`}>
          {valid ? 'Passed Rules & Database (100%)' : 'Validation / Blacklist Alert'}
        </div>
      </div>

      {/* Quick Security Pillars Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-4">
        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center gap-2">
          <ShieldCheck size={16} className="text-brand-700 shrink-0" />
          <div className="min-w-0">
            <span className="block text-[9px] font-bold uppercase tracking-wider text-slate-400">Checksum Algorithm</span>
            <span className="text-xs font-extrabold text-slate-800">ICAO 9303 / Verhoeff</span>
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center gap-2">
          <Clock size={16} className="text-cyan-700 shrink-0" />
          <div className="min-w-0">
            <span className="block text-[9px] font-bold uppercase tracking-wider text-slate-400">Temporal Validity</span>
            <span className={`text-xs font-extrabold ${expiryStatus === 'EXPIRED' ? 'text-rose-600' : 'text-emerald-700'}`}>
              {expiryStatus === 'EXPIRED' ? 'EXPIRED TRAVEL DOC' : 'Active / Valid Expiry'}
            </span>
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center gap-2">
          <Database size={16} className="text-purple-700 shrink-0" />
          <div className="min-w-0">
            <span className="block text-[9px] font-bold uppercase tracking-wider text-slate-400">MHA / Interpol LOC</span>
            <span className={`text-xs font-extrabold truncate ${failedChecks.some(c => c.name?.includes('Watchlist') || c.name?.includes('LOC')) ? 'text-rose-600' : 'text-emerald-700'}`}>
              {watchlistStatus}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-2.5">
        {/* Passed Checks */}
        {passedChecks.map((check, idx) => (
          <div key={`p-${idx}`} className="p-3 rounded-xl bg-emerald-50/40 border border-emerald-100 flex items-start gap-3">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-950">{check.name}</span>
                <span className="text-[10px] font-bold uppercase text-emerald-700 font-mono">PASS</span>
              </div>
              <p className="text-[11px] text-emerald-800/80 mt-0.5">{check.detail}</p>
            </div>
          </div>
        ))}

        {/* Warnings */}
        {warnings.map((check, idx) => (
          <div key={`w-${idx}`} className="p-3 rounded-xl bg-amber-50/50 border border-amber-200 flex items-start gap-3">
            <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-950">{check.name}</span>
                <span className="text-[10px] font-bold uppercase text-amber-800 font-mono">WARNING</span>
              </div>
              <p className="text-[11px] text-amber-800/80 mt-0.5">{check.detail}</p>
            </div>
          </div>
        ))}

        {/* Failed Checks */}
        {failedChecks.map((check, idx) => (
          <div key={`f-${idx}`} className="p-3 rounded-xl bg-rose-50/50 border border-rose-200 flex items-start gap-3">
            <XCircle size={16} className="text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rose-950">{check.name}</span>
                <span className="text-[10px] font-bold uppercase text-rose-700 font-mono">ALERT / FAIL</span>
              </div>
              <p className="text-[11px] text-rose-800/80 mt-0.5">{check.detail}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

