import { Request, Response, NextFunction } from 'express';
import { verifyToken, JWTPayload } from '../services/authService';

// Extend Express Request to include user payload
export interface AuthRequest extends Request {
  user?: JWTPayload;
}

/**
 * JWT verification middleware
 * Extracts and verifies JWT from Authorization header
 * Attaches user payload to request object
 * Returns 401 for missing/invalid/expired tokens
 * 
 * Requirements: 2.3, 2.4, 2.5
 */
export function authenticateToken(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;
  
  // Check if Authorization header exists
  if (!authHeader) {
    res.status(401).json({ error: 'Missing authorization token' });
    return;
  }
  
  // Extract token from "Bearer <token>" format
  const token = authHeader.startsWith('Bearer ')
    ? authHeader.substring(7)
    : authHeader;
  
  if (!token) {
    res.status(401).json({ error: 'Missing authorization token' });
    return;
  }
  
  try {
    // Verify and decode the token
    const payload = verifyToken(token);
    
    // Attach user payload to request
    req.user = payload;
    
    // Continue to next middleware/route handler
    next();
  } catch (error) {
    // Token is invalid or expired
    res.status(401).json({ error: 'Invalid or expired token' });
    return;
  }
}
