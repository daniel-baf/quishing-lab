const crypto = require('crypto');
const { parseBrowser, parseOperatingSystem } = require('../../shared/infrastructure/parsers');

// All participant sessions, keyed by id. Everything is in memory and vanishes
// when the process stops; "Reiniciar" on the dashboard clears it mid-demo.
const sessions = new Map();

// Pipeline stages the landing page walks through. Stored in English so the
// API speaks one language; the UI translates for display.
const STAGES = {
  LANDING: 'landing',
  LOGIN: 'login',
  CAMERA: 'camera',
  SCREEN: 'screen',
  REVEALED: 'revealed',
};

// Camera/screen consent states. The browser is always in charge; these only
// record what the participant decided.
const CAMERA_STATUSES = {
  NOT_REQUESTED: 'not_requested',
  GRANTED: 'granted',
  DENIED: 'denied',
  PREVIEW_ACTIVE: 'preview_active',
  STOPPED: 'stopped',
};

const SCREEN_STATUSES = {
  NOT_REQUESTED: 'not_requested',
  SHARING: 'sharing',
  DENIED: 'denied',
  STOPPED: 'stopped',
};

// Readable, stable labels for any number of participants: A…Z, AA…AZ, BA…
// The demo is not capped at four phones.
function generateSessionLabel(index) {
  let label = '';
  let value = index + 1;
  while (value > 0) {
    value -= 1;
    label = String.fromCharCode(65 + (value % 26)) + label;
    value = Math.floor(value / 26);
  }
  return label;
}

function createSession(fingerprint) {
  const id = crypto.randomUUID();
  const label = generateSessionLabel(sessions.size);
  const session = {
    id,
    label,
    created_at: Date.now(),
    last_seen: Date.now(),
    stage: STAGES.LANDING,
    browser: parseBrowser(fingerprint.userAgent),
    os: parseOperatingSystem(fingerprint.userAgent),
    data: {
      lang: String(fingerprint.lang || '').slice(0, 20),
      tz: String(fingerprint.tz || '').slice(0, 40),
      screen: String(fingerprint.screen || '').slice(0, 20),
      cores: fingerprint.cores > 0 ? fingerprint.cores | 0 : null,
      mem: fingerprint.mem > 0 ? fingerprint.mem | 0 : null,
      conn: String(fingerprint.conn || '').slice(0, 10),
      battery: (fingerprint.battery === null || fingerprint.battery === undefined)
        ? null
        : Math.max(0, Math.min(100, fingerprint.battery | 0)),
      login: null,
      cam: CAMERA_STATUSES.NOT_REQUESTED,
      share: SCREEN_STATUSES.NOT_REQUESTED,
      // Live mirror of the tab: what the landing page sees the participant
      // type. Reported by the landing itself, shown only on the dashboard.
      mirror: { section: 'stage1', email: '', pass: '' },
    },
  };
  sessions.set(id, session);
  return session;
}

function findSession(id) {
  return sessions.get(id);
}

function touchSession(session) {
  session.last_seen = Date.now();
}

function allSessions() {
  return [...sessions.values()];
}

function clearAllSessions() {
  sessions.clear();
}

module.exports = {
  STAGES,
  CAMERA_STATUSES,
  SCREEN_STATUSES,
  createSession,
  findSession,
  touchSession,
  allSessions,
  clearAllSessions,
};
