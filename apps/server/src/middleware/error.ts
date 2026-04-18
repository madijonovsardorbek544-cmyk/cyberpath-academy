import type { NextFunction, Request, Response } from 'express';
import { logger } from '../utils/logger.js';
import { makeId, nowIso, run, toDbJson } from '../lib/db.js';

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  const errorMessage = err instanceof Error ? err.message : String(err);
  logger.error('request.error', {
    requestId: req.requestId ?? null,
    path: req.originalUrl,
    method: req.method,
    error: errorMessage
  });

  try {
    run(
      `INSERT INTO app_error_events (id, request_id, user_id, method, path, status_code, message, stack, metadata, created_at)
       VALUES (?, ?, NULL, ?, ?, 500, ?, ?, ?, ?)`,
      makeId(),
      req.requestId ?? null,
      req.method,
      req.originalUrl,
      errorMessage,
      err instanceof Error ? err.stack ?? null : null,
      toDbJson({ userAgent: req.get('user-agent') ?? null, ip: req.ip }),
      nowIso()
    );
  } catch {}

  return res.status(500).json({
    message: err instanceof Error ? err.message : 'Unexpected server error.',
    requestId: req.requestId ?? null
  });
}
