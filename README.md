# 🕳️ Quishing Lab — Educational demo for university fairs

A controlled demonstration of **quishing** (QR-code phishing): a volunteer scans a
"contest" QR, interacts with a landing page and, in a guided reveal, finds out
what information a website can expose and which decisions they made along the
way. Everything runs **locally on your laptop** (memory only; nothing survives
once the process stops) and is temporarily exposed through a Cloudflare Tunnel.

> ⚠️ Responsible use: always run the educational reveal at the end, announce
> that this is a demo, and wipe/restart between sessions. Any captured
> credential must be fake (the presenter types test data, e.g.
> `hacker@demo.com` / `hunter2`). Read [SECURITY.md](SECURITY.md) before using
> it beyond your own machine.

> 🤝 Want to contribute? The development and UX/UI guide lives in
> [CONTRIBUTING.md](CONTRIBUTING.md).

> 🗣️ Note: the code, docs and comments are in English; the on-screen UI copy
> stays in Spanish because that is the audience at the fair.

## Quick start with Docker (recommended)

```bash
cp .env.example .env
# Edit .env: set a long, unique, stable ADMIN_TOKEN.
make up
make health
```

Open the dashboard at `http://localhost:3000/admin` and enter the `ADMIN_TOKEN`
from `.env`. The token does not change when containers restart, so you will not
see 401s caused by a fresh random token. If the browser keeps an invalid token,
the dashboard drops it automatically and asks again.

Common commands:

```bash
make logs            # app logs
make down            # stops the app, the tunnel and the practice stack
make tunnel          # starts app + Quick Tunnel and streams its logs
```

## Practice stack (intentionally vulnerable)

The QR arsenal in the dashboard targets two deliberately vulnerable training
apps — the demo goes beyond the QR into XSS, session theft and CSRF. They live
in a **separate Compose file** and are started independently:

```bash
make practice-up      # Juice Shop + WebGoat
make health-practice  # verify both respond
make logs-practice    # follow their logs
make practice-down    # stop them
```

- **OWASP Juice Shop** — vulnerable online store at `http://localhost:4000`
  (on the LAN: `http://LAPTOP-IP:4000`). Includes the "Forged Coupon" QR
  challenge, DOM-XSS in the search box and the session JWT stored in
  `sessionStorage`, readable from an XSS. Reset = recreate the container:
  `docker compose -f docker-compose.practice.yml up -d --force-recreate juice-shop`.
- **OWASP WebGoat** — guided course at `http://localhost:8080/WebGoat`, with its
  WebWolf companion (a request bin for exfiltration practice) at
  `http://localhost:9090/WebWolf`. Listens on localhost only.

> ⚠️ **Never** expose Juice Shop or WebGoat through the Cloudflare Tunnel: they
> are vulnerable on purpose and anyone with the URL gets in. Keep them on the
> LAN/VM. If you are not using them in a session: `make practice-down`.

### Extended demo: session theft from a QR

The dashboard includes a **QR arsenal** (below the feed) that shows how a QR can
also steal a session without asking for credentials:

1. **QR 1 (bait)** points to Juice Shop (`http://LAN-IP:4000/`). The victim
   registers and logs in. All legitimate.
2. **QR 2 (theft)** opens Juice Shop's search box with an XSS payload that
   sends the session JWT to this server's `GET /api/loot`. The dashboard counts
   executions and stolen sessions, and lists each JWT with the victim's decoded
   email (click the token to copy it).
3. **Finale:** in a new Juice Shop tab, run `sessionStorage.setItem('token','…')`
   with the copied JWT → you are inside the victim's account without knowing
   their password.

**QR 3 (free-form)** is for your own URLs, e.g. the SQL injection of Juice
Shop's `/rest/products/search`, which also fits in a QR.

Golden rules: always use the **LAN IP, never `localhost`** (`sessionStorage`
is per-origin: mix them and the token "does not exist", so `loot=none` arrives);
Juice Shop never goes through the tunnel; and `Reiniciar` also wipes the loot.
The LAN IP is autodetected when you run `make up`; force it with
`LAN_IP=192.168.x.x make up`.

## Exposing it with a Cloudflare Tunnel

```bash
make tunnel
```

Look in the `make tunnel` logs for the `https://….trycloudflare.com` URL that
Cloudflare prints. Paste it into the dashboard's **QR del concurso** field and
hit **Generar QR** (project the QR so people can scan it). The URL changes
every time the Quick Tunnel is recreated.

The `tunnel` container uses the Compose `tunnel` profile and points internally
at `app:3000`; you do not need `cloudflared` installed on the laptop. To see
the URL again:

```bash
make tunnel-logs
```

**Quick Tunnels** (`trycloudflare.com`) do not reliably deliver Server-Sent
Events, so phones keep SSE when available and *also* poll over HTTP every ~2
seconds for the **REVELAR** and **Reiniciar** commands. You do not need four
participants: the demo works the same with one person or as many as connect.

