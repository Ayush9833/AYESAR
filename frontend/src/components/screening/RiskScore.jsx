import React from 'react';
import StatusBadge from '../common/StatusBadge';

export default function RiskScore({ score = 0, status = 'VERIFIED' }) {
  const normStatus = (status || '').toUpperCase();
  const clampedScore = Math.max(0, Math.min(100, score));

  // Determine color theme based on score & status
  const isVerified = clampedScore <= 40 || normStatus === 'VERIFIED';
  const isReview = (clampedScore > 40 && clampedScore <= 70) || normStatus === 'REVIEW REQUIRED';
  const isSuspicious = clampedScore > 70 || normStatus === 'SUSPICIOUS';

  let colorStroke = '#10B981'; // Green
  let textGrad = 'from-emerald-600 to-teal-700';
  let badgeStatus = 'VERIFIED';
  let riskLevelText = 'Low Risk Assessment';

  if (isReview) {
    colorStroke = '#F59E0B'; // Amber
    textGrad = 'from-amber-600 to-yellow-700';
    badgeStatus = 'REVIEW REQUIRED';
    riskLevelText = 'Moderate Risk / Review Advised';
  } else if (isSuspicious) {
    colorStroke = '#EF4444'; // Red
    textGrad = 'from-rose-600 to-red-700';
    badgeStatus = 'SUSPICIOUS';
    riskLevelText = 'High Fraud Probability';
  }

  // Circular gauge calculations
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (clampedScore / 100) * circumference;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-card flex flex-col items-center text-center relative overflow-hidden">
      <div className="w-full flex items-center justify-between mb-4">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Composite Fraud Risk
        </span>
        <StatusBadge status={badgeStatus} size="sm" />
      </div>

      {/* Circular Gauge */}
      <div className="relative w-36 h-36 flex items-center justify-center my-1">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 128 128">
          {/* Background circle */}
          <circle
            cx="64"
            cy="64"
            r={radius}
            stroke="#F1F5F9"
            strokeWidth="10"
            fill="transparent"
          />
          {/* Animated score stroke */}
          <circle
            cx="64"
            cy="64"
            r={radius}
            stroke={colorStroke}
            strokeWidth="10"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        {/* Center score display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-4xl font-extrabold font-mono tracking-tight bg-clip-text text-transparent bg-gradient-to-br ${textGrad}`}>
            {clampedScore}
          </span>
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Out of 100
          </span>
        </div>
      </div>

      {/* Subtext info */}
      <div className="mt-2 text-center">
        <h4 className="text-sm font-bold text-slate-800">{riskLevelText}</h4>
        <p className="text-[11px] text-slate-500 mt-0.5">
          {isVerified
            ? 'Document satisfies government compliance baseline'
            : isReview
            ? 'Minor discrepancies detected. Human officer approval recommended'
            : 'Multiple fraud signals triggered. Do not approve without secondary physical verification'}
        </p>
      </div>
    </div>
  );
}
