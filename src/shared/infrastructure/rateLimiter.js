// In-memory sliding-window rate limiter keyed by client IP. Good enough for a
// demo that lives for minutes and never persists state.
function createRateLimiter({ windowMs, maxRequests, message }) {
  const requestTimestampsByIp = new Map();

  return function rateLimitMiddleware(req, res, next) {
    const now = Date.now();
    const recent = (requestTimestampsByIp.get(req.ip) || []).filter(t => now - t < windowMs);
    if (recent.length >= maxRequests) {
      return res.status(429).json({ error: message });
    }
    recent.push(now);
    requestTimestampsByIp.set(req.ip, recent);
    next();
  };
}

// Discrete events from the landing page: strict budget.
const EVENT_RATE_LIMITER = createRateLimiter({
  windowMs: 10_000,
  maxRequests: 30,
  message: 'too many events',
});

// High-frequency live traffic (keystroke mirror + ~2 fps screen frames): a
// much looser budget, still bounded.
const LIVE_RATE_LIMITER = createRateLimiter({
  windowMs: 10_000,
  maxRequests: 120,
  message: 'too much live traffic',
});

module.exports = { createRateLimiter, EVENT_RATE_LIMITER, LIVE_RATE_LIMITER };
