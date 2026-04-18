import { env } from '../config/env.js';

const levels = { debug: 10, info: 20, warn: 30, error: 40 } as const;

function shouldLog(level: keyof typeof levels) {
  return levels[level] >= levels[env.logLevel];
}

function write(level: keyof typeof levels, message: string, meta?: Record<string, unknown>) {
  if (!shouldLog(level)) return;
  const payload = {
    ts: new Date().toISOString(),
    level,
    message,
    ...(meta ? { meta } : {})
  };
  const line = JSON.stringify(payload);
  if (level === 'error') {
    console.error(line);
  } else if (level === 'warn') {
    console.warn(line);
  } else {
    console.log(line);
  }
}

export const logger = {
  debug: (message: string, meta?: Record<string, unknown>) => write('debug', message, meta),
  info: (message: string, meta?: Record<string, unknown>) => write('info', message, meta),
  warn: (message: string, meta?: Record<string, unknown>) => write('warn', message, meta),
  error: (message: string, meta?: Record<string, unknown>) => write('error', message, meta)
};
