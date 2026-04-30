import { Request, Response, NextFunction } from 'express';
import { authenticateToken, AuthRequest } from '../../src/middleware/auth';
import { signToken } from '../../src/services/authService';

describe('Authentication Middleware', () => {
  let mockRequest: Partial<AuthRequest>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    mockRequest = {
      headers: {},
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    nextFunction = jest.fn();
  });

  describe('authenticateToken', () => {
    it('should return 401 when Authorization header is missing', () => {
      authenticateToken(
        mockRequest as AuthRequest,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Missing authorization token',
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should return 401 when token is empty', () => {
      mockRequest.headers = { authorization: 'Bearer ' };

      authenticateToken(
        mockRequest as AuthRequest,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Missing authorization token',
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should return 401 when token is invalid', () => {
      mockRequest.headers = { authorization: 'Bearer invalid-token' };

      authenticateToken(
        mockRequest as AuthRequest,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Invalid or expired token',
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should attach user payload and call next() for valid token', () => {
      const userPayload = {
        id: '123',
        email: 'test@example.com',
        name: 'Test User',
      };
      const token = signToken(userPayload);
      mockRequest.headers = { authorization: `Bearer ${token}` };

      authenticateToken(
        mockRequest as AuthRequest,
        mockResponse as Response,
        nextFunction
      );

      expect(mockRequest.user).toBeDefined();
      expect(mockRequest.user?.id).toBe(userPayload.id);
      expect(mockRequest.user?.email).toBe(userPayload.email);
      expect(mockRequest.user?.name).toBe(userPayload.name);
      expect(nextFunction).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should work with token without Bearer prefix', () => {
      const userPayload = {
        id: '456',
        email: 'another@example.com',
        name: 'Another User',
      };
      const token = signToken(userPayload);
      mockRequest.headers = { authorization: token };

      authenticateToken(
        mockRequest as AuthRequest,
        mockResponse as Response,
        nextFunction
      );

      expect(mockRequest.user).toBeDefined();
      expect(mockRequest.user?.id).toBe(userPayload.id);
      expect(nextFunction).toHaveBeenCalled();
    });
  });
});
