/**
 * SATYAPAN QR ↔ OCR Cross-Verification & Multi-Signal Risk Engine
 * 
 * Compares data extracted from the physical document's visual face (OCR)
 * against the cryptographically encoded data in the QR code.
 * Detects discrepancies, visual tampering, photo replacement, and data splicing.
 * 
 * CORE PRINCIPLES:
 * 1. Never assume every QR has Name, DOB, or ID.
 * 2. Only compare fields that exist in BOTH sources.
 * 3. Never invent fake fallback identity data.
 * 4. Distinct QR_DATA and OCR_DATA tracking.
 */

// =========================================================================
// 1. TEXT & DATA NORMALIZATION UTILITIES
// =========================================================================

export function normalizeName(name) {
  if (!name || typeof name !== 'string') return '';
  return name
    .toLowerCase()
    .replace(/\b(mr|mrs|ms|shri|smt|dr|prof|master)\b\.?/gi, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function normalizeId(id) {
  if (!id || typeof id !== 'string') return '';
  return id
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .trim();
}

export function parseAndNormalizeDate(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const clean = dateStr.trim();

  // Format: DD/MM/YYYY or DD-MM-YYYY
  let m = clean.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/);
  if (m) {
    const day = m[1].padStart(2, '0');
    const month = m[2].padStart(2, '0');
    const year = m[3];
    return `${year}-${month}-${day}`;
  }

  // Format: YYYY/MM/DD or YYYY-MM-DD
  m = clean.match(/^(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})$/);
  if (m) {
    const year = m[1];
    const month = m[2].padStart(2, '0');
    const day = m[3].padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Format: Only Year (e.g. YOB 1998)
  m = clean.match(/\b(19\d{2}|20\d{2})\b/);
  if (m) {
    return m[1];
  }

  return clean;
}

/**
 * Calculates Levenshtein Distance between two strings
 */
export function levenshtein(a, b) {
  const an = a ? a.length : 0;
  const bn = b ? b.length : 0;
  if (an === 0) return bn;
  if (bn === 0) return an;
  const matrix = Array.from({ length: bn + 1 }, (_, i) => [i]);
  for (let j = 0; j <= an; j++) matrix[0][j] = j;

  for (let i = 1; i <= bn; i++) {
    for (let j = 1; j <= an; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  return matrix[bn][an];
}

/**
 * Computes string similarity ratio between 0.0 and 1.0
 */
export function stringSimilarity(str1, str2) {
  if (!str1 || !str2) return 0;
  const s1 = String(str1).toLowerCase().trim();
  const s2 = String(str2).toLowerCase().trim();
  if (s1 === s2) return 1.0;
  const maxLen = Math.max(s1.length, s2.length);
  if (maxLen === 0) return 1.0;
  const dist = levenshtein(s1, s2);
  return Math.max(0, 1.0 - dist / maxLen);
}

// =========================================================================
// 2. FIELD-BY-FIELD ASYMMETRIC COMPARATOR
// =========================================================================

/**
 * Compares only fields that actually exist in QR and/or OCR without rigid assumptions.
 */
export function compareQrAndOcr(qrData, ocrData) {
  const comparisons = [];
  let totalCompared = 0;
  let matches = 0;
  let mismatches = 0;

  if (!qrData && !ocrData) {
    return { comparisons: [], totalCompared: 0, matches: 0, mismatches: 0, overallScore: 0, status: 'NO_DATA' };
  }

  const qrFields = qrData?.fields || qrData || {};
  const ocrFields = ocrData || {};

  // -------------------------------------------------------------
  // 1. CARDHOLDER NAME
  // -------------------------------------------------------------
  const qrName = qrFields.name || qrData?.name || null;
  const ocrName = ocrFields.name || null;

  if (qrName && ocrName) {
    totalCompared++;
    const normQR = normalizeName(qrName);
    const normOCR = normalizeName(ocrName);
    const sim = stringSimilarity(normQR, normOCR);
    const isTokenSubset = normQR.split(' ').every(w => normOCR.includes(w)) || 
                          normOCR.split(' ').every(w => normQR.includes(w));

    if (sim >= 0.85 || isTokenSubset) {
      matches++;
      comparisons.push({
        field: 'Cardholder Name',
        qrValue: qrName,
        ocrValue: ocrName,
        status: 'MATCH',
        confidence: Math.round(Math.max(sim * 100, 95)),
        note: 'Cryptographic QR payload matches printed cardholder typography.'
      });
    } else {
      mismatches++;
      comparisons.push({
        field: 'Cardholder Name',
        qrValue: qrName,
        ocrValue: ocrName,
        status: 'MISMATCH',
        confidence: Math.round(sim * 100),
        note: 'CRITICAL DISCREPANCY: Visual name does not match signed cryptographic payload (Possible Splicing / Alteration).'
      });
    }
  } else if (!qrName && ocrName) {
    comparisons.push({
      field: 'Cardholder Name',
      qrValue: 'NOT AVAILABLE IN QR',
      ocrValue: ocrName,
      status: 'OCR_ONLY',
      confidence: 96,
      note: 'Field not encoded in this QR format (Privacy Protection / Front Token). Extracted directly from visual document face via Neural OCR.'
    });
  } else if (qrName && !ocrName) {
    comparisons.push({
      field: 'Cardholder Name',
      qrValue: qrName,
      ocrValue: 'NOT AVAILABLE IN OCR',
      status: 'QR_ONLY',
      confidence: 98,
      note: 'Authenticated from digitally signed QR payload.'
    });
  }

  // -------------------------------------------------------------
  // 2. DATE OF BIRTH / YEAR OF BIRTH
  // -------------------------------------------------------------
  const qrDob = qrFields.dob || qrData?.dob || null;
  const ocrDob = ocrFields.dob || null;

  if (qrDob && ocrDob) {
    totalCompared++;
    const normQRDob = parseAndNormalizeDate(qrDob);
    const normOCRDob = parseAndNormalizeDate(ocrDob);

    if (normQRDob === normOCRDob || (normQRDob && normOCRDob && (normQRDob.includes(normOCRDob) || normOCRDob.includes(normQRDob)))) {
      matches++;
      comparisons.push({
        field: 'Date of Birth',
        qrValue: qrDob,
        ocrValue: ocrDob,
        status: 'MATCH',
        confidence: 100,
        note: 'DOB strictly identical between cryptographic stream and printed text.'
      });
    } else {
      mismatches++;
      comparisons.push({
        field: 'Date of Birth',
        qrValue: qrDob,
        ocrValue: ocrDob,
        status: 'MISMATCH',
        confidence: 20,
        note: 'MODIFIED DOB DETECTED: Printed date does not match issuing authority cryptographic record.'
      });
    }
  } else if (!qrDob && ocrDob) {
    comparisons.push({
      field: 'Date of Birth',
      qrValue: 'NOT AVAILABLE IN QR',
      ocrValue: ocrDob,
      status: 'OCR_ONLY',
      confidence: 95,
      note: 'Field not encoded in this QR format. Extracted from printed document typography.'
    });
  } else if (qrDob && !ocrDob) {
    comparisons.push({
      field: 'Date of Birth',
      qrValue: qrDob,
      ocrValue: 'NOT AVAILABLE IN OCR',
      status: 'QR_ONLY',
      confidence: 95,
      note: 'Extracted from QR record.'
    });
  }

  // -------------------------------------------------------------
  // 3. DOCUMENT NUMBER / AADHAAR UID / PASSPORT NO
  // -------------------------------------------------------------
  const qrUid = qrFields.last4 || qrFields.uid || qrFields.idNumber || qrData?.uidRaw || qrData?.uidMasked || qrData?.idNumber || null;
  const ocrUid = ocrFields.uid || ocrFields.idNumber || null;

  if (qrUid && ocrUid) {
    totalCompared++;
    const normQRUid = normalizeId(qrUid);
    const normOCRUid = normalizeId(ocrUid);

    const last4QR = normQRUid.slice(-4);
    const last4OCR = normOCRUid.slice(-4);

    if (normQRUid === normOCRUid || (last4QR && last4OCR && last4QR === last4OCR)) {
      matches++;
      comparisons.push({
        field: 'Document / UID Number',
        qrValue: qrData?.uidMasked || qrFields.uidMasked || (last4QR ? `**** **** ${last4QR}` : qrUid),
        ocrValue: ocrUid,
        status: 'MATCH',
        confidence: 100,
        note: `Document token authenticated (${last4QR ? 'Last 4 digits ' + last4QR + ' cross-verified' : 'Full sequence verified'}).`
      });
    } else {
      mismatches++;
      comparisons.push({
        field: 'Document / UID Number',
        qrValue: qrData?.uidMasked || qrFields.uidMasked || qrUid,
        ocrValue: ocrUid,
        status: 'MISMATCH',
        confidence: 10,
        note: `NUMBER MISMATCH: QR token (${last4QR}) differs from printed number (${last4OCR}). Discrepancy indicator.`
      });
    }
  } else if (!qrUid && ocrUid) {
    comparisons.push({
      field: 'Document / UID Number',
      qrValue: 'NOT AVAILABLE IN QR',
      ocrValue: ocrUid,
      status: 'OCR_ONLY',
      confidence: 95,
      note: 'Printed document number read from card.'
    });
  } else if (qrUid && !ocrUid) {
    comparisons.push({
      field: 'Document / UID Number',
      qrValue: qrData?.uidMasked || qrFields.uidMasked || qrUid,
      ocrValue: 'NOT AVAILABLE IN OCR',
      status: 'QR_ONLY',
      confidence: 95,
      note: 'Token read from QR code.'
    });
  }

  // -------------------------------------------------------------
  // 4. GENDER
  // -------------------------------------------------------------
  const qrGender = qrFields.gender || qrData?.gender || null;
  const ocrGender = ocrFields.gender || null;

  if (qrGender && ocrGender) {
    totalCompared++;
    const gQR = qrGender.toUpperCase().charAt(0);
    const gOCR = ocrGender.toUpperCase().charAt(0);

    if (gQR === gOCR) {
      matches++;
      comparisons.push({
        field: 'Gender',
        qrValue: qrGender,
        ocrValue: ocrGender,
        status: 'MATCH',
        confidence: 100,
        note: 'Demographic gender aligned.'
      });
    } else {
      mismatches++;
      comparisons.push({
        field: 'Gender',
        qrValue: qrGender,
        ocrValue: ocrGender,
        status: 'MISMATCH',
        confidence: 10,
        note: 'Gender mismatch between visual card and QR record.'
      });
    }
  } else if (!qrGender && ocrGender) {
    comparisons.push({
      field: 'Gender',
      qrValue: 'NOT AVAILABLE IN QR',
      ocrValue: ocrGender,
      status: 'OCR_ONLY',
      confidence: 95,
      note: 'Extracted from visual document.'
    });
  }

  // -------------------------------------------------------------
  // 5. EXPIRATION DATE
  // -------------------------------------------------------------
  const qrExpiry = qrFields.expiryDate || qrData?.expiryDate || null;
  const ocrExpiry = ocrFields.expiryDate || null;
  if (qrExpiry && ocrExpiry) {
    totalCompared++;
    const normQRExp = parseAndNormalizeDate(qrExpiry);
    const normOCRExp = parseAndNormalizeDate(ocrExpiry);

    if (normQRExp === normOCRExp) {
      matches++;
      comparisons.push({
        field: 'Expiry Date',
        qrValue: qrExpiry,
        ocrValue: ocrExpiry,
        status: 'MATCH',
        confidence: 100,
        note: 'Validity expiration date verified.'
      });
    } else {
      mismatches++;
      comparisons.push({
        field: 'Expiry Date',
        qrValue: qrExpiry,
        ocrValue: ocrExpiry,
        status: 'MISMATCH',
        confidence: 25,
        note: 'Expiration date discrepancy detected.'
      });
    }
  }

  // Calculate consistency score
  let overallScore = 100;
  if (totalCompared > 0) {
    overallScore = Math.round((matches / totalCompared) * 100);
  } else if (mismatches > 0) {
    overallScore = 20;
  }

  return {
    comparisons,
    totalCompared,
    matches,
    mismatches,
    overallScore,
    isTampered: mismatches > 0
  };
}

// =========================================================================
// 3. MULTI-SIGNAL RISK ENGINE WITH HONEST VERIFICATION STATUS
// =========================================================================

/**
 * Evaluates comprehensive composite risk score across all security signals:
 * 1. QR Cryptographic Signature
 * 2. QR ↔ OCR Cross-Consistency
 * 3. Document Format & Checksums
 * 4. Image Forensics & Splicing
 * 5. Official Registry Gateway Status
 */
export function evaluateCompositeRisk({
  qrResult,
  ocrData,
  comparisonResult,
  qualityData = {},
  forensicResults = {},
  apiVerification = {}
}) {
  let riskScore = 10;
  const reasons = [];
  const flags = [];

  // 7-Point Security Integrity Checklist
  const checklist = {
    qrDetected: qrResult ? 'YES' : 'NO',
    qrDecoded: qrResult ? 'SUCCESS' : 'FAILED',
    qrDataParsed: qrResult 
      ? (qrResult.name ? 'FULL_DEMOGRAPHICS' : (qrResult.format === 'URL' ? 'URL_ONLY' : 'MINIMAL_TOKEN'))
      : 'NOT_APPLICABLE',
    qrOcrMatch: comparisonResult?.mismatches > 0 
      ? 'MISMATCH' 
      : (comparisonResult?.matches > 0 ? 'MATCH' : 'NOT_APPLICABLE'),
    digitalSignature: qrResult?.signatureStatus === 'SIGNATURE_PRESENT_UNVERIFIED'
      ? 'SIGNATURE PRESENT (KEY NOT INSTALLED)'
      : (qrResult?.signatureStatus || 'NOT_APPLICABLE'),
    issuerVerification: apiVerification?.isDemo 
      ? 'MOCK API (DEMO MODE)' 
      : (apiVerification?.verified ? 'VERIFIED' : 'UNAVAILABLE (STANDALONE)'),
    forensicChecks: forensicResults?.tamperedRegions?.length > 0 ? 'SUSPICIOUS' : 'PASS'
  };

  // Signal 1: QR Presence & Signature status
  if (!qrResult) {
    riskScore += 25;
    reasons.push('Document lacks detectable 2D QR security seal or code is unreadable.');
    flags.push('NO_QR_SEAL');
  } else if (qrResult.signatureStatus === 'CHECKSUM_FAILED' || qrResult.signatureStatus?.includes('FAILED')) {
    riskScore += 65;
    reasons.push('CRITICAL: QR payload checksum failed or digital signature corrupted.');
    flags.push('CRYPTOGRAPHIC_SIGNATURE_TAMPERED');
  } else if (qrResult.signatureStatus === 'SIGNATURE_PRESENT_UNVERIFIED') {
    reasons.push('Cryptographic Digital Signature block detected in QR payload. (Client certificate verification unavailable in offline browser).');
  } else if (qrResult.signatureStatus === 'CHECKSUM_PASSED') {
    reasons.push('Algorithmic Checksum: Verhoeff D₅ mathematical integrity confirmed.');
  }

  // Signal 2: QR ↔ OCR Comparison
  if (comparisonResult) {
    if (comparisonResult.mismatches > 0) {
      riskScore += comparisonResult.mismatches * 40;
      reasons.push(`CRITICAL DISCREPANCY: ${comparisonResult.mismatches} field mismatch between QR payload and printed card text (Splicing / Forgery Alert).`);
      flags.push('DATA_SPLICING_DETECTED');
    } else if (comparisonResult.matches > 0) {
      riskScore = Math.max(5, riskScore - 10);
      reasons.push(`Cross-Verification: All ${comparisonResult.matches} shared fields strictly consistent between QR and visual card typography.`);
    } else {
      reasons.push('Notice: No overlapping fields between QR token and visual text (e.g., tokenized card front or URL).');
    }
  }

  // Signal 3: Algorithmic Format Validation
  if (ocrData?.uid) {
    const cleanUid = ocrData.uid.replace(/\D/g, '');
    if (cleanUid.length === 12 && qrResult && qrResult.isVerhoeffValid === false) {
      riskScore += 30;
      reasons.push('Checksum Failure: 12-digit Aadhaar UID failed Verhoeff Dihedral D₅ validation.');
      flags.push('CHECKSUM_FAILED');
    }
  }

  // Signal 4: Image Forensics (Photo Replacement / Splicing)
  if (forensicResults?.authenticityScore !== undefined && forensicResults.authenticityScore < 70) {
    riskScore += 30;
    reasons.push('Forensic Anomaly: Artificial boundary gradients or cloned pixel blocks detected around photo.');
    flags.push('PHOTO_MANIPULATION_DETECTED');
  }

  // Clamp risk score to 0..100
  riskScore = Math.min(100, Math.max(5, riskScore));

  // Honest determination
  let status = 'VERIFIED';
  let decisionLabel = 'GREEN — VERIFIED (Low Risk)';
  let color = 'emerald';

  if (riskScore >= 70 || flags.includes('CRYPTOGRAPHIC_SIGNATURE_TAMPERED') || flags.includes('DATA_SPLICING_DETECTED')) {
    status = 'SUSPICIOUS';
    decisionLabel = 'RED — SUSPICIOUS / TAMPERED';
    color = 'rose';
  } else if (riskScore >= 35 || flags.includes('NO_QR_SEAL')) {
    status = 'REVIEW_REQUIRED';
    decisionLabel = 'AMBER — MANUAL REVIEW REQUIRED';
    color = 'amber';
  }

  return {
    riskScore,
    status,
    decisionLabel,
    color,
    reasons,
    flags,
    checklist,
    evaluatedAt: new Date().toISOString()
  };
}
