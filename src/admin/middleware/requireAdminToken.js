const { ADMIN_TOKEN } = require('../../config/environment');

// The dashboard is protected by a shared token: either the x-admin-token
// header (what the panel JS sends) or a ?token= query param (used by direct
// links and the SSE stream).
function requireAdminToken(req, res, next) {
  if (req.headers['x-admin-token'] === ADMIN_TOKEN || req.query.token === ADMIN_TOKEN) {
    return next();
  }
  res.status(401).json({ error: 'unauthorized' });
}

module.exports = { requireAdminToken };
