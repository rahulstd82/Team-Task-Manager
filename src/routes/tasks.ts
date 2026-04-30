import { Router, Response, NextFunction } from 'express';
import { AuthRequest, authenticateToken } from '../middleware/auth';
import { requireAdmin, requireMember } from '../middleware/rbac';
import { findProjectById } from '../models/project';
import { findMembership } from '../models/membership';
import {
  createTask,
  findTaskById,
  listProjectTasks,
  updateTask,
  TaskStatus,
} from '../models/task';

const router = Router({ mergeParams: true });

const VALID_STATUSES: TaskStatus[] = ['todo', 'in_progress', 'done'];

/**
 * GET /projects/:id/tasks
 * List all tasks for a project
 * Accessible to any project member
 * Requirements: 5.5
 */
router.get(
  '/',
  authenticateToken,
  requireMember,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const tasks = await listProjectTasks(id);

      res.json({ tasks });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /projects/:id/tasks
 * Create a new task (Admin only)
 * Requirements: 5.1, 5.2, 5.3, 5.4
 */
router.post(
  '/',
  authenticateToken,
  requireAdmin,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { title, description, due_date, assignee_id } = req.body;

      // Validate title (Requirements: 5.3)
      if (!title || typeof title !== 'string' || title.trim().length === 0) {
        return res.status(400).json({ error: 'Task title is required', field: 'title' });
      }

      if (title.length > 500) {
        return res.status(400).json({
          error: 'Task title cannot exceed 500 characters',
          field: 'title',
        });
      }

      // Verify project exists
      const project = await findProjectById(id);
      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      // Validate assignee is a project member (Requirements: 5.2)
      if (assignee_id) {
        const membership = await findMembership(id, assignee_id);
        if (!membership) {
          return res.status(400).json({
            error: 'Assignee must be a member of the project',
            field: 'assignee_id',
          });
        }
      }

      const task = await createTask({
        project_id: id,
        title: title.trim(),
        description,
        due_date,
        assignee_id,
      });

      res.status(201).json({ task });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /projects/:id/tasks/:taskId
 * Update a task — Admin can update anything; a Member can only update status
 * of tasks assigned to them.
 * Requirements: 5.1, 5.2, 5.3, 6.1, 6.2, 6.3, 6.4
 */
router.put(
  '/:taskId',
  authenticateToken,
  requireMember,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id, taskId } = req.params;
      const { title, description, due_date, assignee_id, status } = req.body;

      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      // Verify project exists
      const project = await findProjectById(id);
      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      // Verify task exists and belongs to this project
      const task = await findTaskById(taskId);
      if (!task || task.project_id !== id) {
        return res.status(404).json({ error: 'Task not found' });
      }

      // Determine caller's role in this project
      const membership = await findMembership(id, req.user.id);
      if (!membership) {
        return res.status(403).json({ error: 'Access denied: not a project member' });
      }

      const isAdmin = membership.role === 'admin';

      // Members can only update status of tasks assigned to them (Requirements: 6.2, 6.3)
      if (!isAdmin) {
        if (task.assignee_id !== req.user.id) {
          return res.status(403).json({
            error: 'Access denied: you can only update tasks assigned to you',
          });
        }

        // Members may only change status — reject any other field updates
        const nonStatusFields = [title, description, due_date, assignee_id].filter(
          (v) => v !== undefined
        );
        if (nonStatusFields.length > 0) {
          return res.status(403).json({
            error: 'Access denied: members can only update task status',
          });
        }
      }

      // Validate status if provided (Requirements: 6.4)
      if (status !== undefined && !VALID_STATUSES.includes(status)) {
        return res.status(400).json({
          error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`,
          field: 'status',
        });
      }

      // Validate title if provided (Requirements: 5.3)
      if (title !== undefined) {
        if (typeof title !== 'string' || title.trim().length === 0) {
          return res.status(400).json({ error: 'Task title cannot be empty', field: 'title' });
        }
        if (title.length > 500) {
          return res.status(400).json({
            error: 'Task title cannot exceed 500 characters',
            field: 'title',
          });
        }
      }

      // Validate new assignee is a project member (Requirements: 5.2)
      if (assignee_id !== undefined && assignee_id !== null) {
        const assigneeMembership = await findMembership(id, assignee_id);
        if (!assigneeMembership) {
          return res.status(400).json({
            error: 'Assignee must be a member of the project',
            field: 'assignee_id',
          });
        }
      }

      const updated = await updateTask(taskId, {
        title: title !== undefined ? title.trim() : undefined,
        description,
        due_date,
        assignee_id,
        status,
      });

      res.json({ task: updated });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
