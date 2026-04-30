import jwt from 'jsonwebtoken';
import { UserPayload } from '../models/user';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRY = '24h';

export interface JWTPayload extends UserPayload {
  iat?: number;
  exp?: number;
}

/**
 * Sign a JWT token with user payload
 * Token expires in 24 hours
 */
export function signToken(payload: UserPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRY,
  });
}

/**
 * Verify and decode a JWT token
 * Returns the payload if valid, throws error if invalid/expired
 */
export function verifyToken(token: string): JWTPayload {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}
