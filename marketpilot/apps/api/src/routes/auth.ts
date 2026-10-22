import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../db.js';
import { createToken, requireAuth } from '../middleware/auth.js';
import type { AuthRequest } from '../types.js';
const router = Router();
const registerSchema = z.object({ name: z.string().trim().min(2).max(80), email: z.string().trim().email().max(254), password: z.string().min(10).max(128) });
const loginSchema = z.object({ email: z.string().trim().email(), password: z.string().min(1).max(128) });
router.post('/register', async (req, res, next) => {
  try {
    const input = registerSchema.parse(req.body);
    const email = input.email.toLowerCase();
    if (await prisma.user.findUnique({ where: { email } })) return res.status(409).json({ error: 'An account with this email already exists.' });
    const passwordHash = await bcrypt.hash(input.password, 12);
    const user = await prisma.user.create({ data: { name: input.name, email, passwordHash, subscription: { create: { plan: 'FREE' } } }, select: { id: true, name: true, email: true } });
    await prisma.auditEvent.create({ data: { userId: user.id, action: 'USER_REGISTERED' } });
    res.status(201).json({ token: createToken(user), user });
  } catch (e) { next(e); }
});
router.post('/login', async (req, res, next) => {
  try {
    const input = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email: input.email.toLowerCase() } });
    if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) return res.status(401).json({ error: 'Email or password is incorrect.' });
    await prisma.auditEvent.create({ data: { userId: user.id, action: 'USER_LOGIN' } });
    res.json({ token: createToken(user), user: { id: user.id, name: user.name, email: user.email } });
  } catch (e) { next(e); }
});
router.get('/me', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user!.id }, select: { id: true, name: true, email: true, createdAt: true, subscription: { select: { plan: true, status: true } } } });
    if (!user) return res.status(404).json({ error: 'User not found.' });
    res.json({ user });
  } catch (e) { next(e); }
});
export default router;
