import { Hono } from 'hono';
import { googleAuth } from '@hono/oauth-providers/google';
import { sign } from 'hono/jwt';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';
import { user } from '../db/schema';
import { eq } from 'drizzle-orm';

const app = new Hono();

// Configure Google OAuth
const googleAuthConfig = {
  clientId: process.env.GOOGLE_CLIENT_ID || '',
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  redirectUri: `${process.env.APP_URL || 'http://localhost:3000'}/api/auth/callback/google`,
  scopes: ['email', 'profile'],
};

// Initialize Google OAuth middleware
const googleAuthMiddleware = googleAuth(googleAuthConfig);

// Login route
app.get('/login/google', async (c) => {
  return await googleAuthMiddleware.getAuthorizationUrl(c);
});

// Callback route
app.get('/callback/google', async (c) => {
  try {
    const userData = await googleAuthMiddleware.callback(c);

    if (!userData.email) {
      return c.json({ success: false, error: 'Email not provided by Google' }, 400);
    }

    // Find or create user
    const existingUsers = await db
      .select()
      .from(user)
      .where(eq(user.oauthProviderUserId, userData.id))
      .limit(1);

    let existingUser = existingUsers[0];

    if (!existingUser) {
      const id = uuidv4();
      await db.insert(user).values({
        id,
        name: userData.name || 'User',
        email: userData.email,
        oauthProvider: 'google',
        oauthProviderUserId: userData.id,
        calendarToken: uuidv4(), // Generate a random calendar token
      });

      // Fetch the newly created user
      const newUsers = await db
        .select()
        .from(user)
        .where(eq(user.id, id))
        .limit(1);

      existingUser = newUsers[0];
    }

    // Create JWT token
    const token = await sign({
      userId: existingUser.id,
      email: existingUser.email
    }, process.env.JWT_SECRET || 'default-secret-change-this');

    // Set cookie and redirect
    c.cookie('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 1 week
    });

    return c.redirect('/');
  } catch (error) {
    console.error('Authentication error:', error);
    return c.json({ success: false, error: 'Authentication failed' }, 500);
  }
});

// Logout route
app.get('/logout', (c) => {
  c.cookie('auth_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });

  return c.redirect('/');
});

// Get current user
app.get('/me', async (c) => {
  const token = c.req.cookie('auth_token');

  if (!token) {
    return c.json({ success: false, authenticated: false }, 401);
  }

  try {
    const payload = await c.get('jwtPayload');
    const users = await db
      .select()
      .from(user)
      .where(eq(user.id, payload.userId))
      .limit(1);

    if (users.length === 0) {
      return c.json({ success: false, error: 'User not found' }, 404);
    }

    const userData = users[0];

    return c.json({
      success: true,
      authenticated: true,
      user: {
        id: userData.id,
        name: userData.name,
        email: userData.email,
      },
    });
  } catch (error) {
    console.error('Error getting user:', error);
    return c.json({ success: false, authenticated: false, error: 'Invalid token' }, 401);
  }
});

export default app;
