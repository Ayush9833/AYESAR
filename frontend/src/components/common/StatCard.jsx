import React from 'react';

export default function StatCard({
  title,
  value,
  subtext,
  icon: Icon,
  color = 'blue',
  trend = null
}) {
  const colorMap = {
    blue: {
      bg: 'bg-blue-50/80',
      iconBg: 'bg-blue-500/10 text-blue-600',
      accent: 'text-brand-900'
    },
    green: {
      bg: 'bg-emerald-50/70',
      iconBg: 'bg-emerald-500/10 text-emerald-600',
      accent: 'text-emerald-700'
    },
    amber: {
      bg: 'bg-amber-50/70',
      iconBg: 'bg-amber-500/10 text-amber-600',
      accent: 'text-amber-700'
    },
    red: {
      bg: 'bg-rose-50/70',
      iconBg: 'bg-rose-500/10 text-rose-600',
      accent: 'text-rose-700'
    },
    purple: {
      bg: 'bg-purple-50/70',
      iconBg: 'bg-purple-500/10 text-purple-600',
      accent: 'text-purple-700'
    }
  };

  const scheme = colorMap[color] || colorMap.blue;

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-card hover:shadow-card-hover transition-all duration-200 relative overflow-hidden group">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
            {title}
          </p>
          <div className="flex items-baseline gap-2">
            <h3 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${scheme.accent}`}>
              {value}
            </h3>
            {trend && (
              <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                {trend}
              </span>
            )}
          </div>
          {subtext && (
            <p className="text-xs text-slate-500 mt-1.5 font-medium">
              {subtext}
            </p>
          )}
        </div>
        {Icon && (
          <div className={`p-3 rounded-xl ${scheme.iconBg} transition-transform group-hover:scale-110 duration-200`}>
            <Icon size={22} />
          </div>
        )}
      </div>
      <div className={`absolute bottom-0 left-0 right-0 h-1 ${scheme.bg.replace('/70', '').replace('/80', '')}`} />
    </div>
  );
}
