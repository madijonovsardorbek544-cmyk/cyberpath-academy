import { Router, type Response } from 'express';
import crypto from 'crypto';
import { z } from 'zod';
import { comparePassword, hashPassword, signSession } from '../utils/auth.js';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';
import { authLimiter } from '../middleware/security.js';
import { env } from '../config/env.js';
import { createAuditLog } from '../utils/audit.js';
import { sendTransactionalEmail } from '../services/email.js';
import { makeId, mapUser, nowIso, one, run } from '../lib/db.js';

const router = Router();

const strongPassword = z.string().min(10).max(128)
  .regex(/[A-Z]/, 'Use at least one uppercase letter.')
  .regex(/[a-z]/, 'Use at least one lowercase letter.')
  .regex(/[0-9]/, 'Use at least one number.')
  .regex(/[^A-Za-z0-9]/, 'Use at least one symbol.');

const signupSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().email(),
  password: strongPassword
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128)
});

const requestResetSchema = z.object({ email: z.string().email() });
const resetSchema = z.object({ token: z.string().min(10), password: strongPassword });

function hashResetToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function setSessionCookie(res: Response, token: string) {
  res.cookie('cyberpath_session', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.cookieSecure,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/'
  });
}

router.post('/signup', authLimiter, async (req, res) => {
  const parsed = signupSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid sign-up data.', errors: parsed.error.flatten() });
  }

  const email = parsed.data.email.toLowerCase();
  const existing = one<Record<string, unknown> | null>('SELECT * FROM users WHERE email = ?', email);
  if (existing) {
    return res.status(409).json({ message: 'An account with that email already exists.' });
  }

  const passwordHash = await hashPassword(parsed.data.password);
  const now = nowIso();
  const id = makeId();

  run(
    `INSERT INTO users (id, name, email, password_hash, role, created_at, updated_at)
     VALUES (?, ?, ?, ?, 'student', ?, ?)`,
    id,
    parsed.data.name,
    email,
    passwordHash,
    now,
    now
  );

  run(
    `INSERT INTO subscriptions (id, user_id, plan_id, status, billing_cycle, current_period_end, created_at, updated_at)
     VALUES (?, ?, 'starter', 'trialing', 'monthly', ?, ?, ?)`,
    makeId(),
    id,
    new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    now,
    now
  );

  const user = mapUser(one<Record<string, unknown>>('SELECT * FROM users WHERE id = ?', id));
  const token = signSession({ userId: id, role: 'student' });
  setSessionCookie(res, token);
  createAuditLog({ actorUserId: id, actorRole: 'student', action: 'auth.signup', targetType: 'user', targetId: id, metadata: { email } });

  return res.status(201).json({ user });
});

router.post('/login', authLimiter, async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid login data.' });
  }

  const userRow = one<Record<string, unknown> | null>('SELECT * FROM users WHERE email = ?', parsed.data.email.toLowerCase());
  if (!userRow) {
    return res.status(401).json({ message: 'Invalid credentials.' });
  }

  const ok = await comparePassword(parsed.data.password, String(userRow.password_hash));
  if (!ok) {
    createAuditLog({ actorUserId: String(userRow.id), actorRole: String(userRow.role) as any, action: 'auth.login_failed', targetType: 'user', targetId: String(userRow.id) });
    return res.status(401).json({ message: 'Invalid credentials.' });
  }

  const role = String(userRow.role) as 'student' | 'mentor' | 'admin';
  const token = signSession({ userId: String(userRow.id), role });
  setSessionCookie(res, token);
  createAuditLog({ actorUserId: String(userRow.id), actorRole: role, action: 'auth.login', targetType: 'user', targetId: String(userRow.id) });

  return res.json({ user: mapUser(userRow) });
});

router.post('/logout', requireAuth, (req: AuthenticatedRequest, res) => {
  res.clearCookie('cyberpath_session', {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.cookieSecure,
    path: '/'
  });
  createAuditLog({ actorUserId: req.user?.userId, actorRole: req.user?.role, action: 'auth.logout', targetType: 'user', targetId: req.user?.userId });
  return res.json({ message: 'Logged out.' });
});

router.post('/request-password-reset', authLimiter, async (req, res) => {
  const parsed = requestResetSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Provide a valid email.' });
  }

  const userRow = one<Record<string, unknown> | null>('SELECT * FROM users WHERE email = ?', parsed.data.email.toLowerCase());
  if (!userRow) {
    return res.json({ message: 'If that account exists, a reset email has been queued.' });
  }

  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashResetToken(token);
  const now = nowIso();
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();

  run('UPDATE password_reset_tokens SET used_at = ? WHERE user_id = ? AND used_at IS NULL', now, String(userRow.id));
  run(
    `INSERT INTO password_reset_tokens (id, user_id, token, expires_at, created_at)
     VALUES (?, ?, ?, ?, ?)`,
    makeId(),
    String(userRow.id),
    tokenHash,
    expiresAt,
    now
  );

  const resetUrl = `${env.clientUrl}/#/reset-password?token=${token}`;
  await sendTransactionalEmail({
    userId: String(userRow.id),
    toEmail: String(userRow.email),
    subject: 'CyberPath Academy password reset',
    textBody: `Use this password reset link within 30 minutes: ${resetUrl}`,
    htmlBody: `<p>Use this password reset link within 30 minutes:</p><p><a href="${resetUrl}">${resetUrl}</a></p>`,
    messageType: 'password_reset',
    metadata: { expiresAt }
  });

  createAuditLog({ actorUserId: String(userRow.id), actorRole: String(userRow.role) as any, action: 'auth.password_reset_requested', targetType: 'user', targetId: String(userRow.id) });

  return res.json({
    message: 'If that account exists, a reset email has been queued.',
    devResetToken: env.nodeEnv === 'development' ? token : undefined
  });
});

router.post('/reset-password', authLimiter, async (req, res) => {
  const parsed = resetSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid password reset payload.', errors: parsed.error.flatten() });
  }

  const reset = one<Record<string, unknown> | null>('SELECT * FROM password_reset_tokens WHERE token = ?', hashResetToken(parsed.data.token));
  if (!reset || reset.used_at || new Date(String(reset.expires_at)) < new Date()) {
    return res.status(400).json({ message: 'Reset token is invalid or expired.' });
  }

  const passwordHash = await hashPassword(parsed.data.password);
  const now = nowIso();
  run('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?', passwordHash, now, String(reset.user_id));
  run('UPDATE password_reset_tokens SET used_at = ? WHERE id = ?', now, String(reset.id));
  createAuditLog({ actorUserId: String(reset.user_id), action: 'auth.password_reset_completed', targetType: 'user', targetId: String(reset.user_id) });

  return res.json({ message: 'Password updated. You can now log in.' });
});

router.get('/me', requireAuth, (req: AuthenticatedRequest, res) => {
  const user = mapUser(one<Record<string, unknown> | null>('SELECT * FROM users WHERE id = ?', req.user!.userId));
  return res.json({ user });
});

export default router;
