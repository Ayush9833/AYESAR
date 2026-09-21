import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  ShieldCheck,
  QrCode, 
  LayoutDashboard, 
  FilePlus2, 
  History, 
  BarChart3, 
  Settings, 
  FileText,
  Activity,
  Server,
  Zap,
  X
} from 'lucide-react';

export default function Sidebar({ isOpen, onClose }) {
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'New Screening', path: '/screenings/new', icon: FilePlus2, badgeText: 'LIVE', highlight: true },
    { name: 'Screening History', path: '/screenings', icon: History },
    { name: 'Analytics', path: '/analytics', icon: BarChart3 },
    { name: 'System Settings', path: '/settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-brand-950/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside className={`
        fixed top-0 bottom-0 left-0 z-50 w-64 bg-brand-900 text-white flex flex-col justify-between
        transition-transform duration-300 ease-in-out border-r border-brand-800
        ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
      `}>
        {/* Top: Brand & Nav */}
        <div className="flex flex-col flex-1 overflow-y-auto">
          {/* Logo Header */}
          <div className="h-16 flex items-center justify-between px-6 border-b border-brand-800/80 bg-brand-950/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                <ShieldCheck className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="text-lg font-black tracking-wider text-white">
                  SATYAPAN
                </span>
                <span className="block text-[9px] text-cyan-300 font-bold tracking-wider uppercase">
                  MHA • POLICE-II DIVISION
                </span>
                <span className="block text-[8px] text-emerald-400 font-semibold tracking-wider uppercase">
                  Sashastra Seema Bal (SSB)
                </span>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="lg:hidden text-slate-400 hover:text-white p-1 rounded-lg"
            >
              <X size={20} />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5 flex-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path || 
                (item.path === '/dashboard' && location.pathname === '/');

              return (
                <NavLink
                  key={item.name}
                  to={item.path}
                  onClick={onClose}
                  className={`
                    flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-150
                    ${isActive 
                      ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 font-semibold shadow-sm' 
                      : 'text-slate-300 hover:bg-brand-800/60 hover:text-white'}
                    ${item.highlight && !isActive ? 'ring-1 ring-cyan-500/20' : ''}
                  `}
                >
                  <Icon size={18} className={isActive ? 'text-cyan-400' : 'text-slate-400'} />
                  <span>{item.name}</span>
                  {item.badgeText ? (
                    <span className="ml-auto text-[10px] bg-emerald-500 text-brand-950 font-black px-1.5 py-0.5 rounded uppercase tracking-wider">
                      {item.badgeText}
                    </span>
                  ) : item.highlight && (
                    <span className="ml-auto text-[10px] bg-cyan-500 text-brand-950 font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
                      Live
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Bottom: System Status */}
        <div className="p-4 m-3 rounded-xl bg-brand-950/60 border border-brand-800/80 space-y-2.5">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
            <span className="uppercase tracking-wider text-[10px]">System Status</span>
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Operational
            </span>
          </div>

          <div className="space-y-1.5 pt-1 border-t border-brand-800/60 text-xs">
            <div className="flex items-center justify-between text-slate-300">
              <span className="flex items-center gap-1.5 text-[11px]">
                <Zap size={13} className="text-cyan-400" />
                AI Engine
              </span>
              <span className="text-[11px] font-mono text-emerald-400 font-bold">Online</span>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span className="flex items-center gap-1.5 text-[11px]">
                <Server size={13} className="text-cyan-400" />
                REST API
              </span>
              <span className="text-[11px] font-mono text-emerald-400 font-bold">Port 5000</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
