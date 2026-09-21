import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Menu, 
  Shield, 
  PlusCircle, 
  QrCode, 
  Camera,
  X, 
  Copy, 
  Check, 
  ExternalLink, 
  Smartphone, 
  Wifi,
  Zap
} from 'lucide-react';

export default function Navbar({ onMenuToggle, user, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [copied, setCopied] = useState(false);

  // Live Official URL
  const publicUrl = 'https://ayush9833.github.io/AYESAR/';

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/' || path === '/dashboard') return 'Identity Screening Overview';
    if (path === '/live-verify' || path === '/verify-real') return 'Real-Document Verification Lab';
    if (path.startsWith('/screenings/new')) return 'New Identity Screening';
    if (path.startsWith('/screenings/process')) return 'Multi-Signal Verification Pipeline';
    if (path.startsWith('/screenings/')) return 'Screening Dossier & Forensic Result';
    if (path === '/screenings') return 'Document Screening Archive';
    if (path.startsWith('/reports/')) return 'Official Verification Audit Report';
    if (path === '/analytics') return 'Fraud Detection Analytics';
    if (path === '/settings') return 'Pipeline Configuration & Thresholds';
    return 'Identity Screening Platform';
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <header className="h-16 bg-white border-b border-slate-200/80 sticky top-0 z-30 flex items-center justify-between px-3 sm:px-6 shadow-sm">
        {/* Left: Mobile Toggle & Page Title */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            onClick={onMenuToggle}
            className="lg:hidden p-1.5 sm:p-2 text-slate-600 hover:text-brand-900 hover:bg-slate-100 rounded-lg shrink-0"
            aria-label="Toggle Navigation"
          >
            <Menu size={20} />
          </button>
          <div className="min-w-0">
            <h1 className="text-sm sm:text-base md:text-lg font-bold text-brand-900 tracking-tight truncate">
              {getPageTitle()}
            </h1>
          </div>
        </div>

        {/* Center: Official Ministry & Department Badge */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-full border border-slate-200">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[11px] font-bold text-slate-800 tracking-wide">
            MHA • Police-II Division
          </span>
          <span className="text-slate-300">|</span>
          <span className="text-[11px] font-extrabold text-blue-700 tracking-wide">
            Sashastra Seema Bal (SSB)
          </span>
        </div>

        {/* Right: Actions, Camera Option & Profile */}
        <div className="flex items-center gap-2 sm:gap-2.5">

          {/* Green Camera Scan Button (Matches Mockup) */}
          <button
            onClick={() => navigate('/live-verify')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-all shadow-sm active:scale-95 cursor-pointer"
            title="Camera Scan Document"
          >
            <Camera size={15} className="text-white stroke-[2.2]" />
            <span>Camera Scan</span>
          </button>

          {/* Quick New Screening Button */}
          {!location.pathname.startsWith('/screenings/new') && (
            <button
              onClick={() => navigate('/screenings/new')}
              className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 bg-brand-900 hover:bg-brand-800 text-white text-xs font-semibold rounded-lg shadow-sm transition-all duration-150 cursor-pointer"
            >
              <PlusCircle size={15} className="text-cyan-400" />
              <span className="hidden lg:inline">New Screening</span>
            </button>
          )}

          {/* User profile dropdown / status */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
            <div className="w-8 h-8 rounded-full bg-brand-900 text-cyan-400 flex items-center justify-center font-bold text-xs ring-2 ring-brand-100">
              {user?.name ? user.name[0].toUpperCase() : 'D'}
            </div>
            <div className="hidden 2xl:block text-left text-xs">
              <p className="font-semibold text-slate-800 leading-tight">
                {user?.name || 'Screening Officer'}
              </p>
              <p className="text-[10px] text-slate-500 font-medium">
                {user?.role || 'Lead Auditor'}
              </p>
            </div>
            <button
              onClick={onLogout}
              title="Logout"
              className="text-xs text-slate-400 hover:text-rose-600 font-semibold ml-1 p-1 hover:bg-rose-50 rounded cursor-pointer"
            >
              Exit
            </button>
          </div>
        </div>
      </header>
    </>
  );
}
