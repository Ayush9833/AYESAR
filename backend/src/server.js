import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import screeningRoutes from './routes/screeningRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: '*',
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static uploads
const uploadsPath = path.join(__dirname, '../uploads');
app.use('/uploads', express.static(uploadsPath));

// Serve production frontend assets
const frontendDistPath = path.join(__dirname, '../../frontend/dist');
app.use(express.static(frontendDistPath));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    system: 'SATYAPAN AI Screening Platform',
    version: '2.4.0-SIH2026',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    services: {
      imageAnalysis: 'Sharp Active',
      classification: 'Multi-ID Classifier Active',
      ocrEngine: 'PaddleOCR Microservice Integration Ready',
      forensics: 'Multi-Signal Tampering Detector Active',
      biometrics: 'Face Verification & Anti-Spoof Active',
      fraudEngine: 'Multi-Signal Weighted Engine Active'
    }
  });
});

// Mount routes
app.use('/api/screenings', screeningRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Fallback to index.html for Single Page Application client routing
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendDistPath, 'index.html'));
});

// Centralized error handler
app.use(errorHandler);

app.listen(PORT, '0.0.0.0', () => {
  console.log('====================================================');
  console.log(`🛡️  SATYAPAN FULL-STACK SERVER ON PORT ${PORT}`);
  console.log(`📡  Health Check: http://localhost:${PORT}/api/health`);
  console.log(`📊  Dashboard Stats: http://localhost:${PORT}/api/dashboard/stats`);
  console.log(`🔍  Screenings API: http://localhost:${PORT}/api/screenings`);
  console.log('====================================================');
});
