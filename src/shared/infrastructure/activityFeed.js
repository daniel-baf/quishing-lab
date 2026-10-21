const crypto = require('crypto');
const sseHub = require('./sseHub');

// Bounded, in-memory log of everything that happened during the demo. It backs
// the "live events" feed on the dashboard and nothing else.
const MAX_FEED_ENTRIES = 800;
const feed = [];

function recordFeedEvent({ sessionId = null, sessionLabel = null, type, payload = {} }) {
  const entry = {
    id: crypto.randomUUID(),
    session_id: sessionId,
    type,
    created_at: Date.now(),
    label: sessionLabel,
    payload,
  };
  feed.push(entry);
  if (feed.length > MAX_FEED_ENTRIES) feed.shift();
  sseHub.broadcastFeedEvent(entry);
  return entry;
}

function recentFeedEntries(limit = 60) {
  return feed.slice(-limit).reverse();
}

function clearFeed() {
  feed.length = 0;
}

module.exports = { recordFeedEvent, recentFeedEntries, clearFeed };
