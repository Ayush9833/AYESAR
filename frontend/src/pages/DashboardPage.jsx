import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShieldCheck,
  Sparkles,
  Maximize2,
  QrCode, 
  ShieldAlert, 
  AlertTriangle, 
  FileCheck2, 
  Activity, 
  PlusCircle, 
  ArrowRight,
  TrendingUp,
  RefreshCw,
  Zap,
  CheckCircle2
} from 'lucide-react';
import StatCard from '../components/common/StatCard';
import ActivityChart from '../components/dashboard/ActivityChart';
import RiskDistributionChart from '../components/dashboard/RiskDistributionChart';
import ScreeningTable from '../components/screening/ScreeningTable';
import LoadingState from '../components/common/LoadingState';
import { getDashboardStats } from '../services/api';

export default function DashboardPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalScreenings: 1250,
    verifiedCount: 1034,
    reviewRequiredCount: 143,
    suspiciousCount: 73,
    averageRiskScore: 24,
    recentScreenings: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getDashboardStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to load dashboard stats:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading && !stats) {
    return <LoadingState message="Loading Real-Time Screening Intelligence..." />;
  }

  const total = stats?.totalScreenings || 1248;
  const verified = stats?.verifiedCount || 1032;
  const review = stats?.reviewRequiredCount || 143;
  const suspicious = stats?.suspiciousCount || 73;
  const avgRisk = stats?.averageRiskScore || 24;

  return (
    <div className="space-y-6">
      {/* Top Hero Banner (Matches Design Mockup) */}
      <div className="bg-gradient-to-r from-slate-950 via-brand-900 to-slate-900 rounded-2xl p-5 sm:p-7 text-white relative overflow-hidden shadow-elevated border border-slate-800">
        {/* Subtle decorative background glow */}
        <div className="absolute right-0 top-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-400/30 text-cyan-300 text-[10px] sm:text-xs font-bold uppercase tracking-wider">
              <Sparkles size={13} className="text-cyan-400 shrink-0" />
              <span>MHA - POLICE-II DIVISION | SSB TACTICAL BORDER DEFENSE</span>
            </div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-white leading-tight">
              SATYAPAN — Sashastra Seema Bal (SSB)<br />Border Screening
            </h2>
          </div>

          <div className="flex items-center gap-2.5 self-stretch sm:self-auto">
            <button
              onClick={() => navigate('/screenings/new')}
              className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-brand-950 text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <PlusCircle size={16} className="text-brand-950 stroke-[2.5]" />
              <span>NEW SCREENING</span>
            </button>
            <button
              onClick={() => navigate('/live-verify')}
              title="Open Live Camera Scanner"
              className="hidden sm:flex p-3 bg-white/10 hover:bg-white/20 text-white rounded-xl border border-white/20 transition-all items-center justify-center shrink-0 cursor-pointer"
            >
              <Maximize2 size={16} className="text-cyan-400" />
            </button>
          </div>
        </div>
      </div>

      {/* 5 Main Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <StatCard
          title="Total Screenings"
          value={total.toLocaleString()}
          subtext="Processed identity records"
          icon={FileCheck2}
          color="blue"
          trend="+14% this week"
        />
        <StatCard
          title="Verified Documents"
          value={verified.toLocaleString()}
          subtext="83% approval rate"
          icon={ShieldCheck}
          color="green"
        />
        <StatCard
          title="Review Required"
          value={review.toLocaleString()}
          subtext="Minor font/data variance"
          icon={AlertTriangle}
          color="amber"
        />
        <StatCard
          title="Suspicious Documents"
          value={suspicious.toLocaleString()}
          subtext="Tampering / biometric spoof"
          icon={ShieldAlert}
          color="red"
        />
        <div className="col-span-2 sm:col-span-1 lg:col-span-1">
          <StatCard
            title="Avg Risk Score"
            value={`${avgRisk}/100`}
            subtext={avgRisk <= 40 ? 'Overall Low Risk' : 'Elevated Risk'}
            icon={Activity}
            color={avgRisk <= 40 ? 'green' : avgRisk <= 70 ? 'amber' : 'red'}
          />
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ActivityChart distribution={stats?.verificationDistribution || []} />
        <RiskDistributionChart distribution={stats?.riskDistribution || []} />
      </div>

      {/* Recent Screenings Section */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-card space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-brand-900">Recent Screening Dossiers</h3>
            <p className="text-xs text-slate-500">Live feed of recently analyzed identity documents</p>
          </div>
          <button
            onClick={() => navigate('/screenings')}
            className="text-xs font-bold text-brand-700 hover:text-brand-900 flex items-center gap-1.5 p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <span>View All Archives</span>
            <ArrowRight size={14} />
          </button>
        </div>

        <ScreeningTable screenings={stats?.recentScreenings || []} />
      </div>
    </div>
  );
}