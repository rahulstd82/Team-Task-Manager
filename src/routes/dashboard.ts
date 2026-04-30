import { Router, Response, NextFunction } from 'express';
import { AuthRequest, authenticateToken } from '../middleware/auth';
import { getDashboard } from '../services/dashboardService';

const router = Router();

/**
 * GET /dashboard
 * Returns task counts by status, overdue tasks, and (for Admins) project-wide counts.
 * Data is scoped strictly to the authenticated user.
 * Requirements: 7.1, 7.2, 7.3, 7.4
 */
router.get('/', authenticateToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const dashboard = await getDashboard(req.user.id);

    res.json(dashboard);
  } catch (error) {
    next(error);
  }
});

export default router;
