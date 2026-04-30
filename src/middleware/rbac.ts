import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import pool from '../db/client';

export type ProjectRole = 'admin' | 'member';

interface Membership {
  id: string;
  project_id: string;
  user_id: string;
  role: ProjectRole;
  joined_at: Date;
}

/**
 * Check if user has a specific role for a project
 */
async function getUserProjectRole(
  userId: string,
  projectId: string
): Promise<ProjectRole | null> {
  const result = await pool.query<Membership>(
    `SELECT role FROM memberships
     WHERE user_id = $1 AND project_id = $2`,
    [userId, projectId]
  );
  
  return result.rows[0]?.role || null;
}

/**
 * Middleware factory to require a specific minimum role for a project
 * Checks if user is Admin or Member for the project specified in req.params.id
 * Returns 403 for insufficient permissions
 * 
 * Requirements: 3.4, 4.3, 5.4
 */
export function requireProjectRole(minimumRole: ProjectRole) {
  return async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    // User must be authenticated (should be enforced by authenticateToken middleware)
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    
    // Extract project ID from route params
    const projectId = req.params.id || req.params.projectId;
    
    if (!projectId) {
      res.status(400).json({ error: 'Project ID is required' });
      return;
    }
    
    try {
      // Get user's role for this project
      const userRole = await getUserProjectRole(req.user.id, projectId);
      
      // User is not a member of this project
      if (!userRole) {
        res.status(403).json({ error: 'Access denied: not a project member' });
        return;
      }
      
      // Check if user has sufficient permissions
      if (minimumRole === 'admin' && userRole !== 'admin') {
        res.status(403).json({ error: 'Access denied: admin role required' });
        return;
      }
      
      // User has sufficient permissions (either admin required and user is admin,
      // or member required and user is member or admin)
      next();
    } catch (error) {
      res.status(500).json({ error: 'Failed to verify permissions' });
      return;
    }
  };
}

/**
 * Middleware to require admin role for a project
 */
export const requireAdmin = requireProjectRole('admin');

/**
 * Middleware to require at least member role for a project
 */
export const requireMember = requireProjectRole('member');
