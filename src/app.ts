import express, { Application } from 'express';
import dotenv from 'dotenv';

dotenv.config();

const app: Application = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Routes
import authRoutes from './routes/auth';
app.use('/auth', authRoutes);

import userRoutes from './routes/users';
app.use('/users', userRoutes);

import projectRoutes from './routes/projects';
app.use('/projects', projectRoutes);

import memberRoutes from './routes/members';
app.use('/projects/:id/members', memberRoutes);

import taskRoutes from './routes/tasks';
app.use('/projects/:id/tasks', taskRoutes);

import dashboardRoutes from './routes/dashboard';
app.use('/dashboard', dashboardRoutes);

// Global error handler — must be registered after all routes
import { errorHandler } from './middleware/errorHandler';
app.use(errorHandler);

export default app;
