# Current State

Status: Ready to Build
Phase: Phase 7 - Reports, UAT, And Ops
Next Task: F7-01A - Generate Reports Module Boundary And Manifest

## PLAN-F7-01 Complete - Phase 7 Decomposed, Ready To Build

Required tier used: `PLANNER`. PLAN-F7-01 decomposed Phase 7 from SRS milestone
`PLAN-M6` (reporting, audit, search, performance, operations, pilot hardening)
plus the homeless `PLAN-M5` customer portal UI screens and the five
PHASE-6-REVIEW carry-forward conditions. The full ordered breakdown is in
`.forge/backlog.md` under Phase 7 (F7-01..F7-09 with lettered subtasks).

Plan shape (backend-first → real session-bound UI wiring → portal UI → pre-pilot
quality/ops/UAT/deploy):

- F7-01 Reports/dashboards/scoped exports (REQ-REPORT-001) — generate module,
  cross-module read access, dashboard + filtered report read models, RBAC +
  branch-scoped routes, bounded CSV/Excel export with export audit.
- F7-02 Complaint search API (REQ-SEARCH-001).
- F7-03 Real session-bound staff UI data wiring — resolves carry-forward
  condition 1: role/branch from the server session via `/auth/me`, retiring
  `?role=` as an authority source.
- F7-04 Customer portal UI UI-018/019/020 — resolves condition 4 (or explicit
  commercial exclusion per UI-SCREEN-001 AC5).
- F7-05 Pre-pilot UI quality debt — real a11y/contrast (condition 2) and
  destructive-confirmation state (condition 3).
- F7-06 OpenAPI finalization; F7-07 ops hardening (`ops:backup:check`,
  `test:performance`, and `security:check` — condition 5 — made real);
  F7-08 UAT scripts/L4 data; F7-09 deployment runbook (NFR-SEC-001 AC4).

First buildable task: `F7-01A` (BUILDER-STANDARD) generates only the behavior-free
`reports` module shell + manifest and wires it into the root module. Reporting
RBAC, branch scope, export limits, and export audit begin at `F7-01B`
(BUILDER-STRONG). All Phase 7 build tasks stay within the 1-5 file / 300-line
agentic budget; SRS numbered requirements win over convenience.

## PHASE-6-REVIEW Accepted With Conditions - Phase 7 Ready To Plan

PHASE-6-REVIEW independently re-ran the full Phase 6 proof surface on 2026-06-19
(fresh PHASE-REVIEWER context, not log-trust): lint, typecheck, test 31/31
(coverage 93.78% lines / 86.14% branch / 92.47% funcs), test:web -- shell 88/88,
test:web -- api-client 9/9, test:visual 16, test:e2e -- accessibility 11,
web:perf 2, openapi:check, git diff --check, and the Phase 6 backend
test:api -- auth 32/32. All counts reproduced the builder evidence exactly.

Decision: **Accept With Conditions**. Phase 6 delivered every staff-UI task with
honest evidence and clean trust boundaries — the create form is the only
backend-wired surface (delegates to `createStaffComplaint` with credentials +
CSRF and no client authority fields), the workflow modal and detail/attachment
controls are inert render-only placeholders that decide no transition and move no
files, there is no browser token storage or secret logging, and the proof runner
is a real deterministic L2 render check, not theater.

Five non-blocking conditions are tracked in `.forge/trust.md` under
`PHASE-6-REVIEW`:
1. Preview role/branch (`?role=`) must become server-session-derived before any
   real data is wired in Phase 7.
2. Contrast + real keyboard/browser accessibility (L3) owed before pilot.
3. `destructive confirmation` UI state not yet covered.
4. Customer portal UI screens UI-018/UI-019/UI-020 are MVP/must but homeless —
   added to the backlog under Phase 7 for the planner to sequence or exclude.
5. `security:check` is still a fail-loud placeholder.

Phase 7 opens with a PLANNER pass (`PLAN-F7-01`) rather than direct build, because
F7-01 (operational dashboards + scoped exports) is broader than the 1–5 file
budget and the planner must also reconcile the portal UI screens. Phase 7
implementation must not begin until the planner writes the first buildable task.

## F6-07D Built - AUTO PHASE Stopped For Phase Review

`F6-07D` strengthened `web:perf` with explicit staff dashboard and work-queue
performance cases. Budgets now check deterministic server-render duration, HTML
size, table-row count, responsive guard count, static script emission, image
dimension safety, and required dashboard/queue surface signals.

Required proof passed: lint, typecheck, test 31/31, test:web -- shell 88/88,
test:visual across 16 previews, test:e2e -- accessibility across 11 previews,
web:perf across 2 previews, openapi:check, and git diff --check with line-ending
warnings only.

No browser performance dependency, Lighthouse, UI behavior change, backend route,
OpenAPI change, generated client, database migration, provider call, browser
storage, or product dependency was added.

All Phase 6 backlog items are complete. AUTO PHASE stops here for the mandatory
Phase 6 PHASE-REVIEWER gate before Phase 7 can begin.

## F6-07C Built - AUTO PHASE Continuing

`F6-07C` expanded accessibility proof to 11 named staff-shell cases covering
dashboard feedback, queue labels and alerts, create validation/network feedback,
detail alert state, workflow dialog naming and controls, Admin feedback, reports
denied feedback, and audit filters across English LTR and Arabic RTL. It also
added global focus-visible and reduced-motion CSS.

Required proof passed: lint, typecheck, test 31/31, test:web -- shell 88/88,
test:visual across 16 previews, test:e2e -- accessibility across 11 previews,
web:perf, openapi:check, and git diff --check with line-ending warnings only.

No browser automation dependency, UI feature behavior, backend route, OpenAPI
change, generated client, database migration, provider call, browser storage, or
product dependency was added. AUTO PHASE continues with `F6-07D`.

## F6-07B Built - AUTO PHASE Continuing

`F6-07B` expanded the visual proof runner to 16 deterministic
visual-regression cases: dashboard, work queue, complaint create, complaint
detail, workflow modal, Admin surfaces, reports, and audit viewer, each in
English LTR and Arabic RTL. Cases assert localized visual signals, table/form/
dialog structure, responsive guard classes, direction, section count, and
non-blank render output.

Required proof passed: lint, typecheck, test 31/31, test:web -- shell 88/88,
test:visual across 16 previews, test:e2e -- accessibility, web:perf,
openapi:check, and git diff --check with line-ending warnings only.

No browser automation dependency, screenshot baseline files, UI behavior change,
backend route, OpenAPI change, generated client, database migration, provider
call, browser storage, or product dependency was added. AUTO PHASE continues
with `F6-07C`.

## F6-07A Built - AUTO PHASE Continuing

`F6-07A` replaced fail-loud UI proof placeholders with a deterministic local web
proof runner. `test:visual`, `test:e2e -- accessibility`, and `web:perf` now
render English LTR and Arabic RTL staff shell previews and assert visual
structure, accessibility smoke signals, and frontend performance smoke budgets.

Required proof passed after two honest setup repairs: `test:visual` initially
failed because the root tool resolved `react-dom` from the wrong package, and
`test:e2e -- accessibility` initially failed because the button-type assertion
rejected explicit `type="submit"`. Final proof passed: lint, typecheck, test
31/31, test:web -- shell 88/88, test:visual, test:e2e -- accessibility,
web:perf, openapi:check, and git diff --check with line-ending warnings only.

No browser automation dependency, screenshot baselines, backend route, OpenAPI
change, generated client, database migration, provider call, browser storage, or
product feature behavior was added. AUTO PHASE continues with `F6-07B`.

## F6-06B Built - AUTO PHASE Continuing

`F6-06B` added localized render-only CSV and Excel export affordances to the
reports dashboard. It shows row-limit, RBAC-filtered, and export-audit copy, plus
ready and denied export preview states alongside the existing report state
family.

Required proof passed: lint, typecheck, test 29/29, test:web -- shell 88/88,
openapi:check, and git diff --check with line-ending warnings only.

No report data fetch, CSV/Excel generation, Blob/object URL, download behavior,
metric calculation, report detail navigation, backend route, OpenAPI change,
generated client, browser storage, or new dependency was added. `F6-06` is
complete; AUTO PHASE continues with `F6-07A`.

## F6-06A Built - AUTO PHASE Continuing

`F6-06A` added a localized render-only reports dashboard in the staff shell. It
renders RPT-001 through RPT-017 placeholder entries with report names, audience
text, category badges, API-pending status, management/admin visibility, staff
hiding, and loading, empty, error, success, validation, and conflict states.

Required proof passed: lint, typecheck, test 29/29, test:web -- shell 87/87,
openapi:check, and git diff --check with line-ending warnings only.

No report data fetch, metric calculation, chart rendering, export file, report
detail navigation, pagination, search, sort, backend route, OpenAPI change,
generated client, browser storage, or new dependency was added.

## F6-05F Built - AUTO PHASE Continuing

`F6-05F` added a localized render-only in-app notification center in the staff
shell. It renders unread/read notification regions with event badges, timestamps,
scoped complaint-link affordance, mark-read affordance, and loading, empty, error,
success, validation, and conflict states.

Required proof passed: lint, typecheck, test 29/29, test:web -- shell 83/83,
openapi:check, and git diff --check with line-ending warnings only.

No notification fetch, mark-read mutation, link navigation, pagination, search,
sort, backend route, OpenAPI change, generated client, browser storage, or new
dependency was added. `F6-05` is complete; AUTO PHASE continues with `F6-06A`.

## F6-05E Built - AUTO PHASE Continuing

`F6-05E` added a localized render-only Audit viewer screen in the staff shell. It
renders actor, action, target, date, and correlation ID filters; safe placeholder
rows with timestamp, actor, action, target, correlation ID, and event badges; an
export affordance; and loading, empty, error, success, validation, and conflict
states.

Required proof passed: lint, typecheck, test 29/29, test:web -- shell 79/79,
openapi:check, and git diff --check with line-ending warnings only.

No audit fetch, export file generation, pagination, search, sort, backend route,
OpenAPI change, generated client, browser storage, or new dependency was added.

## F6-05D Built - AUTO PHASE Continuing

`F6-05D` added a localized render-only Admin notification template screen in the
staff shell. It renders template table and preview regions with event triggers,
channels, Arabic/English language labels, approved placeholder tokens,
active/inactive badges, edit/activate/deactivate affordances, and loading, empty,
error, success, validation, and conflict states.

Required proof passed: lint, typecheck, test 29/29, test:web -- shell 75/75,
openapi:check, and git diff --check with line-ending warnings only.

No Admin API fetch/mutation, template persistence, provider call, dispatch
behavior, real template rendering engine, backend route, OpenAPI change,
generated client, browser storage, or new dependency was added.

## F6-05C Built - AUTO PHASE Continuing

`F6-05C` added a localized render-only Admin categories, severities, and SLA
policy screen in the staff shell. It renders category tree, severity values, and
SLA policy table regions with active/inactive badges, scoped policy badges,
warning threshold, deadline fields, create/edit/deactivate affordances, and
loading, empty, error, success, validation, and conflict states. It also grouped
Admin panels behind `AdminSurfaces` to keep the shell file inside the source
budget and tightened the users/roles panel preview-state banner.

Required proof passed after one honest typecheck repair: the first `typecheck`
run found a stale Admin preview prop type after the wrapper change. Final proof
passed: lint, typecheck, test 29/29, test:web -- shell 71/71, openapi:check, and
git diff --check with line-ending warnings only.

No Admin API fetch/mutation, category persistence, severity persistence, SLA
deadline calculation, escalation logic, backend route, OpenAPI change, generated
client, browser storage, or new dependency was added.

## F6-05B Built - AUTO PHASE Continuing

`F6-05B` added a localized render-only Admin users, roles, branch-scope, and
password-reset UI contract in the staff shell. It renders a user table region,
role and branch-scope badges, active/inactive state, create/edit/deactivate
affordances, a generic password-reset affordance, and loading, empty, error,
success, validation, and conflict states.

Required proof passed: lint, typecheck, test 29/29, test:web -- shell 66/66,
openapi:check, and git diff --check with line-ending warnings only.

No Admin API fetch/mutation, role assignment behavior, branch-scope persistence,
password reset delivery, backend route, OpenAPI change, generated client, browser
storage, or new dependency was added.

## F6-05A Built - AUTO PHASE Continuing

`F6-05A` added a localized render-only Admin branches/departments screen in the
staff shell. It renders branch and department tables, active/inactive badges,
create/edit/deactivate affordances, Admin-only preview visibility, and loading,
empty, error, success, validation, and conflict states.

