// Stolen session tokens received through the trap endpoint. Bounded, in-memory,
// ephemeral — exactly like everything else in this demo.
const MAX_LOOT_ENTRIES = 200;
const loots = [];

function addLoot(entry) {
  loots.push(entry);
  if (loots.length > MAX_LOOT_ENTRIES) loots.shift();
  return entry;
}

function recentLoots(limit = 50) {
  return loots.slice(-limit).reverse();
}

function clearLoots() {
  loots.length = 0;
}

function lootCounters() {
  return {
    executions: loots.length,
    stolen: loots.filter(l => l.stolen).length,
  };
}

module.exports = { addLoot, recentLoots, clearLoots, lootCounters };
