import rateLimit from 'express-rate-limit';
import type { NextFunction, Request, Response } from 'express';
import { env } from '../config/env.js';

const allowedOrigins = new Set([env.clientUrl, env.appBaseUrl]);

export const apiLimiter = rateLimit({
  windowMs: 60_000,
  max: env.rateLimitMax,
  standardHeaders: true,
  legacyHeaders: false
});

export const authLimiter = rateLimit({
  windowMs: 60_000,
  max: env.authRateLimitMax,
  standardHeaders: true,
  legacyHeaders: false
});

export function enforceOrigin(req: Request, res: Response, next: NextFunction) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  const origin = req.header('origin');
  if (!origin) return next();
  if (allowedOrigins.has(origin)) return next();
  return res.status(403).json({ message: 'Blocked by origin policy.' });
}
