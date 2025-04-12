import { User } from './schemas';
import type { D1Database } from '@cloudflare/workers-types';

// Environment variables for Google OAuth
export const GOOGLE_CLIENT_ID = '652323395312-4ckve4tocnf6248d8cr072r0klt2k7k2.apps.googleusercontent.com';
export const GOOGLE_CLIENT_SECRET = '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';
export const REDIRECT_URL = 'http://localhost:5173/api/auth/google';

// JWT secret for token signing
export const JWT_SECRET = 'your-secret-key-for-development-only';

// Token expiration time (1 day)
export const TOKEN_EXPIRATION = 60 * 60 * 24;

// Auth-related types
export interface GoogleUserInfo {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
  locale: string;
}

export interface AuthToken {
  userId: string;
  email: string;
  name: string;
  exp: number;
}

// Helper functions
export const isWhitelisted = async (db: D1Database, email: string): Promise<boolean> => {
  const { results } = await db.prepare(
    "SELECT * FROM whitelist WHERE email = ?"
  )
    .bind(email)
    .all();

  return results.length > 0;
};

export const findOrCreateUser = async (
  db: D1Database,
  userInfo: GoogleUserInfo
): Promise<User | null> => {
  // Check if user exists
  const { results: existingUsers } = await db.prepare(
    "SELECT * FROM user WHERE oauth_provider = ? AND oauth_provider_user_id = ?"
  )
    .bind('google', userInfo.id)
    .all();

  if (existingUsers.length > 0) {
    return existingUsers[0] as User;
  }

  // Check if email is whitelisted
  if (!(await isWhitelisted(db, userInfo.email))) {
    return null;
  }

  // Create new user
  const userId = crypto.randomUUID();
  const result = await db.prepare(
    "INSERT INTO user (id, name, email, oauth_provider, oauth_provider_user_id) VALUES (?, ?, ?, ?, ?)"
  )
    .bind(userId, userInfo.name, userInfo.email, 'google', userInfo.id)
    .run();

  if (!result.success) {
    return null;
  }

  return {
    id: userId,
    name: userInfo.name,
    email: userInfo.email,
    oauth_provider: 'google',
    oauth_provider_user_id: userInfo.id,
    calendar_token: null
  };
};
