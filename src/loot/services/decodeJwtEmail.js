// Reads the victim's email out of a Juice Shop JWT without verifying the
// signature. We only need the payload for display on the dashboard; the token
// itself is the "loot" that gets replayed, signature included.
function decodeJwtEmail(token) {
  try {
    const parts = String(token).split('.');
    if (parts.length !== 3) return null;
    const base64Payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(Buffer.from(base64Payload, 'base64').toString('utf8'));
    const email = payload && payload.data && payload.data.email;
    return typeof email === 'string' ? email.slice(0, 120) : null;
  } catch (_) {
    return null;
  }
}

module.exports = { decodeJwtEmail };
