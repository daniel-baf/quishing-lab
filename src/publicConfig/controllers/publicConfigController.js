const { LAN_IP, PORT } = require('../../config/environment');

// Non-sensitive settings consumed by the dashboard: the LAN IP and port are
// used to build the QR arsenal URLs (they must be reachable from the victim's
// phone over the LAN).
function getPublicConfig(req, res) {
  res.json({ lanIp: LAN_IP, port: PORT });
}

module.exports = { getPublicConfig };
