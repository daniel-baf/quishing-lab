# Quishing Lab — QR arsenal for session-theft demonstrations

An educational panel that turns QR codes into attack vectors against
**intentionally vulnerable training apps**. It exists for university fairs and
classrooms: participants scan printed QRs, a stored session lands on the
projected dashboard, and the replay finale shows why "the browser already
logged me in" is not protection.

The panel itself only generates QRs and collects what the XSS payload sends it —
there is **no phishing landing and no victim simulation** here, just the
arsenal and the loot table. Everything runs **locally on your laptop** (memory
only; nothing survives once the process stops).

> **Responsible use:** run it in controlled environments (classroom, fair,
> CTF) with consenting participants and fake accounts. Read
> [SECURITY.md](SECURITY.md) before using it beyond your own machine.

> **Want to contribute?** See [CONTRIBUTING.md](CONTRIBUTING.md).

> **Note:** the code, docs and comments are in English; the on-screen UI copy
> stays in Spanish because that is the audience at the fair.

## What it demonstrates

1. **QR 1 — bait (Juice Shop).** The participant scans it, registers and logs
   in on the intentionally vulnerable OWASP Juice Shop. All legitimate.
2. **QR 2 — session theft (XSS).** With the session active, the QR opens Juice
   Shop's search box with a stored-DOM-XSS payload that reads the session JWT
   from `sessionStorage` and exfiltrates it to this panel's `GET /api/loot`.
   The dashboard counts executions and stolen sessions, and lists each JWT
   with the victim's decoded email.
3. **Replay finale.** Click a token in the loot table to copy it, then in a
   fresh Juice Shop tab run `sessionStorage.setItem('token','…')` → you are
   inside the victim's account without ever knowing their password.
4. **QR 3 — free-form.** Paste any malicious URL (e.g. Juice Shop's SQL
   injection in `/rest/products/search`) and project it as a QR too.

Golden rules: every arsenal URL uses the **LAN IP, never `localhost`**
(`sessionStorage` is per-origin; with the wrong origin the token is missing
and only `loot=none` arrives), and the Juice Shop/WebGoat stack **never** goes
through a public tunnel.

## Quick start

**Requirements:** git, Docker, and a phone on the same LAN for scanning.

```bash
git clone git@github.com:daniel-baf/quishing-lab.git
cd quishing-lab
cp .env.example .env
openssl rand -base64 32   # paste the output as ADMIN_TOKEN in .env
make up                   # panel + Juice Shop + WebGoat
make health && make health-practice
```

Open `http://localhost:3000/admin`, enter the `ADMIN_TOKEN`, and project the
page. The QR arsenal builds itself from the autodetected LAN IP (force it with
`LAN_IP=192.168.x.x make up`).

**Fair script (5–7 min):** QR 1 on screen → a volunteer logs into Juice Shop →
QR 2 → the loot table lights up with their session → replay finale on the
projector → defenses talk (QRs hide destinations, session tokens are as good
as passwords, HttpOnly cookies + short lifetimes + binding mitigate this).

## Practice stack (intentionally vulnerable)

`make up` starts it together with the panel; it also lives in its own Compose
file and can be controlled separately:

```bash
make practice-up      # Juice Shop + WebGoat
make health-practice  # verify both respond
make logs-practice    # follow their logs
make practice-down    # stop them
```

- **OWASP Juice Shop** — `http://localhost:4000` (LAN: `http://LAPTOP-IP:4000`).
  Bait app and XSS/SQLi target. Reset = recreate the container:
  `docker compose -f docker-compose.practice.yml up -d --force-recreate juice-shop`.
- **OWASP WebGoat** — guided lessons at `http://localhost:8080/WebGoat`, with
  WebWolf (a request bin for exfiltration practice) at
  `http://localhost:9090/WebWolf`. Localhost only.

> **Never** expose Juice Shop or WebGoat through the Cloudflare Tunnel: they
> are vulnerable on purpose and anyone with the URL gets in. LAN/localhost
> only. `make practice-down` when idle.

## Exposing the panel with a Cloudflare Tunnel (optional)

Only the panel needs HTTPS (e.g. if you insist on scanning from outside the
LAN). The practice stack stays local either way.

```bash
make tunnel
```

Copy the `https://….trycloudflare.com` URL from the logs (`make tunnel-logs`
brings them back) — the dashboard URL changes every time the Quick Tunnel is
recreated.

## Alternative local start

```bash
npm install
npm start
```

Uses the same `.env`. The QR arsenal still needs the practice stack
(`make practice-up`) and a reachable LAN IP.

## Project structure

```
src/
  server.js                         bootstrap: load config, create app, listen
  app.js                            Express wiring: headers, routers, static
  config/environment.js             env vars + LAN IP detection
  shared/infrastructure/rateLimiter.js  sliding-window IP rate limiter
  loot/                             stolen-session trap domain
    api/routes.js                   /api/loot (intentionally unauthenticated)
    controllers/lootController.js
    models/lootStore.js
    services/decodeJwtEmail.js
  admin/                            presenter dashboard domain
    api/routes.js                   /api/admin/stats, /api/admin/reset (token-protected)
    controllers/adminController.js
    middleware/requireAdminToken.js
  publicConfig/                     non-sensitive settings for the frontend
    api/routes.js                   /api/config (lanIp, port)
public/
  admin.html                        presenter dashboard (counters, QR arsenal, loot)
  styles.css                        dashboard styles
docker-compose.yml                  panel app + tunnel profile
docker-compose.practice.yml         Juice Shop + WebGoat (intentionally vulnerable)
```

## Fair-day checklist

- [ ] `make up` then `make health` and `make health-practice` all green
- [ ] Dashboard opens at `:3000/admin` with the token from `.env`
- [ ] QR 1 and QR 2 show LAN URLs (not `localhost`); force with `LAN_IP=…` if not
- [ ] Tested end-to-end on Android Chrome **and** iOS Safari
- [ ] Practice apps verified LAN-only, never in the tunnel
- [ ] After the fair: `make down` → zero leftovers (everything was in memory)

## Contributing

Improvements are welcome — new QR challenges, better teaching material,
dashboard UX. See [CONTRIBUTING.md](CONTRIBUTING.md).

## Security

If you find a security flaw in the panel itself (accidental persistence,
secret leak, broken isolation), report it privately following
[SECURITY.md](SECURITY.md). Do not open public issues with vulnerability
details.
