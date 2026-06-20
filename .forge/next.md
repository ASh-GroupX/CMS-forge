# Plan Task: PLAN-P9 - Sequence Phase 9 Production Readiness

Status: Ready to Plan
Required model tier: PLANNER
Phase: Phase 9 - Production Readiness (Pilot on Hostinger)

## Goal

Turn docs/PRODUCTION_READINESS.md + the Phase 9 backlog into the first buildable task,
in the correct order. Each task: 1-5 files with an EXECUTED proof, not static green.

## Inputs

- docs/PRODUCTION_READINESS.md (the program + go-live gates + open decisions)
- .forge/backlog.md Phase 9
- docs/CMS_AUTO_SRS.md: REQ-LOCALIZATION-001, UI-DESIGN-001, REQ-NOTIFY-001,
  NFR-SEC-001 (AC4 HTTPS), NFR-AVAIL-001 (backup/restore)
- apps/web/src/i18n/* (corrupted Arabic), apps/web/src/app/layout.tsx (lang=en, no dir),
  apps/web (no components/ui - shadcn never adopted), apps/web/src/app/*.tsx (preview
  scaffolding + hardcoded data)

## Output

- Write the first buildable Phase 9 task to .forge/next.md: P9-01 - fix the corrupted
  Arabic i18n + wire per-locale lang/dir RTL in layout.tsx (the concrete bug, highest
  visible payoff, no VPS needed). Keep it 1-5 files + a test.
- Set .forge/state.md to Ready to Build.

## Guardrails / order

- UI quality is judgment-heavy: snapshot gates only prevent regression, they do not
  create quality. The shadcn refactor (P9-04) must use a human/vision review gate, not
  visual snapshots alone - plan it that way.
- P9-02 (mojibake gate) lands AFTER P9-01 (the fix), or it fails on existing corruption.
- Email/deploy tasks (P9-06..08) need the Docker/staging stack for their proof; do not
  mark done on static green.
- Two open decisions feed P9-06..08: object storage (Cloudflare R2 vs MinIO) and email
  sender (Hostinger SMTP vs Brevo). See docs/PRODUCTION_READINESS.md.
- Replace state.md (do not append).