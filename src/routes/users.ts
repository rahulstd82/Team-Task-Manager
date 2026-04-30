import { Router, Response, NextFunction } from 'express';
import { AuthRequest, authenticateToken } from '../middleware/auth';
import { findUserByEmail } from '../models/user';

const router = Router();

/**
 * GET /users/search?email=...
 * Look up a registered user by email (authenticated users only).
 * Returns only public fields — never exposes password_hash.
 */
router.get('/search', authenticateToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const email = (req.query.email as string | undefined)?.trim().toLowerCase();

    if (!email) {
      return res.status(400).json({ error: 'email query parameter is required' });
    }

    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(404).json({ error: 'No user found with that email address' });
    }

    // Return only safe public fields
    res.json({ user: { id: user.id, name: user.name, email: user.email } });
  } catch (error) {
    next(error);
  }
});

export default router;
