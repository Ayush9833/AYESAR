import LiveVerificationPage from './pages/LiveVerificationPage';
import React, { useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/common/Sidebar';
import Navbar from './components/common/Navbar';
import MobileBottomNav from './components/common/MobileBottomNav';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import NewScreeningPage from './pages/NewScreeningPage';
import ProcessingPage from './pages/ProcessingPage';
import ResultPage from './pages/ResultPage';
import ReportPage from './pages/ReportPage';
import HistoryPage from './pages/HistoryPage';
import AnalyticsPage from './pages/AnalyticsPage';
import SettingsPage from './pages/SettingsPage';

export default function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('satyapan_user') || localStorage.getItem('verishield_user');
    return saved ? JSON.parse(saved) : {
      name: 'Dr. Sameer Roy',
      email: 'officer@satyapan.ai',
      role: 'Chief Screening Officer'
    };
  });

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('satyapan_user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('satyapan_user');
    localStorage.removeItem('verishield_user');
  };

  return (
    <HashRouter>
      <Routes>
        {/* Public Login Route */}
        <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />

        {/* Authenticated Dashboard & Screening Shell */}
        <Route
          path="/*"
          element={
            !user ? (
              <Navigate to="/login" replace />
            ) : (
              <div className="min-h-screen bg-slate-50 flex">
                {/* Responsive Collapsible Sidebar */}
                <Sidebar
                  isOpen={sidebarOpen}
                  onClose={() => setSidebarOpen(false)}
                />

                {/* Main Content Area */}
                <div className="flex-1 lg:ml-64 flex flex-col min-h-screen w-full min-w-0 overflow-x-hidden">
                  <Navbar
                    onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
                    user={user}
                    onLogout={handleLogout}
                  />

                  <main className="flex-1 p-3 sm:p-6 md:p-8 max-w-7xl w-full mx-auto pb-24 lg:pb-8 min-w-0 overflow-x-hidden">
                    <Routes>
                      <Route path="/" element={<DashboardPage />} />
                      <Route path="/dashboard" element={<DashboardPage />} />
                      <Route path="/live-verify" element={<LiveVerificationPage />} />
                      <Route path="/live-verification" element={<LiveVerificationPage />} />
                      <Route path="/verify-real" element={<LiveVerificationPage />} />
                      <Route path="/screenings/new" element={<NewScreeningPage />} />
                      <Route path="/screenings/process/:id" element={<ProcessingPage />} />
                      <Route path="/screenings/:id" element={<ResultPage />} />
                      <Route path="/screenings" element={<HistoryPage />} />
                      <Route path="/reports/:id" element={<ReportPage />} />
                      <Route path="/analytics" element={<AnalyticsPage />} />
                      <Route path="/settings" element={<SettingsPage />} />
                      <Route path="*" element={<Navigate to="/dashboard" replace />} />
                    </Routes>
                  </main>

                  {/* Responsive Mobile App Bottom Navigation Bar */}
                  <MobileBottomNav />
                </div>
              </div>
            )
          }
        />
      </Routes>
    </HashRouter>
  );
}
