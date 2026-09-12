import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../../config/index.js';
import { ANONYMOUS_VIEWER, type Viewer } from '../../domain/entitlements.js';

/**
 * Optional authentication (research.md R-09).
 *
 * Signed-out visitors READ SONG PAGES. Serving a stored explanation costs almost
 * nothing, and a login wall before anyone sees value would suppress adoption.
 *
 * This is the easy thing to get wrong: a missing or invalid token must fall
 * through to the anonymous viewer, NOT a 401. Only routes that genuinely need
 * an identity reject, and they do so themselves.
 */

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace -- Express augmentation requires it
  namespace Express {
    interface Request {
      viewer: Viewer;
    }
  }
}

interface TokenPayload {
  sub: string;
  plan?: string;
}

function isPlan(value: unknown): value is Viewer['plan'] {
  return value === 'basic' || value === 'pro';
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  req.viewer = ANONYMOUS_VIEWER;

  const header = req.headers.authorization;
  if (header === undefined || !header.startsWith('Bearer ')) {
    next();
    return;
  }

  const token = header.slice('Bearer '.length);
  try {
    const payload = jwt.verify(token, config.JWT_SECRET) as TokenPayload;
    req.viewer = {
      userId: payload.sub,
      // An unrecognised plan claim degrades to basic rather than being trusted.
      // Usage counts are loaded from the database by the routes that need them;
      // a token must never be the source of how much quota someone has left.
      plan: isPlan(payload.plan) ? payload.plan : 'basic',
      researchUsedThisMonth: 0,
      librarySavedCount: 0,
    };
  } catch {
    // An expired or forged token is treated as no token. The visitor still
    // reads the page; they simply are not signed in.
    req.viewer = ANONYMOUS_VIEWER;
  }

  next();
}

/** For routes that genuinely need an identity. Not used by the song page. */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (req.viewer.userId === null) {
    res.status(401).json({ error: 'authentication required' });
    return;
  }
  next();
}
