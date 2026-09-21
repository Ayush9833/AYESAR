import React, { useState } from 'react';
import { Eye, FileText, ZoomIn, ShieldAlert, Sparkles, Layers } from 'lucide-react';

export default function DocumentPreview({
  fileUrl,
  fileName,
  fileSize,
  dimensions,
  documentType,
  tamperedRegions = [],
  isPdf = false
}) {
  const [showHeatmap, setShowHeatmap] = useState(true);

  // Fallback placeholder gradient ID visualizer if no raw uploaded image file URL
  const renderFallbackDoc = () => {
    return (
      <div className="w-full h-64 sm:h-72 rounded-xl bg-gradient-to-br from-slate-800 via-brand-900 to-slate-900 p-5 text-white flex flex-col justify-between relative overflow-hidden border border-brand-700 shadow-inner">
        {/* Background Emblem Watermark */}
        <div className="absolute -right-8 -bottom-8 w-44 h-44 rounded-full bg-cyan-500/10 blur-xl pointer-events-none" />
        <div className="absolute right-6 top-6 opacity-10 font-black text-6xl tracking-widest uppercase">
          {documentType}
        </div>

        {/* Top Header of Simulated Card */}
        <div className="flex items-start justify-between z-10">
          <div>
            <span className="text-[10px] font-bold tracking-widest uppercase text-cyan-400">
              Government of India
            </span>
            <h4 className="text-base font-extrabold tracking-wider">{documentType?.toUpperCase()}</h4>
          </div>
          <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center">
            <FileText size={16} className="text-cyan-300" />
          </div>
        </div>

        {/* Center Mock Identity Elements */}
        <div className="flex items-center gap-4 z-10">
          <div className="w-16 h-20 rounded bg-slate-700/80 border border-slate-600 flex flex-col items-center justify-center relative overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-slate-500/60 mb-1" />
            <div className="w-12 h-6 rounded-t-full bg-slate-500/60" />
            {showHeatmap && tamperedRegions.some(r => r.label.includes('Photo')) && (
              <div className="absolute inset-0 bg-rose-500/40 border-2 border-rose-500 animate-pulse flex items-center justify-center">
                <span className="text-[8px] bg-rose-900 text-white font-bold px-1 rounded">ALTERED</span>
              </div>
            )}
          </div>
          <div className="space-y-1.5 flex-1">
            <div className="h-2.5 bg-slate-600/70 rounded w-3/4" />
            <div className="h-2 bg-slate-700/70 rounded w-1/2" />
            <div className="h-3 bg-cyan-500/20 rounded w-5/6 border border-cyan-500/30 flex items-center px-1">
              <span className="text-[9px] font-mono text-cyan-300">•••• •••• ••••</span>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="flex items-center justify-between z-10 pt-2 border-t border-white/10 text-[10px] text-slate-400 font-mono">
          <span>SEC-ID // {fileName || 'DIGITAL_ARCHIVE'}</span>
          <span>{dimensions || '1920x1080'}</span>
        </div>

        {/* Heatmap overlay boxes if tampered regions present */}
        {showHeatmap && tamperedRegions.length > 0 && (
          <div className="absolute inset-0 pointer-events-none">
            {tamperedRegions.map((region, i) => (
              <div
                key={i}
                className="absolute border-2 border-rose-500 bg-rose-500/20 rounded shadow-lg flex items-start"
                style={{
                  left: `${(region.x / 450) * 100}%`,
                  top: `${(region.y / 280) * 100}%`,
                  width: `${(region.width / 450) * 100}%`,
                  height: `${(region.height / 280) * 100}%`
                }}
              >
                <span className="bg-rose-600 text-white text-[8px] font-bold px-1 rounded shadow -translate-y-4">
                  {region.label}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-card flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-brand-900">Document Visual Inspection</h4>
              {tamperedRegions.some(r => r.label?.toLowerCase().includes('photo') || r.label?.toLowerCase().includes('splic')) && (
                <span className="px-2 py-0.5 rounded text-[9px] font-extrabold uppercase bg-rose-100 text-rose-800 border border-rose-300 animate-pulse flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-ping" />
                  🚨 PHOTO REPLACED
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">Source file scan & tamper detection layer</p>
          </div>

          {tamperedRegions.length > 0 && (
            <button
              onClick={() => setShowHeatmap(!showHeatmap)}
              className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg border transition-all ${
                showHeatmap 
                  ? 'bg-rose-50 text-rose-700 border-rose-300' 
                  : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}
            >
              <Layers size={13} />
              <span>{showHeatmap ? 'Tamper Layer ON' : 'Tamper Layer OFF'}</span>
            </button>
          )}
        </div>

        {/* Document Rendering */}
        <div className="relative rounded-xl overflow-hidden bg-slate-900 flex items-center justify-center">
          {fileUrl && !isPdf ? (
            <div className="relative w-full">
              <img
                src={fileUrl}
                alt={fileName || 'Identity document'}
                className="w-full max-h-80 object-contain rounded-xl"
              />
              {/* Overlay for tampered regions */}
              {showHeatmap && tamperedRegions.map((region, i) => (
                <div
                  key={i}
                  className="absolute border-2 border-rose-500 bg-rose-500/25 rounded"
                  style={{
                    left: `${region.x}px`,
                    top: `${region.y}px`,
                    width: `${region.width}px`,
                    height: `${region.height}px`
                  }}
                >
                  <span className="bg-rose-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow absolute -top-4 left-0">
                    {region.label}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            renderFallbackDoc()
          )}
        </div>
      </div>

      {/* Meta Specifications Row */}
      <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-100 text-center">
        <div className="bg-slate-50 p-2 rounded-lg">
          <span className="block text-[10px] text-slate-400 uppercase font-semibold">Dimensions</span>
          <span className="text-xs font-bold text-slate-700 font-mono">{dimensions || '1920x1080'}</span>
        </div>
        <div className="bg-slate-50 p-2 rounded-lg">
          <span className="block text-[10px] text-slate-400 uppercase font-semibold">File Size</span>
          <span className="text-xs font-bold text-slate-700 font-mono">{fileSize || '1.8 MB'}</span>
        </div>
        <div className="bg-slate-50 p-2 rounded-lg">
          <span className="block text-[10px] text-slate-400 uppercase font-semibold">Classification</span>
          <span className="text-xs font-bold text-brand-700">{documentType || 'Aadhaar'}</span>
        </div>
      </div>
    </div>
  );
}
