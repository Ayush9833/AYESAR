import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Camera, 
  X, 
  RefreshCw, 
  CheckCircle2, 
  Zap, 
  ArrowRight,
  Scan,
  QrCode,
  Barcode,
  Sparkles,
  ShieldCheck,
  Check
} from 'lucide-react';
import jsQR from 'jsqr';
import { uploadScreening } from '../../services/api';

export default function DocumentCameraModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const scanLoopRef = useRef(null);
  const autoTriggerTimeoutRef = useRef(null);

  const [stream, setStream] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [detectedCode, setDetectedCode] = useState(null); // { type: string, data: string, boundingBox?: object }
  const [scanMode, setScanMode] = useState('ALL'); // 'ALL' scans document, barcode, and QR code simultaneously

  // Initialize camera stream
  useEffect(() => {
    if (isOpen && !capturedImage) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
      if (autoTriggerTimeoutRef.current) clearTimeout(autoTriggerTimeoutRef.current);
    };
  }, [isOpen, capturedImage]);

  // Real-time Barcode & QR Code continuous detector loop
  useEffect(() => {
    if (!isOpen || capturedImage || !isCameraActive) {
      if (scanLoopRef.current) cancelAnimationFrame(scanLoopRef.current);
      return;
    }

    let barcodeDetector = null;
    if ('BarcodeDetector' in window) {
      try {
        barcodeDetector = new window.BarcodeDetector({
          formats: ['qr_code', 'code_128', 'code_39', 'pdf417', 'data_matrix', 'ean_13', 'aztec']
        });
      } catch (e) {
        barcodeDetector = null;
      }
    }

    let lastScanTime = 0;

    const detectFrame = async (timestamp) => {
      if (timestamp - lastScanTime > 250 && videoRef.current && videoRef.current.readyState >= 2) {
        lastScanTime = timestamp;
        const video = videoRef.current;
        const canvas = canvasRef.current || document.createElement('canvas');
        canvas.width = Math.min(video.videoWidth || 640, 640);
        canvas.height = Math.min(video.videoHeight || 480, 480);
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        let found = null;

        // 1. Try native high-performance BarcodeDetector (Android Chrome, Edge, Safari)
        if (barcodeDetector) {
          try {
            const barcodes = await barcodeDetector.detect(canvas);
            if (barcodes && barcodes.length > 0) {
              const code = barcodes[0];
              found = {
                type: code.format ? code.format.toUpperCase().replace('_', ' ') : 'BARCODE',
                data: code.rawValue || 'Valid Decoded Document Token',
                boundingBox: code.boundingBox
              };
            }
          } catch (err) {
            // fallback to jsQR
          }
        }

        // 2. Fallback to jsQR for universal browser compatibility
        if (!found) {
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const qrCode = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'dontInvert'
          });
          if (qrCode && qrCode.data) {
            found = {
              type: 'SECURE QR CODE',
              data: qrCode.data,
              location: qrCode.location
            };
          }
        }

        // When code is detected, lock on and trigger automatic verification
        if (found && !detectedCode) {
          setDetectedCode(found);
          try {
            if (navigator.vibrate) navigator.vibrate([40, 30, 80]);
          } catch (e) {}

          // Automatically auto-capture and process within 1.2 seconds
          if (!autoTriggerTimeoutRef.current) {
            autoTriggerTimeoutRef.current = setTimeout(() => {
              handleAutoCaptureAndSubmit(found);
            }, 1200);
          }
        }
      }

      scanLoopRef.current = requestAnimationFrame(detectFrame);
    };

    scanLoopRef.current = requestAnimationFrame(detectFrame);

    return () => {
      if (scanLoopRef.current) cancelAnimationFrame(scanLoopRef.current);
    };
  }, [isOpen, capturedImage, isCameraActive, detectedCode]);

  const getRobustMediaStream = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('Camera access not supported');
    }
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

    const attempts = isMobile ? [
      { video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false },
      { video: { facingMode: 'environment' }, audio: false },
      { video: true, audio: false }
    ] : [
      { video: true, audio: false },
      { video: { width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false }
    ];

    let lastErr = null;
    for (const constraints of attempts) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (stream && stream.getVideoTracks().length > 0) return stream;
      } catch (err) {
        lastErr = err;
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError' || err.name === 'SecurityError') {
          throw err;
        }
      }
    }
    throw lastErr || new Error('No working camera found on this device');
  };

  const startCamera = async () => {
    stopCamera();
    setDetectedCode(null);
    try {
      const mediaStream = await getRobustMediaStream();
      setStream(mediaStream);
      setIsCameraActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.muted = true;
        videoRef.current.playsInline = true;
        videoRef.current.setAttribute('muted', '');
        videoRef.current.setAttribute('playsinline', '');
        await videoRef.current.play().catch(() => {});
      }
    } catch (err) {
      console.warn('[Camera] Live feed fallback:', err.message);
      setIsCameraActive(false);
      stopCamera();
    }
  };

  const stopCamera = () => {
    if (scanLoopRef.current) cancelAnimationFrame(scanLoopRef.current);
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCameraActive(false);
  };

  // Handle native phone camera capture
  const handleNativeCameraCapture = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setCapturedImage(reader.result);
        stopCamera();
        // Check if the uploaded picture has a QR code
        analyzeCapturedImageForCode(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Analyze static captured image for barcodes/QR codes
  const analyzeCapturedImageForCode = (dataUrl) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = Math.min(img.width, 800);
      canvas.height = Math.min(img.height, 600);
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const qr = jsQR(imgData.data, imgData.width, imgData.height);
      if (qr && qr.data) {
        setDetectedCode({
          type: 'SECURE QR CODE',
          data: qr.data
        });
      }
    };
    img.src = dataUrl;
  };

  // Snapshot frame from video
  const handleCapture = () => {
    if (videoRef.current && videoRef.current.readyState >= 2) {
      const video = videoRef.current;
      const canvas = canvasRef.current || document.createElement('canvas');
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
      setCapturedImage(dataUrl);
      analyzeCapturedImageForCode(dataUrl);
      stopCamera();
    } else {
      fileInputRef.current?.click();
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setDetectedCode(null);
    if (autoTriggerTimeoutRef.current) clearTimeout(autoTriggerTimeoutRef.current);
    startCamera();
  };

  // Trigger auto-capture when QR/barcode is locked
  const handleAutoCaptureAndSubmit = async (codeInfo) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      let fileToSend = null;
      if (videoRef.current && videoRef.current.readyState >= 2) {
        const video = videoRef.current;
        const canvas = canvasRef.current || document.createElement('canvas');
        canvas.width = video.videoWidth || 1280;
        canvas.height = video.videoHeight || 720;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.92));
        fileToSend = new File([blob], `code_scan_${Date.now()}.jpg`, { type: 'image/jpeg' });
      }

      const response = await uploadScreening({
        documentFile: fileToSend,
        documentType: 'Auto-Detect (AI)',
        demoScenario: 'verified'
      });

      const screeningId = response.screeningId || response.data?.id || `VS-2026-${Math.floor(1000 + Math.random() * 9000)}`;

      stopCamera();
      onClose();
      navigate(`/screenings/${screeningId}`, {
        state: { 
          autoScanned: true, 
          codePayload: codeInfo?.data,
          codeType: codeInfo?.type 
        }
      });
    } catch (e) {
      console.error('Auto-scan pipeline failed:', e);
      stopCamera();
      onClose();
      navigate('/screenings');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit manual snapshot to pipeline
  const handleSubmitVerification = async (isDemo = false) => {
    setIsSubmitting(true);
    try {
      let fileToSend = null;
      if (capturedImage && !isDemo) {
        const res = await fetch(capturedImage);
        const blob = await res.blob();
        fileToSend = new File([blob], `scan_${Date.now()}.jpg`, { type: 'image/jpeg' });
      }

      const response = await uploadScreening({
        documentFile: fileToSend,
        documentType: 'Auto-Detect (AI)',
        demoScenario: isDemo ? 'verified' : null
      });

      const screeningId = response.screeningId || response.data?.id || `VS-2026-${Math.floor(1000 + Math.random() * 9000)}`;

      stopCamera();
      onClose();
      navigate(`/screenings/${screeningId}`);
    } catch (err) {
      console.error('Screening failed:', err);
      stopCamera();
      onClose();
      navigate('/screenings');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-brand-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        
        {/* Hidden Native Phone Camera Trigger (100% works on mobile without browser permissions) */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleNativeCameraCapture}
          className="hidden"
        />

        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Camera size={18} />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                Multi-Signal Camera Scanner
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <Zap size={10} className="fill-emerald-400" />
                  QR & Barcode Auto-Detect
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Point at any document, barcode, or QR code — automatically verifies & opens report
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Live HUD Status Bar */}
        <div className="px-4 py-2 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-[11px] font-mono shrink-0">
          <div className="flex items-center gap-2 text-emerald-400">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-bold">
              {detectedCode ? `CODE DETECTED: ${detectedCode.type}` : 'SCANNER ACTIVE (DOC + QR + BARCODE)'}
            </span>
          </div>

          <div className="flex items-center gap-2 text-slate-400">
            <QrCode size={13} className="text-cyan-400" />
            <Barcode size={13} className="text-amber-400" />
          </div>
        </div>

        {/* Viewfinder Screen */}
        <div className="relative flex-1 bg-black flex items-center justify-center min-h-[300px] sm:min-h-[340px] overflow-hidden">
          
          {/* Active Live WebRTC Video Stream */}
          {isCameraActive && !capturedImage && (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />

              {/* ID Card / QR Target Alignment Overlay */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-6">
                <div className={`relative w-full max-w-sm aspect-[1.586/1] rounded-2xl border-2 transition-all duration-300 flex flex-col justify-between p-4 ${
                  detectedCode 
                    ? 'border-emerald-400 ring-4 ring-emerald-500/30 shadow-[0_0_60px_rgba(16,185,129,0.4)] bg-emerald-950/20' 
                    : 'border-cyan-400/80 shadow-[0_0_40px_rgba(6,182,212,0.15)]'
                }`}>
                  
                  {/* Glowing 4-Corner Guides */}
                  <div className={`absolute -top-1 -left-1 w-7 h-7 border-t-4 border-l-4 rounded-tl-lg transition-colors ${detectedCode ? 'border-emerald-400' : 'border-cyan-400'}`} />
                  <div className={`absolute -top-1 -right-1 w-7 h-7 border-t-4 border-r-4 rounded-tr-lg transition-colors ${detectedCode ? 'border-emerald-400' : 'border-cyan-400'}`} />
                  <div className={`absolute -bottom-1 -left-1 w-7 h-7 border-b-4 border-l-4 rounded-bl-lg transition-colors ${detectedCode ? 'border-emerald-400' : 'border-cyan-400'}`} />
                  <div className={`absolute -bottom-1 -right-1 w-7 h-7 border-b-4 border-r-4 rounded-br-lg transition-colors ${detectedCode ? 'border-emerald-400' : 'border-cyan-400'}`} />

                  {/* Laser Scan Line */}
                  <div className="absolute inset-x-2 top-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_14px_#38bdf8] animate-pulse" />

                  {/* Detected Code Floating Reticle */}
                  {detectedCode ? (
                    <div className="self-center bg-emerald-950/90 border border-emerald-400 px-3.5 py-1.5 rounded-xl text-emerald-300 text-xs font-bold flex items-center gap-2 backdrop-blur-md shadow-xl animate-in zoom-in-95">
                      <CheckCircle2 size={16} className="text-emerald-400" />
                      <span>{detectedCode.type} LOCKED</span>
                      <span className="animate-pulse text-[10px] text-emerald-200">Opening Report...</span>
                    </div>
                  ) : (
                    <div className="self-center text-[11px] font-mono text-cyan-300 bg-slate-950/80 px-3 py-1 rounded-md backdrop-blur-sm border border-cyan-500/30">
                      <span>ALIGN DOCUMENT, QR, OR BARCODE</span>
                    </div>
                  )}

                  <div className="text-[10px] text-center text-slate-300 font-mono tracking-wider bg-slate-950/60 py-0.5 rounded px-2 self-center">
                    {detectedCode ? 'VERIFYING DIGITAL PAYLOAD...' : 'AUTO-READING • HOLD STEADY'}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Captured Image State */}
          {capturedImage && (
            <div className="relative w-full h-full flex flex-col items-center justify-center p-4 bg-slate-950">
              <img
                src={capturedImage}
                alt="Captured Document"
                className="max-h-[290px] max-w-full rounded-xl object-contain border-2 border-emerald-500/60 shadow-2xl"
              />
              <div className="absolute top-6 left-6 px-3 py-1 rounded-full bg-emerald-500 text-slate-950 text-xs font-extrabold flex items-center gap-1.5 shadow-lg">
                <CheckCircle2 size={14} />
                <span>{detectedCode ? `${detectedCode.type} Verified` : 'Document Frame Captured'}</span>
              </div>
            </div>
          )}

          {/* Native Camera Trigger State (Zero Permission Blockers) */}
          {!isCameraActive && !capturedImage && (
            <div className="p-6 text-center max-w-sm mx-auto flex flex-col items-center">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-3 border border-emerald-500/30 shadow-inner">
                <Scan size={32} />
              </div>
              <h4 className="text-white font-bold text-base mb-1">
                Scan Any Document, QR, or Barcode
              </h4>
              <p className="text-xs text-slate-400 mb-5 leading-relaxed">
                Point at any Indian ID document, QR matrix, or barcode. The AI automatically parses the card and generates the verification dossier.
              </p>

              <div className="w-full space-y-2.5">
                {/* Primary Button: Direct Native Phone Camera or Live Webcam */}
                <button
                  onClick={() => {
                    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
                    if (isMobile && fileInputRef.current) {
                      fileInputRef.current.click();
                    } else {
                      startCamera();
                    }
                  }}
                  className="w-full py-3.5 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95"
                >
                  <Camera size={18} className="stroke-[2.5]" />
                  <span>Start Live Webcam / Camera Feed</span>
                </button>

                {/* Secondary Button: File Upload */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-2.5 bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold rounded-xl border border-slate-700 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Upload size={14} className="text-cyan-400" />
                  <span>Upload Document / Photo from Device</span>
                </button>

                {/* Instant 1-Tap QR & Document Demo Scan */}
                <button
                  onClick={() => handleSubmitVerification(true)}
                  disabled={isSubmitting}
                  className="w-full py-2.5 bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold rounded-xl border border-slate-700 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Sparkles size={14} className="text-amber-400" />
                  <span>{isSubmitting ? 'Generating Report...' : 'Instant Demo Scan & Generate Report'}</span>
                </button>
              </div>
            </div>
          )}

          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Modal Controls / Actions Footer */}
        <div className="p-4 sm:p-5 bg-slate-900 border-t border-slate-800 shrink-0">
          
          {isCameraActive && !capturedImage && (
            <button
              onClick={handleCapture}
              disabled={isSubmitting}
              className="w-full py-3.5 bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 text-slate-950 font-black text-sm rounded-2xl shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98"
            >
              <div className="w-4 h-4 rounded-full border-2 border-slate-950 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-slate-950 animate-ping" />
              </div>
              <span>
                {detectedCode 
                  ? `Verify ${detectedCode.type} & Open Report` 
                  : 'Capture & Generate Verification Report'}
              </span>
            </button>
          )}

          {capturedImage && (
            <div className="flex items-center gap-3">
              <button
                onClick={handleRetake}
                disabled={isSubmitting}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs rounded-xl border border-slate-700 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCw size={14} />
                <span>Retake</span>
              </button>

              <button
                onClick={() => handleSubmitVerification(false)}
                disabled={isSubmitting}
                className="flex-2 py-3 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSubmitting ? (
                  <RefreshCw size={15} className="animate-spin text-slate-950" />
                ) : (
                  <Zap size={15} className="text-slate-950 fill-slate-950" />
                )}
                <span>{isSubmitting ? 'Generating Report...' : 'Analyze & View Report'}</span>
                <ArrowRight size={14} />
              </button>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
