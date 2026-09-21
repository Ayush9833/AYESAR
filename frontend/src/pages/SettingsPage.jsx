import React, { useState } from 'react';
import { Sliders, Cpu, Save, ShieldCheck, CheckCircle2, Server, Key, AlertCircle } from 'lucide-react';
import Toast from '../components/common/Toast';

export default function SettingsPage() {
  const [weights, setWeights] = useState({
    forensics: 25,
    faceMatch: 20,
    validation: 20,
    ocr: 15,
    quality: 10,
    liveness: 10
  });

  const [thresholds, setThresholds] = useState({
    verifiedMax: 40,
    reviewMax: 70
  });

  const [toast, setToast] = useState(null);

  const totalWeight = Object.values(weights).reduce((a, b) => a + Number(b), 0);

  const handleSave = (e) => {
    e.preventDefault();
    if (totalWeight !== 100) {
      setToast({ type: 'error', message: `Weights must sum to 100%. Currently: ${totalWeight}%` });
      return;
    }
    setToast({ type: 'success', message: 'Engine configuration updated successfully.' });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-brand-900 tracking-tight">
          System Configuration & AI Engine Weights
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Tune the multi-signal fraud scoring weights and microservice connection URLs
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Multi-Signal Weighting Configuration */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-card space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-brand-900">Multi-Signal Weight Matrix</h3>
              <p className="text-xs text-slate-500">Relative influence of each signal in composite risk scoring</p>
            </div>
            <div className={`px-2.5 py-1 rounded-full text-xs font-bold font-mono ${
              totalWeight === 100 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
            }`}>
              Sum: {totalWeight}%
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Image Manipulation Forensics: {weights.forensics}%
              </label>
              <input
                type="range"
                min="0"
                max="50"
                value={weights.forensics}
                onChange={(e) => setWeights({ ...weights, forensics: Number(e.target.value) })}
                className="w-full accent-brand-900"
              />
              <span className="text-[10px] text-slate-400">Copy-paste, ELA, font kerning (Default: 25%)</span>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Biometric Face Match: {weights.faceMatch}%
              </label>
              <input
                type="range"
                min="0"
                max="50"
                value={weights.faceMatch}
                onChange={(e) => setWeights({ ...weights, faceMatch: Number(e.target.value) })}
                className="w-full accent-brand-900"
              />
              <span className="text-[10px] text-slate-400">1:1 facial cosine distance (Default: 20%)</span>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Data Format Validation: {weights.validation}%
              </label>
              <input
                type="range"
                min="0"
                max="50"
                value={weights.validation}
                onChange={(e) => setWeights({ ...weights, validation: Number(e.target.value) })}
                className="w-full accent-brand-900"
              />
              <span className="text-[10px] text-slate-400">UIDAI / PAN regex checksums (Default: 20%)</span>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                OCR Extraction Confidence: {weights.ocr}%
              </label>
              <input
                type="range"
                min="0"
                max="50"
                value={weights.ocr}
                onChange={(e) => setWeights({ ...weights, ocr: Number(e.target.value) })}
                className="w-full accent-brand-900"
              />
              <span className="text-[10px] text-slate-400">PaddleOCR token certainty (Default: 15%)</span>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Image Quality & Clarity: {weights.quality}%
              </label>
              <input
                type="range"
                min="0"
                max="30"
                value={weights.quality}
                onChange={(e) => setWeights({ ...weights, quality: Number(e.target.value) })}
                className="w-full accent-brand-900"
              />
              <span className="text-[10px] text-slate-400">Resolution & sharpness (Default: 10%)</span>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Passive Liveness Anti-Spoof: {weights.liveness}%
              </label>
              <input
                type="range"
                min="0"
                max="30"
                value={weights.liveness}
                onChange={(e) => setWeights({ ...weights, liveness: Number(e.target.value) })}
                className="w-full accent-brand-900"
              />
              <span className="text-[10px] text-slate-400">Screen replay detection (Default: 10%)</span>
            </div>
          </div>
        </div>

        {/* Section 2: Future AI Integration Endpoints */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-card space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-brand-900">AI Microservice Architecture Hooks</h3>
            <p className="text-xs text-slate-500">
              Clear separation: Currently utilizing high-fidelity simulated engines; connect production microservices here
            </p>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                PaddleOCR Python Microservice URL
              </label>
              <input
                type="text"
                defaultValue="http://localhost:8000/ocr"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono text-slate-800"
                placeholder="http://localhost:8000/ocr"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">
                InsightFace / ArcFace Biometric Service URL
              </label>
              <input
                type="text"
                defaultValue="http://localhost:8001/biometrics"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono text-slate-800"
                placeholder="http://localhost:8001/biometrics"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">
                OpenCV / ViT Digital Tampering Model URL
              </label>
              <input
                type="text"
                defaultValue="http://localhost:8002/forensics"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono text-slate-800"
                placeholder="http://localhost:8002/forensics"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-2.5 bg-brand-900 hover:bg-brand-800 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2"
          >
            <Save size={15} className="text-cyan-400" />
            <span>Save Configuration</span>
          </button>
        </div>
      </form>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
