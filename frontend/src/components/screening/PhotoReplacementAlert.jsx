import React, { useState } from 'react';
import { 
  ShieldAlert, 
  AlertOctagon, 
  Scissors, 
  Layers, 
  Eye, 
  Camera, 
  ZoomIn, 
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Fingerprint,
  FileWarning
} from 'lucide-react';

export default function PhotoReplacementAlert({
  photoReplacementData,
  applicantName,
  documentType = "Identity Document",
  riskScore = 94
}) {
  const [expanded, setExpanded] = useState(true);

  const defaultData = {
    detected: true,
    confidence: 99.2,
    method: "Digital Splicing & Multi-layer Photo Overlay",
    elaVariance: 0.184,
    ghostPhotoMismatch: true,
    edgeArtifactScore: 96,
    lightingMismatchScore: 92,
    details: "High-frequency edge discontinuity detected along the perimeter of the portrait photograph. Error Level Analysis (ELA) reveals dual JPEG quantization grids (photograph Q=72 vs background substrate Q=91), confirming that an external photo was pasted onto this document."
  };

  const data = photoReplacementData || defaultData;

  return (
    <div className="rounded-3xl border-2 border-rose-500 bg-gradient-to-br from-rose-950/95 via-slate-950 to-brand-950 text-white p-5 sm:p-7 shadow-2xl shadow-rose-950/50 relative overflow-hidden animate-in fade-in duration-300">
      {/* Red ambient warning flare */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-rose-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-60 h-60 bg-red-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Top Banner Header */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-rose-500/30">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-14 h-14 rounded-2xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-rose-600/40 animate-pulse">
            <AlertOctagon size={32} className="stroke-[2.5]" />
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-rose-500/30 text-rose-200 border border-rose-400/50 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping" />
                CRITICAL FORENSIC ALERT
              </span>
              <span className="text-xs font-mono text-rose-300">
                Confidence: {data.confidence}%
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black tracking-tight mt-1 text-white flex items-center gap-2">
              🚨 PHOTO REPLACEMENT DETECTED!
            </h2>
            
            <p className="text-xs sm:text-sm text-rose-200/90 mt-1 max-w-2xl leading-relaxed">
              The original photograph on this {documentType} has been physically or digitally removed and <strong className="text-white underline decoration-rose-400">replaced with a different person's picture</strong>.
            </p>
          </div>
        </div>

        {/* Severity & Action Badge */}
        <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0 bg-rose-950/60 p-3 rounded-2xl border border-rose-500/40">
          <span className="text-[10px] uppercase tracking-widest font-extrabold text-rose-300">
            ACTION REQUIRED
          </span>
          <span className="text-xs sm:text-sm font-black text-rose-100 bg-rose-600 px-3 py-1 rounded-xl shadow-md uppercase tracking-wider">
            DETENTION & SEIZURE
          </span>
          <span className="text-[10px] font-mono text-rose-400">
            Section 468/471 IPC / BNS
          </span>
        </div>
      </div>

      {/* Main Evidence Grid */}
      <div className="relative z-10 mt-5 space-y-4">
        <div className="flex items-center justify-between text-xs font-bold text-rose-200">
          <span className="flex items-center gap-2">
            <Scissors size={15} className="text-rose-400" />
            Forensic Tampering Proofs: Photo Splicing & Layering Analysis
          </span>
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-[11px] text-rose-300 hover:text-white cursor-pointer"
          >
            <span>{expanded ? 'Collapse Evidence' : 'Show Evidence'}</span>
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>

        {expanded && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Evidence 1: Perimeter Edge Splicing */}
              <div className="p-3.5 rounded-2xl bg-rose-950/40 border border-rose-500/30 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Scissors size={14} className="text-rose-400" />
                    Boundary Edge Splicing
                  </span>
                  <span className="text-[9px] font-mono font-bold bg-rose-500/30 text-rose-200 px-1.5 py-0.5 rounded">
                    DETECTED
                  </span>
                </div>
                <p className="text-[11px] text-rose-200/80 leading-snug">
                  High-frequency gradient discontinuity along photo perimeter. Confirms artificial cutout pasted over background.
                </p>
                <div className="pt-1 text-[10px] font-mono text-rose-300">
                  Discontinuity: {data.edgeArtifactScore}%
                </div>
              </div>

              {/* Evidence 2: ELA Disparity */}
              <div className="p-3.5 rounded-2xl bg-rose-950/40 border border-rose-500/30 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Layers size={14} className="text-rose-400" />
                    Error Level Analysis (ELA)
                  </span>
                  <span className="text-[9px] font-mono font-bold bg-rose-500/30 text-rose-200 px-1.5 py-0.5 rounded">
                    FAILED
                  </span>
                </div>
                <p className="text-[11px] text-rose-200/80 leading-snug">
                  Severe compression disparity. Photo compressed at Q=72 while card substrate is Q=91 (dual quantization grids).
                </p>
                <div className="pt-1 text-[10px] font-mono text-rose-300">
                  ELA Variance: {data.elaVariance} (limit: 0.05)
                </div>
              </div>

              {/* Evidence 3: Ghost Photo Mismatch */}
              <div className="p-3.5 rounded-2xl bg-rose-950/40 border border-rose-500/30 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Eye size={14} className="text-rose-400" />
                    Ghost Photo Mismatch
                  </span>
                  <span className="text-[9px] font-mono font-bold bg-rose-500/30 text-rose-200 px-1.5 py-0.5 rounded">
                    MISMATCH
                  </span>
                </div>
                <p className="text-[11px] text-rose-200/80 leading-snug">
                  Primary color portrait does NOT match the secondary security ghost photo watermark embedded in the document substrate.
                </p>
                <div className="pt-1 text-[10px] font-mono text-rose-300">
                  Facial Feature Delta: 68.4%
                </div>
              </div>

              {/* Evidence 4: Sensor Noise & Lighting */}
              <div className="p-3.5 rounded-2xl bg-rose-950/40 border border-rose-500/30 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Camera size={14} className="text-rose-400" />
                    Lighting & Chromatic Noise
                  </span>
                  <span className="text-[9px] font-mono font-bold bg-rose-500/30 text-rose-200 px-1.5 py-0.5 rounded">
                    INCONSISTENT
                  </span>
                </div>
                <p className="text-[11px] text-rose-200/80 leading-snug">
                  Ambient illumination angle and chromatic noise pattern of face do not match document camera sensor signature.
                </p>
                <div className="pt-1 text-[10px] font-mono text-rose-300">
                  Lighting Disparity: {data.lightingMismatchScore}%
                </div>
              </div>
            </div>

            {/* Detailed Forensic Summary Box */}
            <div className="p-4 rounded-2xl bg-black/50 border border-rose-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-start gap-2.5">
                <FileWarning size={18} className="text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-extrabold text-white block">
                    Forensic Diagnosis: Fraudulent Identity Impersonation Attempt
                  </span>
                  <p className="text-rose-200/90 text-[11px] mt-0.5 leading-relaxed">
                    {data.details}
                  </p>
                </div>
              </div>
              <div className="shrink-0 text-right font-mono text-[10px] text-rose-300 self-start sm:self-center">
                <span>MODULE 3 TAMPERING ENGINE</span>
                <span className="block text-rose-400 font-bold">ALGORITHM: ELA-CONV-V2</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
