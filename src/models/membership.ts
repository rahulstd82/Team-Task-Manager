import pool from '../db/client';

export type MembershipRole = 'admin' | 'member';

export interface Membership {
  id: string;
  project_id: string;
  user_id: string;
  role: MembershipRole;
  joined_at: Date;
}

export interface MemberWithUser {
  id: string;
  project_id: string;
  user_id: string;
  role: MembershipRole;
  joined_at: Date;
  email: string;
  name: string;
}

/**
 * Add a user to a project with the 'member' role
 * Requirements: 4.1
 */
export async function addMember(
  projectId: string,
  userId: string,
  role: MembershipRole = 'member'
): Promise<Membership> {
  const result = await pool.query<Membership>(
    `INSERT INTO memberships (project_id, user_id, role)
     VALUES ($1, $2, $3)
     RETURNING id, project_id, user_id, role, joined_at`,
    [projectId, userId, role]
  );

  return result.rows[0];
}

/**
 * Remove a user from a project
 * Requirements: 4.2
 */
export async function removeMember(
  projectId: string,
  userId: string
): Promise<boolean> {
  const result = await pool.query(
    `DELETE FROM memberships WHERE project_id = $1 AND user_id = $2`,
    [projectId, userId]
  );

  return result.rowCount !== null && result.rowCount > 0;
}

/**
 * List all members of a project, joined with user info
 * Requirements: 4.6
 */
export async function listProjectMembers(projectId: string): Promise<MemberWithUser[]> {
  const result = await pool.query<MemberWithUser>(
    `SELECT m.id, m.project_id, m.user_id, m.role, m.joined_at,
            u.email, u.name
     FROM memberships m
     INNER JOIN users u ON m.user_id = u.id
     WHERE m.project_id = $1
     ORDER BY m.joined_at ASC`,
    [projectId]
  );

  return result.rows;
}

/**
 * Find a single membership record
 */
export async function findMembership(
  projectId: string,
  userId: string
): Promise<Membership | null> {
  const result = await pool.query<Membership>(
    `SELECT id, project_id, user_id, role, joined_at
     FROM memberships
     WHERE project_id = $1 AND user_id = $2`,
    [projectId, userId]
  );

  return result.rows[0] || null;
}
