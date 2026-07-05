# UI/UX Refactor - Slice 4 Complaint Create, Lookup, and Attachments

Status: Ready
Required model tier: GPT-5.5 Extra High
Phase: ui-ux-redesign
Risk: Medium
SRS IDs: `ARCH-UI-001`, `UI-SCREEN-001`, `UI-DESIGN-001`, `QA-UI-001`, `REQ-LOCALIZATION-001`, `REQ-COMPLAINT-001`, `REQ-ATTACHMENT-001`
Skills: `ui-ux-pro-max`, `redesign`, `design-qa`, `design-taste-frontend` supporting anti-slop only

## Task

Continue the CMS-Auto UI/UX refactor after the staff dashboard/work queue slice.
Rebuild complaint intake as one structured flow without changing backend
authority, route contracts, RBAC, branch scope, audit, attachment authorization,
or portal behavior.

## Scope

- Rebuild intake around these sections:
  - Customer lookup
  - Vehicle lookup
  - Manual fallback
  - Complaint facts
  - Attachments
  - Validation
  - Submit result
- Use the shared primitives from Slice 2 where they fit.
- Keep the real typed API client only; no hardcoded sample data or fake browser
  authority.
- Make attachment validation and scan-status outcomes clear.
- Keep error summary and field-level recovery paths visible.
- Use semantic tokens and shrink raw color usage where touched.
- Keep UI copy in dictionaries and preserve Arabic RTL plus English LTR.

## Proof

- `corepack pnpm typecheck`
- `corepack pnpm lint`
- `corepack pnpm test:web -- shell`
- `corepack pnpm test:web -- localization`
- `corepack pnpm test:visual`
- `corepack pnpm web:visual-review`
- `corepack pnpm test:e2e -- accessibility`
- `corepack pnpm web:perf`
- `git diff --check`

## Stop When

- Complaint create, lookup, manual fallback, attachments, validation, and submit
  result read as one structured intake flow.
- Backend remains the source of truth for authority, branch scope, workflow,
  attachment authorization, validation, and audit.
- No production route behavior, OpenAPI contract, RBAC, branch scope, audit,
  workflow authority, or portal privacy rule changes.
- No new UI dependency is introduced.
