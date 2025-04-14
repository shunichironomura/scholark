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

// Development mode bypass middleware
const devAuthBypass = async (c: any, next: any) => {
  if (process.env.NODE_ENV === 'development') {
    // In development, set a mock JWT payload
    c.set('jwtPayload', {
      userId: 'dev-user-id',
      email: 'dev@example.com'
    });
    await next();
  } else {
    // In production, use the real JWT middleware
    await jwtMiddleware(c, next);
  }
};

// Protected routes
api.use('/conferences', devAuthBypass);
api.route('/conferences', conferenceRoutes);

api.use('/research-topics', devAuthBypass);
api.route('/research-topics', researchTopicRoutes);

api.use('/topic-notes', devAuthBypass);
api.route('/topic-notes', topicNoteRoutes);

api.use('/topic-conferences', devAuthBypass);
api.route('/topic-conferences', topicConferenceRoutes);

// Health check endpoint
api.get('/', (c) => c.json({ status: 'ok', message: 'API is running' }));

export { api };