Required proof passed: lint, typecheck, test 29/29, test:web -- shell 63/63,
openapi:check, and git diff --check with line-ending warnings only.

No Admin API fetch/mutation, client RBAC decision, audit behavior, backend route,
OpenAPI change, generated client, browser storage, or new dependency was added.

## F6-04E Built - AUTO PHASE Continuing

`F6-04E` added localized conflict recovery affordances to the complaint detail
workflow conflict state and strengthened detail workspace English LTR / Arabic RTL
proof across facts, comments, attachments, and workflow regions.

Required proof passed: lint, typecheck, test 29/29, test:web -- shell 59/59,
openapi:check, and git diff --check with line-ending warnings only.

No API call, latest-record fetch, diff/retry behavior, workflow status decision,
backend route, OpenAPI change, generated client, browser storage, or new
dependency was added. `F6-04` is complete; AUTO PHASE continues with `F6-05A`.

## F6-04D Built - AUTO PHASE Continuing

`F6-04D` added a localized render-only workflow action modal section inside the
complaint detail workspace. It shows approve, send back, assign, investigate,
resolve, close, reject, and reopen action affordances; required comment input;
validation, loading, empty, error, success, and conflict preview states; and copy
that keeps workflow authority with the backend.

Required proof passed: lint, typecheck, test 29/29, test:web -- shell 57/57,
openapi:check, and git diff --check with line-ending warnings only.

No transition API call, frontend status decision, owner/branch/SLA/audit decision,
backend route, OpenAPI change, generated client, browser storage, or new
dependency was added.

## F6-04C Built - AUTO PHASE Continuing

`F6-04C` added localized render-only attachment controls inside the complaint
detail workspace. The panel shows upload and authorized-download affordances, safe
file-rule text, pending/clean/rejected scan badges, and loading, empty, and error
preview states.

Required proof passed: lint, typecheck, test 29/29, test:web -- shell 53/53,
openapi:check, and git diff --check with line-ending warnings only.

No file upload, file read, object URL, API fetch, download URL, backend route,
OpenAPI change, generated client, provider call, browser storage, or new
dependency was added.

## F6-04B Built - AUTO PHASE Continuing

`F6-04B` added localized render-only internal comments and public-update panels
inside the complaint detail workspace. The panels show staff-only and
customer-visible badges, safe placeholder author/time/visibility structure, and
loading, empty, and error preview states.

Required proof passed: lint, typecheck, test 29/29, test:web -- shell 49/49,
openapi:check, and git diff --check with line-ending warnings only.

No comment fetch/create/edit/delete behavior, portal UI exposure, workflow action,
attachment behavior, backend route, OpenAPI change, generated client, browser
storage, or new dependency was added.

## F6-04A Built - AUTO PHASE Continuing

`F6-04A` added a localized render-only staff complaint detail workspace. It shows
safe static regions for complaint facts, masked customer data, masked vehicle
data, current owner, status, SLA timer, timeline, and submitted survey results,
plus loading, empty, and error preview states.

Required proof passed: lint, typecheck, test 29/29, test:web -- shell 47/47,
openapi:check, and git diff --check with line-ending warnings only.

No detail API fetch, workflow action, comments behavior, attachment behavior, SLA
calculation, survey API behavior, backend route, OpenAPI change, generated client,
browser storage, or new dependency was added.

## F6-03D2 Built - AUTO PHASE Continuing

`F6-03D2` wired the staff complaint create form to the `createStaffComplaint(...)`
write helper. The form now builds the documented backend request fields from
`FormData`, calls the helper, preserves visible values across success and error
states, renders returned reference/status success text, maps API field errors to
matching form fields, and keeps network/generic errors safe and localized.

Required proof passed after one honest typecheck repair: the first `typecheck`
run failed on `exactOptionalPropertyTypes` for optional child-component props; the
props were tightened and final proof passed: lint, typecheck, test 29/29,
test:web -- shell 42/42, openapi:check, and git diff --check with line-ending
warnings only.

No attachment upload behavior, backend route, OpenAPI change, generated client,
workflow decision, browser storage, session cookie access, or new dependency was
added.

## F6-03D1 Built - AUTO PHASE Continuing

`F6-03D1` added the staff web write helper for `POST /complaints`. It sends a
relative `/complaints?branchId=...` request with `credentials: "include"`, JSON
body, the readable `cms_csrf_token` cookie copied to `x-csrf-token` when present,
and no role/actor/workflow/credential authority in the request body.

Required proof passed: lint, typecheck, test 29/29, test:web -- api-client 9/9,
openapi:check, and git diff --check with line-ending warnings only.

No UI form wiring, attachment upload behavior, backend route, OpenAPI change,
generated client, browser credential exposure, or new dependency was added.

## PLAN-F6-03D-COMPLAINT-SUBMIT-SPLIT Complete - Write Client Slice Selected

Required tier used: `PLANNER`. `F6-03D` was split because the original task
crosses write-client behavior, CSRF, validation envelope mapping, preserved form
state, and shell integration.

Next build task: `F6-03D1` adds only the typed staff web write helper for
`POST /complaints`, including CSRF header handling and validation-error mapping.
`F6-03D2` wires the create form UI after the request contract is isolated.

## F6-03C Built - AUTO PHASE Stopped For Planning

`F6-03C` added a localized render-only attachment upload panel to the complaint
create surface. It includes file-rule messages, a file input control,
placeholder selected-file text, scan-status states for pending/clean/rejected,
and loading/empty/error panel states in English and Arabic. It does not read
files, create object URLs, upload, persist content, or expose storage URLs.

Required proof passed: lint, typecheck, test 29/29, test:web -- shell 40/40,
and git diff --check with line-ending warnings only.

AUTO PHASE stops here because the next backlog item, `F6-03D`, would introduce
real complaint submission through the backend API. That crosses frontend API
client write behavior, server-session credentials, CSRF/session handling,
validation envelope mapping, preserved form state, and shell integration. The
next step is a `PLANNER` split before coding.

## F6-03B Built - AUTO PHASE Continuing

`F6-03B` added the localized render-only complaint create form contract after
the customer/vehicle lookup panel. It includes category, severity, branch,
incident date, subject, and description fields; field-level validation preview
messages; VIN-required-when-vehicle-related copy; and success/error preview
states that preserve visible safe sample input.

Required proof passed after two honest test-scope repairs: the first focused
shell run failed because the dictionary exceeded the 300-line budget, fixed by
removing unused legacy shell strings; the next focused run failed because an old
password-reset assertion scanned the whole page after create-form preserved
values were added, fixed by narrowing it to the reset component source. Final
proof passed: lint, typecheck, test 29/29, test:web -- shell 35/35, and git
diff --check with line-ending warnings only.

No API call, attachment UI, workflow action, complaint detail UI, browser
storage, customer PII, internal comment, audit log, DMS code, portal data, or
new dependency was added.

## F6-03A Built - AUTO PHASE Continuing

`F6-03A` added a localized render-only customer/vehicle lookup panel to the
staff shell. It includes phone, customer code, name, VIN, and plate search
fields, safe local/DMS source badges, safe placeholder result text, manual
fallback affordance, and previewable loading, no-match, and error states.

Required proof passed after one honest test-scope repair: initial
`test:web -- shell` failed because an older broad queue privacy assertion also
matched the new legitimate VIN field label; the assertion was narrowed to the
queue component source. Final proof passed: lint, typecheck, test 29/29,
test:web -- shell 30/30, and git diff --check with line-ending warnings only.

No DMS/CRM/backend API call, complaint submission behavior, full create form,
browser storage, real customer PII, DMS code, audit log, portal data, or new
dependency was added.

## F6-02D Built - AUTO PHASE Continuing

`F6-02D` added focused shell tests proving the staff shell, dashboard card grid,
queue filter grid, and queue table container expose responsive classes for the
current lightweight web proof level. It also proves English LTR and Arabic RTL
render dashboard and queue labels together. No browser automation was added
because visual/a11y/performance runners remain scheduled for `F6-07`.

Required proof passed: lint, typecheck, test 29/29, test:web -- shell 25/25,
and git diff --check with line-ending warnings only.

`F6-02` is now complete. No API calls, new UI surfaces, client-side permission
decisions, browser automation, visual runner, accessibility runner, performance
runner, or new dependency was added.

## F6-02C Built - AUTO PHASE Continuing

`F6-02C` replaced the remaining queue placeholder with a localized complaint
work queue table contract. The shell now renders queue filters, localized table
headers, a safe static sample row set, pagination affordance, and previewable
loading, empty, and error queue states in English and Arabic. This remains
visual-only and does not call APIs or perform real filtering/pagination.

Required proof passed: lint, typecheck, test 29/29, test:web -- shell 23/23,
and git diff --check with line-ending warnings only.

No API calls, real filtering/pagination behavior, detail workspace, workflow
actions, client-side permission decisions, customer PII, internal comments,
audit logs, portal data, or new dependencies were added.

## F6-02B Built - AUTO PHASE Continuing

`F6-02B` replaced the placeholder summary counters with localized, role-specific
dashboard summary cards for staff, admin, and management preview states. The
cards cover open, overdue, SLA warning, closed, and average TAT views where
appropriate for the role preview, plus previewable loading, empty, and error
states. This remains visual-only and does not call APIs or grant authority.

Required proof passed: lint, typecheck, test 29/29, test:web -- shell 19/19,
and git diff --check with line-ending warnings only.

No API calls, queue table, filters, detail workspace, workflow actions,
client-side permission decisions, or new dependencies were added.

## F6-02A Built - AUTO PHASE Continuing

`F6-02A` added a minimal typed web client helper for staff complaint queue and
detail reads. The helper uses relative `GET /complaints` and
`GET /complaints/{id}` paths, cookie credentials, explicit web-facing response
types, safe API/network error mapping, and correlation ID preservation. It does
not accept role, branch, workflow, token, or credential parameters and does not
call APIs from the existing shell.

Required proof passed: lint, typecheck, test 29/29, test:web -- api-client 4/4,
and git diff --check with line-ending warnings only.

No dashboard rendering, queue rendering, filters, workflow actions, client-side
authorization decisions, token storage, generated client, or new dependency was
added.

## F6-01D4 Built - AUTO PHASE Continuing

`F6-01D4` added the localized staff password-reset UI contract to the existing
staff shell. The signed-out shell now exposes forgot-password and reset-token
entry points, request and token forms, generic request success text, generic
invalid/expired-token text, and reset success text in English and Arabic. The
UI remains render-only: no API calls, frontend API client layer, delivery
adapter, browser token storage, or Admin reset UI was added.

Required proof passed after one honest repair: initial typecheck failed on
`exactOptionalPropertyTypes` for the optional preview state; the prop types were
tightened and the final proof passed: lint, typecheck, test 29/29,
test:web -- shell 14/14, and git diff --check with line-ending warnings only.

`F6-01` and `F6-01D` are now complete. AUTO PHASE remains in Phase 6 and
continues with `F6-02A`.

## F6-01D3 Built - AUTO PHASE Continuing

`F6-01D3` exposed password reset request and consume behavior through public
pre-session auth routes. The request route returns only generic `{ ok: true }`
even if the service returns a raw token for internal delivery wiring, and the
consume route returns the service's generic `{ ok: boolean }` result. DTO
validation uses the standard validation envelope, audit context is passed from
the request, and OpenAPI documents both routes without credential examples.

Required proof passed: lint, typecheck, test 29/29, test:api -- auth 32/32,
openapi:check, and git diff --check with line-ending warnings only.

No email/SMS delivery, frontend UI, browser token storage, admin reset UI,
session-only guard, or CSRF requirement was added to these pre-session routes.

## F6-01D2 Built - AUTO PHASE Continuing

`F6-01D2` added backend password-reset consume behavior in the auth service and
repository. Valid unconsumed, non-expired reset tokens now update the staff
password hash with fresh Argon2id, mark the token consumed, and write an `AUTH` /
`password_reset_complete` audit entry in the same transaction. Missing, expired,
and consumed tokens return the same generic denial; weak passwords fail
validation before token lookup or persistence.

Required proof passed: lint, typecheck, test 29/29, test:api -- auth 27/27,
openapi:check, and git diff --check with line-ending warnings only.

No HTTP routes, OpenAPI paths, email/SMS delivery, frontend UI, browser token
storage, or admin reset UI was added.

## F6-01D1 Built - AUTO PHASE Continuing

