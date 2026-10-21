// Registry of open Server-Sent Events streams. Two audiences: the presenter
// dashboard (admin) and the participant phones (public). All state lives in
// memory and dies with the process, like everything else in this demo.
const ADMIN_CLIENTS = new Set();
const PUBLIC_CLIENTS = new Set();

// Keeps proxies, tunnels and mobile networks from closing an idle stream.
const HEARTBEAT_INTERVAL_MS = 20_000;

function writePayload(clients, payload) {
  const message = 'data: ' + JSON.stringify(payload) + '\n\n';
  for (const res of clients) res.write(message);
}

function subscribeToEventStream(req, res, isAdmin) {
  res.status(200).set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.flushHeaders();
  // Cloudflare may hold back SSE comments and the bare `retry` directive; an
  // initial data event forces the stream to be delivered to EventSource.
  res.write('retry: 3000\ndata: {"kind":"connected"}\n\n');
  const clients = isAdmin ? ADMIN_CLIENTS : PUBLIC_CLIENTS;
  clients.add(res);
  const heartbeat = setInterval(() => res.write('data: {"kind":"heartbeat"}\n\n'), HEARTBEAT_INTERVAL_MS);
  req.on('close', () => {
    clearInterval(heartbeat);
    clients.delete(res);
  });
}

function broadcastFeedEvent(event) {
  writePayload(ADMIN_CLIENTS, { kind: 'event', ev: event });
}

function broadcastPublicCommand(command) {
  writePayload(PUBLIC_CLIENTS, command);
}

function broadcastMirrorUpdate({ sessionId, sessionLabel, mirror }) {
  writePayload(ADMIN_CLIENTS, { kind: 'mirror', id: sessionId, label: sessionLabel, mirror });
}

function broadcastScreenFrame({ sessionId, sessionLabel, frame }) {
  writePayload(ADMIN_CLIENTS, { kind: 'frame', id: sessionId, label: sessionLabel, frame });
}

module.exports = {
  subscribeToEventStream,
  broadcastFeedEvent,
  broadcastPublicCommand,
  broadcastMirrorUpdate,
  broadcastScreenFrame,
};
