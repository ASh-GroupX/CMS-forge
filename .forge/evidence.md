# Evidence Log

Append build and verification evidence here, newest at the bottom. One entry per
task: ID, date, risk, status, requirement IDs, evidence, and honest verification
labels.

## Read and write rules (context hygiene)

- APPEND-ONLY. PLAN, VERIFY, and PHASE REVIEW read only the LATEST relevant entries
  (the active phase) - never load the whole file.
- History through Phase 7 / F7-02 is archived in
  `.forge/archive/evidence-archive.md` (and git). Do not load the archive unless a
  specific past entry is genuinely needed.
- When this log outgrows a phase, rotate the older phases into the archive.

---

## F8-00 - Job-Runtime Gate (FORGE-JOB-RUNTIME-001)

- Date: 2026-06-20
- Risk: Low (CI/tooling; no application behavior changed)
- Status: Passed
- Requirement IDs: METHOD-TEST-001, NFR-MAINT-001, CONTRACT-READINESS-002
- Evidence:
  - Added `tools/job-runtime-check.mjs`, wired into `tools/lint.mjs`. `lint` now fails
    when a registered background-job entrypoint has no runtime caller (scheduler /
    worker / ops route); test-file callers do not count as drivers.
  - The 6 current undriven jobs (sla.runWarningJob/runBreachJob,
    notifications.dispatchQueuedEmail/Sms/WhatsApp, attachments.transitionScanStatus)
    are grandfathered in a shrink-only `knownUndrivenJobs` ratchet. A grandfathered job
    that gains a driver fails the gate until removed, so F8-02..04 cannot be marked
    done without actually wiring the job.
  - Wrote the Phase 8 backlog (F8-00..F8-07); phase DoD = executed end-to-end proof.
- Verification:
  - Passed: `corepack pnpm lint` (6 jobs grandfathered; green)
  - Passed: `corepack pnpm test` (46/46; job-runtime-check.mjs 88% line / 84% branch /
    100% func; new tests: orphan flagged, worker-driven passes, test-callers ignored +
    ratchet-removal forced, real-repo holds)
- Notes:
  - Enforcement only - this does NOT make the jobs run. F8-01..06 build the runner /
    S3 / e2e that fix runtime; this gate guarantees they get wired and cannot recur.

(active-phase evidence appends below)

## F7-03A1 - Make `/auth/me` A Session Principal Endpoint

Date: 2026-06-19
Risk: High
Status: Passed
Requirements: REQ-AUTH-001, REQ-RBAC-001, UI-SCREEN-001 AC2/AC3

Evidence:
- Updated `apps/api/src/modules/auth/auth.controller.ts` so `GET /auth/me`
  requires `SessionAuthGuard` and returns the server-derived principal without an
  admin/manager-only RBAC gate.
- Added focused auth route tests proving a `CR_OFFICER` principal can read its
  own `/auth/me` response and that `/auth/me` uses only `SessionAuthGuard`.
- Kept RBAC/branch-scope guard tests on a guarded dummy handler so protected
  resource-route enforcement remains covered.

Verification:
- Failed: `pnpm test:api -- auth` could not start because `pnpm` is not on PATH
  in this shell.
- Passed: `corepack pnpm test:api -- auth` (34/34 tests).
- Passed: `corepack pnpm openapi:check`.
- Passed: `corepack pnpm typecheck`.

Security self-check:
- Roles and branch scope come from the server session, never client input:
  `SessionAuthGuard` populates `request.principal` from the HttpOnly
  `cms_staff_session` cookie; tests spoof `x-role-code`/`x-branch-id` and prove
  `RbacGuard` ignores them.
- State changes/audit transaction rule: not applicable; this task changes a read
  endpoint only.
- No passwords, OTPs, tokens, hashes, or provider secrets are logged or returned:
  auth route/session tests assert responses and audit records exclude raw tokens,
  password hashes, and reset material.
- Customer portal exposure rules: not applicable; staff auth endpoint only.
- Trust boundaries are tested: allowed `CR_OFFICER` `/auth/me` read, denied
  missing session in `SessionAuthGuard`, denied RBAC, and denied branch-scope
  cases are covered in the auth suite.

## F7-03A2 - Resolve Staff Shell Role From `/auth/me`

Date: 2026-06-19
Risk: High
Status: Passed
Requirements: REQ-AUTH-001, REQ-RBAC-001, UI-SCREEN-001 AC2/AC3

Evidence:
- Added `apps/web/src/lib/staff-session-api.ts` to call `GET /auth/me` from the
  server side with the incoming `cms_staff_session` cookie only.
- Updated `apps/web/src/app/page.tsx` so a real session principal decides
  signed-in role/navigation; `?role=` is ignored when `/auth/me` succeeds.
- Added staff shell tests for session-derived admin role, spoofed query ignored
  for a staff principal, and no-session no-fetch fallback.