`F6-01D1` added the password reset token foundation inside the auth module.
Added `StaffPasswordResetToken` Prisma model (user relation, hash-only storage,
15-minute expiry, consumed timestamp, and query indexes), SQL migration, updated
auth module manifest, `createPasswordResetToken` repository method, and
`requestPasswordReset` service behavior. The service normalizes identifiers,
returns generic `{ ok: true }` for all user states (missing/inactive/locked/active)
to prevent user-existence oracle, stores only SHA-256 token hashes, and writes a
same-transaction `AUTH` / `password_reset_request` audit entry for active users.

Required proof passed: lint, typecheck, test 29/29, test:api -- auth 24/24,
prisma:validate, openapi:check, and git diff --check with line-ending warnings only.
Extra sanity proof passed: `corepack pnpm --filter @cms-auto/web build`.

No HTTP routes, OpenAPI paths, email/SMS delivery, browser token storage, admin
reset UI, consume/reset behavior, or password-change logic was added.



## PLAN-F6-01D-PASSWORD-RESET-BACKEND-GAP Complete - Backend Reset Path Selected

Required tier used: `PLANNER`. `REQ-AUTH-001` AC6 and `UI-SCREEN-001` mark staff
password reset as MVP/must, so UI-001A is not deferred without an explicit
commercial exclusion.

The backend prerequisite is split before returning to the UI contract:
`F6-01D1` adds reset-request token persistence and generic service behavior,
`F6-01D2` adds consume/reset behavior, `F6-01D3` adds HTTP routes/OpenAPI, and
`F6-01D4` adds the staff password-reset UI contract.

## F6-01C Built - AUTO PHASE Stopped For Planning

`F6-01C` added localized role preview labels and a small visual-only navigation
allow-list for staff, admin, and management shell states. Staff role previews hide
Admin-only surfaces and show a localized hidden-state message; Admin previews show
the full placeholder navigation. This does not fetch roles, call APIs, grant
access, or decide workflow authority.

Required proof passed: lint, typecheck, test 29/29, test:web -- shell 8/8, and
git diff --check with line-ending warnings only. Extra sanity proof passed:
`corepack pnpm --filter @cms-auto/web build`.

AUTO PHASE stops because the next backlog task, `F6-01D`, depends on password
reset endpoints, and those are absent from OpenAPI and the auth module. The next
step is a `PLANNER` task to split the backend prerequisite or explicitly defer
UI-001A.

## F6-01B Built - AUTO PHASE Continuing

`F6-01B` extended the staff shell with a localized login panel, generic safe
login failure message, signed-out/signed-in visual states, and a localized logout
affordance placeholder. The UI uses query-string previews only for shell proof;
it does not store tokens, call auth APIs, or decide authorization.

Required proof passed: lint, typecheck, test 29/29, test:web -- shell 5/5, and
git diff --check with line-ending warnings only. Extra sanity proof passed:
`corepack pnpm --filter @cms-auto/web build`.

No new auth backend behavior, API client calls, role-aware navigation, complaint
data, workflow actions, forms beyond the login surface, uploads, reports, admin
CRUD, visual runner, accessibility runner, or performance runner was added.

## F6-01A Built - AUTO PHASE Continuing

`F6-01A` replaced the web liveness-only runtime with a minimal Next.js App
Router staff shell. The first screen now renders dense operational placeholder
navigation for dashboard, work queue, complaint create/detail, admin, reports,
audit, and notifications. Labels and direction come from the shared English/Arabic
web dictionary, and unsupported locale input falls back to English/LTR.

Required proof passed: lint, typecheck, test 29/29, test:web -- shell 3/3, and
git diff --check with line-ending warnings only. Extra sanity proof passed:
`corepack pnpm --filter @cms-auto/web build`.

No API calls, login/session behavior, role-aware nav, complaint data, workflow
actions, forms, uploads, admin CRUD, visual runner, accessibility runner, or
performance runner was added.

## PLAN-F6-PHASE Expanded Full Staff UI Plan

At user request, Phase 6 is now split beyond the first shell task. The backlog
covers staff shell/auth entry, work queues, complaint create, complaint detail,
admin/audit/notifications, reports entry placeholders, and UI quality gates.

`F6-01A` remains the active next build task because Forge keeps `next.md` to one
buildable task at a time.

## Phase 5 Accepted With Conditions - Phase 6 Ready To Build

PHASE-5-REVIEW re-ran the repaired Phase 5 proof surface on 2026-06-19: lint,
typecheck, test 29/29, test:api -- attachments 28/28, test:api -- integrations
9/9, test:api -- notifications 39/39, test:api -- surveys 13/13,
openapi:check, prisma:validate, and git diff --check.

Decision: Accept With Conditions. The F5-06B repair now satisfies
`REQ-NOTIFY-002` AC3: critical complaint SMS notifications bypass quiet-hour
suppression using persisted complaint severity and record the safe
`CRITICAL_COMPLAINT_QUIET_HOURS_BYPASS` reason. Preferred-channel suppression
and non-critical quiet-hour denial remain covered.

Non-blocking condition for Phase 6: the web proof scripts are still fail-loud
placeholders. `F6-01A` must make `test:web -- shell` real for the staff shell
before broader visual/accessibility/performance gates land in `F6-07`.

## REPAIR-F5-06B-CRITICAL-QUIET-HOUR-BYPASS Built - Needs Phase Review

`REPAIR-F5-06B-CRITICAL-QUIET-HOUR-BYPASS` repaired notification quiet-hour
behavior so queued SMS dispatch reads persisted complaint severity, preserves
preferred-channel denial, preserves non-critical quiet-hour suppression, and lets
critical complaint SMS bypass quiet hours with the safe
`CRITICAL_COMPLAINT_QUIET_HOURS_BYPASS` delivery metadata reason.

Required proof passed: lint, typecheck, test 29/29, test:api -- notifications
39/39, openapi:check, prisma:validate, and git diff --check with line-ending
warnings only.

Phase 5 must return to the mandatory PHASE-REVIEWER gate before Phase 6 starts.

## PHASE-5-REVIEW Repair Required

PHASE-5-REVIEW independently re-ran the required proof surface on 2026-06-19:
lint, typecheck, test 29/29, test:api -- attachments 28/28, test:api --
integrations 9/9, test:api -- notifications 37/37, test:api -- surveys 13/13,
openapi:check, prisma:validate, and git diff --check with line-ending warnings
only.

Decision: Repair Required. `REQ-NOTIFY-002` AC3 requires critical complaints to
bypass quiet-hour suppression and record the reason. Current notification
dispatch suppresses all SMS during quiet hours without reading persisted
complaint severity, and `F5-06B` evidence explicitly says no critical-complaint
bypass was added.

Phase 6 must not start until the repair is built and re-reviewed.

## Phase 5 Build Complete - Needs Phase Review

`F5-07D` added guarded staff reads for submitted survey results at
`GET /complaints/:complaintId/surveys`. The route verifies scoped complaint
visibility before reading surveys, returns only submitted results, and exposes a
privacy-limited staff response shape.

Required proof passed: lint, typecheck, test 29/29, test:api -- surveys 13/13,
openapi:check, and git diff --check with line-ending warnings only.

All Phase 5 backlog tasks are complete. AUTO PHASE stops here for the mandatory
Phase 5 PHASE-REVIEWER gate.

## F5-07C Built - AUTO PHASE Continuing

`F5-07C` added public `POST /portal/surveys` for one-time expiring survey token
submission, with token-hash verification, 1-5 rating validation, duplicate
denial, and OpenAPI coverage.

Required proof passed: lint, typecheck, test 29/29, test:api -- surveys 8/8,
openapi:check, and git diff --check with line-ending warnings only.

No staff survey result read model, staff/admin UI, customer portal UI, complaint
state change, notification dispatch behavior change, or report integration was
added.

AUTO PHASE remains in Phase 5 and continues with `F5-07D`.

## F5-07B Built - AUTO PHASE Continuing

`F5-07B` added backend survey scheduling behavior for pending complaint/customer
surveys, SHA-256 token-hash storage, idempotent pending survey reuse, and
notification queueing after persistence.

Required proof passed: lint, typecheck, test 29/29, test:api -- surveys 4/4,
openapi:check, and git diff --check with line-ending warnings only.

No portal survey submission route, staff survey result read model, OpenAPI
route, UI, complaint state change, real provider call, provider credential, or
report integration was added.

AUTO PHASE remains in Phase 5 and continues with `F5-07C`.

## F5-07A Built - AUTO PHASE Continuing

`F5-07A` generated the canonical surveys backend module, filled the real module
manifest, and wired `SurveysModule` into the API root module.

Required proof passed: generate:module, lint, typecheck, test 29/29,
openapi:check, and git diff --check with line-ending warnings only.

No survey scheduling behavior, portal survey submission route, staff survey read
model, OpenAPI route, UI, notification dispatch behavior change, schema change,
or migration was added.

AUTO PHASE remains in Phase 5 and continues with `F5-07B`.

## F5-06B Built - AUTO PHASE Continuing

`F5-06B` enforced stored customer preferred-channel and SMS quiet-hour
preferences before provider dispatch. Suppressed sends use stable safe skip
reasons through the existing retry-safe failed terminal path.

Required proof passed: lint, typecheck, test 29/29, test:api -- notifications
37/37, openapi:check, and git diff --check with line-ending warnings only.

No UI, public/customer preference route, OpenAPI route, real provider call,
provider credential, retry scheduler, critical-complaint bypass, or marketing
subscription behavior was added.

AUTO PHASE remains in Phase 5 and continues with `F5-07A`.

## F5-06A Built - AUTO PHASE Continuing

`F5-06A` added customer notification preference persistence and backend service
methods for safe default reads and validated upserts.

Required proof passed: lint, typecheck, test 29/29, test:api -- notifications
34/34, openapi:check, prisma:validate, and git diff --check with line-ending
warnings only.

No dispatch preference enforcement, quiet-hour suppression, UI, public route,
OpenAPI route, real provider call, provider credential, or marketing
subscription behavior was added.

AUTO PHASE remains in Phase 5 and continues with `F5-06B`.

## F5-05D Built - AUTO PHASE Continuing

`F5-05D` added notification delivery attempt persistence and made existing
email/SMS/WhatsApp sent/failed repository updates write the attempt log and
guarded terminal status update in one transaction.

Required proof passed: lint, typecheck, test 29/29, test:api -- notifications
29/29, openapi:check, prisma:validate, and git diff --check with line-ending
warnings only.

No provider behavior change, real provider call, provider credential, route,
Admin UI, retry scheduler, template preview/import/export, or customer
preference behavior was added.

AUTO PHASE remains in Phase 5 and continues with `F5-06A`.

## F5-05C Built - AUTO PHASE Continuing

`F5-05C` added backend-only Admin notification template management routes for
listing, creating, updating, activating, and deactivating templates. Mutation
routes use server-session auth, Admin RBAC, CSRF, validation before writes, and
same-transaction `CONFIG` audit entries. OpenAPI documents every new route.

Required proof passed: lint, typecheck, test 29/29, test:api -- notifications
26/26, openapi:check, and git diff --check with line-ending warnings only.

No Admin UI, dispatch behavior change, provider behavior, delivery-attempt log
schema, template preview endpoint, import, or export was added.

AUTO PHASE remains in Phase 5 and continues with `F5-05D`.

## F5-05B Built - AUTO PHASE Paused At Wider Route Slice

`F5-05B` added backend-only active template resolution by code/channel/locale,
Arabic-to-English fallback, safe scalar placeholder rendering, missing-template
denial, and unsafe payload denial before repository reads or rendering.

Required proof passed: lint, typecheck, test 29/29, test:api -- notifications
21/21, openapi:check, and git diff --check with line-ending warnings only.

No admin route, OpenAPI path, dispatch behavior change, provider behavior,
delivery-attempt schema, mutation service, or UI was added.

AUTO PHASE remains in Phase 5. The next task, `F5-05C`, is ready but intentionally
left as the next build slice because it crosses service, controller/guards, DTOs,
OpenAPI, audit transaction behavior, and API tests.
# Current State

Status: Ready to Build
Phase: Phase 5 - Attachments And Notifications
Next Task: F5-05B - Add Arabic/English Notification Template Resolution Service

## F5-05A Built - AUTO PHASE Continuing

`F5-05A` added notification template persistence with Prisma schema and SQL
migration support for code, channel, locale, subject/body content, version
metadata, activation state, audit timestamps, version uniqueness, active-template
uniqueness, and lookup indexing.

Required proof passed: lint, typecheck, test 29/29, prisma:validate,
openapi:check, and git diff --check with line-ending warnings only.

No template rendering service, admin route, OpenAPI path, dispatch behavior,
provider behavior, delivery-attempt schema, or UI was added.

