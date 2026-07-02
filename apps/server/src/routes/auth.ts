import { Router, type Response } from 'express';
import crypto from 'crypto';
import { z } from 'zod';
import { loginSchema, requestResetSchema, resetSchema, signupSchema } from '@cyberpath/contracts';
import { comparePassword, hashPassword, signSession } from '../utils/auth.js';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';
import { authLimiter } from '../middleware/security.js';
import { env } from '../config/env.js';
import { createAuditLog } from '../utils/audit.js';
import { sendTransactionalEmail } from '../services/email.js';
import { makeId, mapUser, nowIso, one, run } from '../lib/db.js';

const router = Router();

const mfaVerifySchema = z.object({ challengeId: z.string().min(10), code: z.string().regex(/^\d{6}$/) });


function hashResetToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function createSession(userId: string, role: 'student' | 'mentor' | 'admin') {
  const sessionId = makeId();
  const now = nowIso();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  run('INSERT INTO user_sessions (id, user_id, token_id, expires_at, created_at, last_seen_at) VALUES (?, ?, ?, ?, ?, ?)', makeId(), userId, sessionId, expiresAt, now, now);
  return signSession({ userId, role, sessionId });
}

function issueMfaChallenge(userId: string) {
  const code = String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');
  const now = nowIso();
  const challengeId = makeId();
  run('INSERT INTO mfa_challenges (id, user_id, code_hash, expires_at, created_at) VALUES (?, ?, ?, ?, ?)', challengeId, userId, hashResetToken(code), new Date(Date.now() + 5 * 60 * 1000).toISOString(), now);
  return { challengeId, code };
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
  const token = createSession(id, 'student');
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

  if (userRow.locked_until && new Date(String(userRow.locked_until)) > new Date()) {
    createAuditLog({ actorUserId: String(userRow.id), actorRole: String(userRow.role) as any, action: 'auth.login_locked', targetType: 'user', targetId: String(userRow.id) });
    return res.status(423).json({ message: 'Account temporarily locked after repeated failed login attempts.' });
  }

  const ok = await comparePassword(parsed.data.password, String(userRow.password_hash));
  if (!ok) {
    const failures = Number(userRow.failed_login_count ?? 0) + 1;
    const lockedUntil = failures >= 5 ? new Date(Date.now() + 15 * 60 * 1000).toISOString() : null;
    run('UPDATE users SET failed_login_count = ?, locked_until = ? WHERE id = ?', failures, lockedUntil, String(userRow.id));
    createAuditLog({ actorUserId: String(userRow.id), actorRole: String(userRow.role) as any, action: 'auth.login_failed', targetType: 'user', targetId: String(userRow.id), metadata: { failures, locked: Boolean(lockedUntil) } });
    return res.status(401).json({ message: 'Invalid credentials.' });
  }

  const role = String(userRow.role) as 'student' | 'mentor' | 'admin';
  if (Number(userRow.mfa_enabled ?? 0) === 1) {
    const challenge = issueMfaChallenge(String(userRow.id));
    createAuditLog({ actorUserId: String(userRow.id), actorRole: role, action: 'auth.mfa_challenge', targetType: 'user', targetId: String(userRow.id) });
    return res.status(202).json({ mfaRequired: true, challengeId: challenge.challengeId, devMfaCode: env.nodeEnv === 'development' ? challenge.code : undefined });
  }
  run('UPDATE users SET failed_login_count = 0, locked_until = NULL WHERE id = ?', String(userRow.id));
  const token = createSession(String(userRow.id), role);
  setSessionCookie(res, token);
  createAuditLog({ actorUserId: String(userRow.id), actorRole: role, action: 'auth.login', targetType: 'user', targetId: String(userRow.id) });

  return res.json({ user: mapUser(userRow) });
});

router.post('/mfa/verify', authLimiter, async (req, res) => {
  const parsed = mfaVerifySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Invalid MFA payload.' });
  const challenge = one<Record<string, unknown> | null>('SELECT * FROM mfa_challenges WHERE id = ?', parsed.data.challengeId);
  if (!challenge || challenge.used_at || new Date(String(challenge.expires_at)) < new Date() || String(challenge.code_hash) !== hashResetToken(parsed.data.code)) {
    createAuditLog({ action: 'auth.mfa_failed', targetType: 'mfa_challenge', targetId: parsed.data.challengeId });
    return res.status(401).json({ message: 'Invalid or expired MFA code.' });
  }
  const userRow = one<Record<string, unknown>>('SELECT * FROM users WHERE id = ?', String(challenge.user_id));
  const role = String(userRow.role) as 'student' | 'mentor' | 'admin';
  const now = nowIso();
  run('UPDATE mfa_challenges SET used_at = ? WHERE id = ?', now, parsed.data.challengeId);
  run('UPDATE users SET failed_login_count = 0, locked_until = NULL WHERE id = ?', String(userRow.id));
  const token = createSession(String(userRow.id), role);
  setSessionCookie(res, token);
  createAuditLog({ actorUserId: String(userRow.id), actorRole: role, action: 'auth.mfa_verified', targetType: 'user', targetId: String(userRow.id) });
  return res.json({ user: mapUser(userRow) });
});

router.post('/logout', requireAuth, (req: AuthenticatedRequest, res) => {
  if (req.user?.sessionId) run('UPDATE user_sessions SET revoked_at = ? WHERE token_id = ?', nowIso(), req.user.sessionId);
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

router.post('/sessions/revoke-all', requireAuth, (req: AuthenticatedRequest, res) => {
  run('UPDATE user_sessions SET revoked_at = ? WHERE user_id = ? AND revoked_at IS NULL', nowIso(), req.user!.userId);
  createAuditLog({ actorUserId: req.user!.userId, actorRole: req.user!.role, action: 'auth.sessions_revoked', targetType: 'user', targetId: req.user!.userId });
  res.clearCookie('cyberpath_session', { httpOnly: true, sameSite: 'lax', secure: env.cookieSecure, path: '/' });
  return res.json({ message: 'All sessions revoked.' });
});

router.get('/me', requireAuth, (req: AuthenticatedRequest, res) => {
  const user = mapUser(one<Record<string, unknown> | null>('SELECT * FROM users WHERE id = ?', req.user!.userId));
  return res.json({ user });
});

export default router;
