import { Router, Response, NextFunction } from 'express';
import { AuthRequest, authenticateToken } from '../middleware/auth';
import { requireAdmin } from '../middleware/rbac';
import {
  createProject,
  findProjectById,
  updateProject,
  deleteProject,
  listUserProjects,
} from '../models/project';

const router = Router();

/**
 * GET /projects
 * List all projects the authenticated user belongs to
 * Requirements: 3.5
 */
router.get('/', authenticateToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const projects = await listUserProjects(req.user.id);
    
    res.json({ projects });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /projects
 * Create a new project (Admin only - user becomes admin of their own project)
 * Requirements: 3.1, 3.4, 3.6
 */
router.post('/', authenticateToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { name, description } = req.body;
    
    // Validate required fields
    if (!name) {
      return res.status(400).json({ error: 'Project name is required', field: 'name' });
    }
    
    // Validate name length (Requirements: 3.6)
    if (name.length === 0) {
      return res.status(400).json({ error: 'Project name cannot be empty', field: 'name' });
    }
    
    if (name.length > 200) {
      return res.status(400).json({ 
        error: 'Project name cannot exceed 200 characters', 
        field: 'name' 
      });
    }
    
    // Create project with the authenticated user as owner
    const project = await createProject({
      name,
      description,
      owner_id: req.user.id,
    });
    
    res.status(201).json({ project });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /projects/:id
 * Update a project (Admin only)
 * Requirements: 3.2, 3.4, 3.6
 */
router.put('/:id', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    
    // Validate name if provided (Requirements: 3.6)
    if (name !== undefined) {
      if (name.length === 0) {
        return res.status(400).json({ error: 'Project name cannot be empty', field: 'name' });
      }
      
      if (name.length > 200) {
        return res.status(400).json({ 
          error: 'Project name cannot exceed 200 characters', 
          field: 'name' 
        });
      }
    }
    
    // Check if project exists
    const existingProject = await findProjectById(id);
    if (!existingProject) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Update project
    const project = await updateProject(id, { name, description });
    
    res.json({ project });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /projects/:id
 * Delete a project (Admin only)
 * Cascade deletes all associated tasks
 * Requirements: 3.3, 3.4
 */
router.delete('/:id', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    // Check if project exists
    const existingProject = await findProjectById(id);
    if (!existingProject) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Delete project (cascade deletes tasks via database constraint)
    const deleted = await deleteProject(id);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
