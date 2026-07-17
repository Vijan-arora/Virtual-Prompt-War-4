// Express application wiring: security middleware, API routes, and static
// serving of the built React client. Route handlers dispatch to feature
// services; errors funnel into the central error handler.
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import compression from 'compression';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';

import { APP_VERSION, JSON_BODY_LIMIT } from './config/constants.js';
import { env } from './config/env.js';
import { assistantRoutes } from './features/assistant/routes.js';
import { operationsRoutes } from './features/operations/routes.js';
import { stadiumRoutes } from './features/stadium/routes.js';
import { errorHandler, notFoundHandler } from './middleware/error-handler.js';
import { apiLimiter } from './middleware/rate-limit.js';

const CLIENT_DIST_PATH = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../client/dist',
);

/** One year in seconds — safe for content-hashed Vite assets. */
const IMMUTABLE_ASSET_MAX_AGE_MS = 365 * 24 * 60 * 60 * 1000;

function corsOrigins(): string[] {
  return env.ALLOWED_ORIGINS.split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin !== '');
}

function mountClient(app: express.Express): void {
  app.use(
    express.static(CLIENT_DIST_PATH, {
      index: false,
      maxAge: IMMUTABLE_ASSET_MAX_AGE_MS,
      immutable: true,
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('.html')) {
          res.setHeader('Cache-Control', 'no-cache');
        }
      },
    }),
  );
  // SPA fallback: every non-API GET renders the client shell.
  app.get(/^\/(?!api\/).*/, (_req, res) => {
    res.setHeader('Cache-Control', 'no-cache');
    res.sendFile(path.join(CLIENT_DIST_PATH, 'index.html'));
  });
}

/** Builds the fully-wired Express app (exported for supertest). */
export function buildApp(): express.Express {
  const app = express();
  app.set('trust proxy', 1);
  app.disable('x-powered-by');

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          // Stylesheets must be same-origin; only inline style *attributes*
          // (React's data-driven `style` prop) are allowed, not inline
          // <style> blocks — a tighter grant than a blanket 'unsafe-inline'.
          styleSrc: ["'self'"],
          styleSrcAttr: ["'unsafe-inline'"],
          imgSrc: ["'self'", 'data:'],
          connectSrc: ["'self'"],
          objectSrc: ["'none'"],
          frameAncestors: ["'none'"],
        },
      },
    }),
  );
  app.use(cors({ origin: corsOrigins() }));
  app.use(compression());
  app.use(express.json({ limit: JSON_BODY_LIMIT }));

  // Liveness endpoint. Placed under /api so it shares the same base path as
  // all API routes and is ahead of the rate limiter so health checks are never throttled.
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', version: APP_VERSION });
  });

  // RFC 9116 security contact information
  app.get('/.well-known/security.txt', (_req, res) => {
    res.type('text/plain');
    res.send(
      [
        'Contact: https://github.com/Vijan-arora',
        'Expires: 2027-12-31T23:59:59Z',
        'Preferred-Languages: en',
        'Policy: https://github.com/Vijan-arora/ArenaFlow/blob/main/SECURITY.md',
      ].join('\n') + '\n',
    );
  });

  app.use('/api', apiLimiter);
  app.use('/api/stadium', stadiumRoutes);
  app.use('/api/assistant', assistantRoutes);
  app.use('/api/operations', operationsRoutes);

  mountClient(app);

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
