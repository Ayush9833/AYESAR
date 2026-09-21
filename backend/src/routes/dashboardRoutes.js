import express from 'express';
import { getDashboardStats } from '../services/screeningService.js';

const router = express.Router();

// GET /api/dashboard/stats
router.get('/stats', (req, res, next) => {
  try {
    const stats = getDashboardStats();
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
});

export default router;
