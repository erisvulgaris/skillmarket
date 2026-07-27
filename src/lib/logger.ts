type LogLevel = 'info' | 'warn' | 'error';

interface LogMeta {
  [key: string]: unknown;
}

const isProduction = process.env.NODE_ENV === 'production';

function iso(): string {
  return new Date().toISOString();
}

function formatDev(level: LogLevel, message: string, meta?: LogMeta): string {
  const prefix = `[${iso()}] [${level.toUpperCase()}]`;
  const base = `${prefix} ${message}`;
  if (meta && Object.keys(meta).length > 0) {
    return `${base} ${JSON.stringify(meta, null, 2)}`;
  }
  return base;
}

function formatJSON(level: LogLevel, message: string, meta?: LogMeta): string {
  return JSON.stringify({ timestamp: iso(), level, message, ...(meta ?? {}) });
}

export const logger = {
  info(message: string, meta?: LogMeta): void {
    if (isProduction) {
      console.log(formatJSON('info', message, meta));
    } else {
      console.log(formatDev('info', message, meta));
    }
  },

  warn(message: string, meta?: LogMeta): void {
    if (isProduction) {
      console.warn(formatJSON('warn', message, meta));
    } else {
      console.warn(formatDev('warn', message, meta));
    }
  },

  error(message: string, meta?: LogMeta): void {
    if (isProduction) {
      console.error(formatJSON('error', message, meta));
    } else {
      console.error(formatDev('error', message, meta));
    }
  },
};
