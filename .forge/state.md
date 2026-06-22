# Current State

Status: P11B Complete
Phase: Phase 11 - Operator UX Foundation
Next Task: P11C Task update staff pickers
Model Tier: GPT-5 High or Opus 4.8 Max

## How to use this file

SNAPSHOT only. REPLACE each run, never append. Per-task detail -> evidence.md.
Prior state history is in .forge/archive/state-archive.md.

## Snapshot

- Phase 10 remains complete and release-reviewed.
- P11 Operator UX Foundation plan exists in
  `docs/OPERATOR_UX_FOUNDATION_PLAN.md`.
- P11A is complete:
  - Staff users support optional unique usernames.
  - Login accepts username or email.
  - Staff login UI says Username + Password.
  - Dev seed usernames exist for `admin`, `layla`, `omar`, and `sara`.
  - Assignable staff lookup is exposed at `GET /staff/assignable`.
  - Quick Add assignee ID input was replaced with a localized staff picker.
- P11B is complete:
  - Related-record lookup is exposed at `GET /tasks/related-records`.
  - Lookup supports customer, complaint, case, and deal records for Quick Add.
  - Lookup is scoped by server session role/branch and never accepts client
    role or branch authority.
  - Quick Add linked record type/ID fields were replaced with localized
    `Related to` and record picker controls.
  - Quick Add submits selected related record IDs silently and API-side link
    scope validation denies out-of-scope records before task persistence.
  - Customer promise validation still requires a customer, complaint, case, or
    deal link.
  - English and Arabic Quick Add touched strings are localized.
  - OpenAPI canonical/generated contracts are updated.
- Live smoke passed:
  - Username login with `admin`.
  - Today Quick Add task creation using the visible related-record picker.
  - Customer promise without a related record shows required-link validation.
  - Arabic Today related-record labels and `dir=rtl`.
  - Branch user `omar` sees Main Branch related customers only; North Branch
    customer options are absent.
- Proof passed:
  - `corepack pnpm test:api -- tasks`
  - `node --import tsx --test apps/api/src/modules/tasks/*.spec.ts`
  - `corepack pnpm test:web -- shell`
  - `corepack pnpm test:web -- localization`
  - `corepack pnpm openapi:check`
  - `corepack pnpm typecheck`
  - `corepack pnpm lint`
  - `git diff --check`

## Open carry-forward / known debt

- P11C should start with Task update forms: replace raw assignee and next
  follow-up person IDs with the existing staff picker pattern.
- Do not roll pickers across every operational form in one slice; Sent Tasks,
  Deal Handoff, case/complaint detail, CAPA owner, and report filters remain
  later P11C follow-ups.
- Existing task cards still display compact raw task/link IDs for already-saved
  task links; P11B only removed raw linked-record entry from Quick Add.
- Some seeded smoke/test users have English names in `nameAr`; Arabic copy is
  complete for touched labels, but future data seeding can improve Arabic staff
  names.
- No admin screens, AI, WhatsApp, mobile, deploy, employee grievance screens, or
  workflow builder work was added.
- Promise Tracker still resolves customer/deal display context from task-boundary
  link IDs only. Add richer labels later through public customer/deal module
  services or a dedicated read model rather than direct cross-module repository
  reads.
- Departments, branch activation controls, category activation controls,
  severity/SLA policy, notification templates, and work queue query-param
  filtering remain previously known admin/search follow-ups.
