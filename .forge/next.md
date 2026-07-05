# UI/UX Refactor - Slice 5 Complaint Detail and Workflow

Status: Ready
Required model tier: GPT-5.5 Extra High
Phase: ui-ux-redesign
Risk: Medium
SRS IDs: `ARCH-UI-001`, `UI-SCREEN-001`, `UI-DESIGN-001`, `QA-UI-001`, `REQ-LOCALIZATION-001`, `REQ-COMPLAINT-001`, `REQ-WORKFLOW-001`, `REQ-ATTACHMENT-001`, `METHOD-AUDIT-001`
Skills: `ui-ux-pro-max`, `redesign`, `design-qa`, `design-taste-frontend` supporting anti-slop only

## Task

Continue the CMS-Auto UI/UX refactor after the complaint intake slice.
Convert complaint detail into an operational workbench without changing backend
authority, route contracts, RBAC, branch scope, audit, workflow transitions,
attachment authorization, or portal behavior.

## Scope

- Rebuild complaint detail around these workbench regions:
  - Summary
  - SLA and current owner
  - Facts
  - Timeline
  - Comments
  - Attachments
  - Related complaints
  - Next action
- Use the shared primitives from Slice 2 where they fit.
- Keep workflow actions driven by backend-provided available actions and existing
  typed staff API helpers.
- Keep workflow action UI as a real Radix dialog or a clear inline action panel.
- Keep conflict recovery visible with reload latest and retry paths, without
  empty links.
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

- Complaint detail reads as a single operational workbench with the scoped
  regions above.
- Workflow action affordances are accessible and honest: no fake modal
  semantics, no empty `href`, and conflict recovery offers reload latest and
  retry.
- Backend remains the source of truth for authority, branch scope, workflow,
  attachment authorization, validation, and audit.
- No production route behavior, OpenAPI contract, RBAC, branch scope, audit,
  workflow authority, or portal privacy rule changes.
- No new UI dependency is introduced.
