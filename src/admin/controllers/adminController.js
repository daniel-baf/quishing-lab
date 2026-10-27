const lootStore = require('../../loot/models/lootStore');

async function getDashboardStats(req, res) {
  const counters = await lootStore.lootCounters();
  res.json({ counters, loots: await lootStore.recentLoots(50) });
}

async function resetDemo(req, res) {
  await lootStore.clearLoots();
  res.json({ ok: true });
}

module.exports = { getDashboardStats, resetDemo };