AUTO PHASE remains in Phase 5 and continues with `F5-05B`.
# Current State

Status: Ready to Build
Phase: Phase 5 - Attachments And Notifications
Next Task: F5-05A - Add Notification Template Schema And Migration

## F5-04C Built - AUTO PHASE Continuing

`F5-04C` added queued SMS and WhatsApp notification dispatch through the
integrations provider boundaries. Rows are selected only when channel is
`SMS`/`WHATSAPP` plus `QUEUED`, successful dispatch marks them `SENT` with safe
provider metadata, and provider or validation failures mark them `FAILED` with
stable safe reasons.

Required proof passed: lint, typecheck, test 29/29, test:api -- notifications
16/16, openapi:check, and git diff --check with line-ending warnings only.

No real provider SDK/call, provider credential, route, OpenAPI path,
schema/migration change, retry scheduler, delivery-attempt table, email dispatch
change, or UI was added.

AUTO PHASE remains in Phase 5 and continues with `F5-05A`.
# Current State

Status: Ready to Build
Phase: Phase 5 - Attachments And Notifications
Next Task: F5-04C - Dispatch Queued SMS/WhatsApp Notifications With Failure Status

## F5-04B Built - AUTO PHASE Continuing

`F5-04B` added the integrations-owned WhatsApp provider port, deterministic
in-memory provider, and safe `IntegrationsService.sendWhatsApp()` boundary.
Unsafe WhatsApp recipients and payload data are rejected before provider send,
and provider results do not expose credentials.

Required proof passed: lint, typecheck, test 29/29, test:api -- integrations
9/9, openapi:check, and git diff --check with line-ending warnings only.

No real provider SDK/call, provider credential, notification dispatch behavior,
delivery log, route, OpenAPI path, schema/migration change, or UI was added.

AUTO PHASE remains in Phase 5 and continues with `F5-04C`.
# Current State

Status: Ready to Build
Phase: Phase 5 - Attachments And Notifications
Next Task: F5-04B - Add WhatsApp Provider Adapter With In-Memory Test Double

## F5-04A Built - AUTO PHASE Continuing

`F5-04A` added the integrations-owned SMS provider port, deterministic
in-memory provider, and safe `IntegrationsService.sendSms()` boundary. Unsafe
SMS recipients and payload data are rejected before provider send, and provider
results do not expose credentials.

Required proof passed: lint, typecheck, test 29/29, test:api -- integrations
6/6, openapi:check, and git diff --check with line-ending warnings only.

No real provider SDK/call, provider credential, notification dispatch behavior,
delivery log, route, OpenAPI path, schema/migration change, WhatsApp behavior,
or UI was added.

AUTO PHASE remains in Phase 5 and continues with `F5-04B`.
# Current State

Status: Ready to Build
Phase: Phase 5 - Attachments And Notifications
Next Task: F5-04A - Add SMS Provider Adapter With In-Memory Test Double

## F5-03C Built - AUTO PHASE Continuing

`F5-03C` added queued email notification dispatch through the integrations
email provider boundary. Email rows are selected only when `EMAIL` + `QUEUED`,
successful dispatch marks them `SENT` with safe provider metadata, and provider
or validation failures mark them `FAILED` with stable safe reasons.

Required proof passed: lint, typecheck, test 29/29, test:api -- notifications
10/10, openapi:check, and git diff --check with line-ending warnings only.

No real provider SDK/call, provider credential, route, OpenAPI path,
schema/migration change, retry scheduler, delivery-attempt table,
SMS/WhatsApp behavior, or UI was added.

AUTO PHASE remains in Phase 5 and continues with `F5-04A`.
# Current State

Status: Ready to Build
Phase: Phase 5 - Attachments And Notifications
Next Task: F5-03C - Dispatch Queued Email Notifications With Failure Status

## F5-03B Built - AUTO PHASE Continuing

`F5-03B` added the integrations-owned email provider port, deterministic
in-memory provider, and safe `IntegrationsService.sendEmail()` boundary.
Unsafe recipient/payload data is rejected before provider send, and provider
results do not expose credentials.

Required proof passed: lint, typecheck, test 29/29, test:api -- integrations
3/3, openapi:check, and git diff --check with line-ending warnings only.

No real provider SDK/call, provider credential, notification dispatch behavior,
delivery log, route, OpenAPI path, schema/migration change, SMS/WhatsApp
behavior, retry scheduler, or UI was added.

AUTO PHASE remains in Phase 5 and continues with `F5-03C`.
# Current State

Status: Ready to Build
Phase: Phase 5 - Attachments And Notifications
Next Task: F5-03B - Add Email Provider Adapter With In-Memory Test Double

## F5-03A Built - AUTO PHASE Continuing

`F5-03A` generated the canonical `integrations` backend module, filled the real
provider-adapter `MODULE.md`, and wired `IntegrationsModule` into the root API
module.

Required proof passed: generate:module, lint, typecheck, test 29/29,
openapi:check, and git diff --check with line-ending warnings only.

No provider behavior, SDK, credential, notification dispatch behavior, route,
OpenAPI path, schema/migration change, or UI was added.

AUTO PHASE remains in Phase 5 and continues with `F5-03B`.

# Current State

Status: Ready to Build
Phase: Phase 5 - Attachments And Notifications
Next Task: F5-03A - Generate Integrations Module Boundary And Manifest

## F5-02B Built - AUTO PHASE Continuing

`F5-02B` enforced scan status in staff attachment download preparation. Only
`CLEAN` attachments can prepare download tokens; `PENDING` and `REJECTED`
attachments fail before storage token generation or download audit.

Required proof passed: lint, typecheck, test 29/29, test:api -- attachments
28/28, openapi:check, and git diff --check with line-ending warnings only.

No scanner provider integration, async scan jobs, routes, UI, schema/migration
change, real provider call, provider SDK, or provider credential was added.

AUTO PHASE remains in Phase 5 and continues with `F5-03A`.

# Current State

Status: Ready to Build
Phase: Phase 5 - Attachments And Notifications
Next Task: F5-02B - Enforce Scan Status In Attachment Download Behavior

## F5-02A Built - AUTO PHASE Continuing

`F5-02A` added backend-only attachment scan status transitions from `PENDING` to
`CLEAN` or `REJECTED`, with invalid/missing denials and same-transaction
`ATTACHMENT` scan audit.

Required proof passed: lint, typecheck, test 29/29, test:api -- attachments
27/27, openapi:check, and git diff --check with line-ending warnings only.

No scanner provider integration, async scan jobs, download enforcement, routes,
UI, schema/migration change, real provider call, provider SDK, or provider
credential was added.

AUTO PHASE remains in Phase 5 and continues with `F5-02B`.

# Current State

Status: Ready to Build
Phase: Phase 5 - Attachments And Notifications
Next Task: F5-02A - Add Attachment Scan Status Transition Service

## F5-01H Built - AUTO PHASE Continuing

`F5-01H` added portal attachment privacy regression coverage proving portal
attachment upload/tracking response shapes do not expose download tokens, public
URLs, storage keys, internal fields, DMS/staff data, or provider credentials, and
that no portal attachment download route exists yet.

Required proof passed: lint, typecheck, test 29/29, test:api -- attachments
24/24, openapi:check, and git diff --check with line-ending warnings only.

No new attachment behavior, portal download route, malware scan transition, UI,
schema/migration change, real provider call, provider SDK, or provider credential
was added.

AUTO PHASE remains in Phase 5 and continues with `F5-02A`.

# Current State

Status: Ready to Build
Phase: Phase 5 - Attachments And Notifications
Next Task: F5-01H - Add Portal Attachment Download Privacy Regression Coverage

## F5-01G Built - AUTO PHASE Continuing

`F5-01G` added verified portal attachment upload at `POST /portal/attachments`,
backend portal-session authority resolution, terminal complaint denial, forced
customer-visible metadata, and OpenAPI portal upload coverage.

Required proof passed: lint, typecheck, test 29/29, test:api -- attachments
22/22, openapi:check, and git diff --check with line-ending warnings only.

No portal attachment download route, malware scan transition, UI,
schema/migration change, real provider call, provider SDK, or provider credential
was added.

AUTO PHASE remains in Phase 5 and continues with `F5-01H`.

# Current State

Status: Ready to Build
Phase: Phase 5 - Attachments And Notifications
Next Task: F5-01G - Add Portal Attachment Upload Path For Verified Non-Closed Complaints

## F5-01F Built - AUTO PHASE Continuing

`F5-01F` added staff attachment download preparation at
`GET /complaints/:complaintId/attachments/:attachmentId/download`, scoped
complaint visibility checks, attachment-to-complaint verification, safe download
access audit, and OpenAPI download response schema.

Required proof passed: lint, typecheck, test 29/29, test:api -- attachments
18/18, openapi:check, and git diff --check with line-ending warnings only.

No portal route, malware scan transition/enforcement, UI, schema/migration
change, real provider call, provider SDK, or provider credential was added.

AUTO PHASE remains in Phase 5 and continues with `F5-01G`.

# Current State

Status: Ready to Build
Phase: Phase 5 - Attachments And Notifications
Next Task: F5-01F - Add Staff Attachment Download Authorization And Short-Lived URL Route

## F5-01E Built - AUTO PHASE Continuing

`F5-01E` added the guarded staff upload route at
`POST /complaints/:complaintId/attachments`, scoped complaint visibility checks,
server-derived actor/branch/audit context, storage-key-free response DTOs, and
OpenAPI attachment upload schemas.

Required proof passed: lint, typecheck, test 29/29, test:api -- attachments
14/14, openapi:check, and git diff --check with line-ending warnings only.

No staff download route, portal route, malware scan transition, UI,
schema/migration change, real provider call, provider SDK, or provider credential
was added.

AUTO PHASE remains in Phase 5 and continues with `F5-01F`.

# Current State

Status: Ready to Build
Phase: Phase 5 - Attachments And Notifications
Next Task: F5-01E - Add Staff Attachment Upload Route With RBAC, Branch Scope, And OpenAPI

## F5-01D Built - AUTO PHASE Continuing

`F5-01D` added attachment metadata persistence after storage succeeds and writes
an `ATTACHMENT` upload audit entry in the same repository transaction.

Required proof passed: lint, typecheck, test 29/29, test:api -- attachments
10/10, openapi:check, and git diff --check with line-ending warnings only.

No upload/download HTTP routes, download authorization, malware scan behavior
beyond persisted default status, portal/staff UI, OpenAPI attachment paths,
schema/migration changes, real provider calls, provider SDKs, or provider
credentials were added.

AUTO PHASE remains in Phase 5 and continues with `F5-01E`.

# Current State

Status: Ready to Build
Phase: Phase 5 - Attachments And Notifications
Next Task: F5-01D - Persist Attachment Metadata With Upload Audit

## F5-01C Built - AUTO PHASE Continuing

`F5-01C` added the module-owned attachment storage port and in-memory adapter,
wired the adapter into `AttachmentsModule`, and exposed service methods for
storing object bytes and preparing non-public backend download tokens.

Required proof passed: lint, typecheck, test 29/29, test:api -- attachments 8/8,
openapi:check, and git diff --check with line-ending warnings only.

No upload/download routes, database persistence, audit entries, malware scan
behavior, portal/staff UI, OpenAPI attachment paths, schema/migration changes,
real provider calls, provider SDKs, or provider credentials were added.

AUTO PHASE remains in Phase 5 and continues with `F5-01D`.

# Current State

Status: Ready to Build
Phase: Phase 5 - Attachments And Notifications
Next Task: F5-01C - Add Attachment Storage Port And In-Memory Adapter

## PLAN-F5-PHASE Complete - Ready To Build

The rest of Phase 5 is now split into small backend-first tasks covering secure
attachments, scan states, notification provider adapters, templates, delivery
logging, preferences/quiet hours, and survey link flow.

The next build task is `F5-01C`, which adds only the attachment storage port and
in-memory adapter. Upload/download routes, database persistence, audit writes,
scan behavior, portal/staff UI, OpenAPI attachment paths, schema migrations, real
S3 provider calls, and provider secrets stay out of this slice.

## Previous State Before PLAN-F5-PHASE

Status: Ready to Plan
Phase: Phase 5 - Attachments And Notifications
Next Task: PLAN-F5-01C - Split Next Attachment Behavior

## F5-01B Built - AUTO PHASE Stopped For Planning

`F5-01B` added backend-only attachment upload metadata policy validation in
`AttachmentsService`. It enforces image/PDF metadata up to 10 MB, audio/video
metadata up to 50 MB, executable metadata blocked, and mismatched
extension/content-type metadata denied before any storage or persistence path.

