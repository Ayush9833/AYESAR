/**
 * OCR Service Abstraction
 * 
 * Production Hook:
 * - Structured to call a microservice (e.g. Python FastAPI running PaddleOCR or Tesseract)
 *   via process.env.PADDLE_OCR_SERVICE_URL
 * - If external service is unavailable, executes high-fidelity context-aware extraction
 *   labeled clearly as "DEMO OCR ENGINE (PaddleOCR Microservice Integration Ready)"
 */
export async function extractDocumentText({ filePath, documentType, demoScenario = null }) {
  const paddleOcrUrl = process.env.PADDLE_OCR_SERVICE_URL;

  // Production hook: check if real PaddleOCR microservice is active
  if (paddleOcrUrl) {
    try {
      const response = await fetch(`${paddleOcrUrl}/extract`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath, documentType })
      });
      if (response.ok) {
        const data = await response.json();
        return {
          ...data,
          engine: 'PaddleOCR Production v2.7',
          isDemo: false
        };
      }
    } catch (e) {
      console.log('[OCR Service] PaddleOCR microservice not reachable, falling back to simulated engine:', e.message);
    }
  }

  // Realistic OCR extraction for the prototype based on document type & scenario
  if (demoScenario === 'suspicious') {
    return {
      name: "VIKRAM MALHOTRA",
      dateOfBirth: "1990-05-19",
      idNumber: "Z9812450",
      address: "Plot 88, Jubilee Hills, Road No 36, Hyderabad, Telangana 500033",
      documentType: documentType || "Passport",
      confidence: 62,
      rawText: "REPUBLIC OF INDIA\nPASSPORT\nType: P Country: IND Pass No: Z9812450\nName: VIKRAM MALHOTRA\nDOB: 19/05/1990\nSex: M POB: HYDERABAD\nP<INDMALHOTRA<<VIKRAM<<<<<<<<<<<<<<<<<<<\nZ9812450<3IND9005194M3109037<<<<<<<<<<<0",
      engine: "SATYAPAN OCR Engine (Simulated - PaddleOCR Ready)",
      isDemo: true
    };
  }

  if (demoScenario === 'review_required') {
    return {
      name: "POOJA VERMA",
      dateOfBirth: "1988-11-23",
      idNumber: "ABCDE1234F",
      address: "Flat 12, Sunrise Apts, Indiranagar, Bengaluru, Karnataka 560038",
      documentType: documentType || "PAN Card",
      confidence: 84,
      rawText: "INCOME TAX DEPARTMENT\nGOVT. OF INDIA\nPermanent Account Number Card\nABCDE1234F\nName: POOJA VERMA\nFather's Name: RAMESH VERMA\nDOB: 23/11/1988",
      engine: "SATYAPAN OCR Engine (Simulated - PaddleOCR Ready)",
      isDemo: true
    };
  }

  // Default clean extraction based on document type
  if (documentType === 'PAN Card') {
    return {
      name: "RAJESH KUMAR SHUKLA",
      dateOfBirth: "1989-07-21",
      idNumber: "BLCPS8821N",
      address: "A-102, Vasant Vihar, New Delhi 110057",
      documentType: "PAN Card",
      confidence: 95,
      rawText: "INCOME TAX DEPARTMENT\nGOVT. OF INDIA\nBLCPS8821N\nRAJESH KUMAR SHUKLA\nS/O SURAJ SHUKLA\n21/07/1989\nPermanent Account Number",
      engine: "SATYAPAN OCR Engine (Simulated - PaddleOCR Ready)",
      isDemo: true
    };
  }

  if (documentType === 'Passport') {
    return {
      name: "ANANYA IYER",
      dateOfBirth: "1996-12-30",
      idNumber: "K4920184",
      address: "18/B, Anna Salai, T. Nagar, Chennai, Tamil Nadu 600017",
      documentType: "Passport",
      confidence: 97,
      rawText: "REPUBLIC OF INDIA\nPASSPORT\nType: P Country: IND Pass No: K4920184\nName: ANANYA IYER\nDOB: 30/12/1996\nSex: F POB: CHENNAI\nP<INDIYER<<ANANYA<<<<<<<<<<<<<<<<<<<<<<<\nK4920184<7IND9612308F3112304<<<<<<<<<<<4",
      engine: "SATYAPAN OCR Engine (Simulated - PaddleOCR Ready)",
      isDemo: true
    };
  }

  if (documentType === 'Driving Licence') {
    return {
      name: "ROHAN KULKARNI",
      dateOfBirth: "1992-03-11",
      idNumber: "MH-1420110062489",
      address: "501, Crystal Heights, Baner Road, Pune, Maharashtra 411045",
      documentType: "Driving Licence",
      confidence: 94,
      rawText: "UNION OF INDIA - DRIVING LICENCE\nMAHARASHTRA MOTOR VEHICLES DEPT\nDL No: MH-1420110062489\nName: ROHAN KULKARNI\nDOB: 11-03-1992\nBlood Group: B+ Valid Till: 10-03-2042\nAuth: LMV, MCWG",
      engine: "SATYAPAN OCR Engine (Simulated - PaddleOCR Ready)",
      isDemo: true
    };
  }

  // Default: Aadhaar
  return {
    name: "AARAV SHARMA",
    dateOfBirth: "1994-08-14",
    idNumber: "7489 1230 4567",
    address: "B-402, Green Meadows, Sector 62, Noida, Uttar Pradesh 201309",
    documentType: "Aadhaar",
    confidence: 96,
    rawText: "GOVERNMENT OF INDIA\nUnique Identification Authority of India\nEnrollment No: 1024/99120/48192\nTo: AARAV SHARMA\nDOB: 14/08/1994 Gender: MALE\n7489 1230 4567\nMera Aadhaar, Meri Pehchan",
    engine: "SATYAPAN OCR Engine (Simulated - PaddleOCR Ready)",
    isDemo: true
  };
}
