import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  UploadCloud, 
  FileText, 
  Camera, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  HelpCircle,
  FileCheck,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  Zap,
  Scissors,
  QrCode
} from 'lucide-react';

export default function UploadBox({ onStartScreening, isLoading }) {
  const navigate = useNavigate();
  const [docFile, setDocFile] = useState(null);
  const [docPreview, setDocPreview] = useState(null);
  const [selfieFile, setSelfieFile] = useState(null);
  const [selfiePreview, setSelfiePreview] = useState(null);
  const [documentType, setDocumentType] = useState('Auto-Detect (AI)');
  const [isDragging, setIsDragging] = useState(false);
  const [selectedDemoScenario, setSelectedDemoScenario] = useState(null);
  const [simulatePhotoReplacement, setSimulatePhotoReplacement] = useState(false);

  const docInputRef = useRef(null);
  const selfieInputRef = useRef(null);

  const handleDocChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      processDocFile(file);
    }
  };

  const processDocFile = (file) => {
    setDocFile(file);
    setSelectedDemoScenario(null); // Clear preset if manual file chosen
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => setDocPreview(reader.result);
      reader.readAsDataURL(file);
    } else {
      setDocPreview(null);
    }
  };

  const handleSelfieChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelfieFile(file);
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = () => setSelfiePreview(reader.result);
        reader.readAsDataURL(file);
      }
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processDocFile(file);
    }
  };

  const clearDoc = () => {
    setDocFile(null);
    setDocPreview(null);
    setSelectedDemoScenario(null);
    if (docInputRef.current) docInputRef.current.value = '';
  };

  const clearSelfie = () => {
    setSelfieFile(null);
    setSelfiePreview(null);
    if (selfieInputRef.current) selfieInputRef.current.value = '';
  };

  const selectDemoScenario = (scenarioKey, docTypeName) => {
    setSelectedDemoScenario(scenarioKey);
    setDocumentType(docTypeName);
    setDocFile(null);
    setDocPreview(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!docFile && !selectedDemoScenario && !simulatePhotoReplacement) return;

    onStartScreening({
      documentFile: docFile,
      selfieFile,
      documentType,
      demoScenario: simulatePhotoReplacement ? 'photo_replacement' : selectedDemoScenario
    });
  };

  return (
    <div className="space-y-6">
      {/* 1-Click Demo Scenarios Banner for Border Security / SIH Judges */}
      <div className="bg-gradient-to-r from-brand-900 to-brand-800 text-white p-5 rounded-2xl border border-brand-700 shadow-elevated">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs uppercase tracking-wider">
            <Sparkles size={16} />
            <span>MHA & SSB Border Screening Test Suite (SIH 2026)</span>
          </div>
          <span className="text-[10px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded font-bold self-start sm:self-auto">
            1-Click Border Scenarios
          </span>
        </div>
        <p className="text-xs text-slate-300 mb-3">
          Select any operational checkpoint scenario to evaluate against the 4 modules (OCR Extraction, Document Validation, Tampering Detection, and Biometric Face Verification):
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {/* Scenario 1: Authentic Passport */}
          <button
            type="button"
            onClick={() => selectDemoScenario('passport_cleared', 'Passport')}
            className={`p-3 rounded-xl text-left border transition-all duration-150 cursor-pointer ${
              selectedDemoScenario === 'passport_cleared'
                ? 'bg-emerald-500/25 border-emerald-400 ring-2 ring-emerald-500/30'
                : 'bg-brand-950/40 border-brand-700/80 hover:bg-brand-950/70'
            }`}
          >
            <div className="flex items-center justify-between text-emerald-400 font-bold text-xs mb-1">
              <span>1. Official Passport (Aarav)</span>
              <ShieldCheck size={16} />
            </div>
            <p className="text-[11px] text-emerald-300 font-bold">Risk: 12 (CLEARED &lt;1.2s)</p>
            <p className="text-[10px] text-slate-400 mt-1">High passenger volume: ICAO Mod-7 pass, clean MHA LOC, 98% Face match</p>
          </button>

          {/* Scenario 2: Photo Replacement Attack */}
          <button
            type="button"
            onClick={() => selectDemoScenario('photo_replacement', 'Passport')}
            className={`p-3 rounded-xl text-left border transition-all duration-150 cursor-pointer ${
              selectedDemoScenario === 'photo_replacement' || selectedDemoScenario === 'passport_forged'
                ? 'bg-rose-500/30 border-rose-400 ring-2 ring-rose-500/40 shadow-lg shadow-rose-950/40'
                : 'bg-brand-950/40 border-brand-700/80 hover:bg-brand-950/70'
            }`}
          >
            <div className="flex items-center justify-between text-rose-400 font-bold text-xs mb-1">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                2. 🚨 Photo Replacement Attack
              </span>
              <ShieldAlert size={16} />
            </div>
            <p className="text-[11px] text-rose-300 font-extrabold uppercase tracking-wide">
              ALERT: PHOTO REPLACEMENT DETECTED
            </p>
            <p className="text-[10px] text-slate-400 mt-1">
              Replaced portrait photo, ELA variance spike, perimeter boundary splicing, identity impersonation
            </p>
          </button>

          {/* Scenario 3: Tampered Visa Stamp */}
          <button
            type="button"
            onClick={() => selectDemoScenario('visa_tampered', 'Visa')}
            className={`p-3 rounded-xl text-left border transition-all duration-150 cursor-pointer ${
              selectedDemoScenario === 'visa_tampered'
                ? 'bg-rose-500/25 border-rose-400 ring-2 ring-rose-500/30'
                : 'bg-brand-950/40 border-brand-700/80 hover:bg-brand-950/70'
            }`}
          >
            <div className="flex items-center justify-between text-rose-400 font-bold text-xs mb-1">
              <span>3. Tampered Visa Stamp (Elena)</span>
              <AlertCircle size={16} />
            </div>
            <p className="text-[11px] text-rose-300 font-bold">Risk: 82 (FORGED STAMP & OVERSTAY)</p>
            <p className="text-[10px] text-slate-400 mt-1">Synthetic border stamp detected, stay altered to 180 days, expired visa</p>
          </button>

          {/* Scenario 4: Modified DOB */}
          <button
            type="button"
            onClick={() => selectDemoScenario('dob_modified', 'Aadhaar')}
            className={`p-3 rounded-xl text-left border transition-all duration-150 cursor-pointer ${
              selectedDemoScenario === 'dob_modified'
                ? 'bg-amber-500/25 border-amber-400 ring-2 ring-amber-500/30'
                : 'bg-brand-950/40 border-brand-700/80 hover:bg-brand-950/70'
            }`}
          >
            <div className="flex items-center justify-between text-amber-400 font-bold text-xs mb-1">
              <span>4. Modified Date of Birth (Pooja)</span>
              <AlertCircle size={16} />
            </div>
            <p className="text-[11px] text-amber-300 font-bold">Risk: 56 (SECONDARY INSPECTION)</p>
            <p className="text-[10px] text-slate-400 mt-1">Birth year altered from 1998 to 1988, font stroke mismatch, ELA cluster</p>
          </button>

          {/* Scenario 5: SSB Border Transit Permit */}
          <button
            type="button"
            onClick={() => selectDemoScenario('transit_permit', 'Border Transit Permit')}
            className={`p-3 rounded-xl text-left border transition-all duration-150 cursor-pointer sm:col-span-2 lg:col-span-2 ${
              selectedDemoScenario === 'transit_permit'
                ? 'bg-emerald-500/25 border-emerald-400 ring-2 ring-emerald-500/30'
                : 'bg-brand-950/40 border-brand-700/80 hover:bg-brand-950/70'
            }`}
          >
            <div className="flex items-center justify-between text-emerald-400 font-bold text-xs mb-1">
              <span>5. Indo-Nepal Border Transit Pass (Sunil Thapa - SSB Raxaul BOP)</span>
              <ShieldCheck size={16} />
            </div>
            <p className="text-[11px] text-emerald-300 font-bold">Risk: 14 (SSB BORDER TRANSIT CLEARED)</p>
            <p className="text-[10px] text-slate-400 mt-1">Sashastra Seema Bal cross-border registry verified, security seal authentic, 96% biometrics</p>
          </button>
        </div>
      </div>

      {/* Main Upload Box Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-card space-y-6">
        {/* Universal Auto-Classification Info */}
        <div className="p-3 bg-emerald-50/80 border border-emerald-200/80 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500 text-slate-950 flex items-center justify-center font-bold">
              <Zap size={15} />
            </div>
            <div>
              <p className="text-xs font-bold text-emerald-950">Universal Document Auto-Reader Active</p>
              <p className="text-[11px] text-emerald-700">Scan or upload any document — AI automatically determines document class & security features</p>
            </div>
          </div>
          <span className="hidden sm:inline-block px-2.5 py-1 text-[10px] font-mono font-bold uppercase tracking-wider bg-white text-emerald-800 rounded-lg border border-emerald-200 shadow-xs">
            Zero Naming Needed
          </span>
        </div>

        {/* Document Drag & Drop Area */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Identity Document <span className="text-rose-500">*</span>
            </label>
            <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
              <Zap size={13} />
              No upload needed with live camera
            </span>
          </div>

          {selectedDemoScenario ? (
            <div className="p-6 rounded-xl border-2 border-dashed border-cyan-400 bg-cyan-50/50 flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-cyan-500/10 text-cyan-600 flex items-center justify-center mb-2">
                <FileCheck size={24} />
              </div>
              <h4 className="text-sm font-bold text-brand-900">
                Preset Selected: {selectedDemoScenario.toUpperCase().replace('_', ' ')} ({documentType})
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mt-1">
                Using built-in SIH test sample document. You can click "Initiate Screening Pipeline" directly, or scan your own ID using camera below.
              </p>
              <button
                type="button"
                onClick={() => setSelectedDemoScenario(null)}
                className="mt-3 text-xs text-slate-600 hover:text-rose-600 font-semibold underline cursor-pointer"
              >
                Clear Preset & Scan Custom Document
              </button>
            </div>
          ) : !docFile ? (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`
                border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center transition-all duration-200
                ${isDragging 
                  ? 'border-cyan-500 bg-cyan-50/50 ring-4 ring-cyan-500/10' 
                  : 'border-slate-300 bg-slate-50/40'}
              `}
            >
              <input
                ref={docInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.pdf"
                onChange={handleDocChange}
                className="hidden"
              />
              <div className="w-14 h-14 mx-auto rounded-2xl bg-brand-50 text-brand-700 flex items-center justify-center mb-3">
                <UploadCloud size={28} />
              </div>
              <h4 className="text-sm font-bold text-brand-900 mb-1">
                Scan with Camera or Drag & Drop Document
              </h4>
              <p className="text-xs text-slate-500 mb-4 max-w-sm mx-auto">
                Direct camera scanning bypasses manual file searching for faster evaluation
              </p>

              {/* Fast Action Buttons: Real-Doc Scan OR Browse */}
              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => navigate('/live-verify')}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-brand-950 text-xs font-black rounded-xl shadow-md shadow-cyan-500/20 transition-all cursor-pointer active:scale-95"
                  title="Verify with Real-Doc Scanner for actual QR & document demographics"
                >
                  <QrCode size={16} className="text-brand-950 stroke-[2.5]" />
                  <span>Verify via Real-Doc Scanner</span>
                </button>

                <button
                  type="button"
                  onClick={() => docInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  <FileText size={15} className="text-slate-500" />
                  <span>Browse Files</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-3 overflow-hidden">
                {docPreview ? (
                  <img
                    src={docPreview}
                    alt="Document preview"
                    className="w-14 h-14 object-cover rounded-lg border border-slate-300 shrink-0"
                  />
                ) : (
                  <div className="w-14 h-14 bg-brand-100 text-brand-700 rounded-lg flex items-center justify-center shrink-0">
                    <FileText size={24} />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-800 truncate">{docFile.name}</p>
                  <p className="text-xs text-slate-500 font-mono">
                    {(docFile.size / (1024 * 1024)).toFixed(2)} MB • {docFile.type || 'Document'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={clearDoc}
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
          )}
        </div>

        {/* Optional Live Selfie / Biometric Capture */}
        <div className="pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Camera size={14} className="text-cyan-600" />
              Optional Live Selfie (For 1:1 Face Verification)
            </label>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
              Biometric Anti-Spoof
            </span>
          </div>

          {!selfieFile ? (
            <div 
              onClick={() => selfieInputRef.current?.click()}
              className="p-4 rounded-xl border border-dashed border-slate-300 hover:border-cyan-500 hover:bg-cyan-50/30 text-center cursor-pointer transition-all"
            >
              <input
                ref={selfieInputRef}
                type="file"
                accept="image/*"
                onChange={handleSelfieChange}
                className="hidden"
              />
              <p className="text-xs font-semibold text-slate-600">
                Click to attach live applicant selfie for facial match comparison
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                (Optional — demo will synthesize comparison if omitted)
              </p>
            </div>
          ) : (
            <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {selfiePreview && (
                  <img
                    src={selfiePreview}
                    alt="Selfie preview"
                    className="w-10 h-10 object-cover rounded-full border border-slate-300"
                  />
                )}
                <div>
                  <p className="text-xs font-bold text-slate-800">{selfieFile.name}</p>
                  <p className="text-[10px] text-slate-500 font-mono">
                    {(selfieFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={clearSelfie}
                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
          )}
        </div>

        {/* Photo Replacement Simulation Checkbox */}
        <div className="pt-2">
          <label className="flex items-center gap-3 p-3.5 rounded-xl border border-rose-200 bg-rose-50/70 hover:bg-rose-50 cursor-pointer transition-all">
            <input
              type="checkbox"
              checked={simulatePhotoReplacement}
              onChange={(e) => setSimulatePhotoReplacement(e.target.checked)}
              className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 border-slate-300"
            />
            <div className="flex-1">
              <span className="text-xs font-extrabold text-rose-950 flex items-center gap-1.5">
                <Scissors size={14} className="text-rose-600" />
                🚨 Test Photo Replacement Attack on this Document
              </span>
              <p className="text-[11px] text-rose-800/80 mt-0.5">
                Simulates physical photo replacement & digital splicing to verify that the Photo Replacement Alert triggers.
              </p>
            </div>
            <span className="text-[10px] font-mono font-bold bg-rose-200/80 text-rose-900 px-2 py-0.5 rounded">
              SIH TEST
            </span>
          </label>
        </div>

        {/* Submit Action */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[11px] text-slate-400 flex items-center gap-1">
            <HelpCircle size={13} />
            Data is strictly processed in-memory. Zero unsafe biometric exposure.
          </p>

          <button
            type="submit"
            disabled={(!docFile && !selectedDemoScenario) || isLoading}
            className={`
              w-full sm:w-auto px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2
              transition-all duration-200 shadow-md cursor-pointer
              ${(!docFile && !selectedDemoScenario) || isLoading
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-brand-900 hover:bg-brand-800 text-white hover:shadow-elevated'}
            `}
          >
            <span>{isLoading ? 'Processing Pipeline...' : 'Initiate Screening Pipeline'}</span>
            <ArrowRight size={16} className="text-cyan-400" />
          </button>
        </div>
      </form>
    </div>
  );
}
