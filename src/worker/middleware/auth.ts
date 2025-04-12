import { Context, Next } from 'hono';
import { extractTokenFromHeader, verifyToken } from '../../shared/jwt';
import { isWhitelisted } from '../../shared/auth';

// Middleware to check if the user is authenticated
export const authMiddleware = async (c: Context, next: Next) => {
  const authHeader = c.req.header('Authorization') || null;
  const token = extractTokenFromHeader(authHeader);

  if (!token) {
    return c.json({
      success: false,
      error: 'Unauthorized: No token provided'
    }, 401);
  }

  const tokenData = await verifyToken(token);
  if (!tokenData) {
    return c.json({
      success: false,
      error: 'Unauthorized: Invalid token'
    }, 401);
  }

  // Store user data in the context for later use
  c.set('user', {
    id: tokenData.userId,
    email: tokenData.email,
    name: tokenData.name
  });

  await next();
};

// Middleware to check if the user is whitelisted
export const whitelistMiddleware = async (c: Context, next: Next) => {
  const user = c.get('user');

  if (!user || !user.email) {
    return c.json({
      success: false,
      error: 'Unauthorized: User not authenticated'
    }, 401);
  }

  const isUserWhitelisted = await isWhitelisted(c.env.DB, user.email);
  if (!isUserWhitelisted) {
    return c.json({
      success: false,
      error: 'Forbidden: User not in whitelist'
    }, 403);
  }

  await next();
};