Verification:
- Failed: first `corepack pnpm typecheck` caught an exact-optional-property
  issue after implementation.
- Passed: `corepack pnpm test:web -- shell` (91/91 tests) after repair.
- Passed: `corepack pnpm typecheck` after repair.

Security self-check:
- Roles and branch scope come from the server session, never client input:
  the shell forwards only the HttpOnly session cookie to `/auth/me`; a test proves
  `?role=admin` does not override a `CR_OFFICER` principal.
- State changes/audit transaction rule: not applicable; this task only reads the
  current session principal.
- No passwords, OTPs, tokens, hashes, or provider secrets are logged or returned:
  the helper returns only the typed principal and never exposes the cookie value in
  rendered markup.
- Customer portal exposure rules: not applicable; staff shell only.
- Trust boundaries are tested: allowed session-derived role and denied/no-session
  fallback are covered in `test:web -- shell`.

## F7-03A3 - Add Staff Login/Logout Form Actions

Date: 2026-06-19
Risk: High
Status: Passed
Requirements: REQ-AUTH-001, REQ-RBAC-001, UI-SCREEN-001 AC2/AC3

Evidence:
- Added `apps/web/src/lib/staff-auth-actions.ts` with server actions for
  `POST /auth/login` and `POST /auth/logout`.
- Updated `apps/web/src/app/page.tsx` so login/logout controls submit through
  server actions instead of preview-only buttons/links.
- Added shell tests/source checks proving form actions are wired, logout is a
  submit control, and no browser token storage is used.

Verification:
- Passed: `corepack pnpm test:web -- shell` (91/91 tests).
- Passed: `corepack pnpm typecheck`.

Security self-check:
- Roles and branch scope come from the server session, never client input:
  login only creates the server session; F7-03A2 resolves role from `/auth/me`.
- Login/logout cookies are handled server-side: server actions apply backend
  `Set-Cookie` values through `next/headers` cookies.
- No passwords, OTPs, tokens, hashes, or provider secrets are logged or returned:
  actions do not log form data or return auth API bodies to the browser.
- Customer portal exposure rules: not applicable; staff shell only.
- Trust boundaries are tested: form action wiring and no browser token storage are
  covered in `test:web -- shell`; backend auth allowed/denied behavior is covered
  by F7-03A1 `test:api -- auth`.

## F7-03B - Wire Staff Dashboard Summary To Real Read

Date: 2026-06-19
Risk: High
Status: Passed
Requirements: REQ-RBAC-001, UI-SCREEN-001 AC2/AC3, REQ-REPORT-001

Evidence:
- Added `apps/web/src/lib/staff-dashboard-api.ts` to call
  `GET /reports/dashboard` with only the server-side staff session cookie.
- Updated `DashboardSummary` to render real `ReportDashboardSummary` values when
  available and keep existing localized preview states otherwise.
- Added shell tests for real dashboard values, cookie forwarding, and backend
  denial fallback.

Verification:
- Failed: first `corepack pnpm test:web -- shell` caught a missed prop plumb
  (`dashboardSummary is not defined`).
- Passed: `corepack pnpm test:web -- shell` (93/93 tests) after repair.
- Passed: `corepack pnpm typecheck` after repair.

Security self-check:
- Roles and branch scope come from the server session, never client input:
  dashboard reads forward only `cms_staff_session` to the backend route.
- Report/dashboard reads use backend RBAC/branch scope: the web helper calls the
  guarded `/reports/dashboard` endpoint and does not send role or branch query
  authority.
- No passwords, OTPs, tokens, hashes, or provider secrets are logged or returned:
  the helper renders only numeric summary values.
- Customer portal exposure rules: not applicable; staff dashboard only.
- Trust boundaries are tested: real allowed summary render and denied backend
  fallback are covered in `test:web -- shell`.

## F7-03C - Wire Reports Dashboard And Export To Real Reads

Date: 2026-06-19
Risk: High
Status: Passed
Requirements: REQ-REPORT-001, REQ-RBAC-001, UI-SCREEN-001 AC2/AC3

Evidence:
- Added `apps/web/src/lib/staff-reports-api.ts` to call guarded
  `GET /reports` with the server-side staff session cookie.
- Updated `ReportsDashboard` to render real scoped report rows when available and
  keep the RPT-001 through RPT-017 catalog as fallback.
- Replaced export buttons with backend export links for CSV/Excel and no browser
  file generation.
- Added shell tests for real report rows, cookie forwarding, no role/branch query
  authority, export URLs, and denial fallback.

Verification:
- Failed: first `corepack pnpm typecheck` caught report-row validator typing.
- Passed: `corepack pnpm test:web -- shell` (95/95 tests) after repair.
- Passed: `corepack pnpm typecheck` after repair.

