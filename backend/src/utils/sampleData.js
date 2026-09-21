export const initialScreenings = [
  {
    id: "VS-2026-1248",
    createdAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    documentType: "Aadhaar",
    applicantName: "Aarav Sharma",
    dateOfBirth: "1994-08-14",
    idNumber: "7489 1230 4567",
    address: "B-402, Green Meadows, Sector 62, Noida, Uttar Pradesh 201309",
    status: "VERIFIED",
    riskScore: 16,
    confidence: 96,
    qualityScore: 94,
    faceMatchScore: 97,
    livenessScore: 99,
    authenticityScore: 96,
    livenessStatus: "PASS",
    fileName: "aadhaar_aarav_sharma.png",
    fileSize: "1.84 MB",
    dimensions: "1920x1080",
    validationResults: {
      valid: true,
      passedChecks: [
        { name: "Aadhaar 12-Digit Format", status: "PASS", detail: "Format conforms to UIDAI 12-digit standard" },
        { name: "Date of Birth Sanity", status: "PASS", detail: "Age calculated: 31 years (Valid adult ID)" },
        { name: "Mandatory Fields Present", status: "PASS", detail: "Name, DOB, UID number, and Address present" },
        { name: "Cross-Field Integrity", status: "PASS", detail: "Name spelling consistent across OCR and digital bar" }
      ],
      warnings: [],
      failedChecks: []
    },
    forensicResults: {
      authenticityScore: 96,
      checks: [
        { name: "Copy-Paste Detection", status: "PASS", detail: "No duplicated micro-textures or cloned blocks found" },
        { name: "Font Consistency & Glyph Analysis", status: "PASS", detail: "Uniform standard font kerning & baseline alignment" },
        { name: "Image Splicing & Edge Artifacts", status: "PASS", detail: "Smooth gradient transitions; no high-contrast edge splices" },
        { name: "Compression Analysis", status: "PASS", detail: "Single JPEG compression grid without re-quantization anomalies" },
        { name: "Edited Region Heatmap", status: "PASS", detail: "No localized tampering heat clusters detected" },
        { name: "EXIF & Metadata Integrity", status: "PASS", detail: "Original camera capture metadata intact; no editing software signatures" }
      ],
      tamperedRegions: []
    },
    faceResults: {
      documentFaceDetected: true,
      liveFaceDetected: true,
      faceMatchScore: 97,
      livenessScore: 99,
      livenessStatus: "PASS",
      blinkDetected: true,
      motionTextureScore: 98,
      status: "VERIFIED"
    },
    riskBreakdown: [
      { factor: "Image Quality", weight: "10%", score: 94, contribution: "Low Risk", status: "PASS" },
      { factor: "OCR Confidence", weight: "15%", score: 96, contribution: "Low Risk", status: "PASS" },
      { factor: "Data Validation", weight: "20%", score: 100, contribution: "Low Risk", status: "PASS" },
      { factor: "Image Forensics", weight: "25%", score: 96, contribution: "Low Risk", status: "PASS" },
      { factor: "Face Match", weight: "20%", score: 97, contribution: "Low Risk", status: "PASS" },
      { factor: "Liveness Check", weight: "10%", score: 99, contribution: "Low Risk", status: "PASS" }
    ],
    reasons: [
      "All security parameters passed without anomaly",
      "Document format matches UIDAI security baseline",
      "High biometrics correlation (97% face match, 99% active liveness)"
    ]
  },
  {
    id: "VS-2026-1247",
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    documentType: "PAN Card",
    applicantName: "Pooja Verma",
    dateOfBirth: "1988-11-23",
    idNumber: "ABCDE1234F",
    address: "Flat 12, Sunrise Apts, Indiranagar, Bengaluru, Karnataka 560038",
    status: "REVIEW REQUIRED",
    riskScore: 54,
    confidence: 84,
    qualityScore: 82,
    faceMatchScore: 88,
    livenessScore: 91,
    authenticityScore: 68,
    livenessStatus: "PASS",
    fileName: "pan_pooja_verma.jpg",
    fileSize: "920 KB",
    dimensions: "1280x720",
    validationResults: {
      valid: true,
      passedChecks: [
        { name: "PAN 10-Character Structure", status: "PASS", detail: "Matches standard [A-Z]{5}[0-9]{4}[A-Z]" },
        { name: "Date of Birth Sanity", status: "PASS", detail: "Age calculated: 37 years" },
        { name: "Tax Category Identifier", status: "PASS", detail: "4th letter 'P' denotes Individual" }
      ],
      warnings: [
        { name: "Minor Font Kerning Anomaly", status: "WARNING", detail: "Slight pixel spacing discrepancy in Year of Birth" }
      ],
      failedChecks: []
    },
    forensicResults: {
      authenticityScore: 68,
      checks: [
        { name: "Copy-Paste Detection", status: "PASS", detail: "No cloned pixel regions detected" },
        { name: "Font Consistency & Glyph Analysis", status: "WARNING", detail: "Year '1988' rendered with slightly thicker stroke width than baseline" },
        { name: "Image Splicing & Edge Artifacts", status: "WARNING", detail: "Minor gradient boundary difference around DOB box" },
        { name: "Compression Analysis", status: "PASS", detail: "Uniform quantization table" },
        { name: "Edited Region Heatmap", status: "WARNING", detail: "Mild variance cluster in DOB field region" },
        { name: "EXIF & Metadata Integrity", status: "PASS", detail: "No overt image editing software tags" }
      ],
      tamperedRegions: [
        { x: 210, y: 140, width: 85, height: 28, label: "DOB Font Variance" }
      ]
    },
    faceResults: {
      documentFaceDetected: true,
      liveFaceDetected: true,
      faceMatchScore: 88,
      livenessScore: 91,
      livenessStatus: "PASS",
      blinkDetected: true,
      motionTextureScore: 89,
      status: "REVIEW REQUIRED"
    },
    riskBreakdown: [
      { factor: "Image Quality", weight: "10%", score: 82, contribution: "Low Risk", status: "PASS" },
      { factor: "OCR Confidence", weight: "15%", score: 84, contribution: "Medium Risk", status: "WARNING" },
      { factor: "Data Validation", weight: "20%", score: 80, contribution: "Medium Risk", status: "WARNING" },
      { factor: "Image Forensics", weight: "25%", score: 68, contribution: "Moderate Risk", status: "WARNING" },
      { factor: "Face Match", weight: "20%", score: 88, contribution: "Low Risk", status: "PASS" },
      { factor: "Liveness Check", weight: "10%", score: 91, contribution: "Low Risk", status: "PASS" }
    ],
    reasons: [
      "Font stroke inconsistency identified in Date of Birth section",
      "Minor edge gradient discrepancy around DOB bounding box",
      "Manual verification advised to rule out digital tampering"
    ]
  },
  {
    id: "VS-2026-1246",
    createdAt: new Date(Date.now() - 1000 * 60 * 110).toISOString(),
    documentType: "Passport",
    applicantName: "Vikram Malhotra",
    dateOfBirth: "1990-05-19",
    idNumber: "Z9812450",
    address: "Plot 88, Jubilee Hills, Road No 36, Hyderabad, Telangana 500033",
    status: "SUSPICIOUS",
    riskScore: 86,
    confidence: 62,
    qualityScore: 58,
    faceMatchScore: 38,
    livenessScore: 42,
    authenticityScore: 28,
    livenessStatus: "FAIL",
    fileName: "passport_forged_vikram.jpg",
    fileSize: "2.4 MB",
    dimensions: "1600x1200",
    validationResults: {
      valid: false,
      passedChecks: [
        { name: "Mandatory Fields Present", status: "PASS", detail: "Fields extracted" }
      ],
      warnings: [
        { name: "MRZ Checksum Mismatch", status: "WARNING", detail: "Machine Readable Zone checksum does not match visible passport number" }
      ],
      failedChecks: [
        { name: "ID Number Checksum", status: "FAIL", detail: "Passport number failed ICAO 9303 modulo-7 validation" },
        { name: "Cross-Field Consistency", status: "FAIL", detail: "Nationality country code mismatch between visual and MRZ" }
      ]
    },
    forensicResults: {
      authenticityScore: 28,
      checks: [
        { name: "Copy-Paste Detection", status: "FAIL", detail: "Cloned pixel block detected over passport photo zone" },
        { name: "Font Consistency & Glyph Analysis", status: "FAIL", detail: "Non-standard font glyphs detected; mismatched anti-aliasing" },
        { name: "Image Splicing & Edge Artifacts", status: "FAIL", detail: "Severe high-frequency gradient discontinuities along photo edge" },
        { name: "Compression Analysis", status: "FAIL", detail: "Dual JPEG quantization tables indicate re-saved spliced image" },
        { name: "Edited Region Heatmap", status: "FAIL", detail: "High-intensity anomaly clusters in portrait and number areas" },
        { name: "EXIF & Metadata Integrity", status: "FAIL", detail: "Adobe Photoshop CS6 software tag identified in EXIF header" }
      ],
      tamperedRegions: [
        { x: 45, y: 80, width: 130, height: 160, label: "Photo Splicing Artifact" },
        { x: 310, y: 70, width: 110, height: 35, label: "Re-quantized Document Number" }
      ]
    },
    faceResults: {
      documentFaceDetected: true,
      liveFaceDetected: true,
      faceMatchScore: 38,
      livenessScore: 42,
      livenessStatus: "FAIL",
      blinkDetected: false,
      motionTextureScore: 35,
      status: "SUSPICIOUS"
    },
    riskBreakdown: [
      { factor: "Image Quality", weight: "10%", score: 58, contribution: "Medium Risk", status: "WARNING" },
      { factor: "OCR Confidence", weight: "15%", score: 62, contribution: "High Risk", status: "FAIL" },
      { factor: "Data Validation", weight: "20%", score: 25, contribution: "Critical Risk", status: "FAIL" },
      { factor: "Image Forensics", weight: "25%", score: 28, contribution: "Critical Risk", status: "FAIL" },
      { factor: "Face Match", weight: "20%", score: 38, contribution: "Critical Risk", status: "FAIL" },
      { factor: "Liveness Check", weight: "10%", score: 42, contribution: "Critical Risk", status: "FAIL" }
    ],
    reasons: [
      "Photo replacement / splicing detected with high-frequency edge anomalies",
      "Dual JPEG compression grids confirm digital manipulation",
      "Facial biometric match score (38%) far below safety threshold (75%)",
      "Liveness verification failed: potential 2D screen playback or printed photo presentation"
    ]
  },
  {
    id: "VS-2026-1245",
    createdAt: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
    documentType: "Driving Licence",
    applicantName: "Rohan Kulkarni",
    dateOfBirth: "1992-03-11",
    idNumber: "MH-1420110062489",
    address: "501, Crystal Heights, Baner Road, Pune, Maharashtra 411045",
    status: "VERIFIED",
    riskScore: 21,
    confidence: 94,
    qualityScore: 91,
    faceMatchScore: 95,
    livenessScore: 97,
    authenticityScore: 94,
    livenessStatus: "PASS",
    fileName: "dl_rohan_kulkarni.jpg",
    fileSize: "1.42 MB",
    dimensions: "1800x1100",
    validationResults: {
      valid: true,
      passedChecks: [
        { name: "Driving Licence Standard Format", status: "PASS", detail: "Matches Sarathi Parivahan standard: State + RTO + Year + 7 digits" },
        { name: "Date of Birth Sanity", status: "PASS", detail: "Age calculated: 34 years" },
        { name: "Mandatory Fields Present", status: "PASS", detail: "Name, Issue Date, Blood Group, Validity all extracted" }
      ],
      warnings: [],
      failedChecks: []
    },
    forensicResults: {
      authenticityScore: 94,
      checks: [
        { name: "Copy-Paste Detection", status: "PASS", detail: "Clean pixel texture without duplication" },
        { name: "Font Consistency & Glyph Analysis", status: "PASS", detail: "Matches state transport department standard font set" },
        { name: "Image Splicing & Edge Artifacts", status: "PASS", detail: "Seamless micro-print guilloche pattern intact" },
        { name: "Compression Analysis", status: "PASS", detail: "Consistent standard JPEG compression" },
        { name: "Edited Region Heatmap", status: "PASS", detail: "Uniform zero-variance background" },
        { name: "EXIF & Metadata Integrity", status: "PASS", detail: "Native camera metadata confirmed" }
      ],
      tamperedRegions: []
    },
    faceResults: {
      documentFaceDetected: true,
      liveFaceDetected: true,
      faceMatchScore: 95,
      livenessScore: 97,
      livenessStatus: "PASS",
      blinkDetected: true,
      motionTextureScore: 96,
      status: "VERIFIED"
    },
    riskBreakdown: [
      { factor: "Image Quality", weight: "10%", score: 91, contribution: "Low Risk", status: "PASS" },
      { factor: "OCR Confidence", weight: "15%", score: 94, contribution: "Low Risk", status: "PASS" },
      { factor: "Data Validation", weight: "20%", score: 98, contribution: "Low Risk", status: "PASS" },
      { factor: "Image Forensics", weight: "25%", score: 94, contribution: "Low Risk", status: "PASS" },
      { factor: "Face Match", weight: "20%", score: 95, contribution: "Low Risk", status: "PASS" },
      { factor: "Liveness Check", weight: "10%", score: 97, contribution: "Low Risk", status: "PASS" }
    ],
    reasons: [
      "All security parameters passed without anomaly",
      "Document format matches MoRTH Parivahan standard",
      "Biometrics and active liveness verification confirmed"
    ]
  },
  {
    id: "VS-2026-1244",
    createdAt: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
    documentType: "Aadhaar",
    applicantName: "Sneha Patel",
    dateOfBirth: "1997-09-05",
    idNumber: "5124 9901 3245",
    address: "14, Shanti Nagar, SG Highway, Ahmedabad, Gujarat 380054",
    status: "VERIFIED",
    riskScore: 24,
    confidence: 93,
    qualityScore: 89,
    faceMatchScore: 92,
    livenessScore: 94,
    authenticityScore: 93,
    livenessStatus: "PASS",
    fileName: "aadhaar_sneha_patel.jpg",
    fileSize: "1.65 MB",
    dimensions: "1920x1080",
    validationResults: {
      valid: true,
      passedChecks: [
        { name: "Aadhaar 12-Digit Format", status: "PASS", detail: "Format conforms to UIDAI standard" },
        { name: "Date of Birth Sanity", status: "PASS", detail: "Age calculated: 28 years" },
        { name: "Mandatory Fields Present", status: "PASS", detail: "Full identity record extracted" }
      ],
      warnings: [],
      failedChecks: []
    },
    forensicResults: {
      authenticityScore: 93,
      checks: [
        { name: "Copy-Paste Detection", status: "PASS", detail: "Clean" },
        { name: "Font Consistency & Glyph Analysis", status: "PASS", detail: "Consistent" },
        { name: "Image Splicing & Edge Artifacts", status: "PASS", detail: "Consistent" },
        { name: "Compression Analysis", status: "PASS", detail: "Consistent" },
        { name: "Edited Region Heatmap", status: "PASS", detail: "Clean" },
        { name: "EXIF & Metadata Integrity", status: "PASS", detail: "Valid camera metadata" }
      ],
      tamperedRegions: []
    },
    faceResults: {
      documentFaceDetected: true,
      liveFaceDetected: true,
      faceMatchScore: 92,
      livenessScore: 94,
      livenessStatus: "PASS",
      blinkDetected: true,
      motionTextureScore: 93,
      status: "VERIFIED"
    },
    riskBreakdown: [
      { factor: "Image Quality", weight: "10%", score: 89, contribution: "Low Risk", status: "PASS" },
      { factor: "OCR Confidence", weight: "15%", score: 93, contribution: "Low Risk", status: "PASS" },
      { factor: "Data Validation", weight: "20%", score: 96, contribution: "Low Risk", status: "PASS" },
      { factor: "Image Forensics", weight: "25%", score: 93, contribution: "Low Risk", status: "PASS" },
      { factor: "Face Match", weight: "20%", score: 92, contribution: "Low Risk", status: "PASS" },
      { factor: "Liveness Check", weight: "10%", score: 94, contribution: "Low Risk", status: "PASS" }
    ],
    reasons: [
      "Official document layout validated",
      "No digital forensic anomalies detected"
    ]
  },
  {
    id: "VS-2026-1243",
    createdAt: new Date(Date.now() - 1000 * 60 * 500).toISOString(),
    documentType: "PAN Card",
    applicantName: "Aditya Nair",
    dateOfBirth: "1985-02-17",
    idNumber: "BNZPN4492K",
    address: "House 24, Marine Drive, Kochi, Kerala 682011",
    status: "SUSPICIOUS",
    riskScore: 78,
    confidence: 68,
    qualityScore: 65,
    faceMatchScore: 44,
    livenessScore: 50,
    authenticityScore: 35,
    livenessStatus: "FAIL",
    fileName: "pan_manipulated_aditya.jpg",
    fileSize: "1.1 MB",
    dimensions: "1280x720",
    validationResults: {
      valid: false,
      passedChecks: [
        { name: "Mandatory Fields Present", status: "PASS", detail: "Basic fields extracted" }
      ],
      warnings: [],
      failedChecks: [
        { name: "PAN 4th Character Check", status: "FAIL", detail: "4th character 'P' indicates individual but name structure indicates non-person entity mismatch" }
      ]
    },
    forensicResults: {
      authenticityScore: 35,
      checks: [
        { name: "Copy-Paste Detection", status: "FAIL", detail: "Cloned background micro-pattern covering original signature" },
        { name: "Font Consistency & Glyph Analysis", status: "FAIL", detail: "Font mismatch in ID number sequence: digits 4 and 9 use Arial instead of OCR-B" },
        { name: "Image Splicing & Edge Artifacts", status: "FAIL", detail: "Ghost haloing detected around applicant photo frame" },
        { name: "Compression Analysis", status: "WARNING", detail: "Inconsistent block DCT coefficients" },
        { name: "Edited Region Heatmap", status: "FAIL", detail: "Strong anomaly cluster in signature and photo boxes" },
        { name: "EXIF & Metadata Integrity", status: "FAIL", detail: "Software tag indicates GNU Image Manipulation Program (GIMP 2.10)" }
      ],
      tamperedRegions: [
        { x: 190, y: 110, width: 140, height: 35, label: "Font Type Mismatch (Arial vs OCR-B)" },
        { x: 320, y: 220, width: 100, height: 45, label: "Signature Cloned Patch" }
      ]
    },
    faceResults: {
      documentFaceDetected: true,
      liveFaceDetected: true,
      faceMatchScore: 44,
      livenessScore: 50,
      livenessStatus: "FAIL",
      blinkDetected: false,
      motionTextureScore: 40,
      status: "SUSPICIOUS"
    },
    riskBreakdown: [
      { factor: "Image Quality", weight: "10%", score: 65, contribution: "Medium Risk", status: "WARNING" },
      { factor: "OCR Confidence", weight: "15%", score: 68, contribution: "High Risk", status: "FAIL" },
      { factor: "Data Validation", weight: "20%", score: 40, contribution: "Critical Risk", status: "FAIL" },
      { factor: "Image Forensics", weight: "25%", score: 35, contribution: "Critical Risk", status: "FAIL" },
      { factor: "Face Match", weight: "20%", score: 44, contribution: "Critical Risk", status: "FAIL" },
      { factor: "Liveness Check", weight: "10%", score: 50, contribution: "High Risk", status: "FAIL" }
    ],
    reasons: [
      "Font typeface mismatch detected: standard OCR-B replaced with Arial in ID number",
      "Cloned micro-pattern detected over signature area",
      "GIMP image manipulation signature detected in metadata",
      "Facial match and liveness checks failed"
    ]
  },
  {
    id: "VS-2026-1242",
    createdAt: new Date(Date.now() - 1000 * 60 * 720).toISOString(),
    documentType: "Passport",
    applicantName: "Ananya Iyer",
    dateOfBirth: "1996-12-30",
    idNumber: "K4920184",
    address: "18/B, Anna Salai, T. Nagar, Chennai, Tamil Nadu 600017",
    status: "VERIFIED",
    riskScore: 19,
    confidence: 97,
    qualityScore: 95,
    faceMatchScore: 98,
    livenessScore: 99,
    authenticityScore: 97,
    livenessStatus: "PASS",
    fileName: "passport_ananya_iyer.png",
    fileSize: "2.1 MB",
    dimensions: "2048x1536",
    validationResults: {
      valid: true,
      passedChecks: [
        { name: "Passport Number Format", status: "PASS", detail: "Matches standard [A-Z][0-9]{7}" },
        { name: "MRZ Checksum Modulo-7", status: "PASS", detail: "ICAO 9303 checksum verified" },
        { name: "Date of Birth Sanity", status: "PASS", detail: "Age calculated: 29 years" }
      ],
      warnings: [],
      failedChecks: []
    },
    forensicResults: {
      authenticityScore: 97,
      checks: [
        { name: "Copy-Paste Detection", status: "PASS", detail: "Clean" },
        { name: "Font Consistency & Glyph Analysis", status: "PASS", detail: "Clean" },
        { name: "Image Splicing & Edge Artifacts", status: "PASS", detail: "Clean" },
        { name: "Compression Analysis", status: "PASS", detail: "Clean" },
        { name: "Edited Region Heatmap", status: "PASS", detail: "Clean" },
        { name: "EXIF & Metadata Integrity", status: "PASS", detail: "Clean" }
      ],
      tamperedRegions: []
    },
    faceResults: {
      documentFaceDetected: true,
      liveFaceDetected: true,
      faceMatchScore: 98,
      livenessScore: 99,
      livenessStatus: "PASS",
      blinkDetected: true,
      motionTextureScore: 98,
      status: "VERIFIED"
    },
    riskBreakdown: [
      { factor: "Image Quality", weight: "10%", score: 95, contribution: "Low Risk", status: "PASS" },
      { factor: "OCR Confidence", weight: "15%", score: 97, contribution: "Low Risk", status: "PASS" },
      { factor: "Data Validation", weight: "20%", score: 100, contribution: "Low Risk", status: "PASS" },
      { factor: "Image Forensics", weight: "25%", score: 97, contribution: "Low Risk", status: "PASS" },
      { factor: "Face Match", weight: "20%", score: 98, contribution: "Low Risk", status: "PASS" },
      { factor: "Liveness Check", weight: "10%", score: 99, contribution: "Low Risk", status: "PASS" }
    ],
    reasons: [
      "All security parameters passed without anomaly",
      "ICAO 9303 MRZ verification passed",
      "Near-perfect facial biometric correlation (98%)"
    ]
  }
];
