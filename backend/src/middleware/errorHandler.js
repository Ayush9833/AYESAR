export function errorHandler(err, req, res, next) {
  console.error('[SATYAPAN Error]', err);

  // Multer error handling
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      error: 'File size exceeds allowed limit. Please upload a document smaller than 10MB.',
      code: 'FILE_TOO_LARGE'
    });
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({
      success: false,
      error: 'Unexpected file field in upload request.',
      code: 'UNEXPECTED_FIELD'
    });
  }

  if (err.message && err.message.includes('Only JPG, JPEG, PNG, and PDF files are allowed')) {
    return res.status(400).json({
      success: false,
      error: err.message,
      code: 'INVALID_FILE_TYPE'
    });
  }

  // Generic sanitized error
  const statusCode = err.status || 500;
  const userMessage = err.userMessage || 'Unable to process this document. Please upload a clear JPG, PNG or supported PDF.';

  res.status(statusCode).json({
    success: false,
    error: userMessage,
    code: err.code || 'INTERNAL_PROCESSING_ERROR'
  });
}