Security self-check:
- Roles and branch scope come from the server session, never client input:
  report reads forward only `cms_staff_session`.
- Report reads and export affordances use backend RBAC/branch scope: the web read
  calls guarded `/reports`; export links target guarded `/reports/export`.
- No client-side file generation or unbounded export behavior: the browser does
  not build CSV/Excel or blobs; exports remain backend routes with backend limits.
- No passwords, OTPs, tokens, hashes, or provider secrets are logged or returned.
- Trust boundaries are tested: allowed real report render/export URL and denied
  fallback are covered in `test:web -- shell`.

## F7-03D1 - Wire Work Queue To Real Complaint Read

Date: 2026-06-19
Risk: High
Status: Passed
Requirements: REQ-RBAC-001, UI-SCREEN-001 AC2/AC3, REQ-REPORT-001

Evidence:
- Added `apps/web/src/lib/staff-queue-api.ts` to call guarded
  `GET /complaints` with only the server-side staff session cookie.
- Updated `WorkQueue` to render real complaint queue rows when available and keep
  localized preview rows/states otherwise.
- Added shell tests for real queue rendering, cookie forwarding, no query-sourced
  role/branch/workflow authority, and denial fallback.

Verification:
- Failed: first `corepack pnpm typecheck` caught placeholder literal type
  inference in `WorkQueue`.
- Passed: `corepack pnpm test:web -- shell` (97/97 tests) after repair.
- Passed: `corepack pnpm typecheck` after repair.

Security self-check:
- Roles and branch scope come from the server session, never client input:
  queue reads forward only `cms_staff_session`.
- Complaint queue reads use backend RBAC/branch scope: the helper calls guarded
  `/complaints` and sends no role/actor/workflow/branch query.
- No portal-only/internal/audit data is exposed in queue rows: rendered data uses
  the existing queue response contract only.
- No passwords, OTPs, tokens, hashes, or provider secrets are logged or returned.
- Trust boundaries are tested: allowed real queue render and denied fallback are
  covered in `test:web -- shell`.

## F7-03D2 - Wire Complaint Detail To Real Read

Date: 2026-06-19
Risk: High
Status: Passed
Requirements: REQ-RBAC-001, UI-SCREEN-001 AC2/AC3

Evidence:
- Added `apps/web/src/lib/staff-detail-api.ts` to call guarded
  `GET /complaints/{id}` with only the server-side staff session cookie.
- Updated the staff shell/detail workspace to render real complaint facts and
  status timeline when available, while keeping localized preview/fallback states.
- Kept the React workspace render-only by mapping the backend detail contract into
  a small UI view model before rendering.
- Added shell tests for real complaint detail rendering, cookie forwarding, and
  backend denial fallback.

Verification:
- Failed: first `corepack pnpm test:web -- shell` caught workflow-authority terms
  in the detail workspace source scan.
- Passed: `corepack pnpm test:web -- shell` (99/99 tests) after repair.
- Passed: `corepack pnpm typecheck` after repair.

Security self-check:
- Roles and branch scope come from the server session, never client input:
  detail reads forward only `cms_staff_session`.
- Complaint detail reads use backend RBAC/branch scope: the helper calls guarded
  `/complaints/{id}` and sends no role/actor/workflow/branch query authority.
- No portal-only/internal/audit data is exposed in detail rendering: the UI view
  model contains only reference, status, severity, subject, branch, assignee, and
  public status timeline display strings from the guarded staff detail response.
- No passwords, OTPs, tokens, hashes, or provider secrets are logged or returned.
- Trust boundaries are tested: allowed real detail render and denied fallback are
  covered in `test:web -- shell`.

## F7-04A - Portal Submission UI

Date: 2026-06-19
Risk: High
Status: Passed
Requirements: REQ-PORTAL-001, UI-DESIGN-001, UI-SCREEN-001 AC2/AC3/AC5

Evidence:
- Added `/portal` as a public customer complaint submission route in
  `apps/web/src/app/portal/page.tsx`.
- Added `apps/web/src/i18n/portal-submission.ts` with Arabic RTL and English LTR
  portal submission copy, form labels, states, and safe result messaging.
- Rendered contact, complaint, vehicle, and attachment sections with loading,
  validation, success/reference-number, and error states.
- Added shell tests for English form coverage, Arabic RTL localization, safe
  success reference display, state rendering, and public render-only source.

Verification:
- Passed: `corepack pnpm test:web -- shell` (104/104 tests).
- Passed: `corepack pnpm typecheck`.
- Passed: source line budget check: `apps/web/src/app/portal/page.tsx` 150 lines,
  `apps/web/src/i18n/portal-submission.ts` 125 lines.

Security self-check:
- Portal submission UI exposes no internal/staff/audit/DMS data: tests assert the
  rendered page and source avoid those terms, and the success state shows only
  the customer-safe reference result.
