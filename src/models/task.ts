import pool from '../db/client';

export type TaskStatus = 'todo' | 'in_progress' | 'done';

export interface Task {
  id: string;
  project_id: string;
  assignee_id: string | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  due_date: string | null;
  status_updated_at: Date;
  created_at: Date;
}

export interface CreateTaskInput {
  project_id: string;
  title: string;
  description?: string;
  due_date?: string;
  assignee_id?: string;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  due_date?: string | null;
  assignee_id?: string | null;
  status?: TaskStatus;
}

/**
 * Create a new task with default status 'todo'
 * Requirements: 5.1
 */
export async function createTask(input: CreateTaskInput): Promise<Task> {
  const result = await pool.query<Task>(
    `INSERT INTO tasks (project_id, title, description, due_date, assignee_id)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, project_id, assignee_id, title, description, status,
               due_date, status_updated_at, created_at`,
    [
      input.project_id,
      input.title,
      input.description || null,
      input.due_date || null,
      input.assignee_id || null,
    ]
  );

  return result.rows[0];
}

/**
 * Find a task by ID
 */
export async function findTaskById(id: string): Promise<Task | null> {
  const result = await pool.query<Task>(
    `SELECT id, project_id, assignee_id, title, description, status,
            due_date, status_updated_at, created_at
     FROM tasks
     WHERE id = $1`,
    [id]
  );

  return result.rows[0] || null;
}

/**
 * List all tasks for a project
 * Requirements: 5.5
 */
export async function listProjectTasks(projectId: string): Promise<Task[]> {
  const result = await pool.query<Task>(
    `SELECT id, project_id, assignee_id, title, description, status,
            due_date, status_updated_at, created_at
     FROM tasks
     WHERE project_id = $1
     ORDER BY created_at ASC`,
    [projectId]
  );

  return result.rows;
}

/**
 * Update a task's fields. When status changes, status_updated_at is refreshed.
 * Requirements: 6.1, 6.5
 */
export async function updateTask(
  id: string,
  input: UpdateTaskInput
): Promise<Task | null> {
  const updates: string[] = [];
  const values: unknown[] = [];
  let paramCount = 1;

  if (input.title !== undefined) {
    updates.push(`title = $${paramCount++}`);
    values.push(input.title);
  }

  if (input.description !== undefined) {
    updates.push(`description = $${paramCount++}`);
    values.push(input.description);
  }

  if (input.due_date !== undefined) {
    updates.push(`due_date = $${paramCount++}`);
    values.push(input.due_date);
  }

  if (input.assignee_id !== undefined) {
    updates.push(`assignee_id = $${paramCount++}`);
    values.push(input.assignee_id);
  }

  if (input.status !== undefined) {
    updates.push(`status = $${paramCount++}`);
    values.push(input.status);
    // Track when status changes (Requirements: 6.5)
    updates.push(`status_updated_at = CURRENT_TIMESTAMP`);
  }

  if (updates.length === 0) {
    return findTaskById(id);
  }

  values.push(id);

  const result = await pool.query<Task>(
    `UPDATE tasks
     SET ${updates.join(', ')}
     WHERE id = $${paramCount}
     RETURNING id, project_id, assignee_id, title, description, status,
               due_date, status_updated_at, created_at`,
    values
  );

  return result.rows[0] || null;
}
