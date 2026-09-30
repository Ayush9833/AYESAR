import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  UploadCloud, 
  FileText, 
  Camera, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  HelpCircle,
  ArrowRight,
  Zap,
  QrCode,
  Compass,
  Globe2,
  ShieldCheck
} from 'lucide-react';

export default function UploadBox({ onStartScreening, isLoading }) {
  const navigate = useNavigate();
  const [docFile, setDocFile] = useState(null);
  const [docPreview, setDocPreview] = useState(null);
  const [backFile, setBackFile] = useState(null);
  const [backPreview, setBackPreview] = useState(null);
  const [selfieFile, setSelfieFile] = useState(null);
  const [selfiePreview, setSelfiePreview] = useState(null);
  const [documentType, setDocumentType] = useState('Auto-Detect (AI)');
  const [borderCorridor, setBorderCorridor] = useState('INDO_BHUTAN');
  const [isDragging, setIsDragging] = useState(false);
  const [isDraggingBack, setIsDraggingBack] = useState(false);

  const docInputRef = useRef(null);
  const backInputRef = useRef(null);
  const selfieInputRef = useRef(null);

  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' }
      });
      streamRef.current = stream;
      setIsCameraActive(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(e => console.error('Play error:', e));
        }
      }, 100);
    } catch (err) {
      console.error('Camera access error:', err);
      setCameraError('Unable to access webcam. Please grant camera permission or attach an image file.');
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    // Mirror image for natural user selfie perspective
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], 'live_webcam_face.jpg', { type: 'image/jpeg' });
        setSelfieFile(file);
        setSelfiePreview(canvas.toDataURL('image/jpeg'));
        stopCamera();
      }
    }, 'image/jpeg', 0.95);
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

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

  const handleBackChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      processBackFile(file);
    }
  };

  const processBackFile = (file) => {
    setBackFile(file);
    setSelectedDemoScenario(null);
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => setBackPreview(reader.result);
      reader.readAsDataURL(file);
    } else {
      setBackPreview(null);
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

  const handleBackDragOver = (e) => {
    e.preventDefault();
    setIsDraggingBack(true);
  };

  const handleBackDragLeave = () => {
    setIsDraggingBack(false);
  };

  const handleBackDrop = (e) => {
    e.preventDefault();
    setIsDraggingBack(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processBackFile(file);
    }
  };

  const clearDoc = () => {
    setDocFile(null);
    setDocPreview(null);
    if (docInputRef.current) docInputRef.current.value = '';
  };

  const clearBack = () => {
    setBackFile(null);
    setBackPreview(null);
    if (backInputRef.current) backInputRef.current.value = '';
  };

  const clearSelfie = () => {
    setSelfieFile(null);
    setSelfiePreview(null);
    if (selfieInputRef.current) selfieInputRef.current.value = '';
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!docFile && !backFile) return;

    onStartScreening({
      documentFile: docFile,
      backSideFile: backFile,
      selfieFile,
      documentType,
      borderCorridor,
      demoScenario: null
    });
  };

  return (
    <div className="space-y-6">

      {/* Main Upload Box Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-card space-y-6">
        
        {/* Border Corridor & Treaty Protocol Selector */}
        <div className="bg-slate-50/90 border border-slate-200/80 rounded-2xl p-4 sm:p-5 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <div className="flex items-center gap-2">
              <Compass size={16} className="text-cyan-700" />
              <label className="text-xs font-black uppercase tracking-wider text-slate-800">
                Border Corridor & Bilateral Treaty Clearance
              </label>
            </div>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-100 text-cyan-900 border border-cyan-200">
              Active Protocol Rules
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {/* India ↔ Bhutan */}
            <button
              type="button"
              onClick={() => setBorderCorridor('INDO_BHUTAN')}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                borderCorridor === 'INDO_BHUTAN'
                  ? 'border-cyan-500 bg-white shadow-sm ring-2 ring-cyan-500/20'
                  : 'border-slate-200 bg-white/70 hover:bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                  <span>🇮🇳 ⇄ 🇧🇹</span>
                  <span>India ↔ Bhutan</span>
                </span>
                {borderCorridor === 'INDO_BHUTAN' && (
                  <span className="w-2 h-2 rounded-full bg-cyan-600"></span>
                )}
              </div>
              <p className="text-[10px] text-slate-500 leading-tight">
                Jaigaon / Phuentsholing • 1949 Friendship Treaty
              </p>
            </button>

            {/* India ↔ Nepal */}
            <button
              type="button"
              onClick={() => setBorderCorridor('INDO_NEPAL')}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                borderCorridor === 'INDO_NEPAL'
                  ? 'border-cyan-500 bg-white shadow-sm ring-2 ring-cyan-500/20'
                  : 'border-slate-200 bg-white/70 hover:bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                  <span>🇮🇳 ⇄ 🇳🇵</span>
                  <span>India ↔ Nepal</span>
                </span>
                {borderCorridor === 'INDO_NEPAL' && (
                  <span className="w-2 h-2 rounded-full bg-cyan-600"></span>
                )}
              </div>
              <p className="text-[10px] text-slate-500 leading-tight">
                Raxaul / Birgunj / Sunauli • 1950 Peace Treaty
              </p>
            </button>

            {/* Universal Checkpoint */}
            <button
              type="button"
              onClick={() => setBorderCorridor('UNIVERSAL')}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                borderCorridor === 'UNIVERSAL'
                  ? 'border-cyan-500 bg-white shadow-sm ring-2 ring-cyan-500/20'
                  : 'border-slate-200 bg-white/70 hover:bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                  <Globe2 size={13} className="text-indigo-600" />
                  <span>Universal Checkpoint</span>
                </span>
                {borderCorridor === 'UNIVERSAL' && (
                  <span className="w-2 h-2 rounded-full bg-cyan-600"></span>
                )}
              </div>
              <p className="text-[10px] text-slate-500 leading-tight">
                General Border Gate • All National & Travel IDs
              </p>
            </button>
          </div>

          {/* Dynamic Rule Summary Pill */}
          <div className="p-2.5 rounded-xl bg-cyan-50/70 border border-cyan-200/70 text-[11px] text-cyan-950 flex items-start gap-2">
            <ShieldCheck size={14} className="text-cyan-700 shrink-0 mt-0.5" />
            <div className="leading-snug">
              {borderCorridor === 'INDO_BHUTAN' && (
                <span>
                  <b>Indo-Bhutan Treaty Rules:</b> Indian citizens enter visa-free with <b>Passport</b> or <b>Voter ID</b> (Aadhaar/DL overland transit permit). Indian minors permitted with <b>Birth Certificate</b> or Passport. Bhutanese citizens enter with <b>Bhutan CID / Passport</b>. Third-country visitors require <b>Passport + Bhutan Visa/e-Visa</b>.
                </span>
              )}
              {borderCorridor === 'INDO_NEPAL' && (
                <span>
                  <b>Indo-Nepal Treaty Rules:</b> Indian citizens enter visa-free with <b>Passport</b> or <b>Voter ID</b> (NTB accepted IDs). Indian minors permitted with <b>Birth Certificate</b> or Passport. Nepali citizens enter with <b>Nagrikta / Passport</b>. Third-country visitors require <b>Passport + Nepal Entry Visa</b>.
                </span>
              )}
              {borderCorridor === 'UNIVERSAL' && (
                <span>
                  <b>Universal Gate Rules:</b> Full multi-spectral validation active for Aadhaar (QR cryptographic signature), ICAO Passports, Driving Licences, PAN Cards, Voter IDs, and Border Transit Passes.
                </span>
              )}
            </div>
          </div>
        </div>

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

        {/* Document Dual-Side Verification Area */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-800">
                Aadhaar / Passport / Driving Licence / ID Verification <span className="text-rose-500">*</span>
              </label>
              <p className="text-[11px] text-slate-500">
                Upload Document Front (text & photo) or Dual-Side (QR code & address) for automated cryptographic and optical verification.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => navigate('/live-verify')}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-brand-950 text-[11px] font-black rounded-lg shadow-sm transition-all cursor-pointer"
                title="Verify with Real-Doc Scanner"
              >
                <QrCode size={13} className="text-brand-950 stroke-[2.5]" />
                <span>Live Scanner</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* SIDE 1: FRONT SIDE (OCR + Photo) */}
              <div className="flex flex-col">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-cyan-600 text-white flex items-center justify-center text-[10px] font-black">1</span>
                    Side 1: Card Front
                  </span>
                  <span className="text-[10px] text-cyan-700 bg-cyan-50 border border-cyan-200 px-1.5 py-0.5 rounded font-mono font-medium">
                    Printed OCR & Photo
                  </span>
                </div>

                {!docFile ? (
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => docInputRef.current?.click()}
                    className={`
                      border-2 border-dashed rounded-xl p-5 text-center flex-1 flex flex-col items-center justify-center transition-all duration-200 cursor-pointer min-h-[160px]
                      ${isDragging 
                        ? 'border-cyan-500 bg-cyan-50/50 ring-2 ring-cyan-500/20' 
                        : 'border-slate-300 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-400'}
                    `}
                  >
                    <input
                      ref={docInputRef}
                      type="file"
                      accept=".jpg,.jpeg,.png,.pdf"
                      onChange={handleDocChange}
                      className="hidden"
                    />
                    <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center mb-2">
                      <FileText size={20} />
                    </div>
                    <h5 className="text-xs font-bold text-slate-800 mb-0.5">Upload Card Front</h5>
                    <p className="text-[11px] text-slate-500 max-w-[200px]">
                      Drag & drop front face of card, or click to browse
                    </p>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between min-h-[160px]">
                    <div className="flex items-center gap-3 overflow-hidden">
                      {docPreview ? (
                        <img
                          src={docPreview}
                          alt="Card Front preview"
                          className="w-16 h-20 object-cover rounded-lg border border-slate-300 shrink-0 shadow-xs"
                        />
                      ) : (
                        <div className="w-16 h-20 bg-brand-100 text-brand-700 rounded-lg flex items-center justify-center shrink-0">
                          <FileText size={24} />
                        </div>
                      )}
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold text-cyan-700 bg-cyan-50 border border-cyan-200 px-1.5 py-0.5 rounded font-mono uppercase">
                          Front Side Selected
                        </span>
                        <p className="text-xs font-bold text-slate-800 truncate mt-1">{docFile.name}</p>
                        <p className="text-[11px] text-slate-500 font-mono">
                          {(docFile.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={clearDoc}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                      title="Remove front side"
                    >
                      <X size={18} />
                    </button>
                  </div>
                )}
              </div>

              {/* SIDE 2: BACK SIDE (Secure QR Code) */}
              <div className="flex flex-col">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-black">2</span>
                    Side 2: Card Back / QR Code
                  </span>
                  <span className="text-[10px] text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded font-mono font-medium">
                    UIDAI QR & Address
                  </span>
                </div>

                {!backFile ? (
                  <div
                    onDragOver={handleBackDragOver}
                    onDragLeave={handleBackDragLeave}
                    onDrop={handleBackDrop}
                    onClick={() => backInputRef.current?.click()}
                    className={`
                      border-2 border-dashed rounded-xl p-5 text-center flex-1 flex flex-col items-center justify-center transition-all duration-200 cursor-pointer min-h-[160px]
                      ${isDraggingBack 
                        ? 'border-blue-500 bg-blue-50/50 ring-2 ring-blue-500/20' 
                        : 'border-slate-300 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-400'}
                    `}
                  >
                    <input
                      ref={backInputRef}
                      type="file"
                      accept=".jpg,.jpeg,.png,.pdf"
                      onChange={handleBackChange}
                      className="hidden"
                    />
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-2">
                      <QrCode size={20} />
                    </div>
                    <h5 className="text-xs font-bold text-slate-800 mb-0.5">Upload Card Back / QR</h5>
                    <p className="text-[11px] text-slate-500 max-w-[200px]">
                      Drag & drop back of card with QR code, or click to browse
                    </p>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between min-h-[160px]">
                    <div className="flex items-center gap-3 overflow-hidden">
                      {backPreview ? (
                        <img
                          src={backPreview}
                          alt="Card Back preview"
                          className="w-16 h-20 object-cover rounded-lg border border-slate-300 shrink-0 shadow-xs"
                        />
                      ) : (
                        <div className="w-16 h-20 bg-blue-100 text-blue-700 rounded-lg flex items-center justify-center shrink-0">
                          <QrCode size={24} />
                        </div>
                      )}
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded font-mono uppercase">
                          Back Side Selected
                        </span>
                        <p className="text-xs font-bold text-slate-800 truncate mt-1">{backFile.name}</p>
                        <p className="text-[11px] text-slate-500 font-mono">
                          {(backFile.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={clearBack}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                      title="Remove back side"
                    >
                      <X size={18} />
                    </button>
                  </div>
                )}
              </div>
            </div>
        </div>

        {/* Live Traveler Biometric Webcam / Selfie Capture */}
        <div className="pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Camera size={14} className="text-cyan-600" />
              Live Traveler Biometric Capture (Webcam 1:1 Match)
            </label>
            <span className="text-[10px] text-cyan-700 bg-cyan-50 border border-cyan-200 px-2 py-0.5 rounded uppercase tracking-wider font-bold">
              ArcFace 512D + Anti-Spoof
            </span>
          </div>

          {isCameraActive ? (
            <div className="relative rounded-2xl overflow-hidden bg-slate-950 border-2 border-cyan-500 shadow-xl flex flex-col items-center p-3">
              <div className="relative w-full max-w-sm aspect-[4/3] rounded-xl overflow-hidden bg-black flex items-center justify-center">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover transform -scale-x-100"
                />
                {/* Face positioning oval guide */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-40 h-52 rounded-[50%] border-2 border-dashed border-cyan-400/80 shadow-[0_0_20px_rgba(6,182,212,0.3)]"></div>
                </div>
                <div className="absolute top-2 left-2 bg-slate-900/80 text-cyan-300 text-[10px] font-mono px-2 py-0.5 rounded-full flex items-center gap-1.5 backdrop-blur-sm">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  <span>LIVE CAMERA STREAM ACTIVE</span>
                </div>
              </div>

              <div className="flex items-center gap-3 mt-3 w-full max-w-sm justify-center">
                <button
                  type="button"
                  onClick={capturePhoto}
                  className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95"
                >
                  <Camera size={16} />
                  <span>Capture Live Photo</span>
                </button>
                <button
                  type="button"
                  onClick={stopCamera}
                  className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : !selfieFile ? (
            <div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={startCamera}
                  className="p-4 rounded-xl border border-cyan-300 bg-cyan-50/60 hover:bg-cyan-50 hover:border-cyan-500 flex flex-col items-center text-center cursor-pointer transition-all group shadow-sm"
                >
                  <div className="w-10 h-10 rounded-full bg-cyan-500/10 text-cyan-600 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
                    <Camera size={20} />
                  </div>
                  <span className="text-xs font-bold text-brand-900">
                    Open Live Webcam
                  </span>
                  <span className="text-[10px] text-slate-500 mt-0.5">
                    Click real-time photo with laptop/phone camera
                  </span>
                </button>

                <div
                  onClick={() => selfieInputRef.current?.click()}
                  className="p-4 rounded-xl border border-dashed border-slate-300 hover:border-slate-400 hover:bg-slate-50 flex flex-col items-center text-center cursor-pointer transition-all group"
                >
                  <input
                    ref={selfieInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleSelfieChange}
                    className="hidden"
                  />
                  <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
                    <UploadCloud size={20} />
                  </div>
                  <span className="text-xs font-bold text-slate-700">
                    Upload Selfie File
                  </span>
                  <span className="text-[10px] text-slate-400 mt-0.5">
                    Attach JPG/PNG photo from disk
                  </span>
                </div>
              </div>
              {cameraError && (
                <p className="text-[11px] text-rose-600 mt-2 font-semibold flex items-center gap-1">
                  <AlertCircle size={13} />
                  {cameraError}
                </p>
              )}
            </div>
          ) : (
            <div className="p-3.5 rounded-xl border border-emerald-300 bg-emerald-50/70 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {selfiePreview && (
                  <img
                    src={selfiePreview}
                    alt="Selfie preview"
                    className="w-12 h-12 object-cover rounded-full border-2 border-emerald-500 shadow-sm"
                  />
                )}
                <div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 size={14} className="text-emerald-600" />
                    <p className="text-xs font-extrabold text-emerald-950">Live Photo Ready for ArcFace Matching</p>
                  </div>
                  <p className="text-[10px] text-emerald-800 font-mono mt-0.5">
                    {selfieFile.name} • {(selfieFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={clearSelfie}
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                title="Remove photo"
              >
                <X size={18} />
              </button>
            </div>
          )}
        </div>

        {/* Submit Action */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[11px] text-slate-400 flex items-center gap-1">
            <HelpCircle size={13} />
            Data is strictly processed in-memory. Zero unsafe biometric exposure.
          </p>

          <button
            type="submit"
            disabled={!docFile || isLoading}
            className={`
              w-full sm:w-auto px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2
              transition-all duration-200 shadow-md cursor-pointer
              ${!docFile || isLoading
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
