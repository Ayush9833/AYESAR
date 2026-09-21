import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import jsQR from 'jsqr';
import QRCode from 'qrcode';
import { 
  QRCodeReader, 
  MultiFormatReader,
  BarcodeFormat,
  DecodeHintType, 
  RGBLuminanceSource, 
  HybridBinarizer, 
  GlobalHistogramBinarizer, 
  BinaryBitmap 
} from '@zxing/library';
import { 
  ShieldCheck, 
  ShieldAlert, 
  QrCode, 
  FileText, 
  Calculator, 
  Camera, 
  Upload, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Sparkles, 
  ArrowRight, 
  RefreshCw, 
  Maximize2, 
  SwitchCamera, 
  X, 
  Target, 
  ScanLine,
  Eye
} from 'lucide-react';
import { 
  Copy, 
  Check, 
  Terminal, 
  Code2, 
  ExternalLink,
  Layers,
  FileCheck2,
  Binary
} from 'lucide-react';
import { 
  validateVerhoeff, 
  generateVerhoeff, 
  getVerhoeffTrace, 
  parseTD3PassportMRZ, 
  parseUniversalQR,
  parseAadhaarQRCode, 
  SAMPLE_TEST_VECTORS 
} from '../utils/verificationEngines';
import { uploadScreening } from '../services/api';
import { performAadhaarCardOCR, cropResidentPhotoFromCard, cropQrRegionFromDocument } from '../utils/cardOcrEngine';
import { compareQrAndOcr, evaluateCompositeRisk, stringSimilarity, levenshtein, normalizeName, normalizeId } from '../utils/qrOcrComparisonEngine';
import QrOcrComparisonCard from '../components/screening/QrOcrComparisonCard';

/**
 * Validates whether a decoded QR payload belongs to an authentic identity document or official government service
 */
function isRecognizedIdentityQR(parsed) {
  if (!parsed || !parsed.format || parsed.format === 'NOT_DETECTED') return false;

  // 1. Official UIDAI Aadhaar formats & Barcodes on IDs
  if ([
    'UIDAI_SECURE_BINARY', 'UIDAI_SECURE_V2', 'UIDAI_FRONT_ARRAY', 
    'XML', 'UIDAI_DIRECT_UID', 'BINARY_ENCRYPTED', 'PDF417', 'CODE_128', 'DATA_MATRIX'
  ].includes(parsed.format)) {
    return true;
  }

  // 2. Official Government / Identity Portal URL (e.g. DigiLocker, UIDAI, Parivahan, Passport, e-District)
  if (parsed.format === 'URL') {
    const rawUrl = (parsed.rawPayload || parsed.url || '').toLowerCase();
    const isGovDomain = rawUrl.includes('.gov.in') || rawUrl.includes('uidai.gov.in') || rawUrl.includes('nic.in') || rawUrl.includes('digilocker.gov.in') || rawUrl.includes('parivahan.gov.in') || rawUrl.includes('passportindia.gov.in') || rawUrl.includes('incometax.gov.in');
    const isVerifyPath = rawUrl.includes('verify') || rawUrl.includes('aadhaar') || rawUrl.includes('kyc') || rawUrl.includes('identity') || rawUrl.includes('certificate') || rawUrl.includes('verification');
    const isBlocked = rawUrl.includes('youtube.com') || rawUrl.includes('youtu.be') || rawUrl.includes('spotify.com') || rawUrl.includes('instagram.com') || rawUrl.includes('facebook.com') || rawUrl.includes('tiktok.com') || rawUrl.includes('twitter.com') || rawUrl.includes('x.com');
    return !isBlocked && (isGovDomain || isVerifyPath);
  }

  // 3. Structured JSON with identity fields
  if (parsed.format === 'JSON') {
    const f = parsed.fields || {};
    const keys = Object.keys(f).map(k => k.toLowerCase());
    const hasIdentityKey = keys.some(k => 
      ['name', 'dob', 'yob', 'uid', 'aadhaar', 'pan', 'passport', 'voter', 'epic', 'license', 'dl', 'id', 'idnumber', 'gender', 'address', 'signature', 'doc_type'].includes(k)
    );
    return hasIdentityKey || Boolean(parsed.name || parsed.idNumber || parsed.dob);
  }

  // 4. Key-Value format with identity fields
  if (parsed.format === 'KEY_VALUE') {
    const f = parsed.fields || {};
    const keys = Object.keys(f).map(k => k.toLowerCase());
    return keys.some(k => ['name', 'dob', 'uid', 'id', 'pan', 'aadhaar', 'passport', 'license', 'gender'].includes(k)) || Boolean(parsed.name || parsed.idNumber);
  }

  // 5. Plain Text with identity pattern (12-digit Aadhaar, PAN format, Passport number, Voter EPIC, DL, or Name+DOB)
  if (parsed.format === 'TEXT' || parsed.format === 'PLAIN_TEXT') {
    const text = (parsed.rawPayload || '').trim();
    const isAadhaarUid = /^\d{4}\s*\d{4}\s*\d{4}$/.test(text) || /^\d{12}$/.test(text);
    const isPan = /^[A-Z]{5}[0-9]{4}[A-Z]$/i.test(text);
    const isPassport = /^[A-PR-WYa-pr-wy][0-9]{7}$/i.test(text);
    const isVoter = /^[A-Z]{3}[0-9]{7}$/i.test(text);
    const isDl = /^[A-Z]{2}[-\s]?[0-9]{2}[-\s]?[0-9]{4,11}$/i.test(text);
    return isAadhaarUid || isPan || isPassport || isVoter || isDl || Boolean(parsed.name && parsed.dob);
  }

  // 6. Generic QR containing identity tokens
  const raw = (parsed.rawPayload || '').toLowerCase();
  if (raw.includes('aadhaar') || raw.includes('uidai') || raw.includes('pan') || raw.includes('income tax') || raw.includes('passport') || raw.includes('republic of india') || raw.includes('driving licence') || raw.includes('voter id')) {
    return true;
  }

  return false;
}

/**
 * Universal strict validation for identity cards and government documents.
 * Rejects random photos (laptop screens, selfies, scenery, furniture, pets, receipts)
 * Accepts only authentic Indian government identity documents.
 */
function isRecognizedIdentityDocument(ocrResult) {
  if (!ocrResult) return false;

  const raw = (ocrResult.rawText || '').toLowerCase();
  if (!raw || raw.trim().length < 8) return false;

  // 1. Strict official government issuer keywords (English & Hindi)
  // MUST be explicit government authority keywords - never generic words like 'address' or 'c/o'
  const officialIssuers = [
    'aadhaar', 'uidai', 'unique identification', 'mera aadhaar', 'meri pehchan', 
    'आधार', 'भारत सरकार', 'government of india', 'enrollment no', 'मेरा आधार मेरी पहचान', 'विशिष्ट पहचान',
    'income tax department', 'permanent account number', 'pan card', 'आयकर विभाग',
    'election commission', 'voter id', 'electoral photo', 'epic no', 'निर्वाचन आयोग', 'मतदाता पहचान',
    'driving licence', 'driving license', 'motor vehicles', 'transport department', 'union of india', 'parivahan',
    'republic of india', 'passport', 'p<ind', 'indian passport', 'भारत गणराज्य'
  ];

  const hasOfficialIssuer = officialIssuers.some(kw => raw.includes(kw));

  // 2. Recognized official ID number format
  const uid = (ocrResult.uid || '').trim();
  let hasValidIdFormat = false;
  if (uid) {
    const isAadhaar = /^\d{4}\s*\d{4}\s*\d{4}$/.test(uid) || /^[Xx\*\.]{4}\s*[Xx\*\.]{4}\s*\d{4}$/.test(uid);
    const isPan = /^[A-Z]{5}[0-9]{4}[A-Z]$/i.test(uid);
    const isPassport = /^[A-PR-WYa-pr-wy][0-9]{7}$/i.test(uid);
    const isVoter = /^[A-Z]{3}[0-9]{7}$/i.test(uid);
    const isDl = /^[A-Z]{2}[-\s]?[0-9]{2}[-\s]?[0-9]{4,11}$/i.test(uid);
    hasValidIdFormat = isAadhaar || isPan || isPassport || isVoter || isDl;
  }

  // 3. Extracted resident demographics
  const hasResidentDemographics = Boolean(ocrResult.name && (ocrResult.dob || ocrResult.gender));

  // 4. Recognized specific document type (not generic or unknown)
  const isRecognizedType = Boolean(
    ocrResult.docType && 
    ocrResult.docType !== 'Identity Document' && 
    ocrResult.docType !== 'Official ID Card' && 
    ocrResult.docType !== 'Unknown'
  );

  // STRICT RULE A: Official Issuer present AND (valid ID format OR resident demographics OR recognized doc type)
  if (hasOfficialIssuer && (hasValidIdFormat || hasResidentDemographics || isRecognizedType)) {
    return true;
  }

  // STRICT RULE B: Recognized official ID format AND resident demographics
  if (hasValidIdFormat && hasResidentDemographics) {
    return true;
  }

  // Otherwise, strictly reject as non-document / random photo
  return false;
}

/**
 * Adaptive contrast stretching and unsharp mask filter for blurry / glare QR codes
 */
function enhanceBlurryFrame(ctx, width, height) {
  const imgData = ctx.getImageData(0, 0, width, height);
  const d = imgData.data;

  let minLum = 255;
  let maxLum = 0;
  for (let i = 0; i < d.length; i += 16) {
    const lum = d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114;
    if (lum < minLum) minLum = lum;
    if (lum > maxLum) maxLum = lum;
  }

  const range = Math.max(maxLum - minLum, 30);

  for (let i = 0; i < d.length; i += 4) {
    const lum = d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114;
    const normalized = Math.min(255, Math.max(0, ((lum - minLum) / range) * 255));
    const val = normalized < 125 ? Math.max(0, normalized * 0.5) : Math.min(255, normalized * 1.45);
    d[i] = val;
    d[i + 1] = val;
    d[i + 2] = val;
  }

  return imgData;
}

/**
 * Universal Multi-Engine QR Decoder
 * Uses Native Chrome/Android BarcodeDetector -> jsQR -> ZXing Hybrid -> ZXing GlobalHistogram -> Adaptive Filter
 */
/**
 * Decodes a single canvas using Hardware BarcodeDetector -> jsQR -> ZXing (Hybrid) -> ZXing (GlobalHistogram) -> Adaptive Contrast
 */
const ALL_BARCODE_FORMATS = [
  'qr_code', 'pdf417', 'data_matrix', 'aztec',
  'code_128', 'code_39', 'code_93', 'codabar', 'itf',
  'ean_13', 'ean_8', 'upc_a', 'upc_e'
];

const zxingMultiReader = new MultiFormatReader();
const zxingHints = new Map();
zxingHints.set(DecodeHintType.TRY_HARDER, true);
zxingHints.set(DecodeHintType.POSSIBLE_FORMATS, [
  BarcodeFormat.QR_CODE,
  BarcodeFormat.CODE_128,
  BarcodeFormat.CODE_39,
  BarcodeFormat.CODE_93,
  BarcodeFormat.PDF_417,
  BarcodeFormat.DATA_MATRIX,
  BarcodeFormat.AZTEC,
  BarcodeFormat.EAN_13,
  BarcodeFormat.EAN_8,
  BarcodeFormat.ITF,
  BarcodeFormat.CODABAR,
  BarcodeFormat.UPC_A,
  BarcodeFormat.UPC_E
]);
zxingMultiReader.setHints(zxingHints);

const zxingQrReader = new QRCodeReader();
const zxingQrHints = new Map();
zxingQrHints.set(DecodeHintType.TRY_HARDER, true);
zxingQrHints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.QR_CODE]);

/**
 * 3x3 Convolution Sharpening Filter for webcams with soft focus
 */
function createSharpenedCanvas(canvas) {
  try {
    const w = canvas.width;
    const h = canvas.height;
    if (w < 40 || h < 40) return null;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const imgData = ctx.getImageData(0, 0, w, h);
    const src = imgData.data;

    const outCvs = document.createElement('canvas');
    outCvs.width = w;
    outCvs.height = h;
    const outCtx = outCvs.getContext('2d', { willReadFrequently: true });
    const outData = outCtx.createImageData(w, h);
    const dst = outData.data;

    // Fast 3x3 kernel: center 5, cross -1
    for (let y = 1; y < h - 1; y++) {
      const yw = y * w;
      for (let x = 1; x < w - 1; x++) {
        const idx = (yw + x) * 4;
        for (let c = 0; c < 3; c++) {
          const val = 5 * src[idx + c]
            - src[((y - 1) * w + x) * 4 + c]
            - src[((y + 1) * w + x) * 4 + c]
            - src[(yw + (x - 1)) * 4 + c]
            - src[(yw + (x + 1)) * 4 + c];
          dst[idx + c] = val < 0 ? 0 : val > 255 ? 255 : val;
        }
        dst[idx + 3] = 255;
      }
    }
    outCtx.putImageData(outData, 0, 0);
    return outCvs;
  } catch (e) {
    return null;
  }
}