- Attachment affordance is UI-only: the route renders a file input and rules but
  performs no browser upload, object URL creation, or download behavior.
- Public result messaging returns only the customer-safe reference number; sample
  phone/VIN values are not preserved in the success state.
- Trust boundaries are tested with success, loading, validation, and error portal
  states in `test:web -- shell`.

## F7-04B - Portal Tracking UI

Date: 2026-06-19
Risk: High
Status: Passed
Requirements: REQ-PORTAL-002, PORTAL-SEC-001, UI-DESIGN-001, UI-SCREEN-001 AC2/AC3/AC5

Evidence:
- Added `/portal/track` as a public tracking route in
  `apps/web/src/app/portal/track/page.tsx`.
- Added `apps/web/src/i18n/portal-tracking.ts` with Arabic RTL and English LTR
  tracking, verification, public timeline, and follow-up copy.
- Rendered reference/phone verification request, verification-code entry,
  unverified privacy gate, verified public status/timeline, invalid/expired/error
  states, and follow-up affordance after verification.
- Added shell tests for the unverified gate, Arabic RTL, verified public
  timeline, invalid/expired/error/follow-up states, and source privacy.

Verification:
- Passed: `corepack pnpm test:web -- shell` (109/109 tests).
- Passed: `corepack pnpm typecheck`.
- Passed: source line budget check:
  `apps/web/src/app/portal/track/page.tsx` 159 lines,
  `apps/web/src/i18n/portal-tracking.ts` 103 lines.

Security self-check:
- Portal tracking requires verification before status/timeline is shown: default
  rendering shows only request/verify forms plus a privacy gate; tests assert no
  public timeline or status appears before verification.
- Portal tracking UI exposes no internal/staff/audit/DMS/unrelated complaint data:
  tests cover rendered verified output and source privacy checks.
- Session/OTP secrets are never rendered or stored in browser APIs: the UI uses a
  verification-code field only and source tests reject session token, verification
  id, browser storage, and cookie access patterns.
- Trust boundaries are tested with unverified, verified, invalid/expired/error,
  and follow-up states in `test:web -- shell`.

## F7-04C - Survey UI

Date: 2026-06-19
Risk: High
Status: Passed
Requirements: REQ-SURVEY-001, UI-DESIGN-001, UI-SCREEN-001 AC2/AC3/AC5

Evidence:
- Added `/portal/survey` as a public customer satisfaction survey route in
  `apps/web/src/app/portal/survey/page.tsx`.
- Added `apps/web/src/i18n/portal-survey.ts` with Arabic RTL and English LTR
  survey copy, rating labels, and one-time link states.
- Rendered bounded 1-5 rating radio controls, optional comment, success,
  validation, loading, error, used, and expired states.
- Used/expired states suppress the submission form so the UI does not present a
  resubmission path for one-time links.
- Added shell tests for rating accessibility, Arabic RTL, success privacy,
  used/expired lockout, validation/loading/error states, and source privacy.

Verification:
- Passed: `corepack pnpm test:web -- shell` (115/115 tests).
- Passed: `corepack pnpm typecheck`.
- Passed: source line budget check:
  `apps/web/src/app/portal/survey/page.tsx` 93 lines,
  `apps/web/src/i18n/portal-survey.ts` 65 lines.

Security self-check:
- Survey UI does not expose tokens or internal complaint/staff/audit/DMS data:
  source tests reject token/session/verification/private data paths and rendered
  success output does not preserve the sample comment.
- Used/expired states prevent resubmission in the UI by not rendering the survey
  form or submit button.
- Rating controls are accessible and bounded to 1-5: tests assert exactly five
  radio controls with accessible rating labels.
- Trust boundaries are tested with active, success, used, expired, validation,
  loading, and error states in `test:web -- shell`.

## F7-05A - Real Accessibility Proof

Date: 2026-06-19
Risk: High
Status: Passed
Requirements: QA-UI-001, UI-DESIGN-001, UI-SCREEN-001 AC3/AC4

Evidence:
- Extended `tools/web-proof.mjs` so `test:e2e -- accessibility` renders route
  previews instead of only staff shell previews.
- Added accessibility coverage for staff, portal submission, portal tracking, and
  portal survey routes in both English LTR and Arabic RTL.
- Added deterministic checks for language/direction, route coverage, accessible
  regions/labels, named buttons, links with hrefs, hidden decorative SVGs,
  explicit button types, feedback roles, focus affordances, reduced motion, and
  contrast/focus token coverage.
- Preserved stronger staff thresholds while allowing smaller portal routes to set
  route-specific minimums.
- Narrowed the performance proof script check so React/Next inline form-action
  helpers are allowed while external scripts and excess inline scripts are still
  rejected.

Verification:
- Failed: first `corepack pnpm test:e2e -- accessibility` exposed an overly broad
  proof regex that treated `<aside>` as an anchor.
