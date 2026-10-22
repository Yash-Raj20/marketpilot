import type { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import type { AuthRequest } from '../types.js';
const secret = () => process.env.JWT_SECRET || 'development-only-secret-change-me';
export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return res.status(401).json({ error: 'Authentication required.' });
  try {
    const payload = jwt.verify(header.slice(7), secret()) as { sub: string; email: string };
    req.user = { id: payload.sub, email: payload.email };
    next();
  } catch {
    return res.status(401).json({ error: 'Session expired or token is invalid.' });
  }
}
export function createToken(user: { id: string; email: string }) {
  return jwt.sign({ email: user.email }, secret(), { subject: user.id, expiresIn: '7d' });
}
