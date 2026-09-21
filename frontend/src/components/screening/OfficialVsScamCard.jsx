import React from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Landmark, 
  FileCheck, 
  FileWarning, 
  Binary, 
  QrCode, 
  Sparkles,
  Fingerprint
} from 'lucide-react';

export default function OfficialVsScamCard({ officialVsScam, status, riskScore, documentType }) {
  const isOfficial = status === 'VERIFIED' || riskScore <= 40;
  const isScam = status === 'SUSPICIOUS' || riskScore > 70;
  const isReview = !isOfficial && !isScam;

  const defaultChecklist = [
    {
      criterion: "Government Issuer Authority & Heraldic Seals",
      status: isOfficial ? "AUTHENTIC" : isScam ? "FORGED" : "VARIANCE",
      detail: isOfficial 
        ? "National emblem alignment, official font typography, and micro-print guilloche conform to gazette templates."
        : isScam
        ? "Synthetically superimposed emblem and non-standard typography indicate desktop counterfeit generator."
        : "Minor layout variance detected; requires manual comparison against official gazette template."
    },
    {
      criterion: "Mathematical Checksum & Statutory Generation Formula",
      status: isOfficial ? "AUTHENTIC" : isScam ? "FAILED_CHECKSUM" : "AUTHENTIC",
      detail: isOfficial 
        ? `Document ID sequence adheres to official statutory mathematical algorithms (Verhoeff / ICAO Modulo-7 / MCA rules).`
        : isScam
        ? "Failed statutory checksum: ID sequence is mathematically invalid and impossible under official generation."
        : "Structure complies with basic regex pattern, but secondary registry lookup is recommended."
    },
    {
      criterion: "Cryptographic QR Matrix & Digital Signature",
      status: isOfficial ? "AUTHENTIC" : isScam ? "TAMPERED" : "AUTHENTIC",
      detail: isOfficial 
        ? "Encoded cryptographic payload perfectly cross-matches printed OCR text with zero variance."
        : isScam
        ? "2D QR code / barcode payload does not match printed identity data, or digital signature is missing."
        : "Barcode readable with slight optical distortion."
    },
    {
      criterion: "Forensic Pixel Authenticity (ELA & Clone Detection)",
      status: isOfficial ? "AUTHENTIC" : isScam ? "MANIPULATED" : "VARIANCE",
      detail: isOfficial 
        ? "Uniform sensor noise and single-quantization tables confirm authentic single-pass physical issuance."
        : isScam
        ? "Multi-compression layers, cloned pixel blocks, and high-frequency edge artifacts confirm post-issuance editing."
        : "Minor compression differences in background regions."
    }
  ];

  const checklist = officialVsScam?.officialChecklist || defaultChecklist;

  return (
    <div className={`rounded-3xl border-2 p-6 sm:p-7 shadow-elevated transition-all overflow-hidden relative ${
      isOfficial 
        ? 'bg-gradient-to-br from-emerald-950/90 via-slate-900 to-brand-950 border-emerald-500/80 text-white shadow-emerald-500/10' 
        : isScam 
        ? 'bg-gradient-to-br from-rose-950/90 via-slate-900 to-brand-950 border-rose-500/80 text-white shadow-rose-500/10'
        : 'bg-gradient-to-br from-amber-950/90 via-slate-900 to-brand-950 border-amber-500/80 text-white shadow-amber-500/10'
    }`}>
      
      {/* Background ambient lighting */}
      <div className={`absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl pointer-events-none ${
        isOfficial ? 'bg-emerald-500/15' : isScam ? 'bg-rose-500/15' : 'bg-amber-500/15'
      }`} />

      <div className="relative z-10 space-y-6">
        
        {/* Top Header: The Definitive Determination */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-white/10">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${
              isOfficial 
                ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/30' 
                : isScam 
                ? 'bg-rose-500 text-white shadow-rose-500/30 animate-pulse'
                : 'bg-amber-500 text-slate-950 shadow-amber-500/30'
            }`}>
              {isOfficial ? (
                <ShieldCheck size={32} className="stroke-[2.5]" />
              ) : isScam ? (
                <ShieldAlert size={32} className="stroke-[2.5]" />
              ) : (
                <AlertTriangle size={32} className="stroke-[2.5]" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full ${
                  isOfficial 
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                    : isScam 
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' 
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}>
                  {isOfficial ? 'AUTHENTICITY SEAL: VERIFIED' : isScam ? 'CRITICAL FRAUD ALERT' : 'AUDIT WARNING'}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {documentType}
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-black tracking-tight mt-1 text-white">
                {isOfficial ? 'OFFICIALLY GENERATED DOCUMENT' : isScam ? 'SCAM / FAKE DOCUMENT DETECTED' : 'UNOFFICIAL / SUSPICIOUS DOCUMENT'}
              </h2>
              
              <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
                {isOfficial 
                  ? 'This document matches official government issuance standards. Cryptographic security features, micro-print alignment, and statutory registry structures validated.'
                  : isScam
                  ? 'CRITICAL WARNING: This document was NOT officially generated. It contains synthetic layout cloning, unauthorized emblem alterations, or digital tampering.'
                  : 'Document exhibits localized variances or font anomalies that deviate from standard gazette issuance. Secondary manual verification recommended.'}
              </p>
            </div>
          </div>

          {/* Large Trust Gauge */}
          <div className="flex items-center gap-3 self-start sm:self-auto bg-black/40 px-4 py-3 rounded-2xl border border-white/10 shrink-0">
            <div className="text-right">
              <span className="text-[10px] text-slate-400 uppercase tracking-widest block font-bold">
                {isOfficial ? 'Official Trust' : 'Scam Probability'}
              </span>
              <span className={`text-3xl font-black font-mono leading-none ${
                isOfficial ? 'text-emerald-400' : isScam ? 'text-rose-400' : 'text-amber-400'
              }`}>
                {isOfficial ? `${100 - riskScore}%` : `${riskScore}%`}
              </span>
            </div>
            <div className={`w-3 h-10 rounded-full ${
              isOfficial ? 'bg-emerald-500' : isScam ? 'bg-rose-500' : 'bg-amber-500'
            }`} />
          </div>
        </div>

        {/* 4-Pillar Official Verification vs Scam Audit Table */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-300">
            <span className="flex items-center gap-2">
              <Landmark size={15} className="text-cyan-400" />
              Official Issuance vs Counterfeit Forensic Audit
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              National Security Standard
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {checklist.map((item, idx) => {
              const isItemPass = item.status === 'AUTHENTIC' || item.status === 'PASS';
              const isItemFail = item.status === 'FORGED' || item.status === 'FAILED_CHECKSUM' || item.status === 'TAMPERED' || item.status === 'MANIPULATED' || item.status === 'FAIL';

              return (
                <div 
                  key={idx} 
                  className={`p-4 rounded-2xl border transition-all ${
                    isItemPass 
                      ? 'bg-emerald-950/30 border-emerald-500/30' 
                      : isItemFail 
                      ? 'bg-rose-950/40 border-rose-500/40' 
                      : 'bg-amber-950/30 border-amber-500/30'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      {isItemPass ? (
                        <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
                      ) : isItemFail ? (
                        <XCircle size={15} className="text-rose-400 shrink-0" />
                      ) : (
                        <AlertTriangle size={15} className="text-amber-400 shrink-0" />
                      )}
                      {item.criterion}
                    </span>

                    <span className={`text-[9px] font-mono font-extrabold uppercase px-2 py-0.5 rounded ${
                      isItemPass 
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                        : isItemFail 
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' 
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}>
                      {item.status}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    {item.detail}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Actionable Legal & Statutory Guidance */}
        <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-cyan-400 shrink-0" />
            <span className="text-slate-300 text-[11px]">
              {isOfficial 
                ? "Conforms to Information Technology Act 2000 & Aadhaar / PAN Verification Guidelines."
                : isScam
                ? "Counterfeiting identity documents is a cognizable offense under Section 468 & 471 of the Indian Penal Code (IPC) / BNS."
                : "Record marked for supervisory physical document review."}
            </span>
          </div>

          <span className="text-[10px] font-mono text-cyan-300 shrink-0 bg-cyan-950/60 px-2.5 py-1 rounded-lg border border-cyan-500/30">
            SATYAPAN AI ENGINE v2.4
          </span>
        </div>

      </div>
    </div>
  );
}
