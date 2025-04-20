import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { cors } from 'hono/cors';
import { secureHeaders } from 'hono/secure-headers';
import { serveStatic } from 'hono/bun';
import { api } from './api/index';

// Create Hono app
const app = new Hono();

// Middleware
app.use('*', logger());
app.use('*', cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:5176'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  exposeHeaders: ['Set-Cookie'],
}));
app.use('*', secureHeaders());

// Mount API routes
app.route('/api', api);

// Serve static files from the dist directory
app.use('/*', serveStatic({ root: './dist' }));

// Fallback for SPA routing
app.get('*', (c) => {
  return c.redirect('/');
});

// Start server
const port = parseInt(process.env.PORT || '3000');
console.log(`Server starting on port ${port}...`);

export default {
  port,
  fetch: app.fetch,
};