## Automatic permission mode

The landing page no longer shows "enable camera/screen" buttons: on form submit
(or on load if `ENABLE_FAKE_LOGIN=false`) it tries to request both permissions
automatically. This does **not** remove the browser's native dialogs or turn
them into invisible consent: if the browser requires a user gesture or the
person denies, the event shows up as denied on the dashboard.

## Alternative local start

```bash
npm install
npm start
```

Uses the same `.env` with the same stable `ADMIN_TOKEN`.

## Suggested script (5–7 min)

1. **Bait (30 s):** QR on screen — "Gana un Kit Hacker". You (or a volunteer who
   is in on the gag) scans it.
2. **Interaction (1–2 min):** on the phone, fill in the form (fake data) and
   enable the camera (the browser shows its permission dialog — that is part of
   the message).
3. **Dashboard (1 min):** project the panel: watch `✍️ tecleando`,
   `🔑 ENVIÓ CREDENCIALES`, `✅ PERMISO CONCEDIDO` arrive live.
4. **Reveal (1 min):** press 🚨 REVELAR. The phones show "Este QR era una
   trampa" with each person's own list of leaked data.
5. **Defenses (2 min):** verify domains, use a password manager, minimal
   permissions, distrust prizes and urgency. Close with: "this is what we do in
   cybersecurity."

## Intentional design limits

- **No hidden capture:** the camera is a local preview only; no frame ever
  leaves the device.
- **No persisted data:** everything is in memory; `Reiniciar` wipes it all and
  reloads the phones.
- Camera/geolocation permissions are **controlled by the browser** — there is no
  way (nor intent) to bypass the dialog; the moment the dialog appears is the
  teaching moment.
- **Cookies:** the landing only reads `document.cookie` on the demo domain,
  masks the values and shows them in the reveal. `HttpOnly` cookies are **not**
  visible to JavaScript; that limitation is shown too, because it is part of the
  lesson.

## Project structure

```
src/
  server.js                         bootstrap: load config, create app, listen
  app.js                            Express wiring: parsers, headers, routers, static
  config/environment.js             env vars + LAN IP detection
  shared/infrastructure/            cross-cutting, in-memory infra
    activityFeed.js                 bounded event log (dashboard feed)
    rateLimiter.js                  sliding-window IP rate limiters
    parsers.js                      User-Agent → browser/OS summaries
    sseHub.js                       SSE client registry + broadcast helpers
  sessions/                         participant sessions domain
    api/routes.js                   /api/session, /api/events, /api/session/* 
    controllers/sessionController.js
    models/sessionStore.js          session map, stages, status codes, labels
    models/publicCommandStore.js    reveal/reset orders (SSE + polling fallback)
  live/                             real-time channel domain
    api/routes.js                   /api/live (SSE), /api/mirror, /api/screen
    controllers/liveController.js
  loot/                             stolen-session trap domain
    api/routes.js                   /api/loot (intentionally unauthenticated)
    controllers/lootController.js
    models/lootStore.js
    services/decodeJwtEmail.js
  admin/                            presenter dashboard domain
    api/routes.js                   /api/admin/* (token-protected)
    controllers/adminController.js
    middleware/requireAdminToken.js
  publicConfig/                     non-sensitive settings for the frontend
    api/routes.js                   /api/config
public/
  index.html                        mobile landing (contest → camera → reveal)
  admin.html                        presenter dashboard (counters, cards, feed, QR)
  styles.css                        shared styles
docker-compose.yml                  core demo app + tunnel profile
docker-compose.practice.yml         Juice Shop + WebGoat (vulnerable practice stack)
```

The API speaks English (`cam: "granted"`, counters like `lootStolen`, stages
like `revealed`); the frontend translates them into Spanish for display.

## Fair-day checklist

- [ ] `make up && make health` answers `ok`
- [ ] (If used) practice stack up via `make practice-up` — Juice Shop on `:4000`,
      WebGoat on `:8080` — and **never** in the tunnel
- [ ] Tunnel active with valid HTTPS (the camera requires a secure context)
- [ ] Tested on Android Chrome **and** iOS Safari
- [ ] Dashboard token at hand (read it from `.env`, do not share it)
- [ ] Fake credentials ready to type
- [ ] After the fair: Ctrl+C and `rm -rf` the project → zero leftovers

## Contributing

Improvements are welcome — UX/UI of the landing or dashboard, new QR arsenal
challenges, teaching material. See [CONTRIBUTING.md](CONTRIBUTING.md) for the
workflow and style guide.

## Security

If you find a security flaw in the lab itself (accidental persistence, secret
leak, broken isolation), report it privately following
[SECURITY.md](SECURITY.md). Do not open public issues with vulnerability
details.