function createZXingBitmap(imgData, width, height, useGlobalHistogram = false) {
  const d = imgData.data;
  const size = width * height;
  const luminances = new Uint8ClampedArray(size);
  for (let i = 0, j = 0; i < size; i++, j += 4) {
    luminances[i] = (d[j] * 306 + d[j + 1] * 601 + d[j + 2] * 117) >> 10;
  }
  const lumSource = new RGBLuminanceSource(luminances, width, height);
  const binarizer = useGlobalHistogram 
    ? new GlobalHistogramBinarizer(lumSource) 
    : new HybridBinarizer(lumSource);
  return new BinaryBitmap(binarizer);
}

async function decodeSingleCanvas(canvas, label = '') {
  if (!canvas || canvas.width === 0 || canvas.height === 0) return null;
  const width = canvas.width;
  const height = canvas.height;

  // 1. Hardware Accelerated Native BarcodeDetector (All 1D & 2D Barcode Formats)
  if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
    try {
      const detector = new window.BarcodeDetector({ formats: ALL_BARCODE_FORMATS });
      const barcodes = await detector.detect(canvas);
      if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
        const fmt = barcodes[0].format ? barcodes[0].format.toUpperCase() : 'BARCODE';
        return { 
          text: barcodes[0].rawValue, 
          format: fmt, 
          engine: `Native BarcodeDetector (${fmt})${label ? ` [${label}]` : ''}` 
        };
      }
    } catch (e) {}
  }

  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const imgData = ctx.getImageData(0, 0, width, height);

  // 2. Fast pure-JS decoder: jsQR (normal & inverted for QR codes)
  try {
    const j1 = jsQR(imgData.data, width, height, { inversionAttempts: 'attemptBoth' });
    if (j1 && j1.data) return { text: j1.data, format: 'QR_CODE', engine: `jsQR${label ? ` (${label})` : ''}` };
  } catch (e) {}

  // 3. Dedicated ZXing QRCodeReader (HybridBinarizer - specialized for dense Aadhaar QR codes)
  try {
    const bitmap = createZXingBitmap(imgData, width, height, false);
    const res = zxingQrReader.decode(bitmap, zxingQrHints);
    if (res && res.getText()) return { text: res.getText(), format: 'QR_CODE', engine: `ZXing QR Hybrid${label ? ` [${label}]` : ''}` };
  } catch (e) {}

  // 4. Dedicated ZXing QRCodeReader (GlobalHistogramBinarizer)
  try {
    const bitmap = createZXingBitmap(imgData, width, height, true);
    const res = zxingQrReader.decode(bitmap, zxingQrHints);
    if (res && res.getText()) return { text: res.getText(), format: 'QR_CODE', engine: `ZXing QR GlobalHistogram${label ? ` [${label}]` : ''}` };
  } catch (e) {}

  // 5. ZXing MultiFormatReader (All Barcodes: PDF417, Data Matrix, Code 128, etc.)
  try {
    const bitmap = createZXingBitmap(imgData, width, height, false);
    const res = zxingMultiReader.decode(bitmap, zxingHints);
    if (res && res.getText()) {
      const fmt = BarcodeFormat[res.getBarcodeFormat()] || 'BARCODE';
      return { text: res.getText(), format: fmt, engine: `ZXing MultiFormat (${fmt})${label ? ` [${label}]` : ''}` };
    }
  } catch (e) {}

  // 6. Adaptive Contrast Filter
  try {
    const enh = enhanceBlurryFrame(ctx, width, height);
    const j2 = jsQR(enh.data, width, height, { inversionAttempts: 'attemptBoth' });
    if (j2 && j2.data) return { text: j2.data, format: 'QR_CODE', engine: `Adaptive Contrast (QR)${label ? ` [${label}]` : ''}` };

    const bitmapEnh = createZXingBitmap(enh, width, height, false);
    const resEnh = zxingQrReader.decode(bitmapEnh, zxingQrHints);
    if (resEnh && resEnh.getText()) return { text: resEnh.getText(), format: 'QR_CODE', engine: `Adaptive Contrast (QR-ZXing)${label ? ` [${label}]` : ''}` };
  } catch (e) {}

  // 7. 3x3 Convolution Sharpening Filter (Recovers blurred module edges from webcam soft focus)
  try {
    const sharpCanvas = createSharpenedCanvas(canvas);
    if (sharpCanvas) {
      const sCtx = sharpCanvas.getContext('2d', { willReadFrequently: true });
      const sData = sCtx.getImageData(0, 0, width, height);
      const sJs = jsQR(sData.data, width, height, { inversionAttempts: 'attemptBoth' });
      if (sJs && sJs.data) return { text: sJs.data, format: 'QR_CODE', engine: `Sharpened Pass (QR)${label ? ` [${label}]` : ''}` };

      const bmpSharp = createZXingBitmap(sData, width, height, false);
      const sRes = zxingQrReader.decode(bmpSharp, zxingQrHints);
      if (sRes && sRes.getText()) return { text: sRes.getText(), format: 'QR_CODE', engine: `Sharpened Pass (QR-ZXing)${label ? ` [${label}]` : ''}` };
    }
  } catch (e) {}

  return null;
}

/**
 * Universal Multi-Engine & Multi-Zone QR Decoder
 * Handles Full Frame, Aadhaar Back-Side (Right-Half Crop), Center Focus, and Sub-Quadrants at Optimal Resolution
 */
async function decodeImageSource(source) {
  if (!source) return null;

  // 1. Hardware Accelerated Native BarcodeDetector on raw source
  try {
    if ('BarcodeDetector' in window) {
      const detector = new window.BarcodeDetector({ formats: ALL_BARCODE_FORMATS });
      const barcodes = await detector.detect(source);
      if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
        const fmt = barcodes[0].format ? barcodes[0].format.toUpperCase() : 'BARCODE';
        return { text: barcodes[0].rawValue, format: fmt, engine: `Native BarcodeDetector (${fmt})` };
      }
    }
  } catch (e) {}

  // 2. Prepare master canvas (scaled to safe max 1600px to prevent mobile OOM / freeze)
  let canvas;
  let width = 0;
  let height = 0;

  let rawW = 0;
  let rawH = 0;

  if (source instanceof HTMLCanvasElement) {
    rawW = source.width;
    rawH = source.height;
  } else if (source instanceof HTMLVideoElement) {
    rawW = source.videoWidth;
    rawH = source.videoHeight;
  } else if (source instanceof HTMLImageElement) {
    rawW = source.naturalWidth || source.width;
    rawH = source.naturalHeight || source.height;
  }

  if (!rawW || !rawH) return null;

  // Scale down 12MP-48MP mobile captures so memory buffer is < 10MB instead of 48MB+
  const maxDim = Math.max(rawW, rawH);
  const scale = maxDim > 1600 ? 1600 / maxDim : 1.0;
  width = Math.round(rawW * scale);
  height = Math.round(rawH * scale);

  if (source instanceof HTMLCanvasElement && scale === 1.0) {
    canvas = source;
  } else {
    canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(source, 0, 0, width, height);
  }

  // Pass 1: Full Frame Scan
  const fullRes = await decodeSingleCanvas(canvas, 'Full Frame');
  if (fullRes) return fullRes;

  // Pass 2: Multi-Zone Targeted Scanning (Crucial for Aadhaar Back Side & Card Photos)
  // Helper to extract and optionally scale a sub-region
  const extractZone = (sx, sy, sw, sh, targetWidth = 700) => {
    try {
      const zCvs = document.createElement('canvas');
      const scale = targetWidth ? Math.min(2.5, targetWidth / Math.max(sw, 1)) : 1.0;
      zCvs.width = Math.round(sw * scale);
      zCvs.height = Math.round(sh * scale);
      const zCtx = zCvs.getContext('2d', { willReadFrequently: true });
      zCtx.imageSmoothingEnabled = true;
      zCtx.imageSmoothingQuality = 'high';
      zCtx.drawImage(canvas, sx, sy, sw, sh, 0, 0, zCvs.width, zCvs.height);
      return zCvs;
    } catch (e) {
      return null;
    }
  };

  const zones = [
    // Zone 1: Right-Half of Card (Aadhaar Card Back Side QR position)
    {
      name: 'Aadhaar Back Right-Half',
      canvas: extractZone(
        Math.floor(width * 0.35),
        Math.floor(height * 0.08),
        Math.ceil(width * 0.65),
        Math.ceil(height * 0.84),
        800
      )
    },
    // Zone 2: Center Box (centered cards or QRs)
    {
      name: 'Center Focus Box',
      canvas: extractZone(
        Math.floor(width * 0.15),
        Math.floor(height * 0.15),
        Math.ceil(width * 0.70),
        Math.ceil(height * 0.70),
        750
      )
    },
    // Zone 3: Top-Right Quadrant
    {
      name: 'Top-Right Quadrant',
      canvas: extractZone(
        Math.floor(width * 0.40),
        0,
        Math.ceil(width * 0.60),
        Math.ceil(height * 0.60),
        700
      )
    },
    // Zone 4: Bottom-Right Quadrant
    {
      name: 'Bottom-Right Quadrant',
      canvas: extractZone(
        Math.floor(width * 0.40),
        Math.floor(height * 0.40),
        Math.ceil(width * 0.60),
        Math.ceil(height * 0.60),
        700
      )
    },
    // Zone 5: Left-Half (e-Aadhaar or letter format)
    {
      name: 'Left-Half Zone',
      canvas: extractZone(
        0,
        Math.floor(height * 0.08),
        Math.ceil(width * 0.65),
        Math.ceil(height * 0.84),
        750
      )
    }
  ];

  // Fast priority scan on primary target zones (Aadhaar Back QR & Center)
  for (const zone of zones) {
    if (zone.canvas) {
      const zRes = await decodeSingleCanvas(zone.canvas, zone.name);
      if (zRes) return zRes;
    }
  }

  // Pass 3: Multi-Scale Downscale/Upscale Pass (if very high res photo > 1200px or small < 450px)
  const currentMaxDim = Math.max(width, height);
  if (currentMaxDim > 1200) {
    const sCvs = extractZone(0, 0, width, height, 900);
    if (sCvs) {
      const sRes = await decodeSingleCanvas(sCvs, 'High-Res Downscaled Pass');
      if (sRes) return sRes;
    }
  } else if (currentMaxDim < 450 && currentMaxDim > 80) {
    const uCvs = extractZone(0, 0, width, height, 650);
    if (uCvs) {
      const uRes = await decodeSingleCanvas(uCvs, 'Upscaled Pass');
      if (uRes) return uRes;
    }
  }

  return null;
}

/**
 * Synthesizes a crisp, affirmative UPI/Point-of-Sale chime on successful document/QR detection
 */
function playUPIBeep() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sine';
    osc2.type = 'triangle';

    // High positive chime: 880Hz ascending to 1760Hz
    osc1.frequency.setValueAtTime(880, ctx.currentTime);
    osc1.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.12);

    osc2.frequency.setValueAtTime(440, ctx.currentTime);
    osc2.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.20);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(ctx.currentTime);
    osc2.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.22);
    osc2.stop(ctx.currentTime + 0.22);

    setTimeout(() => {
      try { ctx.close(); } catch (e) {}
    }, 400);
  } catch (e) {}
}

/**
 * Synthesizes a low rejection sound when non-document / invalid input is uploaded
 */
function playRejectBeep() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(110, ctx.currentTime + 0.25);

    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.26);

    setTimeout(() => {
      try { ctx.close(); } catch (e) {}
    }, 400);
  } catch (e) {}
}

