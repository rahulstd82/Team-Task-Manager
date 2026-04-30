import pool from '../db/client';
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

export interface User {
  id: string;
  email: string;
  name: string;
  password_hash: string;
  created_at: Date;
}

export interface CreateUserInput {
  email: string;
  name: string;
  password: string;
}

export interface UserPayload {
  id: string;
  email: string;
  name: string;
}

/**
 * Hash a plaintext password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verify a plaintext password against a hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Create a new user in the database
 */
export async function createUser(input: CreateUserInput): Promise<User> {
  const passwordHash = await hashPassword(input.password);
  
  const result = await pool.query<User>(
    `INSERT INTO users (email, name, password_hash)
     VALUES ($1, $2, $3)
     RETURNING id, email, name, password_hash, created_at`,
    [input.email, input.name, passwordHash]
  );
  
  return result.rows[0];
}

/**
 * Find a user by email
 */
export async function findUserByEmail(email: string): Promise<User | null> {
  const result = await pool.query<User>(
    `SELECT id, email, name, password_hash, created_at
     FROM users
     WHERE email = $1`,
    [email]
  );
  
  return result.rows[0] || null;
}

/**
 * Find a user by ID
 */
export async function findUserById(id: string): Promise<User | null> {
  const result = await pool.query<User>(
    `SELECT id, email, name, password_hash, created_at
     FROM users
     WHERE id = $1`,
    [id]
  );
  
  return result.rows[0] || null;
}
