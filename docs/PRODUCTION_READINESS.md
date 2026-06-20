# CMS-Auto Production Readiness (Pilot on Hostinger)

Goal: take the structurally-complete MVP to a **real pilot for real users**, deployed
on a **Hostinger VPS**, with **email-only** notifications. SMS / WhatsApp / DMS stay as
mocks for now (the app already degrades gracefully without them).

Principle (same discipline as the rest of the project): "production-ready" means
**proven on the real environment**, not green locally. Each item below has a gate that
must be *executed*, not assumed. Label honestly: Passed / Failed / Not Run.

---

## 0. Target topology

A single **Hostinger VPS** (Ubuntu, >= 4 GB RAM recommended — Postgres + Redis + three
Node services) running Docker Compose:

```
[ Caddy (auto-HTTPS) ]  ->  web (Next.js)        :3000
                        ->  api (NestJS)          :4000
   worker (BullMQ)  ----+   postgres  redis
   object storage: Cloudflare R2 (S3-compatible)  [or self-hosted MinIO]
```

- Reverse proxy: **Caddy** (simplest auto-TLS via Let's Encrypt) or Nginx + certbot.
- The **worker** is a separate process (the Phase 8 BullMQ runner) — same image, different entrypoint.
- Secrets: a `.env` on the VPS, `chmod 600`, never committed. Acceptable for a single-VPS pilot.

---

## A. Code workstreams (Forge builds, reviewer verifies)

- [ ] **P-01 Finish Phase 8 — async runtime** (in progress): BullMQ worker entrypoint
      drives SLA jobs, notification dispatch, and the attachment scan; the job-runtime
      ratchet reaches empty. Gate: on the Docker stack, an overdue complaint produces a
      warning -> breach -> escalation; a queued notification is dispatched.
- [ ] **P-02 Real storage adapter** for `AttachmentStoragePort` — Cloudflare R2 (or
      MinIO), durable put + short-lived signed URL; in-memory stays the test double.
      Gate: an uploaded file is stored in R2 and downloadable only after scan = CLEAN.
- [ ] **P-03 Finish the UI** (also the "I don't like the app" fix; a hard prod gate):
      remove preview/dev scaffolding (Role preview, "Preview signed-in shell",
      "placeholder" cards), wire real data (kill hardcoded 18/6/2), **adopt shadcn/ui**,
      fix Arabic encoding + `lang`/`dir` RTL in `layout.tsx`, then re-baseline visuals.
      Gate: signed-in app shows real data, no scaffolding, Arabic renders + flows RTL.
- [ ] **P-04 Real email adapter** — SMTP via nodemailer (Hostinger SMTP or a free
      transactional service) replacing the email test double; SMS/WhatsApp/DMS remain
      config-disabled mocks. Gate: a real email sends and arrives (not spam) from staging.
- [ ] **P-05 Production deploy artifacts** — `docker-compose.prod.yml`, `Caddyfile`,
      `.env.production.example`, migrate-on-deploy step, healthchecks + restart policies,
      `Secure` cookies and HTTPS redirect on. Gate: `docker compose -f ...prod up` brings
      the full stack up cleanly on the VPS.
- [ ] **P-06 Anti-mojibake + locale gate** — `lint` fails on `Ø`/`Ù`-class mojibake in
      source/i18n and asserts Arabic strings are real Arabic-range codepoints (stops the
      encoding bug recurring). Gate: lint catches a planted mojibake string.

## B. Ops / decisions (human — not code Forge can do)

- [ ] **O-01** Provision the Hostinger VPS (Ubuntu, >= 4 GB RAM), install Docker + Compose.
- [ ] **O-02** Domain -> VPS A-record; Caddy obtains the TLS cert.
- [ ] **O-03** Postgres OFF `trust` auth — real password; persistent volume; `pg_dump`
      cron backup to **offsite** (R2), and a **restore actually tested** once.
- [ ] **O-04** Object storage account: create the **Cloudflare R2** bucket + keys (or
      stand up MinIO). [decision — see below]
- [ ] **O-05** Email: pick the sender (Hostinger SMTP or a free service) and set
      SPF/DKIM on the sending domain so mail isn't flagged as spam.
- [ ] **O-06** Set production secrets in the VPS `.env` (DB, Redis, R2, SMTP, session keys).
- [ ] **O-07** Basic VPS hardening: `ufw` firewall, SSH keys only, `fail2ban`, automatic
      security updates.
- [ ] **O-08** Run the deploy + a smoke pass; then a small **real UAT/pilot** with a couple
      of branches and real staff users.
- [ ] **O-09** (lower urgency for pilot) Approve a data-retention / privacy stance for
      customer PII before scaling beyond the pilot.

## C. Deferred (explicitly NOT in the pilot)

- SMS / WhatsApp live providers, DMS live integration (stay as mocks; manual fallback works).
- Multi-instance scale + Redis-distributed rate limiting (single VPS = process-local is fine).
- The deferred Phase-2 features (AI, native mobile, advanced analytics).

---

## Critical path (do in this order)

1. **P-01 + P-02** — make the async layer + storage actually run (nothing is "live" until they do).
2. **P-03** — finish the UI (your complaint, and you can't show real users a preview shell).
3. **P-04 + P-05 + P-06** — email, deploy artifacts, the locale gate.
4. **O-01..O-07** — stand up and harden the VPS.
5. **O-08** — deploy, smoke test, pilot.

## Definition of production-ready (the gate to go live)

- Deployed on the Hostinger VPS behind HTTPS and reachable on the domain.
- Real staff login works; the production build contains no preview/dev scaffolding.
- SLA jobs fire in the deployed env (overdue -> breach + escalation).
- A real email sends and arrives from the deployed env.
- An attachment is durably stored (R2) and downloadable only after scan = CLEAN.
- Postgres is off `trust`, secrets are set, backups run and a restore was tested.
- A smoke/UAT pass against the deployed system is signed off.

## Open decisions (need your call)

1. **Object storage**: Cloudflare R2 (recommended — durable, offsite, free tier) vs
   self-hosted MinIO on the VPS (everything in one box, but VPS-disk durability only).
2. **Email sender**: Hostinger SMTP (comes with hosting) vs a free transactional service
   (e.g. Brevo) — the latter usually has better deliverability.
