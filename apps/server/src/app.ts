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
import caseRoutes from './routes/cases.js';
import socRoutes from './routes/soc.js';
import progressRoutes from './routes/progress.js';
import profileRoutes from './routes/profile.js';
import communityCaseRoutes from './routes/communityCases.js';
import eventRoutes from './routes/event.js';
import discussionRoutes from './routes/discussions.js';
import examRoutes, { examVerifyRouter } from './routes/exams.js';
import { errorHandler } from './middleware/error.js';
import { env } from './config/env.js';
import { initDb, one } from './lib/db.js';
import { apiLimiter, enforceCsrf, enforceOrigin, ensureCsrfCookie } from './middleware/security.js';
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
app.use(apiLimiter);
app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());
app.use(ensureCsrfCookie);
app.use(enforceOrigin);
app.use(enforceCsrf);

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
app.use('/api/teacher', mentorRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/platform', platformRoutes);
app.use('/api/cases', caseRoutes);
app.use('/api/soc', socRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/community-cases', communityCaseRoutes);
app.use('/api/event', eventRoutes);
app.use('/api/discussions', discussionRoutes);
app.use('/api/exams/verify', examVerifyRouter);
app.use('/api/exams', examRoutes);

const webDistPath = path.resolve(process.cwd(), 'apps/web/dist');
if (env.isProduction && fs.existsSync(webDistPath)) {
  app.use(express.static(webDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) return next();
    res.sendFile(path.join(webDistPath, 'index.html'));
  });
}

app.use(errorHandler);
