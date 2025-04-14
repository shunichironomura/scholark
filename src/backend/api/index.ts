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
api.use('/conferences', jwtMiddleware);
api.route('/conferences', conferenceRoutes);

api.use('/research-topics', jwtMiddleware);
api.route('/research-topics', researchTopicRoutes);

api.use('/topic-notes', jwtMiddleware);
api.route('/topic-notes', topicNoteRoutes);

api.use('/topic-conferences', jwtMiddleware);
api.route('/topic-conferences', topicConferenceRoutes);

// Health check endpoint
api.get('/', (c) => c.json({ status: 'ok', message: 'API is running' }));

export { api };