Required proof passed: lint, typecheck, test 29/29, test:api -- attachments 4/4,
openapi:check, and git diff --check with line-ending warnings only.

No upload/download routes, object-storage adapter behavior, attachment
persistence, audit entries, malware scan state changes, portal/staff UI, OpenAPI
attachment paths, schema/migration changes, provider calls, or secrets were
added.

AUTO PHASE stops here because the next attachment behavior slice needs a PLANNER
split before BUILDER-STRONG continues.

## PLAN-F5-01B Complete - Ready To Build

PLAN-F5-01B split secure attachment behavior into a backend-only upload metadata
policy slice before storage, persistence, routes, audit, scan state, portal, or UI.

`F5-01B` will enforce the documented MVP defaults from `REQ-FILES-001` AC5:
images and PDFs up to 10 MB, audio/video up to 50 MB, and executable files
blocked. It will add focused `test:api -- attachments` coverage for allowed
image/PDF/audio/video metadata and denied executable, oversize, and mismatched
metadata.

## Previous State Before PLAN-F5-01B

Status: Ready to Plan
Phase: Phase 5 - Attachments And Notifications
Next Task: PLAN-F5-01B - Split Secure Attachment Behavior

## F5-01A Built - AUTO PHASE Stopped For Planning

`F5-01A` generated the canonical behavior-free `attachments` backend module,
filled the real OKF-style module manifest, and wired `AttachmentsModule` into the
root `AppModule` so module reachability lint covers it.

No upload/download routes, object-storage adapter behavior, malware scan
behavior, attachment OpenAPI paths, attachment authorization rules, portal/staff
UI, schema or migration changes, provider calls, or secrets were added.

Required proof passed: `corepack pnpm generate:module -- attachments`, lint,
typecheck, test 29/29, and openapi:check.

AUTO PHASE stops here because the next Phase 5 attachment behavior slice needs a
PLANNER split before BUILDER-STRONG continues.

## PHASE-4-REVIEW Accepted With Conditions - Phase 5 Ready To Build

PHASE-4-REVIEW accepted the Phase 4 customer portal API/session/privacy boundary.
Reviewer proof re-ran and passed: lint, typecheck, test 29/29, test:api --
portal 5/5, test:api -- portal.tracking 23/23, test:api -- workflow 37/37,
test:api -- notifications 6/6, openapi:check, and git diff --check.

Conditions carried into later phases: preferred L3 web/e2e portal proof is still
owed before MVP sign-off, customer-visible attachment submission/follow-up moves
to Phase 5 attachment work, and real OTP delivery/templates/localized customer
notification dispatch remain Phase 5 notification work.

Phase 5 starts with the smallest safe attachment slice: `F5-01A`, a generated
behavior-free `attachments` module boundary and real `MODULE.md`.

## Previous State Before Phase 5

Status: Needs Phase Review
Phase: Phase 4 - Customer Portal
Next Task: PHASE-4-REVIEW - Customer Portal Acceptance Review

## Phase 4 Build Complete - Needs Phase Review

`F4-04A` added explicit privacy regressions across the customer portal submission,
OTP/session, tracking, timeline, and follow-up API slices. The tests prove public
submission strips DMS customer identifiers, reference-number-only tracking and
follow-up input are rejected, portal tracking excludes internal comments, audit
logs, DMS codes, staff PII, unrelated complaints, OTP data, and session secrets,
and follow-up input cannot force internal visibility or staff actor metadata.

Required proof passed: lint, typecheck, test 29/29, test:api -- portal 5/5,
test:api -- portal.tracking 23/23, openapi:check, and git diff --check with
line-ending warnings only.

AUTO PHASE stops here. Phase 4 now needs the mandatory `PHASE-REVIEWER` gate
before Phase 5 can start.

## F4-03B Built - AUTO PHASE Continuing

`F4-03B` added `POST /portal/tracking/follow-ups` for verified customer follow-up
messages. The route accepts only the portal session header, public body text, and
server-derived request context. The service validates the hashed portal session,
rejects `CLOSED` and `REJECTED` complaints, and delegates the write to
`ComplaintsService.createComment` with `PUBLIC` visibility and `actorId: null`.
The response is only `{ ok: true }`.

Required proof passed: lint, typecheck, test 29/29, test:api -- portal.tracking
22/22, test:api -- workflow 37/37, openapi:check, and git diff --check with
line-ending warnings only.

AUTO PHASE remains in Phase 4 and continues with `F4-04A`.

## REPAIR-F4-03A-PROOF Accepted - AUTO PHASE Ready To Continue

The `F4-03A` proof blocker is cleared. The required repair proof surface passed:
lint, typecheck, test 29/29, test:api -- portal.tracking 18/18, openapi:check,
and git diff --check.

No portal behavior changes were needed during this repair. `F4-03A` remains
accepted: verified tracking is session-gated and its timeline returns only
public-safe status movement fields (`fromStatus`, `toStatus`, `action`, and
`createdAt`).

Phase 4 continues with `F4-03B`.

## F4-03A Blocked - Proof Repair Required

`F4-03A` added portal-safe timeline mapping to the verified tracking response and
updated OpenAPI/tests for timeline filtering. The focused portal tracking suite
passed 18/18, and lint/typecheck/openapi passed.

AUTO PHASE stops because required `corepack pnpm test` failed 19/20 in
`tools/generate-module.test.mjs`. The failure is a generator proof mismatch:
existing dirty `tools/generate-module.mjs` and `tools/lint.mjs` changes generate
frontmatter/sectioned `MODULE.md` manifests, while the generator test still
expects the older inline `Owns tables: `branches`` text.

The next task is the smallest proof repair: align the generator test with the
current generator manifest format, then rerun the full F4-03A proof surface.

## F4-02C Built - AUTO PHASE Continuing

`F4-02C` added `GET /portal/tracking` as the first verified customer portal
tracking read. The route accepts the portal session token only from the
`x-portal-session` header plus server-derived request context. The service hashes
the submitted token, validates a non-expired portal-owned session row, reuses the
complaints public service, and returns only reference number, status, createdAt,
and updatedAt. Reference-number-only tracking remains unavailable.

Required proof passed: lint, typecheck, test 20/20, test:api -- portal.tracking
18/18, openapi:check, and git diff --check with line-ending warnings only.

AUTO PHASE remains in Phase 4 and continues with `F4-03A`.

## REPAIR-F4-02B Built - AUTO PHASE Continuing

`REPAIR-F4-02B` added SECURITY audit coverage for the previously unaudited OTP
verification denials: unknown verification IDs, non-pending verification rows,
and exhausted-attempt pending rows. Unknown-ID audits record only request context,
target type/id, and safe reason metadata; known-row early denials record safe
reason/status/attempt metadata. Mutating wrong-OTP, expired-verification, and
successful-verification paths still keep portal writes and SECURITY audit entries
inside the same transaction.

Required proof passed: lint, typecheck, test 20/20, test:api -- portal.tracking
14/14, test:api -- audit 8/8 plus append-only proof, and openapi:check. The first
audit proof attempt timed out while Docker dependency setup was still running; a
longer rerun passed.

AUTO PHASE remains in Phase 4 and continues with `F4-02C`.

## VERIFY-F4-02B Repair Required

Independent VERIFY re-ran the required proof surface successfully: lint,
typecheck, test 20/20, test:api -- portal.tracking 12/12, and openapi:check.
The audit suite was also re-run and passed 8/8.

Decision: Repair. `F4-02B` audits successful verification, wrong OTP attempts,
and expired verification writes, but unknown verification IDs, non-pending
verification rows, and exhausted-attempt failures return
`PORTAL_VERIFICATION_FAILED` without a SECURITY audit event. `PORTAL-SEC-001`
requires OTP abuse to be logged, and the OTP rules require OTP success and
failure to be audit/security logged without exposing OTP values.

Repair the failure-audit gap before `F4-02C` builds verified portal tracking reads
on top of this session gate.

## F4-02B Built - Verify Gate

`F4-02B` added `POST /portal/tracking/otp/verify`, pending/unexpired OTP verification, failed-attempt increments, expired-verification marking, successful verification marking, hashed portal session persistence, and a safe session response containing only the new portal session token and expiration.

Portal verification state changes, session creation, and SECURITY audit entries run inside the portal repository transaction. No complaint details, DMS customer codes, internal comments, audit logs, staff PII, OTP hashes, or session hashes are returned.

Required proof passed: lint, typecheck, test 20/20, test:api -- portal.tracking 12/12, and openapi:check.

AUTO PHASE stops here because `F4-02B` is marked `Verify Gate: required` and needs independent VERIFY before `F4-02C`.

## F4-02A Built - AUTO PHASE Continued

`F4-02A` added `POST /portal/tracking/otp`, server-side portal tracking request parsing, IP/phone/reference rate limiting, complaint/customer matching through the complaints public service, portal-owned verification persistence with salted OTP hashes, and notification queueing after persistence. The public response is only `{ ok: true }`; denial uses `PORTAL_VERIFICATION_FAILED`; no complaint status, customer details, DMS codes, internal comments, audit logs, staff PII, plaintext OTPs, or OTP hashes are returned.

Required proof passed: lint, typecheck, test 20/20, test:api -- portal.tracking 6/6, test:api -- notifications 6/6, and openapi:check.

AUTO PHASE remained in Phase 4 and continued with verify-gated `F4-02B`.

## Previous State Before F4-02A
# Current State

Status: Ready to Build
Phase: Phase 4 - Customer Portal
Next Task: F4-02A - Add portal OTP request persistence and notification queueing

## VERIFY-F4-01C-REPAIR Accepted - Gate Cleared

Independent VERIFY accepted `REPAIR-F4-01C`. The public portal request DTO/parser
exclude `customerNumber`, `PortalService.submitComplaint` forces
`customerNumber: null`, and OpenAPI omits `customerNumber` from
`PortalComplaintRequest` while preserving staff `ComplaintCreateRequest`.

Verification re-ran and passed: lint, typecheck, test 20/20 after sandbox
`spawn EPERM` rerun outside sandbox, test:api -- portal 4/4 after sandbox
`spawn EPERM` rerun outside sandbox, test:api -- workflow 36/36, and
openapi:check. Phase 4 continues with `F4-02A`.

## REPAIR-F4-01C Built - Verify Gate

`REPAIR-F4-01C` removed `customerNumber` from the public portal submission DTO and OpenAPI schema. `PortalService.submitComplaint` now forces `customerNumber: null` when delegating to complaint creation, while staff complaint creation remains unchanged. Tests prove spoofed public `customerNumber` is stripped at the controller boundary and nulled at the service delegate.

Required proof passed: lint, typecheck, test 20/20, test:api -- portal 4/4, test:api -- workflow 36/36, and openapi:check. The test commands initially hit sandbox `spawn EPERM` and passed when rerun outside the sandbox.

AUTO PHASE stops here because this repair returns to the `F4-01C` Verify Gate.

## VERIFY-F4-01C Repair Required

Independent VERIFY re-ran the required proof surface successfully: lint,
typecheck, test 20/20, test:api -- portal 4/4, test:api -- workflow 36/36, and
openapi:check.

Decision: Repair. `PortalComplaintRequest` and the public portal DTO include
`customerNumber`, which maps to the DMS customer-code path in complaint creation.
`REQ-PORTAL-001` forbids staff-only fields exposed to customers, and
`PORTAL-SEC-001` marks DMS customer code as not accessible in the customer portal.
Remove that field from the public portal boundary before OTP/tracking work builds
on this route.

## F4-01C Built - Verify Gate

`F4-01C` added the first public portal boundary: `POST /portal/complaints`.
The route parses public submission fields, derives request context from the server
request, applies a portal-specific rate-limit guard, delegates to
`PortalService.submitComplaint`, and documents the route in OpenAPI. Portal
submission still reaches complaint creation through the complaints public service,
which owns submitted status, initial status history, and COMPLAINT audit in one
transaction.

Required proof passed: lint, typecheck, test 20/20, test:api -- portal 4/4,
test:api -- workflow 36/36, and openapi:check.

AUTO PHASE stops here because `F4-01C` is marked `Verify Gate: required`.

## F4-01B Built - AUTO PHASE Continuing

`F4-01B` added the backend-only portal complaint submission service path.
`PortalService` now delegates to the complaints public service with
`CUSTOMER_PORTAL` request source, while complaint creation still owns the
submitted status, initial status history, and COMPLAINT audit transaction.

