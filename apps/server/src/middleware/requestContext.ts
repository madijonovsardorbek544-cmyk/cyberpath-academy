import crypto from 'crypto';
import type { NextFunction, Request, Response } from 'express';
import { logger } from '../utils/logger.js';

declare module 'express-serve-static-core' {
  interface Request {
    requestId?: string;
    requestStartedAt?: number;
  }
}

export function requestContext(req: Request, res: Response, next: NextFunction) {
  const requestId = req.header('x-request-id') || crypto.randomUUID();
  req.requestId = requestId;
  req.requestStartedAt = Date.now();
  res.setHeader('x-request-id', requestId);

  res.on('finish', () => {
    const durationMs = typeof req.requestStartedAt === 'number' ? Date.now() - req.requestStartedAt : undefined;
    logger.info('request.complete', {
      requestId,
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      durationMs,
      ip: req.ip
    });
  });

  next();
}
