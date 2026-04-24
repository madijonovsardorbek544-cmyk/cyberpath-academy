import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import fs from 'fs';
import path from 'path';
import authRoutes from './routes/auth.js';
import learningRoutes from './routes/learning.js';
import mentorRoutes from './routes/mentor.js';
import adminRoutes from './routes/admin.js';
import aiRoutes from './routes/ai.js';
import platformRoutes from './routes/platform.js';
import { errorHandler } from './middleware/error.js';
import { env } from './config/env.js';
import { initDb, one } from './lib/db.js';
import { apiLimiter, enforceOrigin } from './middleware/security.js';
import { requestContext } from './middleware/requestContext.js';

initDb();

export const app = express();

const connectSrc = Array.from(new Set(["'self'", env.clientUrl, env.appBaseUrl]));
const helmetOptions = {
  crossOriginResourcePolicy: false,
  contentSecurityPolicy: env.isProduction
    ? {
        useDefaults: true,
        directives: {
          defaultSrc: ["'self'"],
          baseUri: ["'self'"],
          objectSrc: ["'none'"],
          frameAncestors: ["'none'"],
          formAction: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          fontSrc: ["'self'", 'data:'],
          scriptSrc: ["'self'"],
          scriptSrcAttr: ["'none'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          connectSrc,
          upgradeInsecureRequests: []
        }
      }
    : false
} satisfies Parameters<typeof helmet>[0];

app.set('trust proxy', 1);
app.use(requestContext);
app.use(cors({ origin: env.clientUrl, credentials: true }));
app.use(helmet(helmetOptions));
app.use(enforceOrigin);
app.use(apiLimiter);
app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'cyberpath-api', timestamp: new Date().toISOString() });
});

app.get('/api/ready', (_req, res) => {
  try {
    one<Record<string, unknown> | null>('SELECT id FROM users LIMIT 1');
    res.json({ status: 'ready' });
  } catch {
    res.status(500).json({ status: 'error' });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/learning', learningRoutes);
app.use('/api/mentor', mentorRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/platform', platformRoutes);

const webDistPath = path.resolve(process.cwd(), 'apps/web/dist');
if (env.isProduction && fs.existsSync(webDistPath)) {
  app.use(express.static(webDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) return next();
    res.sendFile(path.join(webDistPath, 'index.html'));
  });
}

app.use(errorHandler);
