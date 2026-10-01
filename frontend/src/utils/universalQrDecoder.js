/**
 * Universal Multi-Engine & Multi-Zone Barcode / QR Decoder
 *
 * Combines:
 * 1. Hardware-accelerated native BarcodeDetector API (Android Chrome, Edge, Safari)
 * 2. jsQR (pure JS QR decoder with normal & inverted color support)
 * 3. ZXing QRCodeReader (HybridBinarizer & GlobalHistogramBinarizer for dense/low-light QRs)
 * 4. ZXing MultiFormatReader (PDF417, Aztec, Data Matrix, Code 128, Code 39, etc.)
 * 5. Adaptive contrast enhancement filter for soft-focus and glare
 * 6. 3x3 convolution sharpening filter for blurred edge recovery
 * 7. Multi-zone targeted scanning (Aadhaar Card Back Right-Half, Center Box, Quadrants)
 * 8. Multi-scale passes (high-res downscaling to prevent mobile freeze, upscaling for small codes)
 */

import jsQR from 'jsqr';
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

export const ALL_BARCODE_FORMATS = [
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
 * Adaptive contrast stretching and unsharp mask filter for blurry / glare QR codes
 */
export function enhanceBlurryFrame(ctx, width, height) {
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
 * 3x3 Convolution Sharpening Filter for webcams and phone cameras with soft focus
 */
export function createSharpenedCanvas(canvas) {
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

export function createZXingBitmap(imgData, width, height, useGlobalHistogram = false) {
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

/**
 * Decodes a single canvas using Hardware BarcodeDetector -> jsQR -> ZXing (Hybrid) -> ZXing (GlobalHistogram) -> Adaptive Contrast -> Sharpening
 */
export async function decodeSingleCanvas(canvas, label = '') {
  if (!canvas || canvas.width === 0 || canvas.height === 0) return null;
  const width = canvas.width;
  const height = canvas.height;

  // 1. Hardware-Accelerated Native BarcodeDetector (Chrome Android, Safari, Edge)
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

  // 2. Fast pure-JS decoder: jsQR (normal & inverted)
  try {
    const j1 = jsQR(imgData.data, width, height, { inversionAttempts: 'attemptBoth' });
    if (j1 && j1.data) return { text: j1.data, format: 'QR_CODE', engine: `jsQR${label ? ` (${label})` : ''}` };
  } catch (e) {}

  // 3. Dedicated ZXing QRCodeReader (HybridBinarizer - specialized for dense QR codes)
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

  // 7. 3x3 Convolution Sharpening Filter (Recovers blurred module edges)
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
export async function decodeImageSource(source) {
  if (!source) return null;

  // 1. Hardware Accelerated Native BarcodeDetector on raw source
  try {
    if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
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

  if (typeof HTMLCanvasElement !== 'undefined' && source instanceof HTMLCanvasElement) {
    rawW = source.width;
    rawH = source.height;
  } else if (typeof HTMLVideoElement !== 'undefined' && source instanceof HTMLVideoElement) {
    rawW = source.videoWidth;
    rawH = source.videoHeight;
  } else if (typeof HTMLImageElement !== 'undefined' && source instanceof HTMLImageElement) {
    rawW = source.naturalWidth || source.width;
    rawH = source.naturalHeight || source.height;
  } else if (source && source.width && source.height) {
    rawW = source.width;
    rawH = source.height;
  }

  if (!rawW || !rawH) return null;

  // Scale down large mobile captures so memory buffer is < 10MB instead of 48MB+
  const maxDim = Math.max(rawW, rawH);
  const scale = maxDim > 1600 ? 1600 / maxDim : 1.0;
  width = Math.round(rawW * scale);
  height = Math.round(rawH * scale);

  if (typeof HTMLCanvasElement !== 'undefined' && source instanceof HTMLCanvasElement && scale === 1.0) {
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
    },
    // Zone 6: Bottom-Left Quadrant
    {
      name: 'Bottom-Left Quadrant',
      canvas: extractZone(
        0,
        Math.floor(height * 0.40),
        Math.ceil(width * 0.60),
        Math.ceil(height * 0.60),
        700
      )
    }
  ];

  // Fast priority scan on primary target zones
  for (const zone of zones) {
    if (zone.canvas) {
      const zRes = await decodeSingleCanvas(zone.canvas, zone.name);
      if (zRes) return zRes;
    }
  }

  // Pass 3: Multi-Scale Downscale/Upscale Pass
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
 * Robust DataURL QR / Barcode Decoder
 * Accepts any image dataUrl, converts to Image element, and runs full multi-engine multi-zone pipeline
 */
export async function decodeQrFromDataUrl(dataUrl) {
  if (!dataUrl) return null;
  return new Promise((resolve) => {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = async () => {
        try {
          const res = await decodeImageSource(img);
          resolve(res ? res.text : null);
        } catch (err) {
          resolve(null);
        }
      };
      img.onerror = () => resolve(null);
      img.src = dataUrl;
    } catch (e) {
      resolve(null);
    }
  });
}
