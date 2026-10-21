const path = require('path');
const express = require('express');

const lootRoutes = require('./loot/api/routes');
const adminRoutes = require('./admin/api/routes');
const publicConfigRoutes = require('./publicConfig/api/routes');

const PUBLIC_DIR = path.join(__dirname, '..', 'public');

function createApplication() {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', true);
  app.use(express.json({ limit: '8kb' }));

  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'no-referrer');
    next();
  });

  // Domain routers. The admin router keeps its own /api/admin mount point on
  // purpose: its auth middleware (router.use) would otherwise intercept every
  // /api request that reaches it, including routes owned by other domains.
  app.use('/api', lootRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api', publicConfigRoutes);

  app.get('/health', (req, res) => res.json({ ok: true, uptime_s: Math.round(process.uptime()) }));

  // The panel is the product; there is no public landing anymore.
  app.get('/', (req, res) => res.redirect('/admin'));
  app.get('/admin', (req, res) => res.sendFile(path.join(PUBLIC_DIR, 'admin.html')));
  app.use(express.static(PUBLIC_DIR));

  return app;
}

module.exports = { createApplication };
