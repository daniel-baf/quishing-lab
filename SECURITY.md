# Security policy

## Project purpose

Quishing Lab is an **educational** dashboard for fairs and classrooms: it
generates QR codes that attack intentionally vulnerable training apps (OWASP
Juice Shop) — a stored-XSS payload exfiltrates the session JWT to the panel's
trap endpoint, and the projected loot table drives the lesson about session
theft. There is no phishing landing and no victim simulation; the participant
scans a QR knowing it is a security exercise.

## Usage rules

- **Exclusive** use in controlled environments (classroom, university fair,
  CTF) with the participants' consent.
- **Never** point this tooling at third-party systems or people without their
  explicit consent. Unauthorized attacks are illegal in most jurisdictions,
  even if "it is just a demo".
- Accounts used in the practice apps must be fake.
- The practice apps (OWASP Juice Shop, WebGoat) are vulnerable **on purpose**:
  never expose them through the Cloudflare Tunnel or on a public IP.
  LAN/localhost only — they live in `docker-compose.practice.yml`, and
  `make practice-down` stops them when idle. The panel itself is the only
  component that may ever go through the tunnel.

## Defensive design of the panel itself (intentional choices)

- **Memory-only state:** when the process stops nothing remains; the dashboard
  `Reiniciar` wipes the loot mid-demo. Do not add persistence.
- **Unauthenticated trap endpoint (`/api/loot`)**: intentional — the victim's
  browser has no session with this app and cannot send a token. It stays
  ephemeral, rate-limited and capped. Do not "fix" it by adding login; it is
  documented in `src/loot/controllers/lootController.js`.
- `ADMIN_TOKEN` is mandatory for the dashboard; `.env` stays out of version
  control.

## Reporting a vulnerability

If you find a security flaw in the panel itself — e.g. something persists
after a restart, a secret could leak, or the isolation described above is
broken — **do not open a public issue with details**:

1. Open a **private Security Advisory** on GitHub: *Repository → Security →
   Advisories → New draft advisory*.
2. Describe the impact and the minimal steps to reproduce.
3. If it is urgent and you have another channel with the maintainers, ping them
   there referencing the draft.

We respond as soon as possible and will publish the fix with credit unless you
ask otherwise.
