# Contributing to Quishing Lab

Thanks for your interest! This is a **purely educational** project that teaches
how a quishing (QR phishing) attack works and how browser sessions get stolen,
inside a controlled environment. Every contribution must keep that spirit:
didactic, transparent and safe.

> 🗣️ Language convention: code, comments, docs and variable names are English.
> The on-screen UI copy stays Spanish (that is the fair's audience), so the
> frontend maps English API codes (e.g. `cam: "granted"`) to Spanish text.

## Ground rules (non-negotiable)

1. **Never commit secrets.** `.env` is git-ignored; keep it that way. Use
   `.env.example` as the only reference.
2. **Fake data always.** Use toy credentials in demos and tests (e.g.
   `hacker@demo.com` / `hunter2`).
3. **No real attacks.** This code is not used against people without their
   explicit consent. See [SECURITY.md](SECURITY.md).
4. **Juice Shop and WebGoat are never exposed to the Internet.** LAN/localhost
   only, via `docker-compose.practice.yml`.

## Setting up the environment

```bash
git clone git@github.com:daniel-baf/quishing-lab.git
cd quishing-lab
cp .env.example .env   # set a long, random ADMIN_TOKEN
make up && make health # Docker (recommended)
```

Alternative without Docker:

```bash
npm install
npm run dev
```

Presenter dashboard: `http://localhost:3000/admin` (asks for the `ADMIN_TOKEN`
from `.env`).

Need the vulnerable practice stack for the QR arsenal?

```bash
make practice-up && make health-practice
```

## Workflow

1. Branch from `master`:
   - `feature/ux-panel-feed` — UX/UI improvements
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
| `src/shared/infrastructure/` | Cross-cutting in-memory infra: SSE hub, rate limiters, activity feed, UA parsers |
| `src/sessions/` | Participant sessions domain: routes, controller, session store, public command store |
| `src/live/` | Real-time channel: SSE stream, typing mirror, screen frames |
| `src/loot/` | Stolen-session trap: unauthenticated `/api/loot`, bounded store, JWT email decoder |
| `src/admin/` | Presenter dashboard API: stats, reveal, reset (token-protected) |
| `src/publicConfig/` | Non-sensitive settings endpoint (`/api/config`) |
| `src/app.js` / `src/server.js` | Express wiring and bootstrap entrypoint |
| `public/index.html` | Mobile landing (bait → form → reveal) |
| `public/admin.html` | Presenter dashboard (counters, cards, live feed, QR arsenal) |
| `public/styles.css` | Shared styles |
| `docker-compose.yml` / `docker-compose.practice.yml` / `Dockerfile` / `Makefile` | Infra: core app, practice stack, tunnel |

## UX/UI guide

- The **landing** is *mobile-first* (it is scanned with a phone): big tap
  targets, readable text, short steps.
- The **dashboard** is projected on a big screen: high contrast, large type,
  state readable from a distance.
- Tone: reveal, do not scare. The final screen must make clear what was exposed
  and how to defend against it.
- No frameworks, no build step: vanilla HTML/CSS/JS so anyone can read every
  line in class.
- When the backend changes a status code or counter name, update the frontend's
  display maps (e.g. `CAMERA_STATUS_TEXT`, the counters array) in the same PR.

## PR checklist

- [ ] `make up && make health` answers `ok`
- [ ] Tested on a real phone (Android Chrome **and** iOS Safari if the landing changed)
- [ ] No secrets in the diff (`git diff` free of tokens)
- [ ] README updated if behavior or commands changed
- [ ] Only fake data used in tests
