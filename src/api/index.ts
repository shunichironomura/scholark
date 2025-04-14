import { Hono } from 'hono';
import { jwt } from 'hono/jwt';
import authRoutes from './auth';
import conferenceRoutes from './conferences';
import researchTopicRoutes from './research-topics';
import topicNoteRoutes from './topic-notes';
import topicConferenceRoutes from './topic-conferences';

// Create API router
const api = new Hono();

// Public routes
api.route('/auth', authRoutes);

// JWT middleware for protected routes
const jwtMiddleware = jwt({
  secret: process.env.JWT_SECRET || 'default-secret-change-this',
});

// Protected routes
api.route('/conferences', jwtMiddleware, conferenceRoutes);
api.route('/research-topics', jwtMiddleware, researchTopicRoutes);
api.route('/topic-notes', jwtMiddleware, topicNoteRoutes);
api.route('/topic-conferences', jwtMiddleware, topicConferenceRoutes);

// Health check endpoint
api.get('/', (c) => c.json({ status: 'ok', message: 'API is running' }));

export { api };
