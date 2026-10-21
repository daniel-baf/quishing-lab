const sessionStore = require('../../sessions/models/sessionStore');
const publicCommandStore = require('../../sessions/models/publicCommandStore');
const lootStore = require('../../loot/models/lootStore');
const activityFeed = require('../../shared/infrastructure/activityFeed');

const { CAMERA_STATUSES, SCREEN_STATUSES } = sessionStore;

function allSessionIds() {
  return sessionStore.allSessions().map(s => s.id);
}

function getDashboardStats(req, res) {
  const all = sessionStore.allSessions();
  const counters = {
    visits: all.length,
    logins: all.filter(s => s.data.login).length,
    cameraRequests: all.filter(s => s.data.cam !== CAMERA_STATUSES.NOT_REQUESTED).length,
    cameraGranted: all.filter(s =>
      [CAMERA_STATUSES.GRANTED, CAMERA_STATUSES.PREVIEW_ACTIVE].includes(s.data.cam)).length,
    cameraDenied: all.filter(s => s.data.cam === CAMERA_STATUSES.DENIED).length,
    screens: all.filter(s => s.data.share === SCREEN_STATUSES.SHARING).length,
    lootExecutions: lootStore.lootCounters().executions,
    lootStolen: lootStore.lootCounters().stolen,
  };
  res.json({
    sessions: all.map(s => ({
      id: s.id,
      label: s.label,
      stage: s.stage,
      browser: s.browser,
      os: s.os,
      last_seen: s.last_seen,
      data: s.data,
    })),
    events: activityFeed.recentFeedEntries(60),
    counters,
    loots: lootStore.recentLoots(50),
  });
}

function revealToParticipants(req, res) {
  publicCommandStore.issuePublicCommand('reveal', allSessionIds());
  activityFeed.recordFeedEvent({ type: 'reveal_activated' });
  res.json({ ok: true });
}

function resetDemo(req, res) {
  publicCommandStore.issuePublicCommand('reset', allSessionIds());
  sessionStore.clearAllSessions();
  activityFeed.clearFeed();
  lootStore.clearLoots();
  res.json({ ok: true });
}

module.exports = { getDashboardStats, revealToParticipants, resetDemo };
