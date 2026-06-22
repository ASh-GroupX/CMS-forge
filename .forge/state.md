# Current State

Status: Reports Export Live Smoke Repair Complete
Phase: Phase 11 - Operator UX Foundation
Next Task: Ready to plan next Operator UX slice
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
- P11C is complete:
  - Today task update assignee uses the assignable staff picker.
  - Today next follow-up person uses the assignable staff picker.
  - Sent Tasks collaboration context no longer falls back to visible raw staff
    IDs for assignee, next owner, or comment author.
- P11D Deals slice is complete:
  - Deal Handoff create and advance holder controls use the shared assignable
    staff picker.
  - Selected holder IDs submit silently through hidden inputs.
  - Visible holder/owner labels show staff name, role, and branch where the
    session-scoped lookup can resolve them.
  - Visible branch labels no longer fall back to raw IDs.
  - Deal card raw deal ID display was removed; action forms still submit the
    deal ID silently.
  - Arabic Deal Handoff copy for the touched screen uses real Arabic.
- P11D CAPA / Case picker slice is complete:
  - CAPA create uses the shared assignable staff picker instead of visible raw
    owner ID entry.
  - CAPA create silently submits owner ID and validates it server-side with
    `AdminUsersService.assertAssignable`.
  - CAPA owner omission preserves the prior case-owner/actor fallback.
  - Complaint and confidential case detail owner displays no longer fall back to
    visible raw owner IDs.
  - No new case owner edit field or lifecycle action was added.
  - Arabic CAPA picker labels, placeholders, selected/empty/loading/error copy,
    and status labels are complete.
- P11D Reports filter picker cleanup is complete:
  - Reports branch and category filters use dropdowns populated by the existing
    session-scoped complaint form options lookup.
  - Reports owner filter uses the shared assignable staff picker.
  - Visible report filter labels and row scope/category labels avoid raw IDs.
  - Selected branch/category/owner IDs submit silently in query parameters.
  - Export links preserve selected filters.
  - Arabic Reports filter labels, placeholders, selected/empty/loading/error
    copy, and RTL layout are complete for touched controls.
- Reports export live smoke repair is complete:
  - Local API export 500 was reproduced and traced to reports module runtime
    injection/controller binding.
  - Reports controller/service/repository now use explicit Nest injection where
    the local runtime needed it.
  - Export filters, row limits, RBAC, branch scope, and REPORT audit behavior
    are preserved.
  - Live allowed export returns 200 with CSV download headers.
  - Live out-of-scope branch export returns 403.
  - Report KPI calculations and Reports UI were not changed.
- OpenAPI did not change for the export repair.
- Proof passed:
  - `corepack pnpm test:api -- reports`
  - `corepack pnpm test:web -- shell`
  - `corepack pnpm test:web -- localization`
  - `corepack pnpm openapi:check`
  - `corepack pnpm typecheck`
  - `corepack pnpm lint`
  - `git diff --check`

## Open carry-forward / known debt

- Existing task cards still display compact raw task/link IDs for already-saved
  task links; P11B/P11C only removed raw record/staff entry from normal task
  workflows.
- Some seeded smoke/test users have English names in `nameAr`; Arabic copy is
  complete for touched labels, but future data seeding can improve Arabic staff
  names.
- No admin screens, AI, WhatsApp, mobile, deploy, employee grievance screens, or
  workflow builder work was added.
