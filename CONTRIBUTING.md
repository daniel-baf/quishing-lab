# Contributing to Quishing Lab

Thanks for your interest! This is a **purely educational** project: a QR
arsenal panel that demonstrates session theft and injection against
intentionally vulnerable training apps (OWASP Juice Shop, WebGoat), for
university fairs and classrooms. Every contribution must keep that spirit:
didactic, transparent and safe.

> **Language convention:** code, comments, docs and variable names are English.
> The on-screen UI copy stays Spanish (that is the fair's audience).

## Ground rules (non-negotiable)

1. **Never commit secrets.** `.env` is git-ignored; keep it that way. Use
   `.env.example` as the only reference.
2. **Fake accounts always.** Register with toy data in the practice apps (e.g.
   `hacker@demo.com` / `hunter2`).
3. **No real attacks.** This code is not used against people or systems
   without their explicit consent. See [SECURITY.md](SECURITY.md).
4. **Juice Shop and WebGoat are never exposed to the Internet.** LAN/localhost
   only, via `docker-compose.practice.yml`.

## Setting up the environment

```bash
git clone git@github.com:daniel-baf/quishing-lab.git
cd quishing-lab
cp .env.example .env   # set a long, random ADMIN_TOKEN
make up                # panel + practice stack (Docker)
make health && make health-practice
```

Alternative without Docker for the panel:

```bash
npm install
npm run dev            # then `make practice-up` for the vulnerable apps
```

Dashboard: `http://localhost:3000/admin` (asks for the `ADMIN_TOKEN` from
`.env`).

## Workflow

1. Branch from `master`:
   - `feature/ux-loot-table` — UX/UI improvements
   - `fix/…` — bug fixes
   - `docs/…` — documentation
2. Small commits with a clear message. The repo uses
   [Conventional Commits](https://www.conventionalcommits.org/)-style prefixes:
   `feat:`, `fix:`, `chore:`, `docs:`.
3. Open a descriptive PR: what changes, why, and how to test it.

## Code map

| Path | What it holds |
|---|---|
| `src/config/environment.js` | Env vars + LAN IP detection |
| `src/shared/infrastructure/rateLimiter.js` | Sliding-window IP rate limiter |
| `src/loot/` | Stolen-session trap: unauthenticated `/api/loot`, bounded store, JWT email decoder |
| `src/admin/` | Dashboard API: stats + reset (token-protected) |
| `src/publicConfig/` | Non-sensitive settings endpoint (`/api/config`: lanIp, port) |
| `src/app.js` / `src/server.js` | Express wiring and bootstrap entrypoint |
| `public/admin.html` | Presenter dashboard (counters, QR arsenal, loot table) |
| `public/styles.css` | Dashboard styles |
| `docker-compose.yml` / `docker-compose.practice.yml` / `Dockerfile` / `Makefile` | Infra: panel app, vulnerable practice stack, tunnel |

## UX/UI guide

- The **dashboard** is projected on a big screen: high contrast, large type,
  state readable from a distance.
- Tone: reveal, do not scare. The point is to teach how session theft works
  and how to defend against it.
- No frameworks, no build step: vanilla HTML/CSS/JS so anyone can read every
  line in class.
- The QR arsenal URLs must always use the LAN IP (never `localhost` or the
  tunnel domain): `sessionStorage` is per-origin and a wrong origin silently
  breaks the demo (`loot=none`).

## PR checklist

- [ ] `make up && make health && make health-practice` all green
- [ ] The three QR flows verified against a real phone (Android Chrome **and**
      iOS Safari if the dashboard changed)
- [ ] No secrets in the diff (`git diff` free of tokens)
- [ ] README updated if behavior or commands changed
- [ ] Only fake accounts used in tests