Required proof passed: lint, typecheck, test 20/20, test:api -- workflow 36/36,
and openapi:check.

AUTO PHASE remains in Phase 4 and continues with verify-gated `F4-01C`.

## F4-01A Built - AUTO PHASE Continuing

`F4-01A` generated the canonical `portal` module shell and filled the real module
manifest. `PortalService` is now the module public surface, the module owns
`portal_verifications` and `portal_sessions`, and no public routes, AppModule
wiring, customer data exposure, complaint behavior, OTP/session behavior,
OpenAPI paths, web UI, schema changes, migrations, or provider work were added.

Required proof passed: generate:module, lint, typecheck, test 20/20, and
openapi:check.

AUTO PHASE remains in Phase 4 and continues with `F4-01B`.

## PLAN-F4-01 Complete - Ready To Build

PLAN-F4-01 split customer portal entry work into backend-first slices that keep
submission, OTP verification, portal-safe timeline reads, follow-up behavior, and
privacy regression tests separate.

Phase 4 starts with `F4-01A`, a behavior-free generated `portal` module boundary
and real `MODULE.md`. The first public portal privacy/security boundary is
`F4-01C`, which is marked `Verify Gate: required`.

## PHASE-3-REVIEW Accepted With Conditions - Phase 4 Ready To Plan

PHASE-3-REVIEW accepted Phase 3 with non-blocking carry-forward conditions for
the broader notification, SLA escalation, and survey requirements that remain
outside the completed Phase 3 slice.

Reviewer proof re-ran and passed: lint, typecheck, test 20/20, test:api -- sla
16/16, test:api -- notifications 5/5, test:api -- workflow 33/33, and
openapi:check.

Phase 4 must start with `PLAN-F4-01` because customer portal submission,
tracking, OTP verification, and portal privacy need a PLANNER split before any
build task starts.

## Previous State Before Phase 4

## VERIFY-F3-04B Accepted - Phase 3 Build Complete

Independent VERIFY accepted `F3-04B`. Complaint close/reopen transitions now queue
only through the notifications public service after the workflow transaction has
successfully written status, status history, and WORKFLOW audit.

Verification re-ran and passed: lint, typecheck, test 20/20, test:api -- workflow
33/33, test:api -- notifications 5/5, and openapi:check.

Phase 3 backlog is complete and now needs the mandatory PHASE-REVIEWER gate before
Phase 4 starts.

## F3-04B Built - Verify Gate

`F3-04B` wired complaint close/reopen transitions to the notifications public
service after the workflow transaction commits. `CLOSE` queues
`survey.schedule.internal`, and `REOPEN` queues `workflow.reopened.internal`.

The queue calls run only after status update, status history, and WORKFLOW audit
complete inside the transaction. Validation failures, stale persisted status, and
transaction failures do not queue side effects.

Required proof passed: lint, typecheck, test 20/20, test:api -- workflow 33/33,
test:api -- notifications 5/5, and openapi:check.

AUTO PHASE stops here because `F3-04B` is marked `Verify Gate: required`.

## VERIFY-F3-04A Accepted - Gate Cleared

Independent VERIFY accepted `F3-04A`. Required workflow transition data now rejects
with `VALIDATION_FAILED` before any repository transaction/write, while valid
required-data transitions still write status, history, and WORKFLOW audit in the
same transaction. OpenAPI documents the added transition request fields.

Verification re-ran and passed: lint, typecheck, test 20/20, test:api -- workflow
29/29, and openapi:check. Phase 3 continues with `F3-04B`.

## F3-04A Built - Verify Gate

`F3-04A` added backend validation for workflow transition required data before
repository transactions, status updates, status history, or WORKFLOW audit writes.
Send-back, reopen, and rejection actions require a reason; resolve actions require
resolution type, resolution summary, and a backend-owned actor ID from the server
session; close requires confirmation in `reason` plus
`customerCommunicationStatus`.

Valid required-data transitions still write status, history, and WORKFLOW audit in
one transaction. Missing required data rejects with `VALIDATION_FAILED` before any
transaction/write. The transition DTO and OpenAPI contract now document the
optional required-by-action fields.

Required proof passed: lint, typecheck, test 20/20, test:api -- workflow 29/29,
and openapi:check.

AUTO PHASE stops here because `F3-04A` is marked `Verify Gate: required`.

## VERIFY-F3-03A3 Accepted - Gate Cleared

Independent VERIFY accepted `F3-03A3`. SLA now depends on the notifications public
service only, and `runBreachJob` queues one internal `sla.breach.internal`
notification only after a newly inserted breach event. Duplicate retries, future
deadlines, and terminal complaints skip without queueing.

Verification re-ran and passed: lint, typecheck, test 20/20, test:api -- sla
16/16, test:api -- notifications 5/5, and openapi:check. Phase 3 continues with
`F3-04A`.

## F3-03A3 Built - Verify Gate

`F3-03A3` wired SLA breach creation to the notifications public service boundary.
`SlaModule` imports `NotificationsModule`, and `SlaService.runBreachJob` now queues
one internal `sla.breach.internal` notification only after a newly inserted breach
event. Duplicate retries, future deadlines, and terminal `CLOSED`/`REJECTED`
complaints do not queue notifications.

Required proof passed: lint, typecheck, test 20/20, test:api -- sla 16/16,
test:api -- notifications 5/5, and openapi:check.

AUTO PHASE stops here because `F3-03A3` is marked `Verify Gate: required`.

## VERIFY-F3-03A2-REPAIR Accepted - Gate Cleared

Independent VERIFY accepted `REPAIR-F3-03A2`. `NotificationsService.safePayload`
now allows JSON primitives, arrays, and plain objects, rejects non-plain payload
objects such as `Date`, `Map`, and `Set` before repository writes, and preserves
unsafe payload-key denial.

Verification re-ran and passed: lint, typecheck, test 20/20, test:api --
notifications 5/5, and openapi:check. Phase 3 continues with `F3-03A3`.

## REPAIR-F3-03A2 Built - Verify Gate

`REPAIR-F3-03A2` tightened notification payload validation. `NotificationsService`
now allows JSON primitives, arrays, and plain objects, and rejects non-plain payload
objects such as `Date`, `Map`, and `Set` before repository writes. Existing unsafe
payload-key denial remains intact.

Required proof passed: lint, typecheck, test 20/20, test:api -- notifications 5/5,
and openapi:check.

AUTO PHASE stops here because this repair returns to the `F3-03A2` Verify Gate.

## VERIFY-F3-03A2 Repair Required

Independent VERIFY re-ran the required proof surface successfully: lint,
typecheck, test 20/20, test:api -- notifications 4/4, and openapi:check.

Decision: Repair. `NotificationsService.safePayload` accepts non-plain objects such
as `Date`, `Map`, and `Set` as JSON-safe because they have no enumerable values.
Repair payload validation before `F3-03A3` builds SLA integration on this public
service boundary.

## F3-03A2 Built - Verify Gate

`F3-03A2` added the minimal notifications public service. `NotificationsService`
now exposes `queueInternal` for backend callers, validates required fields and safe
JSON payloads, rejects unsafe payload keys before writing, and delegates to
`NotificationsRepository.queueInternal` to create owned `notifications` rows with
`IN_APP` / `QUEUED`. The API test runner now supports the required
`test:api -- notifications` suite.

Required proof passed: lint, typecheck, test 20/20, test:api -- notifications 4/4,
and openapi:check.

AUTO PHASE stops here because `F3-03A2` is marked `Verify Gate: required`.

## F3-03A1 Built - AUTO PHASE Continuing

`F3-03A1` generated the canonical `notifications` module shell and filled the real
module manifest. `NotificationsService` is now the module public surface, the
module owns the existing `notifications` table, and no notification behavior,
routes, OpenAPI paths, provider delivery, workers, schema changes, migrations, UI,
portal behavior, templates, or SLA imports were added.

Required proof passed: generate:module, lint, typecheck, test 20/20, and
openapi:check.

AUTO PHASE remains in Phase 3 and continues with `F3-03A2`.

## PLAN-F3-03 Complete - Ready To Build

PLAN-F3-03 split escalation notification queue work into boundary-safe tasks. The
first task generates the `notifications` module shell and manifest. The next task
will add a queued internal notification public service, marked `Verify Gate:
required`, before SLA integration queues escalation notifications after new breach
events.

## F3-03A Build Stopped - Needs Planning Split

AUTO PHASE stopped before editing source. `F3-03A` requires queueing notification
rows after SLA breach commits, but the repository/service boundary is not safe yet:
the existing `notifications` table has no `notifications` module or public service.
Writing it directly from `SlaRepository` would violate the module rule that a
repository writes only its own module's aggregate and cross-module work goes through
another module's public service.

Next step is a PLANNER split for the smallest Phase 3 path: first create a minimal
notifications public service for queued internal notification rows, then add the SLA
integration that calls it after newly committed breach events.

## VERIFY-F3-02B Accepted - Gate Cleared

Independent VERIFY accepted `F3-02B`. Breach evaluation reads backend-recorded
`DEADLINE_SET` SLA events, creates `SlaEventType.BREACH` rows through the unique
idempotency key with duplicate skipping, reports duplicate retries as skipped, and
skips future deadlines plus terminal `CLOSED`/`REJECTED` complaint statuses without
writing.

Verification re-ran and passed: lint, typecheck, test 20/20, test:api -- sla
16/16, and openapi:check. Phase 3 continues with `F3-03A`.

## F3-02B Built - Verify Gate

`F3-02B` added backend SLA breach-job behavior. `SlaRepository` now reads
backend-recorded `DEADLINE_SET` events for non-terminal complaints and writes one
`SlaEventType.BREACH` event through the unique idempotency key with duplicate
skipping. `SlaService.runBreachJob` creates breaches only when `dueAt <= now`,
skips future deadlines and terminal `CLOSED`/`REJECTED` complaints, and returns
honest scanned/created/skipped counts plus breach keys.

Required proof passed: lint, typecheck, test 20/20, test:api -- sla 16/16, and
openapi:check.

AUTO PHASE stops here because `F3-02B` is marked `Verify Gate: required`.

## VERIFY-F3-02A-REPAIR Accepted - Gate Cleared

Independent VERIFY accepted `REPAIR-F3-02A`. `SlaRepository.createWarningEvent`
uses `createMany` with `skipDuplicates` and reports whether a warning row was
newly inserted. `SlaService.runWarningJob` counts duplicate warning retries as
`skipped`, returns idempotency keys only for newly inserted warnings, and skips
invalid stored policy duration or warning percent values before writing.

Verification re-ran and passed: lint, typecheck, test 20/20, test:api -- sla
13/13, and openapi:check. Phase 3 continues with `F3-02B`.

## REPAIR-F3-02A Built - Verify Gate

`REPAIR-F3-02A` fixed the SLA warning-job verify findings. Warning-event creation
now uses the unique idempotency key through `createMany` with duplicate skipping,
so `runWarningJob` counts only newly inserted warnings as `created`; duplicate
retries are `skipped`. The warning job now also skips invalid stored policy
duration and warning percent values before writing.

Required proof passed: lint, typecheck, test 20/20, test:api -- sla 13/13, and
openapi:check.

AUTO PHASE stops here because this repair returns to the `F3-02A` Verify Gate.

## VERIFY-F3-02A Repair Required

Independent VERIFY re-ran the required proof surface successfully: lint,
typecheck, test 20/20, test:api -- sla 12/12, and openapi:check.

Decision: Repair. `SlaService.runWarningJob` reports duplicate warning retries as
newly created because it increments `created` after every idempotent warning upsert.
The build evidence also claims malformed records are safely skipped, but the focused
test only covers a null deadline and the job does not explicitly fail closed for
invalid stored policy duration or warning percent values.

Repair `F3-02A` before `F3-02B` builds breach-job behavior on this pattern.

## F3-02A Built - Verify Gate

`F3-02A` added backend SLA warning-job behavior. `SlaRepository` now reads recorded
`DEADLINE_SET` events with stored policy duration/warning percent data and upserts
one `SlaEventType.WARNING` event by deterministic warning idempotency key.
`SlaService.runWarningJob` computes configured warning thresholds, skips malformed
or not-due records, and returns scanned/created/skipped counts plus warning keys.

Required proof passed: lint, typecheck, test 20/20, test:api -- sla 12/12, and
openapi:check.

AUTO PHASE stops here because `F3-02A` is marked `Verify Gate: required`.

## VERIFY-F3-01C Accepted - Gate Cleared

