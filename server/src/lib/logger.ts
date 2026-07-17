// Structured JSON logger. The `severity` field lets log aggregators (e.g.
// Render logs, Cloud Logging) classify entries natively.
import { pino } from 'pino';

import { env } from '../config/env.js';

/** Application-wide structured logger (never use console.log). */
export const logger = pino({
  level: env.LOG_LEVEL,
  messageKey: 'message',
  formatters: {
    level: (label) => ({ severity: label.toUpperCase(), level: label }),
  },
});
