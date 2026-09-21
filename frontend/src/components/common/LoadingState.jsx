import React from 'react';
import { Loader2, Shield } from 'lucide-react';

export default function LoadingState({ message = "Loading verification data...", subtext = "Connecting to SATYAPAN AI Core" }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[300px] p-8 text-center bg-white rounded-xl border border-slate-200/80 shadow-card">
      <div className="relative mb-4">
        <div className="w-14 h-14 rounded-2xl bg-brand-50 border border-brand-200 flex items-center justify-center">
          <Shield className="w-7 h-7 text-brand-700" />
        </div>
        <div className="absolute -inset-1 rounded-2xl border-2 border-cyan-500/40 border-t-transparent animate-spin" />
      </div>
      <h3 className="text-base font-bold text-brand-900 mb-1">{message}</h3>
      <p className="text-xs text-slate-500 font-medium max-w-sm">{subtext}</p>
    </div>
  );
}
