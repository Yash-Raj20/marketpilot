import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../db.js';
import { createToken, requireAuth, COOKIE_NAME, COOKIE_OPTIONS } from '../middleware/auth.js';
import type { AuthRequest } from '../types.js';
import { sendWelcomeEmail, sendPasswordChangedEmail, sendEmail } from '../services/email.js';

const router = Router();

const USER_PROJECTION = {
  id: true,
  name: true,
  email: true,
  role: true,
  createdAt: true,
  subscription: {
    select: {
      plan: true,
      status: true,
      currentPeriodEnd: true
    }
  }
} as const;

const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(80),
  email: z.string().trim().email('Invalid email address').max(254),
  password: z.string().min(10, 'Password must be at least 10 characters').max(128)
});

const loginSchema = z.object({
  email: z.string().trim().email('Invalid email address'),
  password: z.string().min(1, 'Password is required').max(128)
});

const resetPasswordSchema = z.object({
  email: z.string().trim().email('Invalid email address'),
  newPassword: z.string().min(10, 'New password must be at least 10 characters').max(128)
});

// 1. REGISTER
router.post('/register', async (req, res, next) => {
  try {
    const input = registerSchema.parse(req.body);
    const email = input.email.toLowerCase();

    if (await prisma.user.findUnique({ where: { email } })) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const passwordHash = await bcrypt.hash(input.password, 12);
    const user = await prisma.user.create({
      data: {
        name: input.name,
        email,
        passwordHash,
        subscription: {
          create: { plan: 'FREE', status: 'ACTIVE' }
        }
      },
      select: USER_PROJECTION
    });

    await prisma.auditEvent.create({
      data: { userId: user.id, action: 'USER_REGISTERED' }
    });

    const token = createToken(user);
    res.cookie(COOKIE_NAME, token, COOKIE_OPTIONS);

    // Send welcome email via Nodemailer asynchronously
    sendWelcomeEmail({ name: user.name, email: user.email }).catch((err) => {
      console.error('[EmailService] Failed to send welcome email:', err);
    });

    res.status(201).json({
      token,
      user,
      message: 'Account created successfully.'
    });
  } catch (e) {
    next(e);
  }
});

// 2. LOGIN
router.post('/login', async (req, res, next) => {
  try {
    const input = loginSchema.parse(req.body);
    const email = input.email.toLowerCase();

    const userWithHash = await prisma.user.findUnique({
      where: { email },
      include: {
        subscription: {
          select: { plan: true, status: true }
        }
      }
    });

    if (!userWithHash || !(await bcrypt.compare(input.password, userWithHash.passwordHash))) {
      return res.status(401).json({ error: 'Email or password is incorrect.' });
    }

    await prisma.auditEvent.create({
      data: { userId: userWithHash.id, action: 'USER_LOGIN' }
    });

    const token = createToken(userWithHash);
    res.cookie(COOKIE_NAME, token, COOKIE_OPTIONS);

    const user = {
      id: userWithHash.id,
      name: userWithHash.name,
      email: userWithHash.email,
      role: userWithHash.role,
      createdAt: userWithHash.createdAt,
      subscription: userWithHash.subscription
    };

    res.json({
      token,
      user,
      message: 'Signed in successfully.'
    });
  } catch (e) {
    next(e);
  }
});

// 3. LOGOUT
router.post('/logout', (_req, res) => {
  res.clearCookie(COOKIE_NAME, COOKIE_OPTIONS);
  res.json({ message: 'Signed out successfully.' });
});

// 4. RESET PASSWORD (FORGOT PASSWORD)
router.post('/reset-password', async (req, res, next) => {
  try {
    const { email, newPassword } = resetPasswordSchema.parse(req.body);
    const cleanEmail = email.toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email: cleanEmail }
    });

    if (!user) {
      return res.status(404).json({ error: 'No account registered with this email address.' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
      select: USER_PROJECTION
    });

    await prisma.auditEvent.create({
      data: { userId: user.id, action: 'PASSWORD_RESET_COMPLETED' }
    });

    const token = createToken(updated);
    res.cookie(COOKIE_NAME, token, COOKIE_OPTIONS);

    // Send password updated security alert via Nodemailer asynchronously
    sendPasswordChangedEmail({ name: updated.name, email: updated.email }).catch((err) => {
      console.error('[EmailService] Failed to send password reset alert email:', err);
    });

    res.json({
      token,
      user: updated,
      message: 'Password reset successfully. You are now logged in.'
    });
  } catch (e) {
    next(e);
  }
});

