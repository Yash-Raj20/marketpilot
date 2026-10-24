import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import type { AuthRequest } from '../types.js';

const secret = () => {
  const s = process.env.JWT_SECRET;
  if (!s) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('FATAL: JWT_SECRET environment variable is required in production.');
    }
    return 'development-only-secret-change-me';
  }
  return s;
};

export const COOKIE_NAME = 'mp_token';

const isProduction = process.env.NODE_ENV === 'production' || process.env.RENDER === 'true';

export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: isProduction,
  sameSite: (isProduction ? 'none' : 'lax') as 'none' | 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/'
};

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  // 1. Primary: Extract from parsed httpOnly cookie
  let token = (req as Request & { cookies?: Record<string, string> }).cookies?.[COOKIE_NAME];

  // Fallback: parse raw cookie header if cookie-parser missed it
  if (!token && req.headers.cookie) {
    const match = req.headers.cookie.match(new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]+)`));
    if (match) token = decodeURIComponent(match[1]);
  }

  // 2. Secondary fallback: Authorization Bearer header
  if (!token && req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.slice(7);
  }

  if (!token) {
    return res.status(401).json({ error: 'Authentication required. Please sign in.' });
  }

  try {
    const payload = jwt.verify(token, secret()) as { sub: string; email: string };
    req.user = { id: payload.sub, email: payload.email };
    next();
  } catch {
    return res.status(401).json({ error: 'Session expired or token is invalid. Please sign in again.' });
  }
}

export function createToken(user: { id: string; email: string }) {
  return jwt.sign({ email: user.email }, secret(), { subject: user.id, expiresIn: '7d' });
}
