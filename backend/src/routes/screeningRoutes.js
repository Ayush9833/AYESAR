import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import {
  processScreeningPipeline,
  getAllScreenings,
  getScreeningById,
  reprocessScreening,
  generateAuditReport
} from '../services/screeningService.js';

const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = path.resolve('uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  }
});

// File validation
const fileFilter = (req, file, cb) => {
  const allowedExts = ['.jpg', '.jpeg', '.png', '.pdf'];
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'application/pdf'];

  if (allowedExts.includes(ext) && (allowedMimeTypes.includes(file.mimetype) || file.mimetype.startsWith('image/'))) {
    cb(null, true);
  } else {
    cb(new Error('Only JPG, JPEG, PNG, and PDF files are allowed for identity verification.'), false);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter
});

// POST /api/screenings
router.post('/', upload.fields([
  { name: 'document', maxCount: 1 },
  { name: 'selfie', maxCount: 1 }
]), async (req, res, next) => {
  try {
    const documentFile = req.files?.document?.[0];
    const selfieFile = req.files?.selfie?.[0];
    const { documentType, demoScenario } = req.body;

    // Check if document was provided or if it's a demo scenario triggering
    if (!documentFile && !demoScenario) {
      return res.status(400).json({
        success: false,
        error: 'Please select an identity document to upload (JPG, PNG, or PDF).',
        code: 'MISSING_DOCUMENT'
      });
    }

    const screening = await processScreeningPipeline({
      file: documentFile,
      selfieFile,
      documentTypeHint: documentType,
      demoScenario
    });

    res.status(201).json({
      success: true,
      screeningId: screening.id,
      status: screening.status,
      riskScore: screening.riskScore,
      data: screening
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/screenings
router.get('/', (req, res, next) => {
  try {
    const { status, search, limit, offset } = req.query;
    const result = getAllScreenings({
      status,
      search,
      limit: limit ? parseInt(limit, 10) : 50,
      offset: offset ? parseInt(offset, 10) : 0
    });

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/screenings/:id
router.get('/:id', (req, res, next) => {
  try {
    const { id } = req.params;
    const screening = getScreeningById(id);

    if (!screening) {
      return res.status(404).json({
        success: false,
        error: `Screening record '${id}' not found.`,
        code: 'NOT_FOUND'
      });
    }

    res.json({
      success: true,
      data: screening
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/screenings/:id/reprocess
router.post('/:id/reprocess', (req, res, next) => {
  try {
    const { id } = req.params;
    const updated = reprocessScreening(id);

    if (!updated) {
      return res.status(404).json({
        success: false,
        error: `Screening record '${id}' not found.`,
        code: 'NOT_FOUND'
      });
    }

    res.json({
      success: true,
      message: 'Screening reprocessed successfully through verification pipeline.',
      data: updated
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/screenings/:id/report
router.post('/:id/report', (req, res, next) => {
  try {
    const { id } = req.params;
    const report = generateAuditReport(id);

    if (!report) {
      return res.status(404).json({
        success: false,
        error: `Screening record '${id}' not found.`,
        code: 'NOT_FOUND'
      });
    }

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    next(error);
  }
});

export default router;