// 5. CURRENT USER (SESSION VERIFICATION)
router.get('/me', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: USER_PROJECTION
    });

    if (!user) {
      res.clearCookie(COOKIE_NAME, COOKIE_OPTIONS);
      return res.status(404).json({ error: 'User session invalid.' });
    }

    res.json({ user });
  } catch (e) {
    next(e);
  }
});

// 6. UPDATE PROFILE NAME
router.put('/profile', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const { name } = z.object({
      name: z.string().trim().min(2, 'Name must be at least 2 characters').max(80)
    }).parse(req.body);

    const updated = await prisma.user.update({
      where: { id: req.user!.id },
      data: { name },
      select: USER_PROJECTION
    });

    await prisma.auditEvent.create({
      data: { userId: req.user!.id, action: 'PROFILE_UPDATED' }
    });

    res.json({
      user: updated,
      message: 'Profile updated successfully.'
    });
  } catch (e) {
    next(e);
  }
});

// 7. CHANGE PASSWORD (AUTHENTICATED)
router.put('/change-password', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const { currentPassword, newPassword } = z.object({
      currentPassword: z.string().min(1, 'Current password is required'),
      newPassword: z.string().min(10, 'New password must be at least 10 characters').max(128)
    }).parse(req.body);

    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user || !(await bcrypt.compare(currentPassword, user.passwordHash))) {
      return res.status(400).json({ error: 'Current password is incorrect.' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: req.user!.id },
      data: { passwordHash }
    });

    await prisma.auditEvent.create({
      data: { userId: req.user!.id, action: 'PASSWORD_CHANGED' }
    });

    // Send security alert via Nodemailer asynchronously
    sendPasswordChangedEmail({ name: user.name, email: user.email }).catch((err) => {
      console.error('[EmailService] Failed to send password changed alert email:', err);
    });

    res.json({ message: 'Password changed successfully.' });
  } catch (e) {
    next(e);
  }
});

// 8. UPDATE SUBSCRIPTION TIER
router.put('/subscription', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const { plan } = z.object({
      plan: z.enum(['FREE', 'PRO', 'ELITE'])
    }).parse(req.body);

    await prisma.subscription.upsert({
      where: { userId: req.user!.id },
      create: { userId: req.user!.id, plan, status: 'ACTIVE' },
      update: { plan, status: 'ACTIVE' }
    });

    await prisma.auditEvent.create({
      data: { userId: req.user!.id, action: `SUBSCRIPTION_${plan}` }
    });

    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: USER_PROJECTION
    });

    res.json({
      user,
      message: `Successfully updated to the ${plan} plan!`
    });
  } catch (e) {
    next(e);
  }
});

// 9. TEST EMAIL DISPATCH (NODEMAILER VERIFICATION)
router.post('/send-test-email', async (req, res, next) => {
  try {
    const { email } = z.object({
      email: z.string().trim().email('Invalid email address')
    }).parse(req.body);

    const result = await sendEmail({
      to: email,
      subject: 'MarketPilot AI — Nodemailer Integration Test',
      html: `
        <h2>Nodemailer Integration Test Successful ✅</h2>
        <p>This is a test email sent from the MarketPilot AI backend using <strong>Nodemailer</strong>.</p>
        <p>Sent at: <strong>${new Date().toLocaleString()}</strong></p>
        <p>Ready for development and staging, with seamless swappability for production.</p>
      `
    });

    res.json({
      success: true,
      message: `Test email dispatched to ${email}`,
      previewUrl: result.previewUrl || null
    });
  } catch (e) {
    next(e);
  }
});

export default router;
