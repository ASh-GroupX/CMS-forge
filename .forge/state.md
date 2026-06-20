# Current State

Status: Ready to Plan
Phase: Phase 9 - Production Readiness (Pilot on Hostinger)
Next Task: PLAN-P9 - Sequence Phase 9 (emit P9-01 Arabic encoding + RTL as first build)
Model Tier: PLANNER

## How to use this file

SNAPSHOT only. REPLACE each run, never append. Per-task detail -> evidence.md.
Prior state history is in .forge/archive/state-archive.md.

## Snapshot

- Phases 0-8 accepted. Phase 8 closed the async runtime (BullMQ runner drives SLA /
  notification / scan jobs; ratchet empty) and the S3-compatible storage adapter.
- Phase 9 = production readiness for a real pilot on a Hostinger VPS, email-only
  (SMS/WhatsApp/DMS stay mocked). Plan: docs/PRODUCTION_READINESS.md.
- Biggest remaining gap is the UI: it is still a preview shell - dev scaffolding
  (Role preview, Preview links), placeholder content, hardcoded data, corrupted
  Arabic (mojibake on disk), no RTL, and shadcn/ui was never adopted.
- NEXT: PLAN-P9 -> emit P9-01 (fix Arabic encoding + lang/dir RTL) as the first build.

## Open decisions (feed P9-06..08)

- Object storage: Cloudflare R2 (recommended) vs self-hosted MinIO.
- Email sender: Hostinger SMTP vs Brevo.

## Open carry-forward / known debt

- UI is preview-grade; P9-01..05 finish it (shadcn refactor needs human/vision review).
- Live email is the only real integration this pilot (P9-06).
- VPS provisioning, TLS, secrets, backups, hardening are human-owned (P9-OPS).