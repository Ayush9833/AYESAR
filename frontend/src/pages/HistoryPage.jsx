import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, RefreshCw, PlusCircle, FileText, CheckCircle2, AlertTriangle, AlertOctagon } from 'lucide-react';
import ScreeningTable from '../components/screening/ScreeningTable';
import LoadingState from '../components/common/LoadingState';
import EmptyState from '../components/common/EmptyState';
import { getScreenings } from '../services/api';

export default function HistoryPage() {
  const navigate = useNavigate();
  const [screenings, setScreenings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [totalCount, setTotalCount] = useState(0);

  const fetchList = async () => {
    try {
      setLoading(true);
      const res = await getScreenings({
        status: statusFilter,
        search: searchTerm
      });
      setScreenings(res.screenings || []);
      setTotalCount(res.total || 0);
    } catch (err) {
      console.error('Failed to load screenings archive:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, [statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchList();
  };

  const filterTabs = [
    { id: 'all', label: 'All Dossiers' },
    { id: 'verified', label: 'Verified', color: 'text-emerald-700' },
    { id: 'review required', label: 'Review Required', color: 'text-amber-700' },
    { id: 'suspicious', label: 'Suspicious', color: 'text-rose-700' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-brand-900 tracking-tight">
            Document Screening Archive
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit trail of processed identity verifications and forensic evaluations
          </p>
        </div>

        <button
          onClick={() => navigate('/screenings/new')}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-900 hover:bg-brand-800 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
        >
          <PlusCircle size={15} className="text-cyan-400" />
          <span>New Screening</span>
        </button>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 pb-1 md:pb-0">
          {filterTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                statusFilter === tab.id
                  ? 'bg-brand-900 text-white shadow-sm'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search size={14} className="text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by ID, Name, ID No..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:bg-white"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg transition-colors"
          >
            Search
          </button>
          <button
            type="button"
            onClick={fetchList}
            title="Refresh List"
            className="p-2 text-slate-400 hover:text-brand-900 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </form>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card overflow-hidden">
        {loading ? (
          <LoadingState message="Fetching Identity Records..." subtext="Filtering database archive" />
        ) : screenings.length === 0 ? (
          <EmptyState
            title="No matching screening records"
            description="Try changing your search keywords or status filter."
            actionLabel="Reset Filters"
            actionPath="/screenings"
          />
        ) : (
          <div>
            <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span className="font-semibold text-slate-700">
                Displaying {screenings.length} of {totalCount} records
              </span>
              <span className="text-[11px] text-slate-400">Click any row to open dossier</span>
            </div>
            <ScreeningTable screenings={screenings} />
          </div>
        )}
      </div>
    </div>
  );
}
