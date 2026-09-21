import React from 'react';
import { FileSearch, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function EmptyState({
  title = "No screening records found",
  description = "Get started by uploading a new identity document for multi-signal verification.",
  actionLabel = "Start New Screening",
  actionPath = "/screenings/new",
  icon: Icon = FileSearch
}) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-xl border border-dashed border-slate-300 shadow-sm my-6">
      <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mb-4">
        <Icon size={28} />
      </div>
      <h3 className="text-base font-bold text-brand-900 mb-1">{title}</h3>
      <p className="text-xs text-slate-500 max-w-md mb-6">{description}</p>
      {actionLabel && (
        <button
          onClick={() => navigate(actionPath)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-900 hover:bg-brand-800 text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
        >
          <Plus size={16} className="text-cyan-400" />
          <span>{actionLabel}</span>
        </button>
      )}
    </div>
  );
}
