# Current State

Status: P12A Dynamic RBAC data model complete
Phase: Phase 12 - Dynamic RBAC
Next Task: Plan P12B server-session permission loading and permission guard
Model Tier: GPT-5 High or Opus 4.8 Max

## How to use this file

SNAPSHOT only. REPLACE each run, never append. Per-task detail -> evidence.md.
Prior state history is in .forge/archive/state-archive.md.

## Snapshot

- P12A is complete:
  - Role identifiers are stored as extensible strings; the historic `RoleCode`
    enum remains only for workflow-history metadata.
  - `permissions` and `role_permissions` provide the persistent selectable
    permission model; role permission selection has not been exposed in the UI
    yet.
  - Dev seed creates the current six roles as system templates and assigns the
    SRS permission matrix without overwriting existing custom assignments.
  - Existing server-side role checks remain authoritative, so live access and
    branch scope did not change in this slice.
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
- P11E Operator UX Arabic completion pass is complete:
  - Arabic operator copy was tightened across Login, Today / Quick Add, Sent
    Tasks, Promises, Deals Handoff, Complaint detail / CAPA, confidential case
    labels, Reports, Notifications, and picker state copy.
  - Touched operator screens no longer show raw task/link/case/branch/deal ID
    fallbacks in normal UI.
  - Staff and related-record picker controls keep stable RTL layout with long
    Arabic labels.
  - Complaint detail / CAPA no longer exposes raw case or branch IDs when human
    labels are unavailable.
  - Representative Arabic screenshots were saved under `output/playwright/`.
- P11 final release review is complete:
  - Confidential case display was hardened to avoid raw case, branch, and note
    author ID display in the touched case route.
  - Generated `output/run-app/web.stdout.log` was cleaned after stopping the
    repo-local smoke dev server that locked it.
  - P11E screenshots remain under `output/playwright/` as intentional evidence.
- OpenAPI did not change for the release review.
- Proof passed:
  - `corepack pnpm test:api -- auth`
  - `corepack pnpm test:api -- tasks`
  - `corepack pnpm test:api -- deals`
  - `corepack pnpm test:api -- cases`
  - `corepack pnpm test:api -- reports`
  - `corepack pnpm test:web -- shell`
  - `corepack pnpm test:web -- localization`
  - `corepack pnpm openapi:check`
  - `corepack pnpm typecheck`
  - `corepack pnpm lint`
  - `git diff --check`

## Open carry-forward / known debt

- Some seeded smoke/test users have English names in `nameAr`; Arabic copy is
  complete for touched labels, but future data seeding can improve Arabic staff
  names.
- Optional live smoke was not repeated in this release review; prior P11E smoke
  screenshots were retained as evidence and automated proof was rerun.
- No admin screens, AI, WhatsApp, mobile, deploy, employee grievance screens, or
  workflow builder work was added.
