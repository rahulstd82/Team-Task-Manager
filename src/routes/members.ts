import { Router, Response, NextFunction } from 'express';
import { AuthRequest, authenticateToken } from '../middleware/auth';
import { requireAdmin, requireMember } from '../middleware/rbac';
import { findProjectById } from '../models/project';
import { findUserById } from '../models/user';
import {
  addMember,
  removeMember,
  listProjectMembers,
  findMembership,
} from '../models/membership';

const router = Router({ mergeParams: true });

/**
 * GET /projects/:id/members
 * List all members of a project
 * Accessible to any project member
 * Requirements: 4.6
 */
router.get(
  '/',
  authenticateToken,
  requireMember,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const members = await listProjectMembers(id);

      res.json({ members });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /projects/:id/members
 * Add a user to a project (Admin only)
 * Requirements: 4.1, 4.3, 4.4, 4.5
 */
router.post(
  '/',
  authenticateToken,
  requireAdmin,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { userId } = req.body;

      if (!userId) {
        return res.status(400).json({ error: 'userId is required', field: 'userId' });
      }

      // Verify project exists
      const project = await findProjectById(id);
      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      // Verify the user to be added exists (Requirements: 4.5)
      const user = await findUserById(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Check for duplicate membership (Requirements: 4.4)
      const existing = await findMembership(id, userId);
      if (existing) {
        return res.status(409).json({ error: 'User is already a member of this project' });
      }

      const membership = await addMember(id, userId, 'member');

      res.status(201).json({ membership });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /projects/:id/members/:userId
 * Remove a user from a project (Admin only)
 * Requirements: 4.2, 4.3
 */
router.delete(
  '/:userId',
  authenticateToken,
  requireAdmin,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id, userId } = req.params;

      // Verify project exists
      const project = await findProjectById(id);
      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      // Verify membership exists
      const existing = await findMembership(id, userId);
      if (!existing) {
        return res.status(404).json({ error: 'Membership not found' });
      }

      await removeMember(id, userId);

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
);

export default router;
