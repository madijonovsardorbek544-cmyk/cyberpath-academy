import { NextFunction, Request, Response } from 'express';
import { verifySession } from '../utils/auth.js';
import type { Role } from '../lib/db.js';

export type AuthenticatedRequest = Request & {
  user?: {
    userId: string;
    role: Role;
  };
};

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const token = req.cookies.cyberpath_session || req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ message: 'Authentication required.' });
  }

  try {
    const session = verifySession(token);
    req.user = { userId: session.userId, role: session.role };
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
