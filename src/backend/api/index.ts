import { Hono } from 'hono';
import { jwt } from 'hono/jwt';
import { oidcAuthMiddleware, getAuth } from '@hono/oidc-auth';
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

// Authentication middleware with optional bypass
const authMiddleware = async (c: any, next: any) => {
  // Check if auth bypass is enabled (regardless of NODE_ENV)
  if (process.env.ENABLE_AUTH_BYPASS === 'true') {
    // With bypass enabled, set a mock JWT payload
    c.set('jwtPayload', {
      userId: 'dev-user-id',
      email: 'dev@example.com'
    });
    await next();
  } else if (process.env.USE_OIDC_AUTH === 'true') {
    // Use OIDC authentication
    return oidcAuthMiddleware()(c, next);
  } else {
    // Use JWT middleware
    await jwtMiddleware(c, next);
  }
};

// Initialize OIDC authentication middleware
if (process.env.USE_OIDC_AUTH === 'true') {
  // Set up OIDC routes
  api.get('/login', async (c) => {
    return c.redirect('/api/auth/callback/google');
  });

  api.get('/logout', async (c) => {
    // Clear the OIDC auth cookie
    c.header('Set-Cookie', `${process.env.OIDC_COOKIE_NAME || 'oidc-auth'}=; Path=${process.env.OIDC_COOKIE_PATH || '/'}; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax`);
    return c.redirect('/');
  });

  api.get('/', async (c) => {
    try {
      const auth = await getAuth(c);
      if (auth) {
        // Set JWT payload from OIDC auth
        c.set('jwtPayload', {
          userId: auth.sub,
          email: auth.email
        });
        return c.json({ success: true, user: auth });
      }
      return c.json({ success: false, authenticated: false });
    } catch (error) {
      console.error('Error getting auth:', error);
      return c.json({ success: false, error: 'Authentication failed' }, 401);
    }
  });
}

// Protected routes
api.use('/conferences', authMiddleware);
api.route('/conferences', conferenceRoutes);

api.use('/research-topics', authMiddleware);
api.route('/research-topics', researchTopicRoutes);

api.use('/topic-notes', authMiddleware);
api.route('/topic-notes', topicNoteRoutes);

api.use('/topic-conferences', authMiddleware);
api.route('/topic-conferences', topicConferenceRoutes);

// Health check endpoint
api.get('/', (c) => c.json({ status: 'ok', message: 'API is running' }));

export { api };
