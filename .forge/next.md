# User-Scoped UX Redesign - Slice 3

Status: Ready
Required model tier: GPT-5.5 Extra High
Phase: user-scoped-ux-redesign
Risk: High
SRS IDs: REQ-FILES-001, ARCH-FILES-001, REQ-PORTAL-002, UI-SCREEN-001, UI-DESIGN-001, NFR-SEC-002

## Task

Make attachments usable.

## Scope

- Re-read Slice 3 in `docs/USER_SCOPED_UX_REDESIGN_PLAN.md`.
- Inspect current attachment controls, upload/download APIs, portal verified tracking attachment flow, and attachment tests before editing.
- Make staff attachment upload/download/scan-state actions real through existing backend routes.
- Make verified portal attachment upload usable without exposing download URLs, storage keys, internal files, or staff-only metadata.
- Keep attachment security, authorization, scan policy, audit, and portal privacy backend-owned.

## Proof

- `corepack pnpm test:api -- attachments`
- `corepack pnpm test:api -- portal.tracking`
- `corepack pnpm test:web -- api-client`
- `corepack pnpm test:web -- shell`
- `corepack pnpm test:e2e -- accessibility`
- `corepack pnpm test:visual`
- `corepack pnpm openapi:check`
- `corepack pnpm typecheck`
- `corepack pnpm lint`
- `git diff --check`
