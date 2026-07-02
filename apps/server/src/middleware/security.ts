import rateLimit from 'express-rate-limit';
import type { NextFunction, Request, Response } from 'express';
import crypto from 'crypto';
import { env } from '../config/env.js';
import { createAuditLog } from '../utils/audit.js';

const allowedOrigins = new Set([env.clientUrl, env.appBaseUrl]);
const unsafeMethods = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

function clientKey(req: Request) {
  const email = typeof req.body?.email === 'string' ? req.body.email.toLowerCase() : 'anonymous';
  return `${req.ip}:${email}`;
}

export const apiLimiter = rateLimit({
  windowMs: 60_000,
  max: env.rateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip ?? 'unknown',
  handler: (req, res) => {
    createAuditLog({ action: 'security.rate_limited', targetType: 'request', metadata: { path: req.path, ip: req.ip } });
    res.status(429).json({ message: 'Too many requests. Please wait and try again.' });
  }
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60_000,
  max: env.authRateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  keyGenerator: clientKey,
  handler: (req, res) => {
    createAuditLog({ action: 'security.auth_rate_limited', targetType: 'auth', metadata: { path: req.path, ip: req.ip, email: req.body?.email } });
    res.status(429).json({ message: 'Too many authentication attempts. Please wait and try again.' });
  }
});

export function enforceOrigin(req: Request, res: Response, next: NextFunction) {
  if (!unsafeMethods.has(req.method)) return next();
  const origin = req.header('origin');
  if (origin && allowedOrigins.has(origin)) return next();
  createAuditLog({ action: 'security.origin_blocked', targetType: 'request', metadata: { path: req.path, origin: origin ?? null, ip: req.ip } });
  return res.status(403).json({ message: 'Blocked by origin policy.' });
}

export function ensureCsrfCookie(req: Request, res: Response, next: NextFunction) {
  if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  const existing = req.cookies?.cyberpath_csrf;
  if (!existing) {
    res.cookie('cyberpath_csrf', crypto.randomBytes(32).toString('hex'), {
      httpOnly: false,
      sameSite: 'lax',
      secure: env.cookieSecure,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/'
    });
  }
  next();
}

export function enforceCsrf(req: Request, res: Response, next: NextFunction) {
  if (!unsafeMethods.has(req.method)) return next();
  if (req.headers.authorization?.startsWith('Bearer ')) return next();
  if (!req.cookies?.cyberpath_session) return next();
  const cookieToken = req.cookies?.cyberpath_csrf;
  if (!cookieToken) return next();
  const headerToken = req.header('x-csrf-token');
  if (cookieToken && headerToken && cookieToken.length === headerToken.length && crypto.timingSafeEqual(Buffer.from(cookieToken), Buffer.from(headerToken))) return next();
  createAuditLog({ action: 'security.csrf_blocked', targetType: 'request', metadata: { path: req.path, ip: req.ip } });
  return res.status(403).json({ message: 'CSRF token is missing or invalid.' });
}
