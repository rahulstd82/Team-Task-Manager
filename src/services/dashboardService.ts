import pool from '../db/client';
import { TaskStatus } from '../models/task';

export interface TaskStatusCounts {
  todo: number;
  in_progress: number;
  done: number;
}

export interface OverdueTask {
  id: string;
  project_id: string;
  assignee_id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  due_date: string;
  status_updated_at: Date;
  created_at: Date;
}

export interface DashboardData {
  task_counts: TaskStatusCounts;
  overdue_tasks: OverdueTask[];
  admin_project_counts?: TaskStatusCounts;
}

/**
 * Aggregate task counts by status for a specific user (tasks assigned to them)
 * Requirements: 7.1
 */
export async function getUserTaskCounts(userId: string): Promise<TaskStatusCounts> {
  const result = await pool.query<{ status: TaskStatus; count: string }>(
    `SELECT status, COUNT(*) as count
     FROM tasks
     WHERE assignee_id = $1
     GROUP BY status`,
    [userId]
  );

  const counts: TaskStatusCounts = { todo: 0, in_progress: 0, done: 0 };

  for (const row of result.rows) {
    counts[row.status as TaskStatus] = parseInt(row.count, 10);
  }

  return counts;
}

/**
 * Return all tasks assigned to a user that are overdue:
 * due_date < today AND status != 'done'
 * Requirements: 7.2
 */
export async function getUserOverdueTasks(userId: string): Promise<OverdueTask[]> {
  const result = await pool.query<OverdueTask>(
    `SELECT id, project_id, assignee_id, title, description, status,
            due_date, status_updated_at, created_at
     FROM tasks
     WHERE assignee_id = $1
       AND due_date < CURRENT_DATE
       AND status != 'done'
     ORDER BY due_date ASC`,
    [userId]
  );

  return result.rows;
}

/**
 * Aggregate task counts across all projects owned by an Admin user
 * Requirements: 7.3
 */
export async function getAdminProjectTaskCounts(userId: string): Promise<TaskStatusCounts> {
  const result = await pool.query<{ status: TaskStatus; count: string }>(
    `SELECT t.status, COUNT(*) as count
     FROM tasks t
     INNER JOIN projects p ON t.project_id = p.id
     WHERE p.owner_id = $1
     GROUP BY t.status`,
    [userId]
  );

  const counts: TaskStatusCounts = { todo: 0, in_progress: 0, done: 0 };

  for (const row of result.rows) {
    counts[row.status as TaskStatus] = parseInt(row.count, 10);
  }

  return counts;
}

/**
 * Build the full dashboard payload for a user.
 * If the user owns any projects (i.e. is an Admin), include admin_project_counts.
 * Requirements: 7.1, 7.2, 7.3, 7.4
 */
export async function getDashboard(userId: string): Promise<DashboardData> {
  const [task_counts, overdue_tasks] = await Promise.all([
    getUserTaskCounts(userId),
    getUserOverdueTasks(userId),
  ]);

  const ownerCheck = await pool.query<{ count: string }>(
    `SELECT COUNT(*) as count FROM projects WHERE owner_id = $1`,
    [userId]
  );

  const isAdmin = parseInt(ownerCheck.rows[0].count, 10) > 0;

  const data: DashboardData = { task_counts, overdue_tasks };

  if (isAdmin) {
    data.admin_project_counts = await getAdminProjectTaskCounts(userId);
  }

  return data;
}
