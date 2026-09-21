import React from 'react';
import { CheckCircle2, AlertTriangle, AlertOctagon } from 'lucide-react';

export default function StatusBadge({ status, size = 'md', showIcon = true }) {
  const normStatus = (status || '').toUpperCase();

  const isVerified = normStatus === 'VERIFIED' || normStatus === 'PASS';
  const isReview = normStatus === 'REVIEW REQUIRED' || normStatus === 'WARNING';
  const isSuspicious = normStatus === 'SUSPICIOUS' || normStatus === 'FAIL';

  let bgClasses = 'bg-slate-100 text-slate-700 border-slate-200';
  let Icon = AlertTriangle;

  if (isVerified) {
    bgClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-1 ring-emerald-500/10';
    Icon = CheckCircle2;
  } else if (isReview) {
    bgClasses = 'bg-amber-50 text-amber-800 border-amber-200 ring-1 ring-amber-500/10';
    Icon = AlertTriangle;
  } else if (isSuspicious) {
    bgClasses = 'bg-rose-50 text-rose-700 border-rose-200 ring-1 ring-rose-500/10';
    Icon = AlertOctagon;
  }

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs font-semibold',
    md: 'px-2.5 py-1 text-xs font-bold tracking-wider',
    lg: 'px-4 py-1.5 text-sm font-extrabold tracking-wider'
  }[size] || 'px-2.5 py-1 text-xs font-bold';

  const iconSizes = {
    sm: 12,
    md: 14,
    lg: 16
  }[size] || 14;

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border uppercase ${bgClasses} ${sizeClasses}`}>
      {showIcon && <Icon size={iconSizes} className="shrink-0" />}
      <span>{normStatus || 'UNKNOWN'}</span>
    </span>
  );
}
