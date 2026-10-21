const lootStore = require('../../loot/models/lootStore');

function getDashboardStats(req, res) {
  const counters = lootStore.lootCounters();
  res.json({ counters, loots: lootStore.recentLoots(50) });
}

function resetDemo(req, res) {
  lootStore.clearLoots();
  res.json({ ok: true });
}

module.exports = { getDashboardStats, resetDemo };
