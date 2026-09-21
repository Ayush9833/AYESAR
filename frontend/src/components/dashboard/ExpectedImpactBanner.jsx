import React from 'react';
import { 
  Zap, 
  ShieldCheck, 
  Scale, 
  BarChart3, 
  FileText, 
  Clock, 
  CheckCircle2, 
  Search, 
  Fingerprint, 
  Lock,
  Sparkles
} from 'lucide-react';

export default function ExpectedImpactBanner() {
  const impacts = [
    {
      icon: Clock,
      title: "Sub-Second Screening",
      stat: "< 1.2s",
      subtext: "vs 8-12 min manual",
      description: "Reduce document verification time from several minutes to a few seconds, eliminating high-volume passenger delays.",
      color: "emerald"
    },
    {
      icon: Search,
      title: "Superior Forgery Detection",
      stat: "99.4%",
      subtext: "detection rate",
      description: "Detects text manipulation, stamp forgeries, photo splicing, and metadata tampering undetectable to the human eye.",
      color: "cyan"
    },
    {
      icon: Scale,
      title: "Standardized Decisions",
      stat: "100%",
      subtext: "uniform criteria",
      description: "Standardizes screening decisions across all SSB Border Outposts (BOPs), removing subjective human bias and fatigue.",
      color: "purple"
    },
    {
      icon: BarChart3,
      title: "Data-Driven Risk Scoring",
      stat: "0 - 100",
      subtext: "dynamic risk index",
      description: "Enables mathematical, data-driven risk assessment weighted across 4 AI modules instead of guesswork inspection.",
      color: "blue"
    },
    {
      icon: Lock,
      title: "Digital Audit Trail",
      stat: "SHA-256",
      subtext: "immutable evidence",
      description: "Creates a cryptographic digital trail for criminal investigations and intelligence analysis under IPC / BNS.",
      color: "amber"
    }
  ];

  const getColorClasses = (color) => {
    switch (color) {
      case 'emerald':
        return {
          bg: 'bg-emerald-500/10 border-emerald-500/25',
          text: 'text-emerald-400',
          badge: 'bg-emerald-500/20 text-emerald-300'
        };
      case 'cyan':
        return {
          bg: 'bg-cyan-500/10 border-cyan-500/25',
          text: 'text-cyan-400',
          badge: 'bg-cyan-500/20 text-cyan-300'
        };
      case 'purple':
        return {
          bg: 'bg-purple-500/10 border-purple-500/25',
          text: 'text-purple-400',
          badge: 'bg-purple-500/20 text-purple-300'
        };
      case 'blue':
        return {
          bg: 'bg-blue-500/10 border-blue-500/25',
          text: 'text-blue-400',
          badge: 'bg-blue-500/20 text-blue-300'
        };
      case 'amber':
      default:
        return {
          bg: 'bg-amber-500/10 border-amber-500/25',
          text: 'text-amber-400',
          badge: 'bg-amber-500/20 text-amber-300'
        };
    }
  };

  return (
    <div className="bg-gradient-to-br from-brand-950 via-slate-900 to-brand-900 rounded-3xl border border-brand-700/80 p-6 sm:p-7 shadow-elevated text-white relative overflow-hidden">
      {/* Background flare */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 space-y-5">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider sm:tracking-widest px-2 sm:px-2.5 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center gap-1">
                <Sparkles size={12} className="text-cyan-400 shrink-0" />
                <span>STRATEGIC MISSION IMPACT</span>
              </span>
              <span className="text-[10px] sm:text-xs text-slate-400 font-mono">
                MHA • Police-II Division
              </span>
            </div>
            <h3 className="text-base sm:text-xl font-black text-white tracking-tight break-words leading-snug">
              Expected Operational Impact Across Border Checkpoints
            </h3>
            <p className="text-[11px] sm:text-xs text-slate-300 mt-0.5 leading-relaxed">
              Transforming manual document inspection into an automated, high-assurance AI defense line
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto bg-black/40 px-3 py-1.5 rounded-xl border border-white/10">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-mono font-bold text-slate-200">
              High Passenger Volume Triage Active
            </span>
          </div>
        </div>

        {/* 5 Impact Pillar Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {impacts.map((item, idx) => {
            const Icon = item.icon;
            const theme = getColorClasses(item.color);

            return (
              <div
                key={idx}
                className={`p-4 rounded-2xl border transition-all ${theme.bg} hover:border-white/30 flex flex-col justify-between`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${theme.badge}`}>
                      <Icon size={16} />
                    </div>
                    <span className="text-[9px] font-bold uppercase font-mono text-slate-400">
                      Impact #{idx + 1}
                    </span>
                  </div>

                  <div className="mb-1.5">
                    <span className={`text-xl font-black font-mono block ${theme.text}`}>
                      {item.stat}
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold block">
                      {item.subtext}
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-white mb-1">
                    {item.title}
                  </h4>

                  <p className="text-[11px] text-slate-300 leading-snug">
                    {item.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
