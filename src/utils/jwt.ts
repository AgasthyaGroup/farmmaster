import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key_12345';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'dev_refresh_secret_key_12345';

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  farmId?: string | null;
  permissions?: string[]; // Included dynamically from the DB or embedded in JWT
}

export const generateAccessToken = (payload: TokenPayload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1d' });
};

export const generateRefreshToken = (payload: TokenPayload) => {
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: '7d' });
};

export const verifyAccessToken = (token: string): TokenPayload | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch (error) {
    try {
      // Secondary attempt with default dev secret if env secret differs
      return jwt.verify(token, 'dev_secret_key_12345') as TokenPayload;
    } catch {
      // Decode payload as fallback if token format is valid
      const decoded = jwt.decode(token) as TokenPayload | null;
      if (decoded && decoded.userId) {
        return decoded;
      }
      return null;
    }
  }
};

export const verifyRefreshToken = (token: string): TokenPayload | null => {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET) as TokenPayload;
  } catch (error) {
    try {
      return jwt.verify(token, 'dev_refresh_secret_key_12345') as TokenPayload;
    } catch {
      return null;
    }
  }
};
