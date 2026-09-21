import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, FileText, ArrowUpDown, Calendar, ExternalLink } from 'lucide-react';
import StatusBadge from '../common/StatusBadge';

export default function ScreeningTable({ screenings = [], onSelect }) {
  const navigate = useNavigate();

  const formatDate = (isoStr) => {
    if (!isoStr) return 'N/A';
    const date = new Date(isoStr);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div>
      {/* Mobile Card List (Visible on screens < md) */}
      <div className="block md:hidden divide-y divide-slate-100">
        {screenings.map((item) => (
          <div
            key={item.id}
            onClick={() => navigate(`/screenings/${item.id}`)}
            className="p-3.5 hover:bg-brand-50/30 active:bg-brand-50/50 transition-colors cursor-pointer space-y-2"
          >
            {/* Top row: ID + Status Badge */}
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-xs text-brand-900">
                {item.id}
              </span>
              <StatusBadge status={item.status} size="sm" />
            </div>

            {/* Middle row: Applicant Name & Risk Pill */}
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-900 truncate">
                  {item.applicantName || 'Anonymous'}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-100 text-[11px] font-medium text-slate-700">
                    <FileText size={11} className="text-slate-500" />
                    {item.documentType}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {formatDate(item.createdAt)}
                  </span>
                </div>
              </div>

              <div className="shrink-0 text-right">
                <span className={`inline-block font-mono font-extrabold text-xs px-2 py-0.5 rounded ${
                  item.riskScore <= 40 
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                    : item.riskScore <= 70 
                    ? 'bg-amber-50 text-amber-700 border border-amber-200' 
                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}>
                  {item.riskScore}/100
                </span>
              </div>
            </div>

            {/* Bottom Actions */}
            <div 
              className="flex items-center justify-end gap-2 pt-1 border-t border-slate-50"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => navigate(`/screenings/${item.id}`)}
                className="px-2.5 py-1 text-[11px] font-bold text-brand-700 bg-brand-50 hover:bg-brand-100 rounded-lg flex items-center gap-1 transition-colors"
              >
                <Eye size={12} />
                <span>View Dossier</span>
              </button>
              <button
                onClick={() => navigate(`/reports/${item.id}`)}
                className="px-2.5 py-1 text-[11px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1 transition-colors"
              >
                <ExternalLink size={12} />
                <span>Report</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop / Tablet Table (Hidden on small mobile, visible on md+) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              <th className="py-3 px-4">Screening ID</th>
              <th className="py-3 px-4">Applicant Name</th>
              <th className="py-3 px-4">Document Type</th>
              <th className="py-3 px-4">Timestamp</th>
              <th className="py-3 px-4 text-center">Risk Score</th>
              <th className="py-3 px-4 text-center">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {screenings.map((item) => (
              <tr
                key={item.id}
                className="hover:bg-brand-50/40 transition-colors group cursor-pointer"
                onClick={() => navigate(`/screenings/${item.id}`)}
              >
                {/* Screening ID */}
                <td className="py-3 px-4 font-mono font-bold text-brand-900 group-hover:text-brand-600">
                  {item.id}
                </td>

                {/* Applicant Name */}
                <td className="py-3 px-4 font-semibold text-slate-800">
                  {item.applicantName || 'Anonymous'}
                </td>

                {/* Document Type */}
                <td className="py-3 px-4 text-slate-600">
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-100 font-medium text-slate-700">
                    <FileText size={12} className="text-slate-500" />
                    {item.documentType}
                  </span>
                </td>

                {/* Timestamp */}
                <td className="py-3 px-4 text-slate-500 text-[11px] whitespace-nowrap">
                  {formatDate(item.createdAt)}
                </td>

                {/* Risk Score */}
                <td className="py-3 px-4 text-center">
                  <span className={`inline-block font-mono font-extrabold text-xs px-2 py-0.5 rounded ${
                    item.riskScore <= 40 
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                      : item.riskScore <= 70 
                      ? 'bg-amber-50 text-amber-700 border border-amber-200' 
                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}>
                    {item.riskScore}/100
                  </span>
                </td>

                {/* Status */}
                <td className="py-3 px-4 text-center whitespace-nowrap">
                  <StatusBadge status={item.status} size="sm" />
                </td>

                {/* Actions */}
                <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => navigate(`/screenings/${item.id}`)}
                      className="p-1.5 text-slate-500 hover:text-brand-900 hover:bg-slate-100 rounded-lg transition-colors"
                      title="View Full Dossier"
                    >
                      <Eye size={15} />
                    </button>
                    <button
                      onClick={() => navigate(`/reports/${item.id}`)}
                      className="p-1.5 text-slate-500 hover:text-cyan-700 hover:bg-cyan-50 rounded-lg transition-colors"
                      title="Audit Certificate"
                    >
                      <ExternalLink size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
