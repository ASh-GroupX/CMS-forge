# Build Task: F5-01A - Generate Attachments Module Boundary And Manifest

Status: Ready to Build
Required model tier: BUILDER-STRONG
Risk: High
Phase: Phase 5 - Attachments And Notifications

## Scope

Create the behavior-free backend `attachments` module boundary for Phase 5.

Do:
- Run the canonical module generator for `attachments`.
- Fill `apps/api/src/modules/attachments/MODULE.md` with the real module boundary:
  `AttachmentsService` as the public surface, `attachments` as the owned table,
  and only allowed public-service dependencies.
- Wire the module only as needed for the existing module reachability lint gate.

Do not add:
- Upload/download routes
- Object-storage adapter behavior
- Malware scan behavior
- Attachment OpenAPI paths
- Attachment authorization rules
- Portal or staff UI
- Schema or migration changes
- Provider calls or secrets

## Requirement IDs

- ARCH-FILES-001
- REQ-FILES-001
- REQ-PORTAL-001
- REQ-PORTAL-002
- METHOD-AUDIT-001
- METHOD-API-001
- METHOD-TEST-001

## Verification Commands

- `corepack pnpm generate:module -- attachments`
- `corepack pnpm lint`
- `corepack pnpm typecheck`
- `corepack pnpm test`
- `corepack pnpm openapi:check`

## Acceptance

- The attachments module exists in canonical generated shape.
- `MODULE.md` is real OKF-style module context, not placeholder text.
- The module boundary declares no behavior that is not implemented yet.
- Existing lint, typecheck, root tests, and OpenAPI drift checks pass.
