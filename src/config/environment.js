require('dotenv').config();
const os = require('os');

const PORT = parseInt(process.env.PORT || '3000', 10);
const ADMIN_TOKEN = process.env.ADMIN_TOKEN;
const ENABLE_FAKE_LOGIN = process.env.ENABLE_FAKE_LOGIN !== 'false';
const PUBLIC_URL = process.env.PUBLIC_URL || '';

if (!ADMIN_TOKEN) {
  throw new Error('ADMIN_TOKEN is required. Copy .env.example to .env and set a long, random token.');
}

// Inside Docker the only IPv4 address is usually the container's own (the
// 172.16/12 range), which would produce useless QR codes. The Makefile detects
// the LAN IP on the host and passes it in; we would rather stay empty than
// guess wrong.
function detectLanIp() {
  for (const addrs of Object.values(os.networkInterfaces())) {
    for (const addr of addrs || []) {
      if ((addr.family !== 'IPv4' && addr.family !== 4) || addr.internal) continue;
      if (/^172\.(1[6-9]|2\d|3[01])\./.test(addr.address)) continue;
      return addr.address;
    }
  }
  return '';
}

const LAN_IP = process.env.LAN_IP || detectLanIp();

module.exports = { PORT, ADMIN_TOKEN, ENABLE_FAKE_LOGIN, PUBLIC_URL, LAN_IP, detectLanIp };