export default function LiveVerificationPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('qr');

  // --- TAB 1: QR CODE STATES ---
  const [qrInput, setQrInput] = useState('');
  const [rawQrPayload, setRawQrPayload] = useState('');
  const [decoderEngine, setDecoderEngine] = useState('');
  const [qrData, setQrData] = useState(null);
  const [ocrData, setOcrData] = useState(null);
  const [qrResult, setQrResult] = useState(null);
  const [scannedCardPhoto, setScannedCardPhoto] = useState(null);
  const [isExtractingDemographics, setIsExtractingDemographics] = useState(false);
  const [ocrFeedbackMessage, setOcrFeedbackMessage] = useState(null);
  const [comparisonResult, setComparisonResult] = useState(null);
  const [compositeRisk, setCompositeRisk] = useState(null);
  const [qrCropSnapshot, setQrCropSnapshot] = useState(null);
  const [capturedFullDoc, setCapturedFullDoc] = useState(null);

  // Developer / Debug mode state
  const [developerMode, setDeveloperMode] = useState(false);
  const [copiedRawPayload, setCopiedRawPayload] = useState(false);
  const [debugTab, setDebugTab] = useState('raw'); // 'raw' | 'ocr' | 'json_qr' | 'json_ocr' | 'math'

  // Live Camera States (Native WebRTC)
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isCameraStarting, setIsCameraStarting] = useState(false);
  const [cameraFacing, setCameraFacing] = useState('environment');
  const [cameraError, setCameraError] = useState(null);
  const [cameraErrorType, setCameraErrorType] = useState(null);
  const [activeStream, setActiveStream] = useState(null);
  const [lockDetected, setLockDetected] = useState(false);
  const [isManualCapturing, setIsManualCapturing] = useState(false);
  const [manualCaptureNotice, setManualCaptureNotice] = useState(null);

  // Upload States
  const [isProcessingUpload, setIsProcessingUpload] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [docValidationError, setDocValidationError] = useState(null);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const animFrameRef = useRef(null);
  const isScanningActiveRef = useRef(false);
  const nativeCameraInputRef = useRef(null);
  const reticleRef = useRef(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [zoomSupported, setZoomSupported] = useState(false);

  /**
   * Mathematically maps the exact cyan reticle box from the screen DOM directly onto
   * the video sensor coordinates (handles object-cover, portrait/landscape, and aspect ratio).
   */
  const getReticleCrop = useCallback((video, reticleEl, marginRatio = 0.10) => {
    if (!video) return null;
    const vw = video.videoWidth;
    const vh = video.videoHeight;
    if (!vw || !vh) return null;

    if (reticleEl) {
      const videoRect = video.getBoundingClientRect();
      const boxRect = reticleEl.getBoundingClientRect();

      const dw = videoRect.width;
      const dh = videoRect.height;
      if (dw > 0 && dh > 0) {
        const scale = Math.max(dw / vw, dh / vh);
        const renderedW = vw * scale;
        const renderedH = vh * scale;
        const offsetX = (renderedW - dw) / 2;
        const offsetY = (renderedH - dh) / 2;

        let boxLeft = boxRect.left - videoRect.left;
        let boxTop = boxRect.top - videoRect.top;
        let boxW = boxRect.width;
        let boxH = boxRect.height;

        if (marginRatio > 0) {
          const mx = boxW * marginRatio;
          const my = boxH * marginRatio;
          boxLeft -= mx;
          boxTop -= my;
          boxW += mx * 2;
          boxH += my * 2;
        }

        const sx = Math.max(0, Math.floor((boxLeft + offsetX) / scale));
        const sy = Math.max(0, Math.floor((boxTop + offsetY) / scale));
        const sw = Math.min(vw - sx, Math.floor(boxW / scale));
        const sh = Math.min(vh - sy, Math.floor(boxH / scale));

        if (sw > 80 && sh > 80) {
          const canvas = document.createElement('canvas');
          const scaleUp = Math.min(2.5, 750 / Math.max(sw, 1));
          canvas.width = Math.round(sw * scaleUp);
          canvas.height = Math.round(sh * scaleUp);
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(video, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
          return canvas;
        }
      }
    }

    const minDim = Math.min(vw, vh);
    const size = Math.floor(minDim * 0.75);
    const sx = Math.floor((vw - size) / 2);
    const sy = Math.floor((vh - size) / 2);
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(video, sx, sy, size, size, 0, 0, size, size);
    return canvas;
  }, []);
  const fileUploadInputRef = useRef(null);
  const resultsContainerRef = useRef(null);
  const uploadProgressRef = useRef(null);

  // --- TAB 2: MRZ STATES ---
  const [mrzLine1, setMrzLine1] = useState(SAMPLE_TEST_VECTORS.genuinePassportMRZ.line1);
  const [mrzLine2, setMrzLine2] = useState(SAMPLE_TEST_VECTORS.genuinePassportMRZ.line2);
  const [mrzResult, setMrzResult] = useState(() => parseTD3PassportMRZ(SAMPLE_TEST_VECTORS.genuinePassportMRZ.line1, SAMPLE_TEST_VECTORS.genuinePassportMRZ.line2));

  // --- TAB 3: VERHOEFF STATES ---
  const [verhoeffInput, setVerhoeffInput] = useState(SAMPLE_TEST_VECTORS.genuineAadhaarNumber);
  const [verhoeffTrace, setVerhoeffTrace] = useState(() => getVerhoeffTrace(SAMPLE_TEST_VECTORS.genuineAadhaarNumber));

  const [isExporting, setIsExporting] = useState(false);

  // Purge any legacy presenter localStorage overrides
  useEffect(() => {
    try {
      localStorage.removeItem('verishield_presenter_profile');
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('verishield_aadhaar_')) localStorage.removeItem(key);
      });
    } catch (e) {}
  }, []);

  /**
   * Real QR Decoding & Asymmetric Cross-Verification Pipeline
   * ZERO FAKE DATA: Never synthesizes name, DOB, or ID. Keeps QR_DATA and OCR_DATA 100% separate.
   */
  const handleDecodeQR = useCallback(async (content, capturedSnapshot = null, engine = 'Multi-Engine Scanner') => {
    const hasQrContent = content !== null && content !== undefined && (typeof content === 'string' ? content.trim().length > 0 : true);
    let parsed = null;
    let rawString = '';
    let formatHint = null;
    let usedEngine = engine;

    if (hasQrContent) {
      if (typeof content === 'object') {
        rawString = content.text || '';
        formatHint = content.format || null;
        usedEngine = content.engine || engine;
      } else {
        rawString = String(content);
      }
      parsed = parseUniversalQR(rawString, formatHint);
    }

    const isCodeValid = hasQrContent && isRecognizedIdentityQR(parsed);

    // =========================================================================
    // INSTANT RESULT PIPELINE (< 50ms): Never make the user wait 30 seconds for OCR!
    // =========================================================================
    if (isCodeValid) {
      setDocValidationError(null);
      setRawQrPayload(rawString);
      setDecoderEngine(usedEngine);
      setQrInput(rawString);
      setQrData(parsed);
      setQrResult(parsed);
      if (capturedSnapshot) {
        setScannedCardPhoto(capturedSnapshot);
        setCapturedFullDoc(capturedSnapshot);
      }
      setUploadError(null);
      setManualCaptureNotice(null);
      setIsProcessingUpload(false); // Instantly dismiss upload progress banner

      if (typeof window !== 'undefined' && window.innerWidth < 1024) {
        setTimeout(() => {
          resultsContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 120);
      }

      // If card snapshot is present, run OCR cross-verification asynchronously in the background
      if (capturedSnapshot) {
        setIsExtractingDemographics(true);
        setOcrFeedbackMessage('Verifying document typography & extracting demographics...');
        performAadhaarCardOCR(capturedSnapshot)
          .then((ocrResult) => {
            if (ocrResult) {
              setOcrData(ocrResult);
              if (ocrResult.qrCrop) setQrCropSnapshot(ocrResult.qrCrop);
              const comp = compareQrAndOcr(parsed, ocrResult);
              setComparisonResult(comp);
              const risk = evaluateCompositeRisk({
                qrResult: parsed,
                ocrData: ocrResult,
                comparisonResult: comp,
                hasCardSnapshot: Boolean(capturedSnapshot)
              });
              setCompositeRisk(risk);
            }
          })
          .catch((err) => {
            console.warn('Background OCR notice:', err);
          })
          .finally(() => {
            setIsExtractingDemographics(false);
            setOcrFeedbackMessage(null);
          });
      } else {
        setOcrData(null);
        setQrCropSnapshot(null);
        setComparisonResult(null);
        setCompositeRisk(null);
      }
      return;
    }

    // =========================================================================
    // CASE 2: NO QR CODE IN FRAME -> Document Optical Recognition & Forensics
    // =========================================================================
    let ocrResult = null;
    if (capturedSnapshot) {
      setIsExtractingDemographics(true);
      setOcrFeedbackMessage('Analyzing document typography & identity fields...');
      setScannedCardPhoto(capturedSnapshot);
      setCapturedFullDoc(capturedSnapshot);
      try {
        ocrResult = await performAadhaarCardOCR(capturedSnapshot);
      } catch (err) {
        console.warn('OCR extraction notice:', err);
      } finally {
        setIsExtractingDemographics(false);
        setOcrFeedbackMessage(null);
      }
    }

    const isDocValid = isRecognizedIdentityDocument(ocrResult);

    // STRICT VALIDATION GATE: Accept only genuine government documents or recognized identity QR codes
    if (!isDocValid) {
      setQrData(null);
      setQrResult(null);
      setOcrData(null);
      setCapturedFullDoc(capturedSnapshot || null);
      setScannedCardPhoto(capturedSnapshot || null);
      setComparisonResult(null);
      setCompositeRisk(null);
      setRawQrPayload(rawString || 'No document detected');
      setDecoderEngine(usedEngine);
      setQrInput('');
      setOcrFeedbackMessage(null);
      setIsProcessingUpload(false);
      setDocValidationError('Upload a valid document or card photo. No recognized government document, identity card, or QR code was detected in the uploaded image.');
      playRejectBeep();
      if (typeof window !== 'undefined' && window.innerWidth < 1024) {
        setTimeout(() => {
          resultsContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 120);
      }
      return;
    }

    // Clear previous validation error upon successful verification
    setDocValidationError(null);

    parsed = {
      format: 'NOT_DETECTED',
      typeLabel: ocrResult?.docType ? `${ocrResult.docType} (Visual OCR)` : 'Document Card (Visual OCR)',
      rawPayload: 'No QR code or barcode was detected on this document image or video feed. Optical Character Recognition and visual document forensics active.',
      fields: {},
      signatureStatus: 'NOT_APPLICABLE'
    };
    rawString = 'Document photo captured';

    setRawQrPayload(rawString);
    setDecoderEngine(usedEngine);
    setQrInput('');
    setQrData(parsed);
    setQrResult(parsed);

    if (capturedSnapshot) {
      setScannedCardPhoto(capturedSnapshot);
      setCapturedFullDoc(capturedSnapshot);
    }
    setUploadError(null);
    setManualCaptureNotice(null);
    setIsProcessingUpload(false);

    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setTimeout(() => {
        resultsContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 120);
    }

    if (ocrResult) {
      setOcrData(ocrResult);
      if (ocrResult.qrCrop) setQrCropSnapshot(ocrResult.qrCrop);

      // Cross-Verification: Compare QR_DATA with OCR_DATA only on fields present in BOTH
      const comp = compareQrAndOcr(parsed, ocrResult);
      const risk = evaluateCompositeRisk({
        qrResult: parsed,
        ocrData: ocrResult,
        comparisonResult: comp,
        hasCardSnapshot: Boolean(capturedSnapshot)
      });
      setComparisonResult(comp);
      setCompositeRisk(risk);

      if (ocrResult.name) {
        setOcrFeedbackMessage(`OCR Extracted: ${ocrResult.name} (${ocrResult.dob || 'DOB Read'})`);
      } else {
        setOcrFeedbackMessage('Visual document text analyzed.');
      }
    } else {
      // Baseline single-source comparison
      const comp = compareQrAndOcr(parsed, null);
      const risk = evaluateCompositeRisk({ qrResult: parsed, comparisonResult: comp });
      setComparisonResult(comp);
      setCompositeRisk(risk);
    }
  }, []);

  // =========================================================================
  // NATIVE WEBRTC CAMERA SCANNER (FOCUSED 100% ON QR BOX, ZERO BACKGROUND)
  // =========================================================================
  const stopCamera = useCallback(() => {
    isScanningActiveRef.current = false;
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (streamRef.current) {
      try {
        streamRef.current.getTracks().forEach(track => track.stop());
      } catch (e) {}
      streamRef.current = null;
    }
    if (videoRef.current) {
      try {
        videoRef.current.srcObject = null;
      } catch (e) {}
    }
    setActiveStream(null);
    setIsCameraActive(false);
    setIsCameraStarting(false);
    setLockDetected(false);
    setIsManualCapturing(false);
    setManualCaptureNotice(null);
  }, []);



  const toggleZoom = async () => {
    const nextZoom = zoomLevel === 1 ? 2 : 1;
    setZoomLevel(nextZoom);
    if (streamRef.current) {
      const track = streamRef.current.getVideoTracks()[0];
      if (track && track.applyConstraints) {
        try {
          await track.applyConstraints({
            advanced: [{ zoom: nextZoom }]
          });
        } catch (e) {}
      }
    }
  };

  // Reusable lightweight canvas for live scanning (zero GC lag)
  const liveScanCanvasRef = useRef(null);

  /**
   * Ultra-Lightweight Live Frame Scanner
   * Non-blocking: Hardware BarcodeDetector (GPU) -> Single 380px reticle crop (jsQR)
   * Completes in < 8ms without locking the browser UI thread
   */
  const fastScanLiveFrame = useCallback(async (video) => {
    if (!video || video.readyState < video.HAVE_CURRENT_DATA) return null;
    const vw = video.videoWidth;
    const vh = video.videoHeight;
    if (!vw || !vh) return null;

    // 1. Hardware Accelerated BarcodeDetector on raw video element (Zero canvas copying, GPU/C++ thread)
    if ('BarcodeDetector' in window) {
      try {
        const detector = new window.BarcodeDetector({ formats: ALL_BARCODE_FORMATS });
        const barcodes = await detector.detect(video);
        if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
          const fmt = barcodes[0].format ? barcodes[0].format.toUpperCase() : 'BARCODE';
          return { decoded: barcodes[0].rawValue, format: fmt, engine: `Native BarcodeDetector (${fmt})` };
        }
      } catch (e) {}
    }

    // 2. High-Precision Reticle Crop Scanner (preserves module resolution for dense Aadhaar and laptop webcams)
    try {
      if (!liveScanCanvasRef.current) {
        liveScanCanvasRef.current = document.createElement('canvas');
      }
      const cvs = liveScanCanvasRef.current;
      const cropSize = Math.floor(Math.min(vw, vh) * 0.78);
      const sx = Math.floor((vw - cropSize) / 2);
      const sy = Math.floor((vh - cropSize) / 2);
      
      const targetDim = Math.min(640, cropSize);
      cvs.width = targetDim;
      cvs.height = targetDim;
      const ctx = cvs.getContext('2d', { willReadFrequently: true });
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(video, sx, sy, cropSize, cropSize, 0, 0, targetDim, targetDim);

      const imgData = ctx.getImageData(0, 0, targetDim, targetDim);
      
      // Try jsQR first (fastest pure-JS)
      const qrRes = jsQR(imgData.data, targetDim, targetDim, { inversionAttempts: 'attemptBoth' });
      if (qrRes && qrRes.data) {
        return { decoded: qrRes.data, format: 'QR_CODE', engine: 'Live Video Scanner (jsQR)' };
      }

      // If dense QR code (e.g. UIDAI Aadhaar QR), decode with ZXing HybridBinarizer
      try {
        const bitmap = createZXingBitmap(imgData, targetDim, targetDim, false);
        const zRes = zxingQrReader.decode(bitmap, zxingQrHints);
        if (zRes && zRes.getText()) {
          return { decoded: zRes.getText(), format: 'QR_CODE', engine: 'Live Video Scanner (ZXing QR)' };
        }
      } catch (e) {}
    } catch (e) {}

    return null;
  }, []);

  const scanVideoLoop = useCallback(async () => {
    if (!isScanningActiveRef.current || !videoRef.current) return;

    try {
      const result = await fastScanLiveFrame(videoRef.current);
      if (result && result.decoded && isScanningActiveRef.current) {
        setLockDetected(true);
        playUPIBeep();
        try {
          if (navigator.vibrate) navigator.vibrate([60, 40, 90]);
        } catch (e) {}

        // Capture snapshot only now upon confirmed detection
        let snapshot = null;
        try {
          const video = videoRef.current;
          const sCvs = document.createElement('canvas');
          sCvs.width = video.videoWidth;
          sCvs.height = video.videoHeight;
          sCvs.getContext('2d').drawImage(video, 0, 0);
          snapshot = sCvs.toDataURL('image/jpeg', 0.88);
        } catch (e) {}

        stopCamera();
        handleDecodeQR(
          { text: result.decoded, format: result.format, engine: result.engine || 'Video Sensor Stream' },
          snapshot,
          result.engine || 'Video Sensor Stream'
        );
        return;
      }
    } catch (err) {}

    if (isScanningActiveRef.current) {
      setTimeout(() => {
        if (isScanningActiveRef.current) {
          animFrameRef.current = requestAnimationFrame(scanVideoLoop);
        }
      }, 120);
    }
  }, [fastScanLiveFrame, handleDecodeQR, stopCamera]);

  // Safe, asynchronous video element attachment and playback
  useEffect(() => {
    if (!activeStream || !videoRef.current) return;
    const video = videoRef.current;
    video.srcObject = activeStream;
    video.muted = true;
    video.playsInline = true;
    video.setAttribute('muted', '');
    video.setAttribute('playsinline', '');

    let isMounted = true;

    const playVideo = async () => {
      try {
        await video.play();
        if (isMounted) {
          isScanningActiveRef.current = true;
          setIsCameraStarting(false);
          if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
          animFrameRef.current = requestAnimationFrame(scanVideoLoop);
        }
      } catch (err) {
        console.warn("Video initial play() rejected, waiting for metadata:", err);
        video.onloadedmetadata = async () => {
          try {
            await video.play();
            if (isMounted) {
              isScanningActiveRef.current = true;
              setIsCameraStarting(false);
              if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
              animFrameRef.current = requestAnimationFrame(scanVideoLoop);
            }
          } catch (e2) {
            console.error("Secondary video play failed:", e2);
            if (isMounted) setIsCameraStarting(false);
          }
        };
      }
    };

    playVideo();

    return () => {
      isMounted = false;
    };
  }, [activeStream, scanVideoLoop]);

  const getRobustMediaStream = async (preferredFacing = 'user') => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      const err = new Error('Camera API (getUserMedia) is not supported in this browser.');
      err.name = 'NotSupportedError';
      throw err;
    }

    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

    // On mobile devices, back camera is usually preferred for document scanning.
    // On laptops/desktops, simple unconstrained video is vastly more reliable because
    // Windows Media Foundation does not report facingMode on integrated USB webcams.
    const attempts = isMobile ? [
      { video: { facingMode: { ideal: preferredFacing || 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false },
      { video: { facingMode: 'environment' }, audio: false },
      { video: true, audio: false }
    ] : [
      // DESKTOP / LAPTOP (HP TrueVision HD Camera, etc.)
      { video: true, audio: false },
      { video: { width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false },
      { video: { width: { ideal: 640 }, height: { ideal: 480 } }, audio: false }
    ];

    let lastErr = null;
    for (const constraints of attempts) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (stream && stream.getVideoTracks().length > 0) {
          return stream;
        }
      } catch (err) {
        lastErr = err;
        // CRITICAL: If permission was denied or dismissed by the user, DO NOT loop!
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError' || err.name === 'SecurityError') {
          throw err;
        }
        console.warn('[Camera] Fallback from constraint attempt:', err.name, err.message);
      }
    }
    throw lastErr || new Error('No working camera stream available');
  };

  const startCamera = async (facing = cameraFacing) => {
    stopCamera();
    setCameraError(null);
    setCameraErrorType(null);
    setManualCaptureNotice(null);
    setIsCameraActive(true);
    setIsCameraStarting(true);

    // Automatic safety watchdog to guarantee buttons never get stuck disabled
    const startingWatchdog = setTimeout(() => {
      setIsCameraStarting(false);
    }, 800);

    try {
      const stream = await getRobustMediaStream(facing);
      clearTimeout(startingWatchdog);
      streamRef.current = stream;
      setActiveStream(stream);

      // Inspect capabilities safely
      try {
        const track = stream.getVideoTracks()[0];
        if (track) {
          if (track.getCapabilities && track.getCapabilities().zoom) {
            setZoomSupported(true);
          }
          if (track.applyConstraints && track.getCapabilities && track.getCapabilities().focusMode) {
            await track.applyConstraints({
              advanced: [{ focusMode: 'continuous' }]
            }).catch(() => {});
          }
        }
      } catch (e) {}

      // Fallback timer: if video element takes more than 1.5s to start, force turn off starting spinner
      setTimeout(() => {
        setIsCameraStarting(false);
      }, 1500);
    } catch (err) {
      console.error("Camera startup error:", err);
      setIsCameraStarting(false);
      setIsCameraActive(false);
      setActiveStream(null);

      let type = 'UNKNOWN';
      let msg = '';

      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        type = 'PERMISSION_DENIED';
        msg = "Camera permission was blocked by your browser for this site.";
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        type = 'DEVICE_BUSY';
        msg = "Your webcam is currently busy or being used by another application (e.g. Zoom, MS Teams, Windows Camera, or another tab).";
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        type = 'NOT_FOUND';
        msg = "No webcam device was found connected to this computer.";
      } else if (err.name === 'OverconstrainedError') {
        type = 'OVERCONSTRAINED';
        msg = `The webcam does not support the requested video format (${err.constraint || 'resolution'}).`;
      } else {
        type = 'GENERIC';
        msg = err.message || "Could not start camera.";
      }

      setCameraErrorType(type);
      setCameraError(msg);
      throw err;
    }
  };

  const handleDeviceCameraClick = async () => {
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (isMobile) {
      nativeCameraInputRef.current?.click();
      return;
    }

    // On laptop/desktop:
    // 1. If camera is already open and active, capture the snapshot right away!
    if (isCameraActive && videoRef.current) {
      await handleManualCapture();
      return;
    }

    // 2. Try starting live camera. If camera fails (blocked/busy/unavailable),
    // immediately open the native file dialog so the user can select their document photo!
    try {
      await startCamera('user');
    } catch (err) {
      console.warn("Webcam access failed on button click, falling back to file picker:", err);
      setTimeout(() => {
        nativeCameraInputRef.current?.click();
      }, 50);
    }
  };

  const toggleCameraFacing = () => {
    const nextFacing = cameraFacing === 'environment' ? 'user' : 'environment';
    setCameraFacing(nextFacing);
    startCamera(nextFacing);
  };

  // =========================================================================
  // MANUAL CAPTURE & ANALYZE BUTTON (MULTI-ZONE DEEP ANALYSIS)
  // =========================================================================
  const handleManualCapture = async () => {
    if (isManualCapturing || !videoRef.current) return;
    setIsManualCapturing(true);
    setManualCaptureNotice(null);

    const video = videoRef.current;
    if (video.readyState < video.HAVE_CURRENT_DATA || video.videoWidth === 0) {
      setManualCaptureNotice("Camera initializing... please wait 1 second.");
      setIsManualCapturing(false);
      return;
    }

    try {
      const vw = video.videoWidth;
      const vh = video.videoHeight;
      const fullCanvas = document.createElement('canvas');
      fullCanvas.width = vw;
      fullCanvas.height = vh;
      const fCtx = fullCanvas.getContext('2d', { willReadFrequently: true });
      fCtx.drawImage(video, 0, 0, vw, vh);
      const snapshot = fullCanvas.toDataURL('image/jpeg', 0.92);

      // Pass 1: Targeted Reticle Scan (Exactly where user points the camera)
      let result = null;
      const reticleCrop = getReticleCrop(video, reticleRef.current, 0.15);
      if (reticleCrop) {
        const reticleRes = await decodeSingleCanvas(reticleCrop, 'Reticle Viewfinder');
        if (reticleRes && (reticleRes.text || reticleRes)) {
          result = { 
            decoded: reticleRes.text || reticleRes, 
            format: reticleRes.format, 
            engine: reticleRes.engine || 'Reticle Viewfinder', 
            snapshot 
          };
        }
      }

      // Pass 2: Full high-res frame scan
      if (!result || !result.decoded) {
        const decodedFromCanvas = await decodeImageSource(fullCanvas);
        if (decodedFromCanvas && (decodedFromCanvas.text || decodedFromCanvas)) {
          result = { 
            decoded: decodedFromCanvas.text || decodedFromCanvas, 
            format: decodedFromCanvas.format, 
            engine: decodedFromCanvas.engine || 'High-Res Frame Inspector', 
            snapshot 
          };
        }
      }

      // Pass 3: Sharpened reticle pass for webcam soft focus
      if ((!result || !result.decoded) && reticleCrop) {
        const sharpCvs = createSharpenedCanvas(reticleCrop);
        if (sharpCvs) {
          const sRes = await decodeSingleCanvas(sharpCvs, 'Sharpened Reticle');
          if (sRes && (sRes.text || sRes)) {
            result = { decoded: sRes.text || sRes, format: sRes.format, engine: sRes.engine, snapshot };
          }
        }
      }

      // Stop camera IMMEDIATELY so the view closes instantly and video tracks release
      stopCamera();

      if (result && result.decoded) {
        setDocValidationError(null);
        setLockDetected(true);
        playUPIBeep();
        try {
          if (navigator.vibrate) navigator.vibrate([60, 40, 90]);
        } catch (e) {}
        await handleDecodeQR(
          { text: result.decoded, format: result.format, engine: result.engine || 'Video Sensor Stream' },
          result.snapshot || snapshot,
          result.engine || 'Video Sensor Stream'
        );
      } else {
        // No barcode detected -> send directly to handleDecodeQR for optical document OCR!
        // handleDecodeQR will run performAadhaarCardOCR in the background and show the results.
        await handleDecodeQR(null, snapshot, 'Camera Document Snapshot (Visual OCR)');
      }
    } catch (err) {
      console.error("Manual capture error:", err);
      stopCamera();
    } finally {
      setIsManualCapturing(false);
    }
  };

  const processImageFileDirectly = async (file) => {
    if (!file) return;
    setIsProcessingUpload(true);
    setUploadError(null);
    setDocValidationError(null);

    // On mobile screens, immediately scroll to progress indicator
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setTimeout(() => {
        uploadProgressRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 50);
    }

    let img = null;
    let objectUrl = null;

    try {
      // 1. Try URL.createObjectURL first (fastest, lowest memory)
      try {
        objectUrl = URL.createObjectURL(file);
        img = await new Promise((resolve, reject) => {
          const i = new Image();
          i.onload = () => resolve(i);
          i.onerror = reject;
          i.src = objectUrl;
        });
      } catch (blobErr) {
        // Fallback to FileReader if object URL is restricted by browser
        img = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            const i = new Image();
            i.onload = () => resolve(i);
            i.onerror = reject;
            i.src = e.target.result;
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      }
    } catch (loadErr) {
      console.error('File load error:', loadErr);
      setIsProcessingUpload(false);
      setUploadError('Unable to open this image. Please select a JPG, PNG, or camera photo.');
      return;
    } finally {
      if (objectUrl) {
        try { URL.revokeObjectURL(objectUrl); } catch (e) {}
      }
    }

    try {
      const rawW = img.naturalWidth || img.width;
      const rawH = img.naturalHeight || img.height;
      if (!rawW || !rawH) {
        throw new Error('Image has zero dimensions');
      }

      // 2. Downscale into a master canvas (max 1400px) to prevent mobile browser memory freeze
      const maxDim = Math.max(rawW, rawH);
      const scale = maxDim > 1400 ? 1400 / maxDim : 1.0;
      const w = Math.round(rawW * scale);
      const h = Math.round(rawH * scale);

      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(img, 0, 0, w, h);

      // Lightweight snapshot dataUrl (~200KB) for UI previews and OCR
      const snapshotDataUrl = canvas.toDataURL('image/jpeg', 0.82);

      // 3. Ultra-fast QR & Barcode Decode
      const decoded = await decodeImageSource(canvas);

      if (decoded && (decoded.text || decoded)) {
        try { playUPIBeep(); } catch (e) {}
        const rawText = decoded.text || decoded;
        const fmt = decoded.format || null;
        await handleDecodeQR(
          { text: rawText, format: fmt, engine: decoded.engine || 'High-Resolution File Inspector' },
          snapshotDataUrl,
          decoded.engine || 'High-Resolution File Inspector'
        );
      } else {
        // No QR detected on uploaded card -> Optical Document OCR & verification
        await handleDecodeQR(null, snapshotDataUrl, 'High-Resolution File (Optical OCR Inspector)');
      }
    } catch (err) {
      console.error('Image file process error:', err);
      setUploadError('Unable to process this image file. Please try another photo or use the live camera.');
    } finally {
      setIsProcessingUpload(false);
      if (typeof window !== 'undefined' && window.innerWidth < 1024) {
        setTimeout(() => {
          resultsContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 150);
      }
    }
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera, activeTab]);

  const updateMRZ = (l1, l2) => {
    setMrzLine1(l1);
    setMrzLine2(l2);
    setMrzResult(parseTD3PassportMRZ(l1, l2));
  };

  const updateVerhoeff = (num) => {
    const clean = num.replace(/\D/g, '').substring(0, 12);
    setVerhoeffInput(clean);
    setVerhoeffTrace(getVerhoeffTrace(clean));
  };

  const handleExportToPipeline = async (type) => {
    try {
      setIsExporting(true);
      let demoScenario = 'verified';
      let docType = 'Aadhaar';

      if (type === 'qr') {
        docType = 'Aadhaar';
        demoScenario = qrResult?.isVerhoeffValid ? 'verified' : 'suspicious';
      } else if (type === 'mrz') {
        docType = 'Passport';
        demoScenario = mrzResult?.isAllValid ? 'passport_cleared' : 'passport_forged';
      } else if (type === 'verhoeff') {
        docType = 'Aadhaar';
        demoScenario = verhoeffTrace.isValid ? 'verified' : 'suspicious';
      }

      const res = await uploadScreening({
        documentType: docType,
        demoScenario: demoScenario
      });

      if (res.success && res.screeningId) {
        navigate(`/screenings/process/${res.screeningId}`, {
          state: {
            screening: res.data,
            screeningId: res.screeningId
          }
        });
      }
    } catch (err) {
      console.error(err);
      setIsExporting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Top Title Banner */}
      <div className="bg-brand-900 border border-brand-800 rounded-2xl p-5 sm:p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-[11px] font-bold tracking-wide uppercase mb-2">
              <Sparkles size={13} className="text-cyan-400" />
              <span>Hackathon Live Verification Engine</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Real-Document Verification Lab
            </h1>
          </div>
          <div className="flex flex-col items-start sm:items-end gap-1.5 shrink-0">
            <span className="px-3 py-1 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold rounded-lg flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Offline Edge Verified</span>
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              Zero Server Dependency
            </span>
          </div>
        </div>

        {/* Tab Navigation Switches */}
        <div className="flex gap-2 border-t border-brand-800/80 pt-4 mt-5 overflow-x-auto">
          <button
            onClick={() => { setActiveTab('qr'); stopCamera(); }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'qr'
                ? 'bg-cyan-500 text-brand-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-300 hover:bg-brand-800/70 hover:text-white'
            }`}
          >
            <QrCode size={16} />
            <span>1. UIDAI Secure QR Scanner</span>
          </button>

          <button
            onClick={() => { setActiveTab('mrz'); stopCamera(); }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'mrz'
                ? 'bg-cyan-500 text-brand-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-300 hover:bg-brand-800/70 hover:text-white'
            }`}
          >
            <FileText size={16} />
            <span>2. ICAO-9303 Passport MRZ</span>
          </button>

          <button
            onClick={() => { setActiveTab('verhoeff'); stopCamera(); }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'verhoeff'
                ? 'bg-cyan-500 text-brand-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-300 hover:bg-brand-800/70 hover:text-white'
            }`}
          >
            <Calculator size={16} />
            <span>3. Verhoeff D₅ Aadhaar Math</span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: UIDAI OFFLINE SECURE QR SCANNER                    */}
      {/* ========================================================= */}
      {activeTab === 'qr' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Live Camera & Instant File Analysis */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-sm text-slate-800 flex items-center gap-2">
                  <Camera size={16} className="text-cyan-600" />
                  <span>QR-Only Focus Scanner</span>
                </h3>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded flex items-center gap-1">
                  <Target size={11} />
                  <span>Ignores Background</span>
                </span>
              </div>

              {/* NATIVE FULL-FEED LIVE CAMERA (UNIVERSAL MULTI-SURFACE SCANNER) */}
              {isCameraActive || isCameraStarting ? (
                <div className="space-y-3">
                  <div className="relative rounded-3xl overflow-hidden bg-slate-950 w-full mx-auto aspect-[3/4] min-h-[460px] flex items-center justify-center border-2 border-cyan-500 shadow-2xl">
                    
                    {/* Native Video Stream - Full View, Crystal Clear */}
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    
                    {/* Camera Starting Spinner */}
                    {isCameraStarting && (
                      <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center text-white space-y-3 z-30">
                        <RefreshCw size={32} className="text-cyan-400 animate-spin" />
                        <span className="text-xs font-bold text-slate-300">Starting Camera...</span>
                      </div>
                    )}

                    {/* SLEEK VIEWFINDER RETICLE - CLEAN WITH ZERO TEXT OVERLAY */}
                    <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center p-4">
                      {/* Generous Reticle Box */}
                      <div 
                        ref={reticleRef}
                        className={`relative w-72 aspect-square rounded-2xl transition-all duration-200 flex flex-col justify-between p-3 ${
                          lockDetected 
                            ? 'border-2 border-emerald-400 bg-emerald-500/20 scale-98 shadow-[0_0_35px_rgba(16,185,129,0.5)]' 
                            : isManualCapturing
                              ? 'border-2 border-amber-400 bg-amber-500/15 shadow-[0_0_30px_rgba(245,158,11,0.5)]'
                              : 'border border-cyan-400/60 shadow-[0_0_20px_rgba(6,182,212,0.25)]'
                        }`}
                      >
                        <div className="flex justify-between">
                          <div className={`w-9 h-9 border-t-4 border-l-4 rounded-tl-xl transition-colors ${lockDetected ? 'border-emerald-400' : isManualCapturing ? 'border-amber-400' : 'border-cyan-400'}`} />
                          <div className={`w-9 h-9 border-t-4 border-r-4 rounded-tr-xl transition-colors ${lockDetected ? 'border-emerald-400' : isManualCapturing ? 'border-amber-400' : 'border-cyan-400'}`} />
                        </div>

                        <div className="flex justify-between">
                          <div className={`w-9 h-9 border-b-4 border-l-4 rounded-bl-xl transition-colors ${lockDetected ? 'border-emerald-400' : isManualCapturing ? 'border-amber-400' : 'border-cyan-400'}`} />
                          <div className={`w-9 h-9 border-b-4 border-r-4 rounded-br-xl transition-colors ${lockDetected ? 'border-emerald-400' : isManualCapturing ? 'border-amber-400' : 'border-cyan-400'}`} />
                        </div>
                      </div>
                    </div>

                    {/* Top Controls Bar */}
                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-20">
                      <button
                        onClick={stopCamera}
                        className="p-2.5 bg-black/60 hover:bg-black/80 text-white rounded-full backdrop-blur-md border border-white/20 transition-all cursor-pointer shadow-md"
                        title="Close Camera"
                      >
                        <X size={16} />
                      </button>

                      {/* Zoom Toggle Button */}
                      <button
                        onClick={toggleZoom}
                        className="px-3.5 py-1.5 bg-black/70 hover:bg-black/90 text-cyan-300 font-bold rounded-full backdrop-blur-md border border-cyan-400/40 transition-all cursor-pointer shadow-md flex items-center gap-1.5 text-xs active:scale-95"
                        title="Toggle Zoom"
                      >
                        <span>🔍</span>
                        <span>{zoomLevel}x Zoom</span>
                      </button>

                      <button
                        onClick={toggleCameraFacing}
                        className="p-2.5 bg-black/60 hover:bg-black/80 text-white rounded-full backdrop-blur-md border border-white/20 transition-all cursor-pointer shadow-md"
                        title="Switch Camera"
                      >
                        <SwitchCamera size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-2 pt-1">
                    <button
                      onClick={handleManualCapture}
                      disabled={isManualCapturing || isCameraStarting}
                      className="w-full py-3.5 px-4 bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400 hover:from-cyan-400 hover:to-emerald-300 text-slate-950 font-black rounded-2xl shadow-xl shadow-cyan-500/25 flex items-center justify-center gap-3 transition-all cursor-pointer active:scale-98 border border-white/40 disabled:opacity-60"
                    >
                      {isManualCapturing ? (
                        <>
                          <RefreshCw size={20} className="text-slate-950 animate-spin" />
                          <span className="text-sm font-black">Analyzing All Zones...</span>
                        </>
                      ) : (
                        <>
                          <div className="w-8 h-8 rounded-full bg-slate-950 text-cyan-300 flex items-center justify-center shadow-inner">
                            <Camera size={18} />
                          </div>
                          <div className="text-left">
                            <span className="block text-sm font-black leading-tight tracking-tight">
                              📸 Capture & Analyze Now
                            </span>
                            <span className="block text-[11px] font-semibold text-slate-900/80 leading-tight">
                              Instantly scans full screen & any surface
                            </span>
                          </div>
                        </>
                      )}
                    </button>



                    {/* Close Camera Button */}
                    <button
                      onClick={stopCamera}
                      className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                    >
                      Close Camera
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {/* Button 1: Live WebRTC Camera Stream */}
                  <button
                    onClick={() => startCamera().catch(() => {})}
                    className="w-full py-3.5 px-4 bg-gradient-to-r from-brand-900 to-cyan-800 hover:from-brand-800 hover:to-cyan-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer active:scale-98"
                  >
                    <Camera size={18} className="text-cyan-400" />
                    <span>Launch Live Camera Scanner</span>
                  </button>

                  {/* Button 2: Device Camera (Instant Direct Analysis) */}
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      ref={nativeCameraInputRef}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        e.target.value = '';
                        if (file) processImageFileDirectly(file);
                      }}
                      className="hidden"
                    />
                    <button
                      onClick={handleDeviceCameraClick}
                      className="w-full py-2.5 px-4 bg-cyan-50 hover:bg-cyan-100 text-cyan-950 border border-cyan-300 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <Maximize2 size={15} className="text-cyan-700" />
                      <span>Take Photo with Device Camera</span>
                    </button>
                  </div>

                  {/* Button 3: File / Photo Upload (Instant Direct Analysis via Label) */}
                  <label className="block relative border-2 border-dashed border-cyan-400/80 hover:border-cyan-500 rounded-xl p-4 text-center cursor-pointer transition-all bg-cyan-50/40 hover:bg-cyan-50 active:scale-[0.99] shadow-xs">
                    <input
                      type="file"
                      accept="image/*"
                      ref={fileUploadInputRef}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        e.target.value = '';
                        if (file) processImageFileDirectly(file);
                      }}
                      className="hidden"
                    />
                    <Upload size={24} className="mx-auto text-cyan-600 mb-1" />
                    <p className="text-xs font-bold text-slate-800">Upload Saved QR Code / Card Photo</p>
                    <p className="text-[10px] text-slate-500">Tap to select Aadhaar, PAN, ID card or QR photo from gallery</p>
                  </label>
                </div>
              )}

              {/* Upload Processing Indicator */}
              {isProcessingUpload && (
                <div ref={uploadProgressRef} className="p-4 bg-cyan-50 border-2 border-cyan-300 rounded-2xl text-xs text-cyan-950 flex items-center gap-3 shadow-sm animate-pulse">
                  <RefreshCw size={20} className="text-cyan-600 animate-spin shrink-0" />
                  <div>
                    <strong className="block font-bold text-sm text-cyan-950">Analyzing Saved Document / QR Code...</strong>
                    <span className="text-[11px] text-cyan-700">Extracting high-resolution zones & validating identity document</span>
                  </div>
                </div>
              )}

              {/* Upload Error Banner */}
              {uploadError && (
                <div className="p-4 bg-rose-50 border-2 border-rose-300 rounded-2xl text-xs text-rose-950 flex items-start gap-3 shadow-sm animate-fade-in">
                  <XCircle size={18} className="text-rose-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <strong className="block font-bold text-rose-900">Upload Issue</strong>
                    <p className="text-[11px] text-rose-800 leading-relaxed">{uploadError}</p>
                  </div>
                </div>
              )}

              {/* Document Validation Error Notice */}
              {docValidationError && (
                <div className="p-4 bg-amber-50 border-2 border-amber-400 rounded-2xl text-xs text-amber-950 space-y-3 shadow-sm animate-fade-in">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-black text-amber-900 text-sm">
                      <AlertTriangle size={18} className="text-amber-600 shrink-0" />
                      <span>Document / Code Detection Guide</span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-200 text-amber-900 font-extrabold uppercase">
                      ALIGN CARD
                    </span>
                  </div>

                  <p className="text-xs text-amber-900/90 leading-relaxed font-medium">
                    {docValidationError}
                  </p>

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <button
                      onClick={() => fileUploadInputRef.current?.click()}
                      className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                    >
                      <Upload size={13} />
                      <span>Upload Valid Document</span>
                    </button>

                    <button
                      onClick={() => { setDocValidationError(null); startCamera().catch(() => {}); }}
                      className="px-3.5 py-2 bg-white hover:bg-rose-50 text-rose-800 border border-rose-300 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                    >
                      <Camera size={13} className="text-rose-700" />
                      <span>Rescan with Camera</span>
                    </button>
                  </div>
                </div>
              )}



              {/* Camera Error Banner */}
              {cameraError && (
                <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-2xl text-xs text-amber-950 space-y-3 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-amber-900 text-sm">
                      <AlertTriangle size={18} className="text-amber-600 shrink-0" />
                      <span>
                        {cameraErrorType === 'PERMISSION_DENIED' ? 'Camera Permission Blocked in Browser' :
                         cameraErrorType === 'DEVICE_BUSY' ? 'Webcam Currently Busy / In Use' :
                         'Camera Notice'}
                      </span>
                    </div>
                    {cameraErrorType && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-200/80 text-amber-900 font-bold">
                        {cameraErrorType}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-amber-900/90 leading-relaxed font-medium">
                    {cameraError}
                  </p>

                  {cameraErrorType === 'PERMISSION_DENIED' && (
                    <div className="p-3 bg-white/90 rounded-xl border border-amber-200 text-[11px] text-slate-800 space-y-1.5">
                      <strong className="block text-slate-900 font-bold">How to unblock camera in 5 seconds:</strong>
                      <ol className="list-decimal list-inside space-y-1 text-slate-700">
                        <li>Look at your browser address bar at the top (left of <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-[10px] text-slate-900">https://ayush9833.github.io</code>).</li>
                        <li>Click the <strong>lock icon (🔒)</strong> or <strong>tune settings icon</strong>.</li>
                        <li>Change <strong>Camera</strong> from "Block" to <strong>"Allow"</strong>.</li>
                        <li>Click the <strong>Retry Camera</strong> button below.</li>
                      </ol>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <button
                      onClick={() => startCamera().catch(() => {})}
                      className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                    >
                      <RefreshCw size={13} />
                      <span>Retry Camera</span>
                    </button>

                    <button
                      onClick={() => nativeCameraInputRef.current?.click()}
                      className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                    >
                      <Upload size={13} className="text-brand-700" />
                      <span>Upload Card Photo Directly</span>
                    </button>
                  </div>
                </div>
              )}



              {/* Raw Payload Accordion */}
              <details className="text-xs text-slate-500 border-t border-slate-100 pt-2">
                <summary className="cursor-pointer font-bold hover:text-slate-700">View / Paste Raw QR String</summary>
                <textarea
                  value={qrInput}
                  onChange={(e) => handleDecodeQR(e.target.value)}
                  className="w-full h-24 mt-2 p-2 font-mono text-[10px] bg-slate-900 text-emerald-400 rounded-lg border border-slate-700"
                  placeholder="Paste XML or decoded QR stream here..."
                />
              </details>
            </div>
          </div>

          {/* Right Column: Decoded Citizen Card & Cryptographic Seal */}
          <div ref={resultsContainerRef} className="lg:col-span-7 space-y-4">
            {docValidationError ? (
              /* STRICT REJECTION STATE: Upload a valid document (Matches Screenshot media_1788692164956.jpg) */
              <div className="bg-white border-2 border-rose-200 rounded-3xl p-6 sm:p-8 shadow-sm text-center space-y-5 animate-fade-in">
                <div className="w-16 h-16 mx-auto rounded-3xl bg-rose-50 border-2 border-rose-200 flex items-center justify-center text-rose-500 shadow-inner">
                  <AlertTriangle size={36} className="text-rose-500 stroke-[2.2]" />
                </div>

                <div className="max-w-md mx-auto space-y-2">
                  <div className="inline-flex items-center px-4 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-200">
                    VERIFICATION REJECTED
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                    Upload a valid document
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                    The uploaded or captured image is not a recognized official identity document or authentic identity QR code.
                  </p>
                </div>

                {/* Frame Preview with 'NOT A DOCUMENT' Badge Overlay */}
                {capturedFullDoc && (
                  <div className="max-w-md mx-auto p-2 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                    <div className="relative rounded-xl overflow-hidden aspect-[16/10] bg-slate-950 flex items-center justify-center group">
                      <img 
                        src={capturedFullDoc} 
                        alt="Captured input frame" 
                        className="w-full h-full object-contain filter brightness-75 contrast-105" 
                      />
                      {/* Red Pill Overlay Badge: NOT A DOCUMENT */}
                      <div className="absolute inset-0 flex items-center justify-center bg-black/25">
                        <div className="px-4 py-2 rounded-xl bg-rose-600/95 text-white font-extrabold text-xs sm:text-sm tracking-wider uppercase flex items-center gap-2 shadow-xl border border-rose-400/50 backdrop-blur-xs">
                          <XCircle size={18} className="text-white shrink-0 stroke-[2.5]" />
                          <span>NOT A DOCUMENT</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-400 font-mono tracking-wide">Captured Input Frame</p>
                  </div>
                )}

                {/* Accepted Government Documents List */}
                <div className="bg-slate-50/80 border border-slate-200 rounded-2xl p-4 text-left max-w-md mx-auto space-y-2.5">
                  <h5 className="font-extrabold text-xs text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                    <ShieldAlert size={15} className="text-amber-600 shrink-0" />
                    <span>ACCEPTED GOVERNMENT IDENTITY DOCUMENTS:</span>
                  </h5>
                  <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside">
                    <li><strong>Aadhaar Card:</strong> Front or Back (with UIDAI Secure QR)</li>
                    <li><strong>PAN Card:</strong> Income Tax Department Permanent Account Number</li>
                    <li><strong>Indian Passport:</strong> Republic of India (Front Page or MRZ)</li>
                    <li><strong>Driving Licence:</strong> Union of India Motor Vehicles Permit</li>
                    <li><strong>Voter ID Card:</strong> Election Commission of India (EPIC)</li>
                    <li><strong>Official Identity QR:</strong> UIDAI e-Aadhaar or gov.in verification</li>
                  </ul>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <button
                    onClick={() => fileUploadInputRef.current?.click()}
                    className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center gap-2 shadow-md transition-all cursor-pointer"
                  >
                    <Upload size={16} className="text-white" />
                    <span>Upload Valid Document</span>
                  </button>
                  <button
                    onClick={() => { setDocValidationError(null); startCamera().catch(() => {}); }}
                    className="px-5 py-2.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 font-bold rounded-xl text-xs sm:text-sm flex items-center gap-2 shadow-sm transition-all cursor-pointer"
                  >
                    <Camera size={16} className="text-brand-700" />
                    <span>Rescan with Camera</span>
                  </button>
                </div>
              </div>
            ) : (qrData || qrResult || ocrData || capturedFullDoc) ? (
              (() => {
                const effectiveQr = qrData || qrResult || {
                  format: 'NOT_DETECTED',
                  typeLabel: 'QR Not Detected / Absent',
                  rawPayload: rawQrPayload || 'No QR code was detected on this document image or stream. Visual document verification active.',
                  fields: {},
                  signatureStatus: 'NOT_APPLICABLE'
                };
                const effectiveRaw = rawQrPayload || effectiveQr.rawPayload || '';
                const isQrDetected = effectiveQr.format !== 'NOT_DETECTED' && effectiveQr.format !== 'EMPTY';

                const handleCopyRaw = () => {
                  if (effectiveRaw) {
                    navigator.clipboard.writeText(effectiveRaw);
                    setCopiedRawPayload(true);
                    setTimeout(() => setCopiedRawPayload(false), 2000);
                  }
                };

                return (
                  <div className="space-y-4">
                    {/* ========================================================= */}
                    {/* SECTION 1: RAW QR DECODING & STREAM METADATA              */}
                    {/* ========================================================= */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${isQrDetected ? 'bg-emerald-500 animate-pulse' : 'bg-cyan-500 animate-pulse'}`} />
                          <h4 className="font-extrabold text-sm text-slate-900 tracking-tight flex items-center gap-1.5">
                            {isQrDetected ? (
                              <>
                                <QrCode size={16} className="text-emerald-600" />
                                <span>QR DETECTED & DECODED</span>
                              </>
                            ) : (
                              <>
                                <Eye size={16} className="text-cyan-600" />
                                <span>OPTICAL CHARACTER RECOGNITION (NEURAL VISION)</span>
                              </>
                            )}
                          </h4>
                        </div>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          isQrDetected 
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-cyan-100 text-cyan-800 border border-cyan-300'
                        }`}>
                          {isQrDetected ? 'RAW STREAM ACTIVE' : 'CARD FACE OCR ACTIVE'}
                        </span>
                      </div>

                      {/* Raw Payload Stream Inspector */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                          <span className="font-bold text-slate-700 flex items-center gap-1">
                            <Terminal size={12} className="text-slate-600" />
                            <span>Exact Decoded Payload:</span>
                          </span>
                          <button
                            onClick={handleCopyRaw}
                            className="text-[10px] font-bold text-brand-700 hover:text-brand-900 flex items-center gap-1 cursor-pointer bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded transition-all"
                          >
                            {copiedRawPayload ? <Check size={11} className="text-emerald-600" /> : <Copy size={11} />}
                            <span>{copiedRawPayload ? 'Copied' : 'Copy Payload'}</span>
                          </button>
                        </div>
                        <div className="p-3 bg-slate-950 text-emerald-400 font-mono text-[11px] rounded-xl border border-slate-800 max-h-32 overflow-y-auto break-all select-all shadow-inner leading-relaxed">
                          {effectiveRaw || 'Payload string is empty'}
                        </div>
                      </div>

                      {/* 4 Multi-Engine Hardware Metrics */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
                        <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80">
                          <span className="text-[9px] font-bold text-slate-400 uppercase block">Payload Length</span>
                          <strong className="text-xs font-mono font-bold text-slate-800 block">
                            {effectiveRaw.length} chars
                          </strong>
                        </div>

                        <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80">
                          <span className="text-[9px] font-bold text-slate-400 uppercase block">Detected Format</span>
                          <strong className="text-xs font-bold text-cyan-800 block truncate" title={effectiveQr.typeLabel || effectiveQr.format}>
                            {effectiveQr.typeLabel || effectiveQr.format}
                          </strong>
                        </div>

                        <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80">
                          <span className="text-[9px] font-bold text-slate-400 uppercase block">Decoder Engine</span>
                          <strong className="text-xs font-bold text-slate-700 block truncate" title={decoderEngine || 'Multi-Engine Scanner'}>
                            {decoderEngine || 'Hardware / Sensor'}
                          </strong>
                        </div>

                        <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80">
                          <span className="text-[9px] font-bold text-slate-400 uppercase block">Digital Seal</span>
                          <strong className="text-xs font-bold text-amber-700 block truncate" title={effectiveQr.signatureStatus}>
                            {effectiveQr.signatureStatus === 'SIGNATURE_PRESENT_UNVERIFIED' 
                              ? 'Key Not Installed' 
                              : (effectiveQr.signatureStatus || 'Unsigned')}
                          </strong>
                        </div>
                      </div>
                    </div>

                    {/* ========================================================= */}
                    {/* SECTION 2: ADAPTIVE PARSED QR DATA (FORMAT-SPECIFIC)      */}
                    {/* ========================================================= */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                        <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                          <FileCheck2 size={15} className="text-brand-700" />
                          <span>Parsed QR Fields (Authentic Payload Content)</span>
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          Zero Fake Fields • Extracted As-Is
                        </span>
                      </div>

                      {/* 2-0: No QR Detected / OCR-Only Mode */}
                      {effectiveQr.format === 'NOT_DETECTED' && (
                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                          <div className="flex items-center gap-2 font-bold text-slate-800">
                            <FileText size={16} className="text-cyan-600" />
                            <span>Visual OCR Verification Mode</span>
                          </div>
                          <p className="text-[11px] text-slate-600 leading-relaxed">
                            This document surface does not contain an encoded 2D QR code (or the physical card front was presented). 
                            All demographic data is extracted directly from the physical card typography using Neural OCR below.
                          </p>
                        </div>
                      )}

                      {/* 2A: URL / External Link Format */}
                      {effectiveQr.format === 'URL' && (
                        <div className="p-4 bg-cyan-50/70 border border-cyan-200 rounded-xl space-y-2 text-xs">
                          <div className="flex items-center gap-2 font-bold text-cyan-950">
                            <ExternalLink size={16} className="text-cyan-700" />
                            <span>Verification URL Endpoint</span>
                          </div>
                          <p className="text-[11px] text-cyan-900 leading-relaxed">
                            This QR code contains an online verification link. It does <strong>not</strong> contain offline demographic fields (Name, DOB, UID).
                          </p>
                          <div className="p-2.5 bg-white rounded-lg border border-cyan-300 font-mono text-xs text-brand-900 break-all select-all flex items-center justify-between">
                            <span>{effectiveQr.fields?.url || effectiveRaw}</span>
                          </div>
                        </div>
                      )}

                      {/* 2B: UIDAI Physical Card Front Array Token */}
                      {effectiveQr.format === 'UIDAI_FRONT_ARRAY' && (
                        <div className="space-y-3">
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                              <span className="text-[10px] text-slate-400 font-bold uppercase block">Masked UID Token</span>
                              <strong className="text-sm font-mono font-extrabold text-slate-900">
                                {effectiveQr.uidMasked || `**** **** ${effectiveQr.fields?.last4}`}
                              </strong>
                            </div>
                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                              <span className="text-[10px] text-slate-400 font-bold uppercase block">Architecture</span>
                              <strong className="text-sm font-mono font-extrabold text-slate-900">
                                v{effectiveQr.fields?.version || '1'} PVC Front
                              </strong>
                            </div>
                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                              <span className="text-[10px] text-slate-400 font-bold uppercase block">Photo Flag</span>
                              <strong className="text-sm font-extrabold text-slate-900">
                                {effectiveQr.fields?.hasPhoto ? 'Portrait on Card' : 'Standard Token'}
                              </strong>
                            </div>
                          </div>

                          <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-xl text-xs text-amber-950 space-y-1">
                            <span className="font-bold block text-amber-900">ℹ️ Front Security Token Structure:</span>
                            <p className="text-[11px] leading-relaxed text-amber-900/90 font-medium">
                              UIDAI Physical Card Front QRs are security tokens storing the last 4 digits and a 2048-bit RSA digital signature. 
                              Cardholder Name, DOB, and Address are <strong>not encoded in this front QR</strong>. 
                              They are printed on the physical card face and extracted via <strong>Neural OCR</strong> below for cross-verification.
                            </p>
                          </div>
                        </div>
                      )}

                      {/* 2C: UIDAI Full Decompressed VTC Demographics or XML Demographics */}
                      {(effectiveQr.format === 'UIDAI_SECURE_BINARY' || effectiveQr.format === 'XML') && (
                        <div className="space-y-3">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                              <span className="text-[10px] text-slate-400 font-bold uppercase block">Cardholder Name (In QR)</span>
                              <strong className="text-sm text-slate-900 font-extrabold">{effectiveQr.name || 'Not present in QR'}</strong>
                            </div>
                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                              <span className="text-[10px] text-slate-400 font-bold uppercase block">Date of Birth (In QR)</span>
                              <strong className="text-sm text-slate-900 font-extrabold">{effectiveQr.dob || 'Not present in QR'}</strong>
                            </div>
                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                              <span className="text-[10px] text-slate-400 font-bold uppercase block">Masked UID (In QR)</span>
                              <strong className="text-sm font-mono text-slate-900 font-extrabold">{effectiveQr.uidMasked || 'XXXX-XXXX-SECURE'}</strong>
                            </div>
                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                              <span className="text-[10px] text-slate-400 font-bold uppercase block">Gender (In QR)</span>
                              <strong className="text-sm text-slate-900 font-bold">{effectiveQr.gender || 'Not present in QR'}</strong>
                            </div>
                            {effectiveQr.fullAddress && (
                              <div className="sm:col-span-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                <span className="text-[10px] text-slate-400 font-bold uppercase block">Address (In QR)</span>
                                <p className="text-xs text-slate-700 font-medium mt-0.5 break-words">{effectiveQr.fullAddress}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* 2D: Structured JSON or Key-Value format */}
                      {(effectiveQr.format === 'JSON' || effectiveQr.format === 'KEY_VALUE') && (
                        <div className="space-y-2">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                            {Object.entries(effectiveQr.fields || {}).map(([k, v]) => (
                              <div key={k} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80">
                                <span className="text-[10px] text-slate-400 font-bold uppercase block">{k}</span>
                                <strong className="text-xs font-mono text-slate-900 block truncate">{String(v)}</strong>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 2E: Plain Text format */}
                      {effectiveQr.format === 'PLAIN_TEXT' && (
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 font-mono text-xs text-slate-800">
                          {effectiveQr.fields?.text || effectiveRaw}
                        </div>
                      )}
                    </div>

                    {/* ========================================================= */}
                    {/* SECTION 3: PHYSICAL DOCUMENT VISUAL FACE (OCR EXTRACTION) */}
                    {/* ========================================================= */}
                    {(capturedFullDoc || scannedCardPhoto) && (
                      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                          <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                            <Eye size={15} className="text-cyan-700" />
                            <span>Physical Document Visual Face (Optical OCR)</span>
                          </span>
                          {isExtractingDemographics ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-100 text-cyan-900 flex items-center gap-1 animate-pulse">
                              <RefreshCw size={10} className="animate-spin" />
                              <span>Reading Text...</span>
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 font-mono">
                              Neural OCR Ready
                            </span>
                          )}
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 items-start">
                          <img 
                            src={capturedFullDoc || scannedCardPhoto} 
                            alt="Scanned Document Face" 
                            className="w-24 h-24 sm:w-28 sm:h-28 object-cover rounded-xl border border-slate-300 shadow-xs shrink-0" 
                          />
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full text-xs">
                            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                              <span className="text-[10px] text-slate-400 font-bold uppercase block">Printed Name (Card Face)</span>
                              <strong className="text-xs font-bold text-slate-900 block">
                                {ocrData?.name || (isExtractingDemographics ? 'Reading...' : 'Not detected on card')}
                              </strong>
                            </div>

                            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                              <span className="text-[10px] text-slate-400 font-bold uppercase block">Printed DOB (Card Face)</span>
                              <strong className="text-xs font-bold text-slate-900 block">
                                {ocrData?.dob || (isExtractingDemographics ? 'Reading...' : 'Not detected')}
                              </strong>
                            </div>

                            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                              <span className="text-[10px] text-slate-400 font-bold uppercase block">Printed Number (Card Face)</span>
                              <strong className="text-xs font-mono font-bold text-slate-900 block">
                                {ocrData?.uid || (isExtractingDemographics ? 'Reading...' : 'Not detected')}
                              </strong>
                            </div>

                            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                              <span className="text-[10px] text-slate-400 font-bold uppercase block">Document Type</span>
                              <strong className="text-xs font-bold text-slate-900 block">
                                {ocrData?.documentType || 'Official ID Card'}
                              </strong>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ========================================================= */}
                    {/* SECTION 4: FIELD-BY-FIELD CONSISTENCY MATRIX              */}
                    {/* ========================================================= */}
                    <QrOcrComparisonCard
                      qrData={effectiveQr}
                      ocrData={ocrData}
                      comparisonResult={comparisonResult}
                      compositeRisk={compositeRisk}
                      documentSnapshot={capturedFullDoc || scannedCardPhoto}
                      qrSnapshot={qrCropSnapshot}
                      sessionId={`SES-BOP-${effectiveQr.fields?.last4 || effectiveQr.uidRaw || '5005'}`}
                      timestamp={new Date().toISOString()}
                    />

                    {/* ========================================================= */}
                    {/* SECTION 5: DEVELOPER / DEBUG MODE TERMINAL PANEL          */}
                    {/* ========================================================= */}
                    <div className="bg-slate-900 text-slate-100 rounded-2xl p-5 border border-slate-800 shadow-xl space-y-4 font-mono">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
                        <div className="flex items-center gap-2">
                          <Terminal size={18} className="text-cyan-400" />
                          <h4 className="font-extrabold text-sm text-white tracking-tight">
                            Officer Developer & Debug Console
                          </h4>
                        </div>
                        <label className="flex items-center gap-2 text-xs font-bold text-cyan-300 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={developerMode}
                            onChange={(e) => setDeveloperMode(e.target.checked)}
                            className="rounded text-cyan-500 focus:ring-cyan-400 cursor-pointer"
                          />
                          <span>Enable Developer Mode</span>
                        </label>
                      </div>

                      {developerMode ? (
                        <div className="space-y-3">
                          {/* Sub-Tabs */}
                          <div className="flex gap-1.5 overflow-x-auto border-b border-slate-800 pb-2 text-xs">
                            <button
                              onClick={() => setDebugTab('raw')}
                              className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                                debugTab === 'raw' ? 'bg-cyan-500 text-brand-950' : 'text-slate-400 hover:text-slate-200'
                              }`}
                            >
                              1. Raw QR Stream
                            </button>
                            <button
                              onClick={() => setDebugTab('ocr')}
                              className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                                debugTab === 'ocr' ? 'bg-cyan-500 text-brand-950' : 'text-slate-400 hover:text-slate-200'
                              }`}
                            >
                              2. Raw OCR Text
                            </button>
                            <button
                              onClick={() => setDebugTab('json_qr')}
                              className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                                debugTab === 'json_qr' ? 'bg-cyan-500 text-brand-950' : 'text-slate-400 hover:text-slate-200'
                              }`}
                            >
                              3. Parsed QR Object
                            </button>
                            <button
                              onClick={() => setDebugTab('json_ocr')}
                              className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                                debugTab === 'json_ocr' ? 'bg-cyan-500 text-brand-950' : 'text-slate-400 hover:text-slate-200'
                              }`}
                            >
                              4. Parsed OCR Object
                            </button>
                            <button
                              onClick={() => setDebugTab('math')}
                              className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                                debugTab === 'math' ? 'bg-cyan-500 text-brand-950' : 'text-slate-400 hover:text-slate-200'
                              }`}
                            >
                              5. Matching Score Matrix
                            </button>
                          </div>

                          {/* Tab 1: Raw QR Stream */}
                          {debugTab === 'raw' && (
                            <div className="space-y-2 text-xs">
                              <div className="flex justify-between text-slate-400 text-[10px]">
                                <span>Length: {effectiveRaw.length} chars</span>
                                <span>Decoder Engine: {decoderEngine || 'Multi-Engine'}</span>
                              </div>
                              <pre className="p-3 bg-slate-950 text-cyan-300 rounded-xl border border-slate-800 text-[11px] overflow-x-auto whitespace-pre-wrap break-all max-h-56">
                                {effectiveRaw}
                              </pre>
                            </div>
                          )}

                          {/* Tab 2: Raw OCR Output */}
                          {debugTab === 'ocr' && (
                            <div className="space-y-2 text-xs">
                              <span className="text-slate-400 text-[10px] block">
                                Output from OCR.space Neural Vision Engine:
                              </span>
                              <pre className="p-3 bg-slate-950 text-emerald-400 rounded-xl border border-slate-800 text-[11px] overflow-x-auto whitespace-pre-wrap break-all max-h-56">
                                {ocrData?.rawText || 'No OCR text extracted yet. Ensure document card image is captured.'}
                              </pre>
                            </div>
                          )}

                          {/* Tab 3: Parsed QR JSON */}
                          {debugTab === 'json_qr' && (
                            <div className="space-y-2 text-xs">
                              <span className="text-slate-400 text-[10px] block">
                                Structured QR Object (Source: parseUniversalQR):
                              </span>
                              <pre className="p-3 bg-slate-950 text-cyan-300 rounded-xl border border-slate-800 text-[10px] overflow-x-auto whitespace-pre max-h-56">
                                {JSON.stringify(effectiveQr, null, 2)}
                              </pre>
                            </div>
                          )}

                          {/* Tab 4: Parsed OCR JSON */}
                          {debugTab === 'json_ocr' && (
                            <div className="space-y-2 text-xs">
                              <span className="text-slate-400 text-[10px] block">
                                Structured OCR Object (Source: parseUniversalDocumentOCR):
                              </span>
                              <pre className="p-3 bg-slate-950 text-amber-300 rounded-xl border border-slate-800 text-[10px] overflow-x-auto whitespace-pre max-h-56">
                                {JSON.stringify(ocrData || { note: 'OCR not executed or empty' }, null, 2)}
                              </pre>
                            </div>
                          )}

                          {/* Tab 5: Similarity Math Table */}
                          {debugTab === 'math' && (
                            <div className="space-y-2 text-xs overflow-x-auto">
                              <table className="w-full text-left text-[11px] border-collapse">
                                <thead>
                                  <tr className="border-b border-slate-800 text-slate-400 text-[10px] uppercase">
                                    <th className="py-2 px-2">Field</th>
                                    <th className="py-2 px-2">QR Normalized</th>
                                    <th className="py-2 px-2">OCR Normalized</th>
                                    <th className="py-2 px-2">Sim %</th>
                                    <th className="py-2 px-2">Status</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/60 font-mono">
                                  {(comparisonResult?.comparisons || []).map((c, idx) => {
                                    const normQ = normalizeName(c.qrValue);
                                    const normO = normalizeName(c.ocrValue);
                                    const sim = Math.round(stringSimilarity(normQ, normO) * 100);
                                    return (
                                      <tr key={idx} className="hover:bg-slate-800/40">
                                        <td className="py-2 px-2 text-white font-bold">{c.field}</td>
                                        <td className="py-2 px-2 text-slate-300 truncate max-w-[120px]">{normQ || '—'}</td>
                                        <td className="py-2 px-2 text-slate-300 truncate max-w-[120px]">{normO || '—'}</td>
                                        <td className="py-2 px-2 text-cyan-300">{c.confidence ?? sim}%</td>
                                        <td className="py-2 px-2">
                                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                            c.status === 'MATCH' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                                            c.status === 'MISMATCH' ? 'bg-rose-950 text-rose-300 border border-rose-800' :
                                            'bg-slate-800 text-slate-300'
                                          }`}>
                                            {c.status}
                                          </span>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          Toggle Developer Mode to inspect raw cryptographic byte streams, OCR tokens, JSON trees, and string similarity mathematics.
                        </p>
                      )}
                    </div>

                    {/* Forward to Full Pipeline Button */}
                    <button
                      onClick={() => handleExportToPipeline('qr')}
                      disabled={isExporting}
                      className="w-full py-3.5 bg-gradient-to-r from-brand-900 via-cyan-900 to-cyan-700 hover:from-brand-800 hover:to-cyan-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer active:scale-98"
                    >
                      <span>{isExporting ? 'Initiating Dossier...' : 'Initiate Full 8-Stage SATYAPAN Audit Dossier'}</span>
                      <ArrowRight size={16} />
                    </button>
                  </div>
                );
              })()
            ) : (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-12 text-center text-slate-400 space-y-2">
                <QrCode size={36} className="mx-auto text-slate-300" />
                <p className="text-xs font-bold">Scan or upload any document QR code to verify live</p>
                <p className="text-[11px] text-slate-500">Supports Aadhaar (Front & Back), Passports, JSON, URLs, and Plain Text</p>
              </div>
            )}
          </div>
        </div>
      )}


      {/* ========================================================= */}
      {/* TAB 2: ICAO-9303 PASSPORT MRZ CHECKER                     */}
      {/* ========================================================= */}
      {activeTab === 'mrz' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-extrabold text-base text-slate-800 flex items-center gap-2">
                <FileText size={18} className="text-cyan-600" />
                <span>ICAO-9303 Machine Readable Zone (MRZ) 7-3-1 Engine</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Every authentic passport has two 44-character MRZ lines with mathematical check digits. Tampering with any character will cause immediate checksum failure.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => updateMRZ(SAMPLE_TEST_VECTORS.genuinePassportMRZ.line1, SAMPLE_TEST_VECTORS.genuinePassportMRZ.line2)}
                className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold hover:bg-emerald-100 cursor-pointer"
              >
                Sample Valid Passport
              </button>
              <button
                onClick={() => updateMRZ(SAMPLE_TEST_VECTORS.tamperedPassportMRZ.line1, SAMPLE_TEST_VECTORS.tamperedPassportMRZ.line2)}
                className="px-3 py-1.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold hover:bg-rose-100 cursor-pointer"
              >
                Sample Forged Passport
              </button>
            </div>
          </div>

          <div className="space-y-3 font-mono">
            <div>
              <label className="text-[11px] font-bold text-slate-500 block mb-1">
                Line 1 (Document Type, Country, Names - 44 chars):
              </label>
              <input
                type="text"
                maxLength={44}
                value={mrzLine1}
                onChange={(e) => updateMRZ(e.target.value, mrzLine2)}
                className="w-full p-2.5 bg-slate-900 text-cyan-300 rounded-xl text-xs sm:text-sm tracking-wider uppercase border border-slate-700 focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-500 block mb-1">
                Line 2 (Passport No, DOB, Expiry, Check Digits - 44 chars):
              </label>
              <input
                type="text"
                maxLength={44}
                value={mrzLine2}
                onChange={(e) => updateMRZ(mrzLine1, e.target.value)}
                className="w-full p-2.5 bg-slate-900 text-cyan-300 rounded-xl text-xs sm:text-sm tracking-wider uppercase border border-slate-700 focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          {mrzResult && (
            <div className="space-y-4 pt-2">
              <div className={`p-4 rounded-xl border flex items-center justify-between ${
                mrzResult.isAllValid
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                  : 'bg-rose-50 border-rose-300 text-rose-950'
              }`}>
                <div className="flex items-center gap-3">
                  {mrzResult.isAllValid ? (
                    <CheckCircle2 size={24} className="text-emerald-600 shrink-0" />
                  ) : (
                    <XCircle size={24} className="text-rose-600 shrink-0" />
                  )}
                  <div>
                    <strong className="text-sm font-extrabold block">
                      {mrzResult.isAllValid
                        ? 'ICAO Doc 9303 Compliant — Authentic Travel Document'
                        : 'CRITICAL ALERT: MRZ Checksum Mismatch Detected (Counterfeit or Tampered)'}
                    </strong>
                    <span className="text-xs opacity-80">
                      {mrzResult.isAllValid
                        ? 'All check digits match the 7-3-1 cyclic modulo-10 algorithm.'
                        : 'One or more fields have been manually modified or forged in Photoshop.'}
                    </span>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                  mrzResult.isAllValid ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                }`}>
                  {mrzResult.isAllValid ? 'VERIFIED' : 'TAMPERED'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                <div className={`p-3 rounded-xl border ${mrzResult.isPassportCheckValid ? 'bg-slate-50 border-slate-200' : 'bg-rose-50 border-rose-300'}`}>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Passport Number</span>
                  <strong className="text-sm font-mono text-slate-800 block my-1">{mrzResult.passportNum}</strong>
                  <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-[11px]">
                    <span>Check: <b>{mrzResult.passportCheck}</b></span>
                    <span className={mrzResult.isPassportCheckValid ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold'}>
                      Calc: {mrzResult.passportCheckCalculated} {mrzResult.isPassportCheckValid ? '✓' : '✗'}
                    </span>
                  </div>
                </div>

                <div className={`p-3 rounded-xl border ${mrzResult.isDobCheckValid ? 'bg-slate-50 border-slate-200' : 'bg-rose-50 border-rose-300'}`}>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Date of Birth</span>
                  <strong className="text-sm font-mono text-slate-800 block my-1">{mrzResult.dobFormatted}</strong>
                  <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-[11px]">
                    <span>Check: <b>{mrzResult.dobCheck}</b></span>
                    <span className={mrzResult.isDobCheckValid ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold'}>
                      Calc: {mrzResult.dobCheckCalculated} {mrzResult.isDobCheckValid ? '✓' : '✗'}
                    </span>
                  </div>
                </div>

                <div className={`p-3 rounded-xl border ${mrzResult.isExpiryCheckValid ? 'bg-slate-50 border-slate-200' : 'bg-rose-50 border-rose-300'}`}>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Expiration Date</span>
                  <strong className="text-sm font-mono text-slate-800 block my-1">{mrzResult.expiryFormatted}</strong>
                  <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-[11px]">
                    <span>Check: <b>{mrzResult.expiryCheck}</b></span>
                    <span className={mrzResult.isExpiryCheckValid ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold'}>
                      Calc: {mrzResult.expiryCheckCalculated} {mrzResult.isExpiryCheckValid ? '✓' : '✗'}
                    </span>
                  </div>
                </div>

                <div className={`p-3 rounded-xl border ${mrzResult.isCompositeCheckValid ? 'bg-slate-50 border-slate-200' : 'bg-rose-50 border-rose-300'}`}>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Composite Checksum</span>
                  <strong className="text-sm font-mono text-slate-800 block my-1">Full MRZ String</strong>
                  <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-[11px]">
                    <span>Check: <b>{mrzResult.compositeCheck}</b></span>
                    <span className={mrzResult.isCompositeCheckValid ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold'}>
                      Calc: {mrzResult.compositeCheckCalculated} {mrzResult.isCompositeCheckValid ? '✓' : '✗'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Traveler Full Name</span>
                  <strong className="text-sm text-slate-800 font-extrabold">{mrzResult.fullName}</strong>
                  <span className="text-slate-500 block text-[11px]">Country: {mrzResult.issuingCountry} • Nationality: {mrzResult.nationality} • Sex: {mrzResult.sex}</span>
                </div>
                <button
                  onClick={() => handleExportToPipeline('mrz')}
                  disabled={isExporting}
                  className="px-4 py-2.5 bg-brand-900 hover:bg-brand-800 text-white rounded-xl font-bold flex items-center gap-2 shrink-0 transition-all shadow-sm cursor-pointer"
                >
                  <span>{isExporting ? 'Exporting...' : 'Screen in SATYAPAN Dossier'}</span>
                  <ArrowRight size={15} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: VERHOEFF D5 MATHEMATICAL VALIDATOR                 */}
      {/* ========================================================= */}
      {activeTab === 'verhoeff' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-extrabold text-base text-slate-800 flex items-center gap-2">
                <Calculator size={18} className="text-cyan-600" />
                <span>Aadhaar Verhoeff Dihedral Group D₅ Matrix Calculator</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                The 12th digit of an Aadhaar number is computed via dihedral group D₅ permutations. It catches 100% of single-digit substitution errors and 95.4% of transposition errors offline.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => updateVerhoeff(SAMPLE_TEST_VECTORS.genuineAadhaarNumber)}
                className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold hover:bg-emerald-100 cursor-pointer"
              >
                Genuine 12-Digit UID
              </button>
              <button
                onClick={() => updateVerhoeff(SAMPLE_TEST_VECTORS.forgedAadhaarNumber)}
                className="px-3 py-1.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold hover:bg-rose-100 cursor-pointer"
              >
                Random Forged UID
              </button>
            </div>
          </div>

          <div className="max-w-md mx-auto space-y-2 text-center">
            <label className="text-xs font-bold text-slate-600 block">
              Enter 12-Digit Aadhaar Number for Live Mathematical Trace:
            </label>
            <input
              type="text"
              maxLength={12}
              value={verhoeffInput}
              onChange={(e) => updateVerhoeff(e.target.value)}
              className="w-full text-center p-3 text-xl font-mono tracking-widest rounded-xl border-2 border-slate-300 focus:border-cyan-500 focus:outline-none bg-slate-50 font-black text-brand-900"
              placeholder="e.g. 5486 7912 3452"
            />
            <span className="text-[11px] text-slate-400">
              Length: {verhoeffInput.length} / 12 digits
            </span>
          </div>

          {verhoeffTrace && (
            <div className="space-y-4">
              <div className={`p-4 rounded-xl border text-center ${
                verhoeffTrace.isValid
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                  : 'bg-rose-50 border-rose-300 text-rose-950'
              }`}>
                <div className="flex items-center justify-center gap-2 mb-1">
                  {verhoeffTrace.isValid ? <CheckCircle2 size={20} className="text-emerald-600" /> : <XCircle size={20} className="text-rose-600" />}
                  <strong className="text-base font-extrabold">
                    {verhoeffTrace.isValid
                      ? 'Verhoeff Checksum: VALID (c = 0)'
                      : `Verhoeff Checksum: FAILED (c = ${verhoeffTrace.finalChecksum})`}
                  </strong>
                </div>
                <p className="text-xs opacity-90 max-w-xl mx-auto">
                  {verhoeffTrace.isValid
                    ? `The 12th digit '${verhoeffTrace.actualCheckDigit}' satisfies the Dihedral Group D₅ permutation equation. This number is mathematically authentic.`
                    : `Counterfeit or typo detected! For the first 11 digits, the mathematically expected 12th check digit is '${verhoeffTrace.expectedCheckDigit}', but found '${verhoeffTrace.actualCheckDigit}'.`}
                </p>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 flex items-center justify-between text-xs font-bold text-slate-700">
                  <span className="flex items-center gap-1.5">
                    <ScanLine size={14} className="text-cyan-600" />
                    <span>Step-by-Step Dihedral D₅ Permutation Multiplication Table</span>
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">Algorithm: Jacobus Verhoeff (1969)</span>
                </div>
                <div className="overflow-x-auto max-h-60">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                      <tr>
                        <th className="p-2 text-center">Step (i)</th>
                        <th className="p-2 text-center">Digit (dᵢ)</th>
                        <th className="p-2 text-center">Permuted p(i%8, dᵢ)</th>
                        <th className="p-2 text-center">Intermediate c</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {verhoeffTrace.trace.map((t) => (
                        <tr key={t.step} className="hover:bg-slate-50">
                          <td className="p-2 text-center text-slate-400">{t.step}</td>
                          <td className="p-2 text-center font-bold text-slate-800">{t.digit}</td>
                          <td className="p-2 text-center text-cyan-600">{t.permutedValue}</td>
                          <td className="p-2 text-center font-bold text-brand-900">{t.nextC}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
