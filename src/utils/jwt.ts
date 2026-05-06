import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

if (!JWT_SECRET) {
  throw new Error('Please define JWT_SECRET environment variable');
}

if (!JWT_REFRESH_SECRET) {
  throw new Error('Please define JWT_REFRESH_SECRET environment variable');
}

export interface TokenPayload {
  userId: string;
  email: string;
  role: 'SUPER_ADMIN' | 'FARM_ADMIN' | 'INCHARGE';
  farmId?: string | null;
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
    return null;
  }
};

export const verifyRefreshToken = (token: string): TokenPayload | null => {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET) as TokenPayload;
  } catch (error) {
    return null;
  }
};
