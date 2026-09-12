import type { NextFunction, Request, Response } from 'express';
import { config } from '../../config/index.js';

/**
 * Structured logging and the error boundary.
 *
 * CLAUDE.md §6: no error is swallowed into a default that looks like success.
 * An unexpected error is logged in full and answered with a generic message —
 * the client learns nothing exploitable, and the log keeps everything needed to
 * diagnose it.
 */

const LEVELS = { debug: 10, info: 20, warn: 30, error: 40 } as const;
type Level = keyof typeof LEVELS;

function emit(level: Level, message: string, fields: Record<string, unknown> = {}): void {
  if (LEVELS[level] < LEVELS[config.LOG_LEVEL]) return;
  const line = JSON.stringify({ level, message, time: new Date().toISOString(), ...fields });
  if (level === 'error' || level === 'warn') console.error(line);
  else console.log(line);
}

export const log = {
  debug: (m: string, f?: Record<string, unknown>) => emit('debug', m, f),
  info: (m: string, f?: Record<string, unknown>) => emit('info', m, f),
  warn: (m: string, f?: Record<string, unknown>) => emit('warn', m, f),
  error: (m: string, f?: Record<string, unknown>) => emit('error', m, f),
};

/** An error the client is allowed to see the reason for. */
export class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly reason?: string,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

export function notFound(_req: Request, res: Response): void {
  res.status(404).json({ error: 'not found' });
}

export function errorHandler(
  error: unknown,
  req: Request,
  res: Response,
  // Express identifies the error handler by arity; the parameter must stay.
  _next: NextFunction,
): void {
  if (error instanceof HttpError) {
    log.warn('request refused', {
      status: error.status,
      reason: error.reason,
      path: req.path,
    });
    res.status(error.status).json({
      error: error.message,
      ...(error.reason === undefined ? {} : { reason: error.reason }),
    });
    return;
  }

  // Unexpected. Log everything, tell the client nothing.
  log.error('unhandled error', {
    path: req.path,
    method: req.method,
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
  });
  res.status(500).json({ error: 'internal error' });
}