- Passed: `corepack pnpm test:e2e -- accessibility` (17 route previews) after
  repair.
- Passed: `corepack pnpm test:web -- shell` (115/115 tests).
- Passed: `corepack pnpm typecheck`.
- Failed: first `node --test tools/web-proof.test.mjs` exposed an existing perf
  proof incompatibility with the React/Next inline form-action helper.
- Passed: `node --test tools/web-proof.test.mjs` after narrowing the script
  check.

Security self-check:
- Accessibility proof covers both staff and portal public screens across English
  LTR and Arabic RTL route previews.
- Keyboard/focus, labels, icon-button names, contrast token coverage, and RTL/LTR
  route coverage are checked by runnable proof.
- No browser/axe dependency was added; this is deterministic static route-render
  proof, not real-browser axe scanning. Real browser/axe coverage remains a
  future enhancement unless added in a later task.

## F7-05B - Destructive Confirmation UI States

Date: 2026-06-19
Risk: High
Status: Passed
Requirements: QA-UI-001, UI-DESIGN-001, UI-SCREEN-001 AC2/AC4

Evidence:
- Added `apps/web/src/i18n/staff-confirmations.ts` for localized destructive
  confirmation copy.
- Added an Admin deactivate confirmation panel at the Admin surfaces boundary so
  deactivate affordances have an explicit confirmation step in the admin preview.
- Added attachment rejection confirmation rendering for rejected attachment scan
  states.
- Added workflow close/reject confirmation rendering in the workflow modal when
  required-comment validation is shown.
- Added shell tests proving deactivate, attachment reject, and workflow close/
  reject confirmation copy/buttons render and remain mutation-free.

Verification:
- Passed: `corepack pnpm test:web -- shell` (117/117 tests).
- Passed: `corepack pnpm test:e2e -- accessibility` (17 route previews).
- Passed: `corepack pnpm typecheck`.

Security self-check:
- Destructive actions require explicit confirmation UI before the final affordance:
  deactivate, attachment reject, and workflow close/reject all render confirmation
  panels with confirm/cancel controls.
- Confirmation rendering remains UI-only and does not perform backend mutations:
  source tests reject fetch/browser storage and mutation verb patterns in the
  edited UI surfaces.
- Workflow close/reject remains backend-authority-only: the modal still renders
  allowed action labels from backend-policy copy and does not decide transitions.

## F7-06 - OpenAPI Contract Finalization

Date: 2026-06-19
Risk: High
Status: Passed
Requirements: ARCH-API-001, UI-SCREEN-001 AC2, PORTAL-SEC-001

Evidence:
- Updated `tools/openapi-check.mjs` so the canonical contract documents the real
  public health routes `/` and `/health`.
- Added `HealthResponse` to the canonical schema set and required checker list.
- Regenerated `packages/contracts/openapi.json` from the canonical generator.
- Confirmed SLA and integrations controllers expose no HTTP methods yet, so no
  OpenAPI paths are currently required for those scaffolds.

Verification:
- Passed: `corepack pnpm openapi:generate`.
- Passed: `corepack pnpm openapi:check`.
- Passed: `corepack pnpm test:api -- portal` (5/5 tests).
- Passed: `corepack pnpm test:api -- portal.tracking` (23/23 tests).
- Passed: `corepack pnpm test:api -- surveys` (13/13 tests).
- Passed: `corepack pnpm typecheck`.
- Passed: `node --test tools/openapi-check.test.mjs` (4/4 tests).

Security self-check:
- Public portal schemas do not include internal comments, audit logs, DMS codes,
  staff PII, OTP values, or token hashes; portal/survey API tests include
  explicit OpenAPI privacy assertions.
- Staff routes remain documented behind their existing session/RBAC responses;
  this task only documented existing health routes and did not alter guards.
- OpenAPI drift enforcement runs and passes through `openapi:check`.

## F7-07A - Real Backup Health Check

Date: 2026-06-19
Risk: High
Status: Passed
Requirements: NFR-DATA-001, NFR-AVAIL-001, NFR-OBS-001

Evidence:
- Added `tools/ops-backup-check.mjs` as the real `ops:backup:check` proof.
- Updated `package.json` so `ops:backup:check` runs the deterministic checker
  instead of the fail-loud placeholder.
- Added `docs/operations/backup.md` with the pilot database backup schedule,
  staging restore test steps, attachment backup/replication plan, RPO/RTO, and
  non-dev secret-handling requirements.
- Added `tools/ops-backup-check.test.mjs` covering the default local pass path,
  forbidden staging/production `POSTGRES_HOST_AUTH_METHOD=trust` posture, and
  no-secret proof output.