Independent VERIFY accepted `F3-01C`. `SlaRepository.createDeadlineEvent` persists
`DEADLINE_SET` events through an idempotent upsert keyed by `idempotencyKey`.
`SlaService.recordDeadlineEvent` resolves the active policy, calculates the due
timestamp, derives a deterministic key from complaint ID, stage, policy ID, and
entered timestamp, and writes one deadline event. Missing policy fails closed before
event creation.

Verification re-ran and passed: lint, typecheck, test 20/20, test:api -- sla 9/9,
and openapi:check. Phase 3 continues with `F3-02A`.

## F3-01C Built - Verify Gate

`F3-01C` added backend SLA deadline-event recording. `SlaService.recordDeadlineEvent`
resolves the active policy, calculates the due timestamp, derives a deterministic
idempotency key from complaint ID, stage, policy ID, and entered timestamp, and
persists one `DEADLINE_SET` event through `SlaRepository.createDeadlineEvent`.
Duplicate retry requests use the same idempotency key.

Required proof passed: lint, typecheck, test 20/20, test:api -- sla 9/9, and
openapi:check.

AUTO PHASE stops here because `F3-01C` is marked `Verify Gate: required`.

## VERIFY-F3-01B Accepted - Gate Cleared

Independent VERIFY accepted `F3-01B`. `SlaRepository.findActiveBySeverityAndStage`
reads active policies only, `SlaService.resolvePolicy` uses stored policy records
with nullable-or-equal branch/department/category scope matching, most-specific
selection, and newest `updatedAt` tie-breaking. Inactive or missing policies fail
closed with `SLA_POLICY_MISSING`.

Verification re-ran and passed: lint, typecheck, test 20/20, test:api -- sla 6/6,
and openapi:check. Phase 3 continues with `F3-01C`.

## F3-01B Built - Verify Gate

`F3-01B` added active stored-policy reads and backend SLA policy resolution by
severity, stage, and optional branch/department/category scope. The resolver uses
nullable-or-equal scope matching, most-specific policy selection, newest
`updatedAt` tie-breaking, and stable `SLA_POLICY_MISSING` for inactive or missing
matches.

Required proof passed: lint, typecheck, test 20/20, test:api -- sla 6/6, and
openapi:check.

AUTO PHASE stops here because `F3-01B` is marked `Verify Gate: required`.

## VERIFY-F3-01A Accepted - Gate Cleared

Independent VERIFY accepted `F3-01A`. The generated `sla` module boundary is
intact, `SlaService.calculateDeadline` is backend-owned and deterministic for
stored `ALWAYS_ON` policy input, invalid or unsupported policy input fails closed
with `SLA_POLICY_MISSING`, and no repository writes, jobs, routes, OpenAPI paths,
UI, portal exposure, provider calls, or side effects were introduced.

Verification re-ran and passed: lint, typecheck, test 20/20, test:api -- sla 3/3,
and openapi:check. Phase 3 continues with `F3-01B`.

## F3-01A Built - Verify Gate

`F3-01A` generated the SLA module and added deterministic backend deadline
calculation for stored `ALWAYS_ON` policy input. The calculator validates
severity, stage, duration, warning percent, branch timezone, calendar mode, and
entered timestamp, returns ISO `warningAt` and `dueAt`, and fails closed with
`SLA_POLICY_MISSING` for invalid or unsupported policy input.

Required proof passed: lint, typecheck, test 20/20, test:api -- sla 3/3, and
openapi:check.

AUTO PHASE stops here because `F3-01A` is marked `Verify Gate: required`.

## Previous State Before F3-01A

Status: Ready to Build
Phase: Phase 3 - SLA And Workflow Operations
Next Task: F3-01A - Generate SLA Module And Deadline Calculator

## PLAN-F3-01 Complete - Ready To Build

PLAN-F3-01 split Phase 3 into buildable SLA/workflow operations work. The first
task is the SLA module boundary plus deterministic backend deadline calculation,
marked `Verify Gate: required` because warning jobs, breach jobs, escalation, and
reopen/reassignment recalculation build directly on it.

## Phase 2 Accepted With Conditions - Ready To Plan Phase 3

PHASE-2-REVIEW accepted Complaint Core after the branch-scope and transition
role-denial audit repairs. Required proof re-ran and passed: lint, typecheck,
test 20/20, test:api -- workflow 27/27, and openapi:check.

Phase 3 may start with one non-blocking carry-forward: first-response reporting
must later either compute from the first public staff comment timestamp or
materialize `Complaint.firstResponseAt` before reporting depends on it.

## REPAIR-PHASE-2-TRANSITION-ROLE-DENIAL-AUDIT Built - Needs Phase Review

The transition role-denial audit repair is built. Valid state/action transitions
denied because of actor role now write a `SECURITY` / `workflow_role_forbidden`
audit event before returning `RBAC_FORBIDDEN`, and still reject before status
update, status history, or WORKFLOW audit writes.

Required proof passed: lint, typecheck, test 20/20, test:api -- workflow 27/27,
and openapi:check.

Phase 2 is back at the mandatory PHASE-REVIEWER gate before Phase 3 planning.

## PHASE-2-REVIEW Repair Required After Branch-Scope Repair

PHASE-2-REVIEW re-ran the required proof surface successfully after
`REPAIR-PHASE-2-TRANSITION-BRANCH-SCOPE`: lint, typecheck, test 20/20,
test:api -- workflow 27/27, and openapi:check.

Decision: Repair Required. Transition-specific role denials inside
`ComplaintsService.validateTransition` throw `RBAC_FORBIDDEN` before a transaction,
but do not write the `SECURITY` audit event required by `REQ-RBAC-001` AC5 and
`WORKFLOW-MATRIX-001` AC2. Repair this before Phase 3 planning.

## REPAIR-PHASE-2-TRANSITION-BRANCH-SCOPE Built - Needs Phase Review

The Phase 2 transition branch-scope repair is built. `POST /complaints/:id/transitions`
now verifies scoped complaint detail before applying a transition, so hidden complaint
IDs reject before status update, status history, or WORKFLOW audit writes.

Required proof passed: lint, typecheck, test 20/20, test:api -- workflow 27/27,
and openapi:check.

Phase 2 is back at the mandatory PHASE-REVIEWER gate before Phase 3 planning.

## PHASE-2-REVIEW Repair Required

PHASE-2-REVIEW re-ran the required proof surface successfully: lint, typecheck,
test 20/20, test:api -- workflow 25/25, and openapi:check.

Decision: Repair Required. `POST /complaints/:id/transitions` uses guard metadata
and the query `branchId`, but does not prove the target complaint belongs to that
scoped branch before `ComplaintsService.applyTransition` updates status and writes
workflow history/audit. Queue/detail/comment paths are scoped; transition must get
the same target-complaint branch protection before Phase 3 starts.

## Phase 2 Build Complete - Needs Phase Review

`F2-04C` added guarded staff HTTP comment routes and OpenAPI contract entries:
`POST /complaints/:id/comments` and `GET /complaints/:id/comments/public`.
The controller validates DTOs, derives actor and branch authority from the server
session/guards, verifies scoped complaint access before delegating, and preserves
public-comment privacy.

Required proof passed: lint, typecheck, test 20/20, test:api -- workflow 25/25,
and openapi:check.

All Phase 2 backlog tasks are complete. AUTO PHASE stops here for the mandatory
Phase 2 PHASE-REVIEWER gate.

## F2-04B Built - AUTO PHASE Continuing

`F2-04B` added complaint comment service behavior: blank comment validation, internal
or public visibility, same-transaction COMMENT audit, and public-only comment reads.

Required proof passed: lint, typecheck, test 20/20, test:api -- workflow 22/22,
and openapi:check.

AUTO PHASE remains in Phase 2 and continues with `F2-04C`.

## F2-04A Built - AUTO PHASE Continuing

`F2-04A` added branch-scoped complaint detail reads through `GET /complaints/:id`.
Repository/service return explicit detail objects with status-history timeline and
stable `COMPLAINT_NOT_FOUND` for missing or branch-hidden complaints.

Required proof passed: lint, typecheck, test 20/20, test:api -- workflow 20/20,
and openapi:check.

AUTO PHASE remains in Phase 2 and continues with `F2-04B`.

## F2-03C Built - AUTO PHASE Continuing

`F2-03C` added branch-scoped staff queue reads through `GET /complaints`.
Repository/service return explicit queue objects, and the controller derives queue
branch scope from the guarded query target or the server principal for non-admin
staff.

Required proof passed: lint, typecheck, test 20/20, test:api -- workflow 18/18,
and openapi:check.

AUTO PHASE remains in Phase 2 and continues with `F2-04A`.

## F2-03B Built - AUTO PHASE Continuing

`F2-03B` added `POST /complaints` as a guarded staff complaint creation route. The
controller validates the request body, requires a guarded `branchId` query target,
ignores spoofed body branch/actor data, derives actor context from the server
request principal, and delegates to `ComplaintsService.createInternal`.

Required proof passed after one honest repair loop: `typecheck` initially failed
because nullable context fields could be `undefined`; the create DTO mapper now
normalizes them to `null`. Final proof passed: lint, typecheck, test 20/20,
test:api -- workflow 16/16, and openapi:check.

AUTO PHASE remains in Phase 2 and continues with `F2-03C`.

## F2-03A Built - AUTO PHASE Continuing

`F2-03A` added `ComplaintsService.createInternal` with required-field validation,
VIN-required-when-vehicle-related validation, count-based deterministic reference
generation, complaint persistence, initial submitted status history, and COMPLAINT
audit in one transaction.

Required proof passed after one honest repair loop: `typecheck` initially failed on
Prisma relation input shape and nullable history actor role; the repository now
upserts the minimal customer then creates the complaint by `customerId`, and creation
history allows `actorRole: null`. Final proof passed: lint, typecheck, test 20/20,
test:api -- workflow 13/13, and openapi:check.

AUTO PHASE remains in Phase 2 and continues with `F2-03B`.

## F2-02C Built - AUTO PHASE Continuing

`F2-02C` added `POST /complaints/:id/transitions` as a guarded staff workflow route.
The controller validates request shape, derives actor role/ID/audit context from the
server request principal, forces `STAFF_API` request source, and delegates to
`ComplaintsService.applyTransition`.

Required proof passed after two honest repair loops: the first workflow run failed
on a test expectation for existing branch-scope audit metadata, and the first lint
run failed because `tools/openapi-check.mjs` exceeded the 300-line budget. Both were
fixed. Final proof passed: lint, typecheck, test 20/20, test:api -- workflow 11/11,
and openapi:check.

AUTO PHASE remains in Phase 2 and continues with `F2-03A`.

## VERIFY-F2-02B-REPAIR Accepted

Independent VERIFY accepted the `REPAIR-F2-02B` fix. The repair stayed inside the
scoped service/repository/workflow-test files; valid persisted transitions still
run through the matrix validator; the status update atomically checks persisted
current status; stale persisted status rejects with `COMPLAINT_INVALID_TRANSITION`
before history or audit writes; successful status, history, and WORKFLOW audit
writes still share one transaction.

Required proof re-ran and passed: lint, typecheck, test 20/20,
test:api -- workflow 7/7, and openapi:check.

The F2-02B verify gate is cleared. Phase 2 continues with `F2-02C`.

## REPAIR-F2-02B Built - Verify Gate

`REPAIR-F2-02B` fixed the stale persisted-status gap found by `VERIFY-F2-02B`.
Complaint transitions now update status only when the complaint's persisted
current status matches the expected `fromStatus`; a mismatch rejects with stable
`COMPLAINT_INVALID_TRANSITION` before status history or WORKFLOW audit is written.

Required proof passed: lint, typecheck, test 20/20, test:api -- workflow 7/7, and
openapi:check.

AUTO PHASE stops here because `F2-02B` remains a `Verify Gate: required`.

## VERIFY-F2-02B Repair Required

Independent VERIFY re-ran all required proof commands successfully: lint,
typecheck, test 20/20, test:api -- workflow 6/6, and openapi:check.

Decision: Repair. `applyTransition` validates caller-provided `fromStatus`, but
the persistence write updates by `complaintId` only and never atomically checks
the complaint's persisted current status before writing status history and
WORKFLOW audit. Because `F2-02C` builds the HTTP transition route directly on this
path, repair `F2-02B` before continuing.

## F2-02B Built - Verify Gate

`F2-02B` added complaint transition persistence through the service/repository:
valid transitions update complaint status, insert status history, and write a
WORKFLOW audit entry in one transaction. `test:api -- workflow` now covers the
matrix, invalid transitions, unauthorized roles, same-transaction persistence, and
pre-transaction denials.

