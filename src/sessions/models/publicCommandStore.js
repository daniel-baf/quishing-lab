const crypto = require('crypto');
const sseHub = require('../../shared/infrastructure/sseHub');

// Quick Tunnels do not guarantee reliable SSE delivery, so reveal/reset orders
// are also polled by the phones over plain HTTP. Orders are associated with
// the sessions that exist at issue time: someone who joins later must not
// receive a stale reveal or reset.
const COMMAND_TTL_MS = 5 * 60 * 1000;
const pendingBySessionId = new Map();

function issuePublicCommand(kind, sessionIds) {
  const command = { id: crypto.randomUUID(), kind, issued_at: Date.now() };
  for (const sessionId of sessionIds) {
    pendingBySessionId.set(sessionId, command);
  }
  sseHub.broadcastPublicCommand(command);
  return command;
}

function pruneExpiredCommands() {
  const cutoff = Date.now() - COMMAND_TTL_MS;
  for (const [sessionId, command] of pendingBySessionId) {
    if (command.issued_at < cutoff) pendingBySessionId.delete(sessionId);
  }
}

function pendingCommandFor(sessionId) {
  pruneExpiredCommands();
  return pendingBySessionId.get(sessionId) || null;
}

module.exports = { issuePublicCommand, pendingCommandFor };
