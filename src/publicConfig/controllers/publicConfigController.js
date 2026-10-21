const { PUBLIC_URL, ENABLE_FAKE_LOGIN, LAN_IP } = require('../../config/environment');

// Non-sensitive settings consumed by the frontend: the tunnel URL to
// pre-fill the QR field, whether the fake login form is enabled, and the LAN
// IP used to build the QR arsenal URLs.
function getPublicConfig(req, res) {
  res.json({ publicUrl: PUBLIC_URL, fakeLogin: ENABLE_FAKE_LOGIN, lanIp: LAN_IP });
}

module.exports = { getPublicConfig };
