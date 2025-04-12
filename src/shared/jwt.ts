import { SignJWT, jwtVerify, JWTPayload } from 'jose';
import { AuthToken, JWT_SECRET, TOKEN_EXPIRATION } from './auth';
import { User } from './schemas';

// Extend JWTPayload to include our custom fields
interface CustomJWTPayload extends JWTPayload {
  userId: string;
  email: string;
  name: string;
}

// Create a JWT token for a user
export const createToken = async (user: User): Promise<string> => {
  const tokenData: CustomJWTPayload = {
    userId: user.id || '',
    email: user.email,
    name: user.name,
    exp: Math.floor(Date.now() / 1000) + TOKEN_EXPIRATION,
  };

  const encoder = new TextEncoder();
  const secretKey = encoder.encode(JWT_SECRET);

  return new SignJWT(tokenData)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + TOKEN_EXPIRATION)
    .sign(secretKey);
};

// Verify a JWT token
export const verifyToken = async (token: string): Promise<AuthToken | null> => {
  try {
    const encoder = new TextEncoder();
    const secretKey = encoder.encode(JWT_SECRET);

    const { payload } = await jwtVerify(token, secretKey);
    return payload as unknown as AuthToken;
  } catch (error) {
    console.error('Error verifying token:', error);
    return null;
  }
};

// Extract token from Authorization header
export const extractTokenFromHeader = (authHeader: string | null): string | null => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7); // Remove 'Bearer ' prefix
};
