import { Request, Response, NextFunction } from 'express';

/**
 * Custom application error class for typed HTTP errors.
 * Allows route handlers and services to throw structured errors
 * that the global handler maps to the correct HTTP status code.
 */
export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly field?: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

/**
 * Global error handler middleware.
 *
 * Maps known error types to HTTP status codes and returns a consistent
 * JSON structure: { error: string, field?: string }.
 * Stack traces are never exposed to the client.
 *
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5
 */
export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void {
  // Structured application error
  if (err instanceof AppError) {
    const body: Record<string, string> = { error: err.message };
    if (err.field) body.field = err.field;
    res.status(err.statusCode).json(body);
    return;
  }

  // JWT / token errors surfaced by jsonwebtoken
  if (err instanceof Error) {
    if (err.name === 'JsonWebTokenError' || err.name === 'NotBeforeError') {
      res.status(401).json({ error: 'Invalid or expired token' });
      return;
    }
    if (err.name === 'TokenExpiredError') {
      res.status(401).json({ error: 'Token has expired' });
      return;
    }

    // Postgres unique-constraint violation (code 23505)
    const pgErr = err as Error & { code?: string; constraint?: string };
    if (pgErr.code === '23505') {
      res.status(409).json({ error: 'Resource already exists' });
      return;
    }

    // Postgres foreign-key violation (code 23503)
    if (pgErr.code === '23503') {
      res.status(404).json({ error: 'Referenced resource not found' });
      return;
    }
  }

  // Fallback: unexpected server error — never expose stack trace
  res.status(500).json({ error: 'An unexpected error occurred' });
}