Verification:
- Passed: `corepack pnpm ops:backup:check`.
- Passed: `node --test tools/ops-backup-check.test.mjs` (3/3 tests).
- Passed: `corepack pnpm test` (34/34 tool tests; coverage gate passed).
- Passed: `corepack pnpm typecheck`.
- Passed: source line budget check:
  `tools/ops-backup-check.mjs` 150 lines,
  `tools/ops-backup-check.test.mjs` 35 lines,
  `docs/operations/backup.md` 44 lines.

Security self-check:
- The check does not print secrets: tests assert proof output excludes the local
  database password and connection URL forms, and the checker reports only
  structural pass/fail messages.
- Unsafe non-dev backup posture fails loudly: `CMS_ENV=staging` and
  `CMS_ENV=production` fail when compose still contains
  `POSTGRES_HOST_AUTH_METHOD=trust`.
- Remaining live-backup/deploy gaps are recorded honestly: this is a local
  deterministic proof only; actual staging backup execution, restore evidence,
  and object-storage replication are documented as operator/deployment work.
- State changes/audit transaction rule: not applicable; operations proof only.
- Customer portal exposure rules: not applicable; no application data is read.

## F7-07B - Real Performance Baseline

Date: 2026-06-19
Risk: High
Status: Passed
Requirements: NFR-PERF-001, QA-UI-001, UI-DESIGN-001

Evidence:
- Updated `package.json` so `test:performance` runs
  `node --import tsx tools/web-proof.mjs perf` instead of the fail-loud
  placeholder.
- Reused the existing deterministic frontend performance proof that renders the
  staff dashboard and work queue route previews with server-render timing,
  HTML-size, row-count, responsive-guard, script, and image-dimension budgets.
- Added a scaffold regression test proving `test:performance` is wired to the
  real web performance runner and does not point at `pending-proof`.

Verification:
- Passed: `corepack pnpm test:performance` (2 route previews).
- Passed: `corepack pnpm web:perf` (2 route previews).
- Failed: first `corepack pnpm test` caught a test assumption that
  `checkScaffold()` returned package scripts.
- Passed: `corepack pnpm test` (35/35 tool tests; coverage gate passed) after
  repairing the test to read `package.json` directly.
- Passed: `corepack pnpm typecheck`.
- Passed: source line budget check: `tools/scaffold-check.test.mjs` 17 lines.

Security self-check:
- The performance proof does not call protected backend routes or leak session
  cookies/tokens: it server-renders static route previews locally through
  `tools/web-proof.mjs` and performs no network fetches.
- Remaining limit stated honestly: this is a deterministic frontend smoke budget,
  not Lighthouse, browser RUM, API p95, or million-record search/load testing.
- State changes/audit transaction rule: not applicable; proof wiring only.
- Customer portal exposure rules: not applicable; this proof covers staff route
  preview surfaces only.

## F7-07C - Wire Security Check

Date: 2026-06-19
Risk: High
Status: Passed
Requirements: NFR-SEC-001, REQ-AUTH-001, REQ-RBAC-001, REQ-AUDIT-001, PORTAL-SEC-001

Evidence:
- Added `tools/security-check.mjs` as the real `security:check` proof
  orchestrator.
- Updated `package.json` so `security:check` runs the new proof instead of the
  fail-loud placeholder.
- Added `tools/security-check.test.mjs` covering selected command suites,
  placeholder exclusion, pass behavior, and failure propagation.
- Updated `tools/pending-proof.test.mjs` to keep fail-loud coverage on the still
  pending `db:index:check` script instead of the now-real security check.

Verification:
- Passed: `node --test tools/security-check.test.mjs tools/pending-proof.test.mjs`
  (4/4 tests).
- Passed: `corepack pnpm security:check`:
  auth 34/34, admin 15/15, security 4/4, audit redaction/RBAC 8/8, portal 5/5,
  portal tracking 23/23, attachments 28/28, reports 7/7.
- Passed: `corepack pnpm test` (38/38 tool tests; coverage gate passed).
- Passed: `corepack pnpm typecheck`.
- Passed: source line budget check:
  `tools/security-check.mjs` 68 lines,
  `tools/security-check.test.mjs` 51 lines,
  `tools/pending-proof.test.mjs` 12 lines.

Security self-check:
- `security:check` runs real suites: auth session/password/reset security,
  admin RBAC/CSRF, CSRF/rate-limit guards, audit redaction/RBAC, portal
  submission privacy, portal tracking verification privacy, attachment
  authorization/scan policy, and report authorization/scoped export security.
- The check does not print secrets or token material from its own orchestration:
  it logs suite labels only, never command arguments, environment values,
  passwords, OTPs, session tokens, reset tokens, hashes, or provider secrets.
- The Phase 6 carry-forward placeholder condition is closed:
  `security:check` no longer invokes `tools/pending-proof.mjs`.
