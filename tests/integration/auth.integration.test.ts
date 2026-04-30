import request from 'supertest';
import app from '../../src/app';
import pool from '../../src/db/client';

describe('Authentication Integration Tests', () => {
  beforeAll(async () => {
    // Clean up test data
    await pool.query('DELETE FROM users WHERE email LIKE $1', ['test%@example.com']);
  });

  afterAll(async () => {
    // Clean up test data
    await pool.query('DELETE FROM users WHERE email LIKE $1', ['test%@example.com']);
    await pool.end();
  });

  describe('POST /auth/register', () => {
    it('should register a new user and return JWT', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({
          email: 'test1@example.com',
          name: 'Test User',
          password: 'password123',
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe('test1@example.com');
      expect(response.body.user.name).toBe('Test User');
    });

    it('should return 409 for duplicate email', async () => {
      // First registration
      await request(app)
        .post('/auth/register')
        .send({
          email: 'test2@example.com',
          name: 'Test User',
          password: 'password123',
        });

      // Duplicate registration
      const response = await request(app)
        .post('/auth/register')
        .send({
          email: 'test2@example.com',
          name: 'Another User',
          password: 'password456',
        });

      expect(response.status).toBe(409);
      expect(response.body.error).toContain('already exists');
    });

    it('should return 400 for password shorter than 8 characters', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({
          email: 'test3@example.com',
          name: 'Test User',
          password: 'short',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('at least 8 characters');
    });

    it('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({
          email: 'test4@example.com',
          // missing name and password
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });
  });

  describe('POST /auth/login', () => {
    beforeAll(async () => {
      // Create a test user for login tests
      await request(app)
        .post('/auth/register')
        .send({
          email: 'testlogin@example.com',
          name: 'Login Test User',
          password: 'password123',
        });
    });

    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'testlogin@example.com',
          password: 'password123',
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body.user.email).toBe('testlogin@example.com');
    });

    it('should return 401 for invalid password', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'testlogin@example.com',
          password: 'wrongpassword',
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toContain('Invalid');
    });

    it('should return 401 for non-existent email', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123',
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toContain('Invalid');
    });
  });
});
