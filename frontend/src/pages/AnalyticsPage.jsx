import React from 'react';
import { BarChart3, TrendingUp, AlertTriangle, ShieldCheck, ShieldAlert, Cpu, CheckCircle2 } from 'lucide-react';

export default function AnalyticsPage() {
  const fraudTypeDistribution = [
    { type: 'Digital Font & Kerning Tampering', count: 42, pct: '38%', color: 'bg-rose-500' },
    { type: 'Photo Replacement & Splicing', count: 28, pct: '25%', color: 'bg-rose-600' },
    { type: 'Biometric Anti-Spoof 2D Screen Replay', count: 22, pct: '20%', color: 'bg-amber-500' },
    { type: 'ID Number Checksum Inconsistency', count: 12, pct: '11%', color: 'bg-amber-600' },
    { type: 'Photoshop EXIF Metadata Signatures', count: 7, pct: '6%', color: 'bg-cyan-500' }
  ];

  const documentVulnerabilityRates = [
    { doc: 'PAN Card', total: 412, flagged: 34, rate: '8.2%' },
    { doc: 'Passport', total: 328, flagged: 18, rate: '5.5%' },
    { doc: 'Aadhaar Card', total: 380, flagged: 12, rate: '3.1%' },
    { doc: 'Driving Licence', total: 128, flagged: 9, rate: '7.0%' }
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-brand-900 tracking-tight">
          Fraud Intelligence & Signal Analytics
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          National identity threat landscape analysis & attack vector decomposition
        </p>
      </div>

      {/* Top Threat Indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-card">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-2">
            <span className="uppercase tracking-wider text-[10px]">Primary Threat Vector</span>
            <span className="text-rose-600 font-bold">38% Impact</span>
          </div>
          <h3 className="text-base font-bold text-slate-900">Font Glyph Manipulation</h3>
          <p className="text-xs text-slate-500 mt-1">Altering year of birth or numbers on legitimate cards</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-card">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-2">
            <span className="uppercase tracking-wider text-[10px]">Biometric Attack Rate</span>
            <span className="text-amber-600 font-bold">20% of Attacks</span>
          </div>
          <h3 className="text-base font-bold text-slate-900">2D Screen & Photo Spoofs</h3>
          <p className="text-xs text-slate-500 mt-1">Defeated by SATYAPAN micro-texture & passive blink checks</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-card">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-2">
            <span className="uppercase tracking-wider text-[10px]">False Positive Rate</span>
            <span className="text-emerald-600 font-bold">&lt; 0.8%</span>
          </div>
          <h3 className="text-base font-bold text-slate-900">High Assurance Precision</h3>
          <p className="text-xs text-slate-500 mt-1">Multi-signal aggregation eliminates single-point OCR false alarms</p>
        </div>
      </div>

      {/* Fraud Vectors Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-card">
          <h3 className="text-sm font-bold text-brand-900 mb-1">Detected Fraud Techniques</h3>
          <p className="text-xs text-slate-500 mb-4">Frequency of identified manipulation methods</p>

          <div className="space-y-3">
            {fraudTypeDistribution.map((item, i) => (
              <div key={i} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-700">{item.type}</span>
                  <span className="font-mono text-slate-900 font-bold">{item.count} cases ({item.pct})</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${item.color} rounded-full`}
                    style={{ width: item.pct }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Document Vulnerability Table */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-card">
          <h3 className="text-sm font-bold text-brand-900 mb-1">Document Type Vulnerability</h3>
          <p className="text-xs text-slate-500 mb-4">Anomaly encounter rate across Indian ID formats</p>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="pb-2">Document</th>
                  <th className="pb-2 text-center">Screened</th>
                  <th className="pb-2 text-center">Flagged</th>
                  <th className="pb-2 text-right">Fraud Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {documentVulnerabilityRates.map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="py-3 font-bold text-slate-800">{row.doc}</td>
                    <td className="py-3 text-center font-mono text-slate-600">{row.total}</td>
                    <td className="py-3 text-center font-mono text-rose-600 font-bold">{row.flagged}</td>
                    <td className="py-3 text-right font-mono font-bold text-brand-900">{row.rate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
