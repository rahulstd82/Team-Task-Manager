import pool from '../db/client';

export interface Project {
  id: string;
  name: string;
  description: string | null;
  owner_id: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateProjectInput {
  name: string;
  description?: string;
  owner_id: string;
}

export interface UpdateProjectInput {
  name?: string;
  description?: string;
}

export async function createProject(input: CreateProjectInput): Promise<Project> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const projectResult = await client.query<Project>(
      "INSERT INTO projects (name, description, owner_id) VALUES ($1, $2, $3) RETURNING id, name, description, owner_id, created_at, updated_at",
      [input.name, input.description || null, input.owner_id]
    );
    const project = projectResult.rows[0];
    await client.query(
      "INSERT INTO memberships (project_id, user_id, role) VALUES ($1, $2, 'admin')",
      [project.id, input.owner_id]
    );
    await client.query("COMMIT");
    return project;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function findProjectById(id: string): Promise<Project | null> {
  const result = await pool.query<Project>(
    "SELECT id, name, description, owner_id, created_at, updated_at FROM projects WHERE id = $1",
    [id]
  );
  return result.rows[0] || null;
}

export async function updateProject(id: string, input: UpdateProjectInput): Promise<Project | null> {
  const updates: string[] = [];
  const values: any[] = [];
  let paramCount = 1;
  if (input.name !== undefined) {
    updates.push("name = $" + paramCount);
    values.push(input.name);
    paramCount++;
  }
  if (input.description !== undefined) {
    updates.push("description = $" + paramCount);
    values.push(input.description);
    paramCount++;
  }
  if (updates.length === 0) {
    return findProjectById(id);
  }
  updates.push("updated_at = CURRENT_TIMESTAMP");
  values.push(id);
  const result = await pool.query<Project>(
    "UPDATE projects SET " + updates.join(", ") + " WHERE id = $" + paramCount + " RETURNING id, name, description, owner_id, created_at, updated_at",
    values
  );
  return result.rows[0] || null;
}

export async function deleteProject(id: string): Promise<boolean> {
  const result = await pool.query("DELETE FROM projects WHERE id = $1", [id]);
  return result.rowCount !== null && result.rowCount > 0;
}

export async function listUserProjects(userId: string): Promise<Project[]> {
  const result = await pool.query<Project>(
    "SELECT p.id, p.name, p.description, p.owner_id, p.created_at, p.updated_at FROM projects p INNER JOIN memberships m ON p.id = m.project_id WHERE m.user_id = $1 ORDER BY p.created_at DESC",
    [userId]
  );
  return result.rows;
}
