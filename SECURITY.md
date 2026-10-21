# Security policy

## Project purpose

Quishing Lab is an **educational** demo for fairs and classrooms: it shows how
a malicious QR (quishing) works and how an XSS steals a web session, all inside
a controlled environment, with a final reveal and fake data. Part of its code
*simulates* phishing on purpose — that is the lesson, not the feature.

## Usage rules

- **Exclusive** use in controlled environments (classroom, university fair,
  CTF) with the participants' consent.
- **Never** use it against third parties without their explicit consent.
  Non-consensual phishing is illegal in most jurisdictions, even if "it is
  just a demo".
- Credentials captured during demos must be fake.
- The practice apps (OWASP Juice Shop, WebGoat) are vulnerable **on
  purpose**: never expose them through the Cloudflare Tunnel or on a public
  IP. LAN/localhost only — they live in `docker-compose.practice.yml`, and
  `make practice-down` stops them when idle.

## Defensive design of the lab itself (intentional choices)

- **Memory-only state:** when the process stops nothing remains; the dashboard
  `Reiniciar` wipes everything mid-demo. Do not add persistence.
- **No hidden capture:** the camera is a local preview; no frame ever leaves
  the participant's device.
- **Unauthenticated trap endpoint (`/api/loot`)**: intentional — the victim's
  browser has no session with this app and cannot send a token. It stays
  ephemeral, rate-limited and capped. Do not "fix" it by adding login; it is
  documented in `src/loot/controllers/lootController.js`.
- Cookie values are stored **already masked** by the client.
- `ADMIN_TOKEN` is mandatory for the dashboard; `.env` stays out of version
  control.

## Reporting a vulnerability

If you find a security flaw in the lab itself — e.g. something persists after
a restart, a secret could leak, or the isolation described above is broken —
**do not open a public issue with details**:

1. Open a **private Security Advisory** on GitHub: *Repository → Security →
   Advisories → New draft advisory*.
2. Describe the impact and the minimal steps to reproduce.
3. If it is urgent and you have another channel with the maintainers, ping them
   there referencing the draft.

We respond as soon as possible and will publish the fix with credit unless you
ask otherwise.
