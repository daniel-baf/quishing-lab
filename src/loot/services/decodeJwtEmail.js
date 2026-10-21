// Reads a Juice Shop JWT payload without verifying the signature. We only
// need display fields for the dashboard; the token itself is the "loot" that
// gets replayed, signature included.
function decodeJwtPayload(token) {
  try {
    const parts = String(token).split('.');
    if (parts.length !== 3) return null;
    const base64Payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(Buffer.from(base64Payload, 'base64').toString('utf8'));
  } catch (_) {
    return null;
  }
}

function decodeJwtEmail(token) {
  const payload = decodeJwtPayload(token);
  const email = payload && payload.data && payload.data.email;
  return typeof email === 'string' ? email.slice(0, 120) : null;
}

// Juice Shop's frontend stores the basket id in sessionStorage at login; a
// replay without it requests /rest/basket/NaN and the UI crashes reading
// .Products of null. The bid travels inside the JWT payload.
function decodeJwtBid(token) {
  const payload = decodeJwtPayload(token);
  const bid = payload && payload.bid;
  return Number.isFinite(bid) ? bid : null;
}

module.exports = { decodeJwtEmail, decodeJwtBid };
