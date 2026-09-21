import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FilePlus2, 
  History, 
  BarChart3, 
  Camera,
  QrCode 
} from 'lucide-react';

export default function MobileBottomNav() {
  const location = useLocation();

  const tabs = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Real Doc', path: '/live-verify', icon: QrCode },
    { name: 'New Scan', path: '/screenings/new', icon: FilePlus2 },
    { name: 'History', path: '/screenings', icon: History }
  ];

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 py-1.5 px-3 flex items-center justify-around shadow-2xl lg:hidden">
        {/* Left 2 Tabs */}
        {tabs.slice(0, 2).map((tab) => {
          const Icon = tab.icon;
          const isActive = location.pathname === tab.path || 
            (tab.path === '/dashboard' && location.pathname === '/');

          return (
            <NavLink
              key={tab.name}
              to={tab.path}
              className={`flex flex-col items-center py-1 px-3 rounded-xl transition-all ${
                isActive ? 'text-cyan-600 font-extrabold' : 'text-slate-500 hover:text-slate-900 font-medium'
              }`}
            >
              <Icon size={19} className={isActive ? 'stroke-[2.5]' : 'stroke-2'} />
              <span className="text-[10px] tracking-tight mt-0.5">{tab.name}</span>
            </NavLink>
          );
        })}

        {/* Center Real-Doc Scan Floating Button */}
        <NavLink
          to="/live-verify"
          className={({ isActive }) => `-mt-5 w-12 h-12 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-brand-950 flex items-center justify-center shadow-lg shadow-cyan-500/30 active:scale-95 transition-all border-2 border-white cursor-pointer ${isActive ? 'ring-2 ring-cyan-400 ring-offset-2' : ''}`}
          title="Real Doc Scan"
          aria-label="Real Doc Scan"
        >
          <QrCode size={22} className="stroke-[2.5]" />
        </NavLink>

        {/* Right 2 Tabs */}
        {tabs.slice(2, 4).map((tab) => {
          const Icon = tab.icon;
          const isActive = location.pathname === tab.path;

          return (
            <NavLink
              key={tab.name}
              to={tab.path}
              className={`flex flex-col items-center py-1 px-3 rounded-xl transition-all ${
                isActive ? 'text-cyan-600 font-extrabold' : 'text-slate-500 hover:text-slate-900 font-medium'
              }`}
            >
              <Icon size={19} className={isActive ? 'stroke-[2.5]' : 'stroke-2'} />
              <span className="text-[10px] tracking-tight mt-0.5">{tab.name}</span>
            </NavLink>
          );
        })}
      </nav>
    </>
  );
}
