const path = require('path');
const express = require('express');

const { EVENT_RATE_LIMITER } = require('./shared/infrastructure/rateLimiter');
const sessionRoutes = require('./sessions/api/routes');
const liveRoutes = require('./live/api/routes');
const lootRoutes = require('./loot/api/routes');
const adminRoutes = require('./admin/api/routes');
const publicConfigRoutes = require('./publicConfig/api/routes');
const sessionStore = require('./sessions/models/sessionStore');

const PUBLIC_DIR = path.join(__dirname, '..', 'public');

function createApplication() {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', true);

  // Screen frames (base64 JPEG) are far bigger than a regular event, so only
  // /api/screen gets the large parser; everything else keeps the strict limit.
  const smallJsonParser = express.json({ limit: '8kb' });
  const largeJsonParser = express.json({ limit: '3mb' });
  app.use((req, res, next) =>
    (req.path === '/api/screen' ? largeJsonParser : smallJsonParser)(req, res, next));

  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'no-referrer');
    next();
  });

  // Domain routers. The admin router keeps its own /api/admin mount point on
  // purpose: its auth middleware (router.use) would otherwise intercept every
  // /api request that reaches it, including routes owned by other domains.
  app.use('/api', sessionRoutes);
  app.use('/api', liveRoutes);
  app.use('/api', lootRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api', publicConfigRoutes);

  app.get('/health', (req, res) => res.json({
    ok: true,
    sessions: sessionStore.allSessions().length,
    uptime_s: Math.round(process.uptime()),
  }));

  app.get('/admin', (req, res) => res.sendFile(path.join(PUBLIC_DIR, 'admin.html')));
  app.use(express.static(PUBLIC_DIR));

  return app;
}

module.exports = { createApplication };
