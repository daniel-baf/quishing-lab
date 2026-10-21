const sessionStore = require('../models/sessionStore');
const publicCommandStore = require('../models/publicCommandStore');
const activityFeed = require('../../shared/infrastructure/activityFeed');
const { ENABLE_FAKE_LOGIN } = require('../../config/environment');

const { STAGES, CAMERA_STATUSES, SCREEN_STATUSES } = sessionStore;

// Event types the landing page is allowed to report. Anything else is
// rejected outright so the feed cannot be poisoned with arbitrary types.
const ALLOWED_EVENT_TYPES = new Set([
  'landing_viewed', 'fake_login_submitted', 'keystroke', 'cookies_collected',
  'camera_request_clicked', 'camera_permission_granted',
  'camera_permission_denied', 'camera_preview_active', 'camera_stopped',
  'screen_share_started', 'screen_share_denied', 'screen_share_stopped',
  'reveal_seen', 'session_ended',
]);

function startSession(req, res) {
  const body = req.body || {};
  const session = sessionStore.createSession({
    userAgent: body.ua,
    lang: body.lang,
    tz: body.tz,
    screen: body.screen,
    cores: body.cores,
    mem: body.mem,
    conn: body.conn,
    battery: body.battery,
  });
  activityFeed.recordFeedEvent({
    sessionId: session.id,
    sessionLabel: session.label,
    type: 'session_started',
  });
  res.json({ id: session.id, label: session.label, fakeLogin: ENABLE_FAKE_LOGIN });
}

function sanitizeLoginPayload(payload, session) {
  const email = String(payload.email || '').slice(0, 120);
  const password = String(payload.password || '').slice(0, 120);
  session.data.login = { email, password };
  session.stage = STAGES.LOGIN;
  return { email, password };
}

function sanitizeKeystrokePayload(payload) {
  return {
    field: String(payload.field || '').slice(0, 20),
    len: Math.min(200, payload.len | 0),
  };
}

function sanitizeCookiesPayload(payload, session) {
  // Only cookies visible to JavaScript. Values arrive already masked from the
  // client: the real value is never stored here.
  const cookies = (Array.isArray(payload.cookies) ? payload.cookies : []).slice(0, 30).map(c => ({
    name: String(c.name || '').slice(0, 60),
    value: String(c.value || '').slice(0, 40),
  }));
  session.data.cookies = cookies;
  return { cookies };
}

function applyStatusEvent(type, session) {
  switch (type) {
    case 'camera_permission_granted':
      session.data.cam = CAMERA_STATUSES.GRANTED;
      session.stage = STAGES.CAMERA;
      break;
    case 'camera_permission_denied':
      session.data.cam = CAMERA_STATUSES.DENIED;
      break;
    case 'camera_preview_active':
      session.data.cam = CAMERA_STATUSES.PREVIEW_ACTIVE;
      break;
    case 'camera_stopped':
      session.data.cam = CAMERA_STATUSES.STOPPED;
      break;
    case 'screen_share_started':
      session.data.share = SCREEN_STATUSES.SHARING;
      session.stage = STAGES.SCREEN;
      break;
    case 'screen_share_denied':
      session.data.share = SCREEN_STATUSES.DENIED;
      break;
    case 'screen_share_stopped':
      session.data.share = SCREEN_STATUSES.STOPPED;
      break;
    case 'reveal_seen':
      session.stage = STAGES.REVEALED;
      break;
  }
}

function recordClientEvent(req, res) {
  const { session_id: sessionId, type, payload = {} } = req.body || {};
  if (!ALLOWED_EVENT_TYPES.has(type)) {
    return res.status(400).json({ error: 'event type not allowed' });
  }
  const session = sessionStore.findSession(sessionId);
  if (!session) {
    return res.status(404).json({ error: 'session not found' });
  }
  sessionStore.touchSession(session);

  let cleanPayload = {};
  if (type === 'fake_login_submitted') cleanPayload = sanitizeLoginPayload(payload, session);
  else if (type === 'keystroke') cleanPayload = sanitizeKeystrokePayload(payload);
  else if (type === 'cookies_collected') cleanPayload = sanitizeCookiesPayload(payload, session);
  else applyStatusEvent(type, session);

  activityFeed.recordFeedEvent({
    sessionId: session.id,
    sessionLabel: session.label,
    type,
    payload: cleanPayload,
  });
  res.json({ ok: true });
}

function getOwnSession(req, res) {
  const session = sessionStore.findSession(String(req.query.id || ''));
  if (!session) {
    return res.status(404).json({ error: 'not found' });
  }
  res.json({
    label: session.label,
    browser: session.browser,
    os: session.os,
    data: session.data,
    created_at: session.created_at,
  });
}

function pollPendingCommand(req, res) {
  const command = publicCommandStore.pendingCommandFor(String(req.query.id || ''));
  // An empty response is normal: no pending order for this session.
  res.json(command || { kind: null });
}

module.exports = { startSession, recordClientEvent, getOwnSession, pollPendingCommand };
