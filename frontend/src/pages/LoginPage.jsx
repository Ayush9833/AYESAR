import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Lock, Mail, ArrowRight, Sparkles, CheckCircle2, Shield } from 'lucide-react';

export default function LoginPage({ onLogin }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState('officer@satyapan.ai');
  const [password, setPassword] = useState('demo1234');
  const [rememberMe, setRememberMe] = useState(true);

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin({
      name: 'Insp. S. Kumar (SSB 48th Bn)',
      email: email || 'officer.ssb@mha.gov.in',
      role: 'SSB Border Outpost Incharge'
    });
    navigate('/dashboard');
  };

  const handleDemoLogin = () => {
    setEmail('ssb.evaluator@mha.gov.in');
    setPassword('sih2026ssb');
    onLogin({
      name: 'SSB & MHA Police-II Panel',
      email: 'ssb.evaluator@mha.gov.in',
      role: 'MHA Police-II / SSB Evaluation Officer'
    });
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background glow accents */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Login Card */}
      <div className="w-full max-w-md bg-brand-900/90 backdrop-blur-xl border border-brand-800 rounded-3xl p-8 shadow-2xl relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-black tracking-wider text-white">
            SATYAPAN
          </h2>
          <p className="text-xs text-cyan-300 font-bold tracking-widest uppercase mt-0.5">
            Ministry of Home Affairs • Police-II Division
          </p>
          <p className="text-[11px] text-emerald-400 font-semibold tracking-wider mt-1">
            Sashastra Seema Bal (SSB) Border Screening Terminal
          </p>
        </div>

        {/* 1-Click SIH Evaluator Quick Access */}
        <div className="mb-6 p-3 rounded-xl bg-brand-950/70 border border-brand-700/80">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold text-cyan-400 flex items-center gap-1">
              <Sparkles size={13} /> SIH 2026 Evaluation Access
            </span>
            <span className="text-[9px] bg-cyan-500 text-brand-950 font-bold px-1.5 py-0.5 rounded uppercase">
              Instant
            </span>
          </div>
          <button
            type="button"
            onClick={handleDemoLogin}
            className="w-full py-2 px-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-brand-950 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 shadow-md"
          >
            <span>One-Click Demo Evaluator Login</span>
            <ArrowRight size={14} />
          </button>
        </div>

        {/* Standard Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Official Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-brand-950/80 border border-brand-700/80 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-colors"
                placeholder="officer@satyapan.ai"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Secure Key / Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-brand-950/80 border border-brand-700/80 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-colors"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded bg-brand-950 border-brand-700 text-cyan-500 focus:ring-0"
              />
              <span>Remember token</span>
            </label>
            <span className="text-cyan-400/80 text-[11px]">Security Level 3</span>
          </div>

          <button
            type="submit"
            className="w-full mt-2 py-3 bg-white hover:bg-slate-100 text-brand-950 text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
          >
            <span>Access Screening Console</span>
            <ArrowRight size={15} />
          </button>
        </form>

        {/* SIH Footer Notice */}
        <div className="mt-6 pt-4 border-t border-brand-800/80 text-center text-[10px] text-slate-400">
          <p className="font-semibold text-slate-300">Smart India Hackathon 2026 Submission</p>
          <p className="text-slate-500 mt-0.5">Problem Statement: AI-Based Fake Identity Screening</p>
        </div>
      </div>
    </div>
  );
}
