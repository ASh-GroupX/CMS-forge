# Current State

Status: Ready to Build
Phase: Phase 9 - Production Readiness (Pilot on Hostinger)
Next Task: P9-01A - Staff shell Arabic i18n and root lang/dir RTL
Model Tier: BUILDER-STANDARD

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
  Arabic (mojibake on disk), no root RTL, and shadcn/ui was never adopted.
- PLAN-P9 split the corrupted Arabic work into P9-01A..P9-01E to keep each build
  near 1-5 files.
- NEXT: P9-01A fixes `staff-shell.ts` Arabic text and root `lang`/`dir` RTL.

## Open decisions (feed P9-06..08)

- Object storage: Cloudflare R2 (recommended) vs self-hosted MinIO.
- Email sender: Hostinger SMTP vs Brevo.

## Open carry-forward / known debt

- UI is preview-grade; P9-01A..P9-05 finish it (shadcn refactor needs human/vision review).
- Live email is the only real integration this pilot (P9-06).
- VPS provisioning, TLS, secrets, backups, hardening are human-owned (P9-OPS).