- Remaining limit stated honestly: this does not replace external penetration
  testing, SAST/DAST, or production TLS/gateway checks; HTTPS redirect remains
  tracked for F7-09.

## F7-08 - UAT Scripts With Realistic Automotive Data

Date: 2026-06-19
Risk: High
Status: Passed
Requirements: UI-SCREEN-001, UI-DESIGN-001, QA-UI-001

Evidence:
- Added `docs/operations/uat-phase7.md` with a non-developer UAT checklist for
  every MVP screen from UI-001 through UI-020, including UI-001A and UI-014A.
- Mapped UAT scripts UAT-001 through UAT-016 to realistic automotive scenarios
  using the seeded complaint references CMP-SEED-001, CMP-SEED-002,
  CMP-SEED-003 and fictional VINs SEEDDEMO00001/SEEDDEMO00002.
- Included English LTR and Arabic RTL acceptance coverage, evidence capture
  expectations, and defect triage fields.
- Added `tools/uat-check.mjs` and `tools/uat-check.test.mjs` to enforce screen
  ID coverage, UAT scenario coverage, seed signals, RTL/LTR signals, and
  forbidden placeholder/secret-like text.

Verification:
- Passed: `node tools/uat-check.mjs`.
- Passed: `node --test tools/uat-check.test.mjs` (3/3 tests).
- Passed: `corepack pnpm test` (41/41 tool tests; coverage gate passed).
- Passed: `corepack pnpm typecheck`.
- Passed: source line budget check:
  `tools/uat-check.mjs` 79 lines,
  `tools/uat-check.test.mjs` 22 lines,
  `docs/operations/uat-phase7.md` 81 lines.

Security self-check:
- Portal UAT steps require verification before tracking details are viewed:
  UI-019 and UAT-009 explicitly require reference plus verification before
  public tracking details/timeline appear.
- UAT data/examples do not expose passwords, OTPs, tokens, staff PII beyond role
  labels, audit internals to portal users, or DMS codes; the checker rejects
  secret-like placeholders and DMS code text.
- Human UAT sign-off remains separate from deterministic checklist validation:
  the checklist states that business reviewers must sign the completed run.
- State changes/audit transaction rule: not applicable; UAT documentation/proof
  only.

## F7-09 - Deployment And Operations Runbook

Date: 2026-06-19
Risk: High
Status: Passed
Requirements: NFR-SEC-001, NFR-AVAIL-001, NFR-OBS-001, NFR-DATA-001

Evidence:
- Added `docs/operations/runbook.md` covering local setup, deployment,
  migration, rollback, environment variables, backup/restore, monitoring,
  incident response, security, DMS integration, notification providers, and data
  retention.
- Updated `docker-compose.yml` so `POSTGRES_HOST_AUTH_METHOD` is parameterized
  as `${POSTGRES_HOST_AUTH_METHOD:-trust}` rather than hardcoded to `trust`.
- Extended `tools/ops-backup-check.mjs` so `ops:backup:check` validates the
  broader operations runbook and fails staging/production when
  `POSTGRES_HOST_AUTH_METHOD` resolves to `trust`.
- Extended `tools/ops-backup-check.test.mjs` to prove production passes only
  when a hardened non-trust auth method is explicitly supplied.

Verification:
- Passed: `corepack pnpm ops:backup:check`.
- Passed: `node --test tools/ops-backup-check.test.mjs` (4/4 tests).
- Passed: `corepack pnpm test` (42/42 tool tests; coverage gate passed).
- Passed: `corepack pnpm typecheck`.
- Passed: source line budget check:
  `tools/ops-backup-check.mjs` 194 lines,
  `tools/ops-backup-check.test.mjs` 44 lines,
  `docs/operations/runbook.md` 84 lines,
  `docker-compose.yml` 52 lines.

Security self-check:
- Non-dev Postgres auth is no longer hardcoded to trust:
  `POSTGRES_HOST_AUTH_METHOD` is parameterized and the proof fails
  staging/production unless a non-trust value such as `scram-sha-256` is
  supplied.
- HTTPS redirect/TLS enforcement is documented as a production gateway
  requirement before pilot traffic is allowed.
- The runbook documents environment variables without secret values and instructs
  operators not to attach passwords, OTP values, tokens, session cookies,
  provider credentials, or full attachment contents to tickets.
- Remaining limit stated honestly: this task documents deployment operations and
  validates local posture; it does not provision certificates, gateways, cloud
  storage, provider credentials, or a CI/CD pipeline.

## PHASE-7-REVIEW-REPAIR - Line Budget And Review Proof

Date: 2026-06-20
Risk: High
Status: Passed
Requirements: UI-DESIGN-001, QA-UI-001, NFR-SEC-001, NFR-OBS-001

Evidence:
- During the mandatory Phase 7 review, the first proof rerun found `lint`
  failures because `apps/web/src/app/page.tsx`, `tools/openapi-check.mjs`, and
  `tools/web-proof.mjs` exceeded the 300-line source budget.
