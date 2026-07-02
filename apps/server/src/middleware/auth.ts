import { NextFunction, Request, Response } from 'express';
import { verifySession } from '../utils/auth.js';
import { nowIso, one, run, type Role } from '../lib/db.js';

export type AuthenticatedRequest = Request & {
  user?: {
    userId: string;
    role: Role;
    sessionId?: string;
  };
};

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const token = req.cookies.cyberpath_session || req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ message: 'Authentication required.' });
  }

  try {
    const session = verifySession(token);
    if (session.sessionId) {
      const sessionRow = one<Record<string, unknown> | null>('SELECT * FROM user_sessions WHERE token_id = ?', session.sessionId);
      if (!sessionRow || sessionRow.revoked_at || new Date(String(sessionRow.expires_at)) < new Date()) {
        return res.status(401).json({ message: 'Invalid or expired session.' });
      }
      run('UPDATE user_sessions SET last_seen_at = ? WHERE token_id = ?', nowIso(), session.sessionId);
    }
    req.user = { userId: session.userId, role: session.role, sessionId: session.sessionId };
    return next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired session.' });
  }
}

export function requireRole(roles: Role[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'You do not have access to this resource.' });
    }
    return next();
  };
}