AUTO PHASE stops here because `F2-02B` is marked `Verify Gate: required`.

## Out-of-Band Shared Pack Extracted (F1-06D)

At user request, extracted the accepted Phase 1 security-baseline mechanism and
proof-test guidance into a shared local agent pack:
`C:/Users/dryos/.agents/packs/forge-security-baseline`.

This did not move the Phase 2 cursor. The active next build task remains
`F2-01A - Add Complaint Transition History Metadata Schema And Migration`.

## Phase 2 - Planning Started (PLAN-F2-01)

PLAN-F2-01 reconciled the already-applied F0-08 complaint schema against
`REQ-COMPLAINT-001`, `ARCH-WORKFLOW-001`, `WORKFLOW-MATRIX-001`,
`ARCH-DATA-001`, `METHOD-AUDIT-001`, and `API-STANDARD-001`.

Result: the complaint-core tables already exist, but
`complaint_status_history` needs transition provenance fields before the backend
state-machine kernel is built. `F2-01A` is queued as the smallest buildable first
task. The state-machine persistence task `F2-02B` remains `Verify Gate: required`
because later complaint creation and queue behavior depend on it.

## Phase 1 — Accepted (PHASE-1-REVIEW)

PHASE-1-REVIEW decision: **Accept With Conditions** (PHASE-REVIEWER, Opus 4.8, 2026-06-18).
All 23 Phase 1 tasks done with honest, independently-reproduced evidence. Full proof surface
re-run green: lint, typecheck, test 20/20, test:api -- auth 21/21, -- admin 15/15,
-- security 4/4, -- audit 8/8 + live append-only proof, openapi:check, build. NFR-SEC-001
AC1/AC2/AC3/AC5 met; the MVP "Security baseline" gate is satisfied. Every Verify Gate was
honored by an independent VERIFY. Full record in `.forge/trust.md` (PHASE-1-REVIEW). Phase 2
is cleared to start; it opens with a planner pass.

### Non-blocking conditions carried into later phases (see trust.md PHASE-1-REVIEW)

1. `security:check` is still a fail-loud placeholder — wire it to the real security suites
   before the MVP pilot sign-off gate (substance is proven by `test:api -- security/auth/admin/audit`).
2. NFR-SEC-001 AC4 (prod HTTP?HTTPS at the gateway) + parameterizing `POSTGRES_HOST_AUTH_METHOD: trust`
   are owed by the Phase 7 deployment runbook (F7-04).
3. No full Nest bootstrap/e2e test yet (F1-06C added reflection-metadata guard tests + fixed the
   branches DI graph). Add a bootstrap smoke test early in Phase 2.
4. Per-module `PrismaService`/`AuditService` duplication — consider a shared `@Global()` core module
   in Phase 2.
5. Deferred auth features: username login, account-lock, password-reset land with their feature tasks.

## Phase 1 — CSRF Kernel Gate Passed (VERIFY-F1-06B, gate cleared)

VERIFY-F1-06B decision: **Accept** (independent VERIFY, fresh context / Opus 4.8,
2026-06-18). Builder honesty Honest, code quality Good. All six proof commands
independently re-run green (lint, typecheck, test 20/20, test:api -- security 4/4,
test:api -- auth 21/21, openapi:check). CSRF kernel + auth-route enforcement confirmed:
`POST /auth/logout` requires session auth + matching double-submit CSRF cookie/header;
`POST /auth/login` issues a readable CSRF cookie but is not CSRF-gated (rate-limited
instead); denial is stable `CSRF_INVALID` 403 with a safe `SECURITY`/`csrf_rejected`
audit and no secret exposure; OpenAPI documents it drift-free. Full record in
`.forge/trust.md` (VERIFY-F1-06B). The `Verify Gate` on `F1-06B` is cleared — AUTO PHASE
may resume from `F1-06C`.

### Carry-forward into F1-06C (see trust.md VERIFY-F1-06B observations)

1. `branches.module.ts` does not register `SessionAuthGuard`/`RbacGuard`/`SESSION_AUTH_SERVICE`
   though the branches controller uses them, and no test boots Nest to prove resolution.
   F1-06C edits this module to add `CsrfGuard` (needs only the provided `AuditService`); the
   builder should register the guard there and confirm the branch mutation routes bootstrap.
2. Guard wiring across the app is inspection-verified, not e2e-tested (all API tests are
   unit-level). A small Nest bootstrap smoke test would close this; flag for the Phase 1
   PHASE-REVIEWER if not added in F1-06C.

After `F1-06C`, all Phase 1 backlog tasks are done ? `Needs Phase Review` before Phase 2.

## Phase 1 — F1-06 Split (PLAN-F1-06, 2026-06-18)

`F1-06` (login rate limiting + CSRF) was split into three ordered BUILDER-STRONG build
tasks because the two protections touch different trust boundaries and the combined
surface exceeds the 1–5 file budget:

- `F1-06A` — login rate limiting by account + IP on `POST /auth/login` (NFR-SEC-001 AC3).
  Queued now; self-contained, nothing builds on it.
- `F1-06B` — CSRF kernel guard + token issuance + enforcement on auth mutation routes
  (`POST /auth/logout`) (NFR-SEC-001 AC5). **Verify Gate: required** — `F1-06C` builds
  directly on this CSRF mechanism, so AUTO PHASE pauses for an independent VERIFY here.
- `F1-06C` — enforce the same CSRF guard on branch (admin) mutation routes + OpenAPI +
  admin test fixups (NFR-SEC-001 AC5).

CSRF mutation surface mapped to `POST /auth/logout`, `POST /branches`, `PATCH /branches/:id`,
`POST /branches/:id/deactivate`. `POST /auth/login` is pre-session ? covered by rate
limiting (AC3), not CSRF (AC5). After `F1-06C`, all Phase 1 backlog tasks are done ?
`Needs Phase Review` before Phase 2.

## Phase 1 — Auth Foundation Verified (gate passed)

VERIFY-F1-01E decision: **Accept** (independent VERIFY, fresh context / Opus 4.8,
2026-06-18). Builder honesty Honest, code quality Good. All five proof commands
independently re-run green (lint, typecheck, test 19/19, test:api -- auth 15/15,
openapi:check); change scope clean; no secret/token exposure, missing audit, or
OpenAPI drift. Full record in `.forge/trust.md` (VERIFY-F1-01E). The `Verify Gate`
on `F1-01E3` is cleared — AUTO PHASE may resume from `F1-02`.

### Carry-forward conditions into the rest of Phase 1 (see trust.md VERIFY-F1-01E)

1. Login rate limiting (NFR-SEC-001 AC3) and CSRF on session-authenticated mutation
   routes (NFR-SEC-001 AC5) are unbuilt `[must]` items and blocking at the MVP
   "Security baseline" gate. Tracked as new backlog item `F1-06`; must land before the
   Phase 1 PHASE-REVIEWER gate.
2. Username login (REQ-AUTH-001 AC1) is email-only until the users/admin model adds a
   username column; `identifier` naming is already forward-compatible.
3. Lock (REQ-AUTH-001 AC5) and password-reset (AC6) audit/flows land with those
   features; login/logout/failure auditing is complete.
4. Audit append-only is application-level only; DB-level UPDATE/DELETE revocation is
   F1-03's job.

## Phase 0 — Accepted

PHASE-0-REVIEW decision: **Accept Phase** (PHASE-REVIEWER, Opus 4.8, 2026-06-18).
All nine Phase 0 tasks done with honest, independently-reproduced evidence. Full
record in `.forge/trust.md`. Phase 1 is cleared to start.

Independently re-run and passing: lint, typecheck, test (15/15, coverage clears
thresholds), openapi:check, build, prisma validate.

## Carry-forward conditions into Phase 1 (see trust.md PHASE-0-REVIEW)

1. F1-00A must generate a Prisma migration from the F0-08 schema (committed migration
   only covers the minimal F0-04 model). Run migrations inside the Docker network on Windows.
2. No NestJS runtime yet — `apps/api` is a `node:http` liveness server. F1-00B must stand
   up the Nest app + core kernel (prisma, errors, audit, correlation). Escalate to PLANNER
   to split if scope exceeds 1–5 files.
3. Module generator emits plain TS classes, not Nest decorators — re-align at F1-05 golden CRUD.
4. `POSTGRES_HOST_AUTH_METHOD: trust` is dev-only; parameterize before any non-dev deploy.
5. Visual/a11y/perf gates stay honest fail-loud until Phase 6 screens exist.

## History

- F0-00 — agent rulebook + architecture blueprint wired into Forge.
- F0-01 — pnpm workspace scaffold, package boundaries, OpenAPI shell, Prisma shell, postgres/redis compose.
- F0-02 — real lint/typecheck/test/build/OpenAPI gates.
- F0-03 — Docker Compose all four services; images built.
- F0-04 — minimal Prisma schema + SRS-aligned enums; idempotent seed verified against live postgres; init migration committed.
- F0-05 — design tokens, Tailwind config, shadcn/ui foundation in apps/web.
- F0-06 — boundary lint, coverage thresholds, OpenAPI scaffold drift, fail-loud UI/perf proofs.
- F0-07 — dependency-free module generator; `branches` reserved as future golden CRUD.
- F0-08 — coherent MVP data model: complaint history, audit, SLA, portal verification/session, comments, attachments, approvals, notifications, surveys, compensation.
- F1-00A — generated + applied the F0-08 Prisma migration inside the Docker network; seed data preserved.
- F1-00B — bootstrapped NestJS app + core kernel (Prisma lifecycle, correlation, error envelope); liveness preserved.
- F1-01A — dev-only Argon2id staff seed hashes; real `test:api -- auth` runner replacing the placeholder.
- F1-01B — service credential verification (Argon2id), generic denial of wrong/inactive/locked/missing-hash.
- F1-01C — `StaffSession` model + migration; session creation stores only a SHA-256 token hash; HttpOnly/SameSite/Secure cookie.
- F1-01D — session validation + logout invalidation by token hash; generic denial of missing/unknown/expired/revoked.
- F1-01E1 — `AuthModule` + `POST /auth/login` and `/auth/logout` routes with DTO parsing.
- F1-01E2 — append-only `AuditService`; AUTH login_success/login_failure/logout entries; audit-in-transaction for state changes.
- F1-01E3 — auth OpenAPI contract (paths + safe schemas + Set-Cookie); `openapi:check` hardened against auth-path/schema removal.
- VERIFY-F1-01E — independent gate Accept (Honest/Good); five proof commands re-run green; carry-forward security conditions recorded.
- VERIFY-F1-03A — independent gate Repair (Honest/Acceptable); proof commands re-run green, but audit search currently allows Branch Manager despite `RBAC-MATRIX-001` marking audit-log view as Admin yes / Branch Manager no.
- REPAIR-F1-03A — audit search restricted to Admin-only; proof commands passed; queued independent repair VERIFY before `F1-03B`.
- VERIFY-F1-03A-REPAIR — independent gate Accept (Honest/Good); `GET /audit/logs` confirmed Admin-only per RBAC-MATRIX-001 (Branch Manager denied + SECURITY-audited, service fails closed); filtering/clamp/redaction/OpenAPI intact; five proof commands re-run green. Audit search gate cleared.
- F1-03B — Admin-only audit export added with row cap, redacted JSON attachment, export audit entry, OpenAPI contract, and focused audit tests.
- F1-03C — DB-level trigger prevents audit log update/delete; `test:api -- audit` applies migrations in Docker and proves insert succeeds while update/delete fail.
- F1-04 — stable API error envelope now supports optional validation field errors; auth/RBAC errors remain safe and correlation IDs propagate to headers and error bodies.
- PLAN-F1-05 — split golden CRUD work; first build task is generator alignment before creating the `branches` exemplar.
- F1-05A - generator now emits NestJS-shaped module skeletons with module/controller/service/repository decorators and manifest-valid `MODULE.md` files.
- F1-05B - generated the real `branches` module shell and filled its `MODULE.md`; CRUD behavior remains unbuilt.
- F1-05C - added branch read/list service and repository behavior with a real `test:api -- admin` suite.
- F1-05D - added Admin-only branch read/list HTTP endpoints and OpenAPI contract entries.
- F1-05E - added branch create/update/deactivate service behavior with same-transaction CONFIG audit entries.
- F1-05F - added Admin-only branch write endpoints, OpenAPI write contract entries, route tests, and froze `branches` as the golden CRUD reference.
- Known limitation: Prisma's Rust engine cannot connect through Docker Desktop's Windows port-forwarding (P1000); run DB ops inside the Docker network. Does not affect application code.