- Repaired the budget breach by extracting staff shell auth/role panels to
  `apps/web/src/app/staff-shell-panels.tsx`, moving web proof case data to
  `tools/web-proof-cases.mjs`, and moving the large canonical OpenAPI document
  to `tools/openapi-canonical.json` behind the existing `openapi-check` API.
- Updated the shell source-inspection test to follow the extracted staff shell
  panel source while preserving the full rendered shell assertions.
- Final line counts are within budget for touched source files:
  `apps/web/src/app/page.tsx` 227 lines,
  `apps/web/src/app/staff-shell-panels.tsx` 82 lines,
  `tools/web-proof.mjs` 136 lines,
  `tools/web-proof-cases.mjs` 77 lines,
  `tools/openapi-check.mjs` 54 lines.

Verification:
- Failed then repaired: `corepack pnpm lint` initially reported three source
  files over 300 lines during phase review.
- Failed then repaired: `corepack pnpm test` and `corepack pnpm test:web --
  shell` initially failed after extraction because the new JSX file needed the
  React import and one source-inspection test still read the old file.
- Passed: `corepack pnpm lint`.
- Passed: `corepack pnpm typecheck`.
- Passed: `corepack pnpm test` (42/42 tool tests; coverage gate passed at
  90.63% lines, 87.40% functions, 81.57% branches).
- Passed: `corepack pnpm test:web -- shell` (117/117 tests).
- Passed: `corepack pnpm test:e2e -- accessibility` (17 route previews).
- Passed: `corepack pnpm test:performance` (2 route previews).
- Passed: `corepack pnpm openapi:check`.
- Passed: `corepack pnpm security:check`.
- Passed: `corepack pnpm ops:backup:check`.

Security self-check:
- Extraction did not move authority into React: staff role and branch authority
  still come from `getStaffSessionPrincipal`/server session when present, and
  preview query params are ignored for real principals.
- OpenAPI drift checking still compares the contract to the canonical document;
  the canonical payload moved to JSON storage to satisfy the source budget.
- No secrets, OTPs, tokens, passwords, provider credentials, audit internals, or
  staff PII were added to public UI or proof artifacts.

## F8-01 - Background Runner Foundation (BullMQ)

Date: 2026-06-20
Risk: High
Status: Passed
Requirements: ARCH-STACK-001, SLA-CALENDAR-001, NFR-OBS-001

Evidence:
- Added `bullmq` to `apps/api/package.json` and updated `pnpm-lock.yaml`.
- Added `apps/api/src/worker/queue.ts` with REDIS_URL parsing, the queue registry
  for `sla`, `notifications`, and `attachments-scan`, a typed enqueue helper, and
  registry close helper.
- Added `apps/api/src/worker/index.ts` as a second Nest application context
  process. It boots the relevant DI graph, starts one noop BullMQ worker per
  queue, logs queue connection, logs received smoke jobs, and shuts down cleanly.
- Added a `worker` service to `docker-compose.yml` using the existing API image
  with `node dist/worker/index.js` against the same Postgres and Redis services.
- Added `apps/api/test/worker/queue.test.ts` covering registry creation,
  enqueue routing, registry close, and rejected non-Redis URLs without live Redis.
- Left the job-runtime ratchet at 6; this task added no SLA, notification, or
  attachment business job calls.

Verification:
- Passed: `node --import tsx --test apps/api/test/worker/queue.test.ts` (4/4).
- Passed: `corepack pnpm typecheck`.
- Passed: `corepack pnpm lint`.
- Passed: `corepack pnpm test` (46/46 tool tests; coverage gate passed).
- Passed: `docker compose up -d redis worker`; image built, Redis/Postgres/worker
  were running.
- Passed: Docker worker log showed queue connections for `attachments-scan`,
  `sla`, and `notifications`, then `worker ready queues=sla,notifications,attachments-scan`.
- Passed: enqueued a smoke job inside the worker image with
  `node --input-type=module -e ...`; output was `enqueued f8-01-smoke-1781934277758`.
- Passed: Docker worker log showed
  `test job received queue=notifications name=worker.smoke id=f8-01-smoke-1781934277758`.

Security self-check:
- Roles and branch scope: no client/RBAC surface was added; existing HTTP guards
  still own session-derived role and branch scope.
- State changes and audit: no domain state change or business job logic was
  added. F8-02 must prove SLA state/audit behavior when it starts invoking jobs.
- Secrets: `REDIS_URL` is parsed from environment and never logged; worker logs
  queue name, job name, and job id only.
- Portal exposure: no portal route or portal data shape changed.
- Trust boundary proof: accepted Redis URLs are covered by the registry test and
  Docker runtime proof; non-Redis URLs are rejected by unit test before any queue
  is created.
