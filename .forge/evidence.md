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

## P9-02 - Anti-Mojibake Arabic Locale Lint Gate

Date: 2026-06-20
Risk: Medium
Status: Passed
Requirements: REQ-LOCALIZATION-001 AC1, REQ-LOCALIZATION-001 AC2, UI-DESIGN-001 AC3, UI-DESIGN-001 AC4

Evidence:
- Added `tools/i18n-lint.mjs` to scan `apps/web/src/i18n/*.ts` for U+00C3,
  U+00C2, U+00D8, U+00D9, and U+FFFD mojibake markers.
- The same gate checks each `ar:` locale block contains Arabic-range Unicode code
  points.
- Wired the i18n gate into `tools/lint.mjs`, so `corepack pnpm lint` fails on
  Arabic mojibake before pilot.
- Added `tools/i18n-lint.test.mjs` to prove the gate accepts current clean i18n,
  rejects mojibake, and rejects an Arabic block without Arabic code points.
- No business or workflow authority moved into React.

Verification:
- Passed: `corepack pnpm test:web -- localization`.
- Passed: `corepack pnpm lint`.
- Failed then repaired: `corepack pnpm test` initially caught a test fixture that
  wrote literal Unicode escapes instead of marker characters, then caught the
  `ar:` matcher only handling multiline object properties. Both were repaired.
- Passed: `corepack pnpm test` (48/48 tool tests; coverage gate passed).
- Passed: `corepack pnpm typecheck`.

## P9-01E - Remaining Staff Arabic I18n

Date: 2026-06-20
Risk: Medium
Status: Passed
Requirements: REQ-LOCALIZATION-001 AC1, REQ-LOCALIZATION-001 AC2, UI-DESIGN-001 AC3, UI-DESIGN-001 AC4

Evidence:
- Confirmed `apps/web/src/i18n/staff-audit-viewer.ts`,
  `apps/web/src/i18n/staff-notification-center.ts`, and
  `apps/web/src/i18n/staff-reports-dashboard.ts` already contain real Arabic
  Unicode code points and no U+00C3, U+00C2, U+00D8, U+00D9, or U+FFFD markers.
- Extended `apps/web/test/localization/staff-shell-localization.test.ts` to cover
  audit viewer, notification center, and reports dashboard Arabic text bundles.
- Verified audit, notification, and reports surfaces render Arabic RTL and
  English LTR through the existing staff shell.
- Verified reports export copy still states RBAC-filtered backend scope.
- No permission, branch-scope, business, or workflow authority moved into React.

Verification:
- Passed: `corepack pnpm test:web -- localization`.
- Passed: `corepack pnpm test:e2e -- ui-smoke`.
- Passed: `corepack pnpm test:e2e -- accessibility`.
- Passed: `corepack pnpm lint`.
- Passed: `corepack pnpm typecheck`.

## Phase 9 Active Evidence Index

Date: 2026-06-20
Status: Passed through P9-02

- P9-01A: Passed `corepack pnpm test:web -- localization`,
  `corepack pnpm test:e2e -- ui-smoke`,
  `corepack pnpm test:e2e -- accessibility`, `corepack pnpm lint`, and
  `corepack pnpm typecheck`.
- P9-01B: Passed `corepack pnpm test:web -- localization`,
  `corepack pnpm test:e2e -- accessibility`, `corepack pnpm lint`, and
  `corepack pnpm typecheck`.
- P9-01C: Passed `corepack pnpm test:web -- localization`,
  `corepack pnpm test:e2e -- ui-smoke`,
  `corepack pnpm test:e2e -- accessibility`, `corepack pnpm lint`, and
  `corepack pnpm typecheck`.
- P9-01D: Passed `corepack pnpm test:web -- localization`,
  `corepack pnpm test:e2e -- ui-smoke`,
  `corepack pnpm test:e2e -- accessibility`, `corepack pnpm lint`, and
  `corepack pnpm typecheck`.
- P9-01E: Passed `corepack pnpm test:web -- localization`,
  `corepack pnpm test:e2e -- ui-smoke`,
  `corepack pnpm test:e2e -- accessibility`, `corepack pnpm lint`, and
  `corepack pnpm typecheck`.
- P9-02: Passed `corepack pnpm test:web -- localization`,
  `corepack pnpm lint`, `corepack pnpm test` (48/48 tool tests; coverage gate
  passed), and `corepack pnpm typecheck`.
- AUTO PHASE stopped at `PLAN-P9-03` because shadcn adoption must be split before
  build work.

## P9-04A Repair — Golden screen: real route + components/ + colored badges

- Date: 2026-06-20
- Risk: Medium
- Status: Built
- SRS IDs: UI-DESIGN-001, ARCH-UI-001

### Changes

1. `src/i18n/staff-shell.ts` — added `unassigned` key (EN/AR) to workQueue; no existing keys changed.
2. `src/components/work-queue/index.tsx` (NEW) — clean WorkQueue without QueuePreviewState;
   `rows: ComplaintQueueItem[] | null` drives empty/error; colored Badges via design tokens
   (severity: HIGH=status-error, CRITICAL=destructive, MEDIUM=status-warning; status:
   IN_PROGRESS=brand, SUBMITTED=status-info, RESOLVED=status-success, etc.); row hover; branded action link.
3. `src/app/(staff)/layout.tsx` (NEW) — App Router staff route-group layout; locale from
   `x-cms-locale` header; session principal for role-nav; two-column shell (sidebar + children).
4. `src/app/(staff)/complaints/page.tsx` (NEW) — real Server Component route; locale from
   searchParams; calls `getStaffQueueItems`; renders WorkQueue. No preview-state props.
5. `test/shell/shell.test.ts` — added ComplaintsPage import + 7 new tests.

### Verification

- `typecheck`: **Passed** — `npx tsc -p apps/web/tsconfig.json --noEmit` clean (0 errors).
- `lint`: **Passed** — `node tools/lint.mjs` → "Lint passed".
- `test:web`: **Passed** — 124/124 tests (7 new all green; all 117 existing still pass).
- Localization: **Passed** — 11/11 localization tests pass.
- `test:e2e`, `test:visual`, screenshot review: **Not Run** (require live stack).

## P9-04A - Work Queue Golden Screen

Date: 2026-06-20
Risk: Medium
Status: Passed
Requirements: UI-DESIGN-001 AC1, UI-DESIGN-001 AC2, UI-DESIGN-001 AC3, UI-DESIGN-001 AC4, UI-DESIGN-001 AC5, UI-DESIGN-001 AC6, UI-SCREEN-001 AC1, UI-SCREEN-001 AC2, UI-SCREEN-001 AC3

Evidence:
- Rebuilt `apps/web/src/app/work-queue.tsx` with generated shadcn primitives:
  `Card`, `Table`, `Button`, `Input`, `Label`, `Select`, `Badge`, and
  `Skeleton`.
- Removed hardcoded fallback complaint rows. Work queue table rows now render only
  from `ComplaintQueueItem[]` passed through the existing typed staff queue read.
- Backend authority stayed server-owned: the component does not read role, branch
  scope, workflow state, query params, cookies, storage, or `fetch`.
- Added localized production-safe work queue copy, success/conflict states, and
  neutral SLA copy until the backend exposes a queue SLA field.
- Added shell tests for no fallback rows, real API rows through forwarded session
  cookies, API-denied empty rendering, and loading/empty/error/success/conflict
  feedback roles.
- Repaired the generated `Skeleton` primitive's missing React import and added the
  root `@/*` path mapping so the same shadcn imports resolve in the TSX proof
  runners.
- Updated EN/AR visual and accessibility proof cases for the golden work queue,
  including success and conflict states.
- Visual review result: Passed. `web:visual-review` wrote
  `coverage/web-visual-review/en-work-queue-visual-regression.html` and
  `coverage/web-visual-review/ar-work-queue-visual-regression.html`; I also
  rendered the actual Next app on port 3100 and inspected EN/AR Chrome
  screenshots for layout, overflow, and RTL/LTR direction. The dev server was
  stopped after inspection.

Verification:
- Failed then repaired: `corepack pnpm test:web -- shell` initially failed after
  the new loading state exercised the generated `Skeleton` primitive without a
  React import, and after an over-broad source assertion matched shadcn `@/*`
  imports. Repaired with the primitive import and narrower assertions.
- Failed then repaired: `corepack pnpm test:e2e -- ui-smoke` and
  `corepack pnpm test:e2e -- accessibility` initially failed because the root TSX
  runner could not resolve `@/*` shadcn imports. Repaired with root
  `tsconfig.json` path mapping.
- Passed: `corepack pnpm test:web -- shell` (117/117).
- Passed: `corepack pnpm test:e2e -- ui-smoke` (2 route previews).
- Passed: `corepack pnpm test:e2e -- accessibility` (17 route previews).
- Passed: `corepack pnpm test:visual` (16 route previews).
- Passed: `corepack pnpm web:visual-review`.
- Passed: `corepack pnpm web:perf` (2 route previews).
- Passed: `corepack pnpm lint`.
- Passed: `corepack pnpm typecheck`.

## PLAN-P9-04 - Golden Screen Split

Date: 2026-06-20
Risk: Medium
Status: Passed
Requirements: UI-DESIGN-001 AC1, UI-DESIGN-001 AC2, UI-DESIGN-001 AC3, UI-DESIGN-001 AC4, UI-DESIGN-001 AC5, UI-DESIGN-001 AC6, UI-SCREEN-001

Evidence:
- Ran `corepack pnpm web:visual-review`; artifacts were written under
  `coverage/web-visual-review`.
- Reviewed the generated visual artifact index and the work queue artifact.
- Selected the complaint work queue (`UI-003`) as the golden screen because it is
  the central operational surface and covers filters, table density, status and
  SLA badges, pagination, loading/empty/error/success/conflict state treatment,
  responsive overflow, and RTL/LTR layout.
- Split the remaining screen refactor work into P9-04B..P9-04H so no builder has
  to refactor the full app shell in one pass.

Verification:
- Passed: `corepack pnpm web:visual-review`.

## P9-03A - Initialize Shadcn Config

Date: 2026-06-20
Risk: Medium
Status: Passed
Requirements: UI-DESIGN-001 AC1, UI-DESIGN-001 AC2

Evidence:
- Ran `corepack pnpm dlx shadcn@latest init --yes` from `apps/web`; the current
  CLI still prompted for choices and wrote no files.
- Retried with explicit `--template next --base radix --no-monorepo`; the CLI
  still prompted for a preset.
- Retried with explicit `--preset nova`; the CLI could not detect this minimal
  Next app and pointed to manual configuration.
- Added `apps/web/components.json` matching the official shadcn config contract:
  CSS `src/globals.css`, Tailwind `tailwind.config.ts`, aliases
  `@/components`, `@/components/ui`, and `@/lib/utils`, RSC/TSX enabled, Lucide
  icons.
- No `apps/web/src/components/ui/*` primitive files were added.
- No React screen or business/workflow authority changed.

Verification:
- Passed: `node -e "JSON.parse(require('fs').readFileSync('apps/web/components.json','utf8')); console.log('components.json valid')"`
- Passed: `corepack pnpm test:e2e -- ui-smoke` (2 route previews).
- Passed: `corepack pnpm test:e2e -- accessibility` (17 route previews).
- Passed: `corepack pnpm lint`.
- Passed: `corepack pnpm typecheck`.

## P9-03B - Add Action/Form Shadcn Primitives

Date: 2026-06-20
Risk: Medium
Status: Passed
Requirements: UI-DESIGN-001 AC1, UI-DESIGN-001 AC2

Evidence:
- Ran `corepack pnpm dlx shadcn@latest add button input label textarea select badge --yes`.
- The CLI needed a `pnpm` executable, so a temporary PATH shim forwarded `pnpm`
  to `corepack pnpm`; no project source was added for that shim.
- Added generated shadcn primitives under `apps/web/src/components/ui`:
  `button.tsx`, `input.tsx`, `label.tsx`, `textarea.tsx`, `select.tsx`, and
  `badge.tsx`.
- Added `@radix-ui/react-label` and `@radix-ui/react-select` to
  `apps/web/package.json` and `pnpm-lock.yaml`.
- Added `@/* -> ./src/*` to `apps/web/tsconfig.json` so generated imports
  resolve to the existing app source tree.
- No React screen or business/workflow authority changed.

Verification:
- Passed: `corepack pnpm test:e2e -- ui-smoke` (2 route previews).
- Passed: `corepack pnpm test:e2e -- accessibility` (17 route previews).
- Passed: `corepack pnpm lint`.
- Passed: `corepack pnpm typecheck`.

## P9-03C - Add Layout/Feedback Shadcn Primitives

Date: 2026-06-20
Risk: Medium
Status: Passed
Requirements: UI-DESIGN-001 AC1, UI-DESIGN-001 AC2

Evidence:
- Ran `corepack pnpm dlx shadcn@latest add card table dialog tabs skeleton sonner --yes`
  with the temporary `pnpm` PATH shim used in P9-03B.
- Added generated shadcn primitives under `apps/web/src/components/ui`:
  `card.tsx`, `table.tsx`, `dialog.tsx`, `tabs.tsx`, `skeleton.tsx`, and
  `sonner.tsx`.
- Added `@radix-ui/react-dialog`, `@radix-ui/react-tabs`, `next-themes`, and
  `sonner` to `apps/web/package.json` and `pnpm-lock.yaml`.
- Repaired the generated `sonner.tsx` theme prop so strict
  `exactOptionalPropertyTypes` typecheck gets a concrete theme value.
- No React screen or business/workflow authority changed.

Verification:
- Failed then repaired: `corepack pnpm typecheck` initially failed on generated
  `sonner.tsx` because `theme` could be `undefined`.
- Passed after repair: `corepack pnpm test:e2e -- ui-smoke` (2 route previews).
- Passed after repair: `corepack pnpm test:e2e -- accessibility` (17 route previews).
- Passed after repair: `corepack pnpm lint`.
- Passed after repair: `corepack pnpm typecheck`.

## P9-03D - Align Tailwind And CSS Tokens For Shadcn

Date: 2026-06-20
Risk: Medium
Status: Passed
Requirements: UI-DESIGN-001 AC1, UI-DESIGN-001 AC2

Evidence:
- Added Tailwind color aliases used by generated shadcn primitives:
  `background`, `foreground`, `card`, `popover`, `primary`, `secondary`,
  `muted`, `accent`, `destructive`, `border`, `input`, and `ring`.
- Added matching CSS variables in `apps/web/src/globals.css`, mapping primary,
  destructive, neutral, and focus behavior to the existing semantic token set.
- Preserved existing `brand`, `neutral`, `status`, `state`, radius, shadow, and
  focus token names for current screens.
- No React screen or business/workflow authority changed.

Verification:
- Passed: `corepack pnpm test:web -- localization` (11/11).
- Passed: `corepack pnpm test:e2e -- ui-smoke` (2 route previews).
- Passed: `corepack pnpm test:e2e -- accessibility` (17 route previews).
- Passed: `corepack pnpm lint`.
- Passed: `corepack pnpm typecheck`.

## P9-03E - Add Frontend A11y And Tailwind Proof Tooling

Date: 2026-06-20
Risk: Medium
Status: Passed
Requirements: UI-DESIGN-001 AC1, UI-DESIGN-001 AC2

Evidence:
- Added root dev dependencies `eslint-plugin-jsx-a11y`,
  `prettier-plugin-tailwindcss`, and `@axe-core/playwright`.
- Added a minimal frontend proof tooling resolver gate to `tools/lint.mjs`, so
  `corepack pnpm lint` fails if any required package is missing.
- No broad ESLint or Prettier config was added.
- No React screen or business/workflow authority changed.

Verification:
- Passed: `corepack pnpm test:e2e -- ui-smoke` (2 route previews).
- Passed: `corepack pnpm test:e2e -- accessibility` (17 route previews).
- Passed: `corepack pnpm lint`.
- Passed: `corepack pnpm test` (48/48 tool tests; coverage gate passed).
- Passed: `corepack pnpm typecheck`.

## P9-03F - Add Screenshot And Vision Review Workflow Scaffold

Date: 2026-06-20
Risk: Medium
Status: Passed
Requirements: UI-DESIGN-001 AC1, UI-DESIGN-001 AC2

Evidence:
- Added `corepack pnpm web:visual-review`, backed by `tools/web-visual-review.mjs`.
- The review CLI reuses the existing visual proof cases and writes ignored HTML
  review artifacts under `coverage/web-visual-review`, including `index.html`
  and 16 EN/AR surface artifacts.
- The CLI prints artifact paths for reviewer inspection before golden-screen
  approval.
- No React screen or business/workflow authority changed.
- P9-03A..P9-03F are now complete; AUTO PHASE stops at P9-04 because it is a
  planning task requiring PLANNER.

Verification:
- Passed: `corepack pnpm web:visual-review` (16 artifacts written).
- Passed: `corepack pnpm test:visual` (16 route previews).
- Passed: `corepack pnpm test:e2e -- accessibility` (17 route previews).
- Passed: `corepack pnpm lint`.
- Passed: `corepack pnpm typecheck`.

## P9-01D - Admin Arabic I18n

Date: 2026-06-20
Risk: Medium
Status: Passed
Requirements: REQ-LOCALIZATION-001 AC1, REQ-LOCALIZATION-001 AC2, UI-DESIGN-001 AC3, UI-DESIGN-001 AC4

Evidence:
- Repaired CP1252 mojibake in `apps/web/src/i18n/staff-admin-branches.ts`.
- Confirmed `apps/web/src/i18n/staff-admin-categories-sla.ts`,
  `apps/web/src/i18n/staff-admin-users.ts`, and
  `apps/web/src/i18n/staff-admin-notification-templates.ts` already contain real
  Arabic Unicode code points and no U+00C3, U+00C2, U+00D8, U+00D9, or U+FFFD
  markers.
- Extended `apps/web/test/localization/staff-shell-localization.test.ts` to cover
  branch/department, category/SLA, users/roles, and notification template admin
  Arabic text bundles.
- Verified admin surfaces render Arabic RTL and English LTR through the existing
  staff shell.
- No RBAC/admin authority moved into React.

Verification:
- Passed: `corepack pnpm test:web -- localization`.
- Passed: `corepack pnpm test:e2e -- ui-smoke`.
- Passed: `corepack pnpm test:e2e -- accessibility`.
- Passed: `corepack pnpm lint`.
- Passed: `corepack pnpm typecheck`.

## P9-01C - Complaint And Attachment Arabic I18n

Date: 2026-06-20
Risk: Medium
Status: Passed
Requirements: REQ-LOCALIZATION-001 AC1, REQ-LOCALIZATION-001 AC2, UI-DESIGN-001 AC3, UI-DESIGN-001 AC4

Evidence:
- Repaired CP1252 mojibake in
  `apps/web/src/i18n/staff-complaint-create.ts` and
  `apps/web/src/i18n/staff-complaint-detail.ts`.
- Confirmed `apps/web/src/i18n/staff-confirmations.ts` and
  `apps/web/src/i18n/staff-attachments.ts` already contain real Arabic Unicode
  code points and no U+00C3, U+00C2, U+00D8, U+00D9, or U+FFFD markers.
- Extended `apps/web/test/localization/staff-shell-localization.test.ts` to cover
  complaint create, complaint detail, confirmation, and attachment Arabic text.
- Verified the staff shell renders complaint and attachment surfaces in Arabic
  RTL and English LTR.
- Confirmation copy remains explicit for close/reject workflow actions.
- No business or workflow authority moved into React.

Verification:
- Passed: `corepack pnpm test:web -- localization`.
- Passed: `corepack pnpm test:e2e -- ui-smoke`.
- Passed: `corepack pnpm test:e2e -- accessibility`.
- Passed: `corepack pnpm lint`.
- Passed: `corepack pnpm typecheck`.

## P9-01B - Portal Arabic I18n

Date: 2026-06-20
Risk: Medium
Status: Passed
Requirements: REQ-LOCALIZATION-001 AC1, REQ-LOCALIZATION-001 AC2, UI-DESIGN-001 AC3, UI-DESIGN-001 AC4

Evidence:
- Confirmed `apps/web/src/i18n/portal-submission.ts`,
  `apps/web/src/i18n/portal-tracking.ts`, and
  `apps/web/src/i18n/portal-survey.ts` already contain real Arabic Unicode code
  points and no U+00C3, U+00C2, U+00D8, U+00D9, or U+FFFD mojibake markers.
- Extended `apps/web/test/localization/staff-shell-localization.test.ts` to cover
  portal submission, tracking, and survey Arabic strings plus English
  language-switch targets.
- Verified portal submission, tracking, and survey render Arabic RTL and English
  LTR.
- Verified portal tracking copy still requires verification before showing
  complaint status.
- No business or workflow authority moved into React.

Verification:
- Passed: `corepack pnpm test:web -- localization`.
- Passed: `corepack pnpm test:e2e -- accessibility`.
- Passed: `corepack pnpm lint`.
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

## F8-02 - Drive SLA Jobs From Worker

Date: 2026-06-20
Risk: High
Status: Passed
Requirements: SLA-CALENDAR-001, NFR-OBS-001, ARCH-STACK-001

Evidence:
- Updated `apps/api/src/worker/index.ts` so the `sla` queue dispatches
  `sla.warning` to `SlaService.runWarningJob(new Date())` and `sla.breach` to
  `SlaService.runBreachJob(new Date())`.
- Added BullMQ repeatable schedulers for both SLA job names with
  `SLA_JOB_INTERVAL_MS` defaulting to 60000 ms.
- Kept `notifications` and `attachments-scan` queues as noops for F8-03/F8-04.
- Updated `tools/job-runtime-check.mjs` so `runWarningJob` and `runBreachJob`
  were removed from `knownUndrivenJobs`; ratchet is now 4.
- Added `apps/api/test/worker/sla-runner.test.ts` covering warning dispatch,
  breach dispatch, noop behavior for non-SLA queues, and interval scheduling.

Verification:
- Passed: `node --import tsx --test apps/api/test/worker/sla-runner.test.ts`
  (4/4).
- Passed: `corepack pnpm typecheck`.
- Passed: `corepack pnpm lint`.
- Passed: `corepack pnpm test` (46/46 tool tests; coverage gate passed).
- Passed: `docker compose up -d --build redis worker`.
- Passed: worker logs showed repeatable jobs firing:
  `sla job received name=sla.warning id=repeat:sla.warning:...` and
  `sla job received name=sla.breach id=repeat:sla.breach:...`.
- Passed: Docker proof created `CMP-F8-02-1781935059473`, then enqueued
  `f8-02-warning-1781935059473` and `f8-02-breach-1781935059473`.
- Passed: proof query found:
  warning `sla:warning:f8-02-deadline-1781935059473`,
  breach `sla:breach:f8-02-deadline-1781935059473`, and notification
  `cmqly4joz0007rwteiazp0fbk`.
- Passed: worker logs showed the proof jobs creating exactly one new warning and
  one new breach for that deadline key.

Security self-check:
- Roles and branch scope: no client/RBAC surface was added; worker uses backend
  `SlaService` only and imports no private repository/DTO/Prisma API.
- State changes and audit: this task invokes the existing SLA service methods;
  warning/breach idempotency and escalation notification behavior remain owned
  by `SlaService`/`SlaRepository`. No duplicate state-change logic was added.
- Secrets: worker logs queue/job/result ids only; no `REDIS_URL`, provider
  credentials, passwords, OTPs, tokens, hashes, or payload secrets are logged.
- Portal exposure: no portal route or public response shape changed.
- Trust boundary proof: unit test proves only explicit SLA job names call SLA
  methods, non-SLA queues stay noop, and invalid scheduler intervals fail.

## F8-03 - Drive Notification Dispatch From Worker

Date: 2026-06-20
Risk: High
Status: Passed
Requirements: ARCH-STACK-001, NFR-OBS-001

Evidence:
- Updated `apps/api/src/worker/index.ts` so the `notifications` queue dispatches
  `notifications.email`, `notifications.sms`, and `notifications.whatsapp`
  through `NotificationsService.dispatchQueuedEmail`,
  `NotificationsService.dispatchQueuedSms`, and
  `NotificationsService.dispatchQueuedWhatsApp`.
- Added BullMQ repeatable schedulers for the three notification job names with
  `NOTIFICATION_JOB_INTERVAL_MS` defaulting to 60000 ms.
- Kept provider delivery, quiet-hours, channel preference, retry-safe status
  writes, and delivery attempt logging inside the existing notifications module.
- Updated `tools/job-runtime-check.mjs` so the three notification dispatch
  methods were removed from `knownUndrivenJobs`; ratchet is now 1.
- Added `apps/api/test/worker/notification-runner.test.ts` covering email, SMS,
  WhatsApp, interval scheduling, and invalid interval handling with fake service
  dependencies.

Verification:
- Passed: `node --import tsx --test apps/api/test/worker/notification-runner.test.ts`
  (3/3).
- Passed: `corepack pnpm typecheck`.
- Passed: `corepack pnpm lint`.
- Passed: `corepack pnpm test` (46/46 tool tests; coverage gate passed).
- Passed: `docker compose up -d --build redis worker`.
- Environment repair for Docker proof: the local compose Postgres volume was
  missing existing Phase 5 notification migrations. `prisma migrate deploy`
  failed with an opaque schema-engine error, so the existing migration SQL files
  were applied through `psql` before proof. No source migration was changed.
- Passed: Docker proof created `CMP-F8-03-1781935914331`, queued one email, one
  SMS, and one WhatsApp notification, then enqueued
  `f8-03-email-1781935914331`, `f8-03-sms-1781935914331`, and
  `f8-03-whatsapp-1781935914331`.
- Passed: proof query found email `cmqlymv9b0007ab3a29vg17sc` as `SENT` with
  provider `in-memory`, SMS `cmqlymv9g0009ab3avp6dt5ot` as `FAILED` with
  `NOTIFICATION_QUIET_HOURS_SKIPPED`, and WhatsApp
  `cmqlymv9g000aab3awmz85lm6` as `SENT` with provider `in-memory`.
- Passed: delivery attempt rows matched those outcomes, including the quiet-hour
  SMS failure reason.
- Passed: worker logs showed the proof jobs returning
  `{"attempted":1,"sent":1,"failed":0,"skipped":0}` for email,
  `{"attempted":1,"sent":0,"failed":1,"skipped":0}` for SMS, and
  `{"attempted":1,"sent":1,"failed":0,"skipped":0}` for WhatsApp.

Security self-check:
- Roles and branch scope: no client/RBAC surface was added; worker uses backend
  `NotificationsService` only and imports no notification repository, DTO, or
  Prisma model API.
- State changes and audit: delivery status transitions and delivery attempt
  records remain inside the notifications repository/service transaction path;
  the worker only selects the public dispatch entrypoint by explicit job name.
- Secrets: worker logs queue/job/result counts only; no `REDIS_URL`, provider
  credentials, passwords, OTPs, tokens, hashes, or payload secrets are logged.
- Portal exposure: no portal route or public response shape changed.
- Trust boundary proof: unit test proves each explicit notification job name
  calls only the matching public service method, and Docker proof proves quiet
  hours are enforced by the existing notification rules rather than worker logic.

## F8-04 - Drive Attachment Scan From Worker

Date: 2026-06-20
Risk: High
Status: Passed
Requirements: ARCH-FILES-001, REQ-FILES-001, METHOD-AUDIT-001, ARCH-STACK-001, NFR-OBS-001

Evidence:
- Updated `apps/api/src/worker/index.ts` so the `attachments-scan` queue handles
  explicit `attachments.scan` jobs and calls only
  `AttachmentsService.transitionScanStatus`.
- Added scan payload validation for attachment id, target status, and
  correlation id. Invalid scan payloads fail loudly before the service is called.
- Kept download authorization, scan-state availability checks, and audit writes
  inside the existing attachment service/controller path.
- Sanitized attachment scan worker logging to `{ attachmentId, scanStatus }` so
  storage keys and filenames are not logged.
- Tightened worker routing so unknown job names remain noops without resolving
  queue-specific services.
- Updated `tools/job-runtime-check.mjs` so `transitionScanStatus` was removed
  from `knownUndrivenJobs`; ratchet is now empty.
- Added `apps/api/test/worker/attachment-scan-runner.test.ts` covering CLEAN,
  REJECTED, invalid payload handling, sanitized logging, and noop routing.
- Added a thin root `tsconfig.json` and shared decorator compiler settings in
  `tsconfig.base.json` so the direct `node --import tsx` worker proof command
  can load Nest-decorated API source files.

Verification:
- Failed then repaired: the first direct worker test run failed because `tsx`
  could not load Nest parameter decorators without a root `tsconfig.json`.
- Passed: `node --import tsx --test apps/api/test/worker/attachment-scan-runner.test.ts`
  (4/4).
- Passed: existing direct worker regression tests:
  `node --import tsx --test apps/api/test/worker/sla-runner.test.ts apps/api/test/worker/notification-runner.test.ts apps/api/test/worker/queue.test.ts`
  (11/11).
- Passed: `corepack pnpm typecheck`.
- Passed: `corepack pnpm lint`.
- Passed: `corepack pnpm test` (46/46 tool tests; coverage gate passed).
- Failed then repaired: `docker compose up -d --build api redis worker` timed
  out client-side before recreating API/worker. Repaired with
  `docker compose build api` and
  `docker compose up -d --force-recreate api worker redis`.
- Failed then repaired: the first Docker proof script asserted the old flat error
  shape; the API correctly returned HTTP 409 with nested
  `error.code=ATTACHMENT_SCAN_UNAVAILABLE`.
- Passed: Docker proof created `CMP-F8-04-1781936722607`, logged in through the
  real API, uploaded attachment `cmqlz473o000hl2jigav3b4ed` through
  `POST /complaints/:id/attachments`, and confirmed the initial
  `GET /download` returned HTTP 409 `ATTACHMENT_SCAN_UNAVAILABLE`.
- Passed: Docker proof enqueued `f8-04-scan-1781936722607`; the worker processed
  `attachments.scan` and returned
  `{"attachmentId":"cmqlz473o000hl2jigav3b4ed","scanStatus":"CLEAN"}`.
- Passed: proof query found the attachment as `CLEAN` and an
  `attachment_scan_clean` audit row with correlation id
  `f8-04-corr-1781936722607`.
- Passed: the same authorized `GET /download` route returned HTTP 200 and a
  short-lived download token after the scan completed.

Security self-check:
- Roles and branch scope: the Docker proof used real login/session cookies and
  the existing staff attachment routes. The worker did not accept role or branch
  authority from the client; branch id was audit context for the system scan job.
- State changes and audit: scan status transition and `attachment_scan_clean`
  audit write remain in `AttachmentsService.transitionScanStatus` in the same
  transaction. The worker contains no repository or Prisma write logic.
- Secrets: proof credentials, cookies, CSRF values, and download token values
  were not logged. Worker logs attachment id and scan status only.
- Portal exposure: no portal download route or portal response shape changed.
- Trust boundary proof: Docker proof verified pending attachments are blocked by
  the existing download path until the worker invokes the public scan transition
  service and the attachment becomes `CLEAN`.

## F8-05 - Add Durable S3-Compatible Attachment Storage

Date: 2026-06-20
Risk: High
Status: Blocked
Requirements: ARCH-FILES-001, REQ-FILES-001, NFR-DATA-001, NFR-OBS-001

Evidence:
- Added `@aws-sdk/client-s3` and `@aws-sdk/s3-request-presigner` to
  `apps/api/package.json`; updated `pnpm-lock.yaml`.
- Added `S3AttachmentStorage` behind the existing `AttachmentStoragePort` in
  `apps/api/src/modules/attachments/attachment-storage.port.ts`.
- Added environment-driven adapter selection:
  `ATTACHMENT_STORAGE_DRIVER=memory|s3`; development/test without S3 config uses
  the in-memory double, while production defaults to S3 and incomplete S3 config
  fails loudly.
- Updated `apps/api/src/modules/attachments/attachments.module.ts` to provide
  storage through `attachmentStorageFromEnv()` without changing controller or
  service call sites.
- Added a local MinIO service and S3 attachment environment knobs to
  `docker-compose.yml` for executed proof.
- Added `apps/api/test/attachments/storage-adapter.test.ts` covering memory
  fallback, production S3 config validation, S3 put, signed URL generation, TTL,
  and secret-safe validation errors.

Verification:
- Passed: `node --import tsx --test apps/api/test/attachments/storage-adapter.test.ts`
  (4/4).
- Passed: `corepack pnpm exec tsc -p apps/api/tsconfig.json --noEmit`.
- Passed: `corepack pnpm typecheck`.
- Passed: `corepack pnpm lint`.
- Passed: `corepack pnpm test` (46/46 tool tests; coverage gate passed).
- Passed: `git diff --check`.
- Failed / Blocked: attempted
  `docker compose up -d --build minio api redis worker` with S3 attachment
  environment. Build reached image export and MinIO pull, then Docker Desktop
  failed with `failed to create temp dir ... input/output error`.
- Failed / Blocked: follow-up Docker checks (`docker system df`,
  `docker compose ps`, `docker version`) returned
  `Docker Desktop is unable to start`. The `desktop-linux` daemon is unavailable,
  so the required executed Docker S3 proof cannot run in this session.

Security self-check:
- Roles and branch scope: API upload/download call sites remain unchanged and
  still use existing session/RBAC/branch-scope guards.
- State changes and audit: attachment metadata persistence, scan-state checks,
  and audit writes remain in the existing service/repository paths; the storage
  adapter only stores object bytes and issues signed URLs.
- Secrets: adapter validation errors name missing/invalid config keys but do not
  echo access key or secret values. No cookies, CSRF values, signed URLs,
  provider secrets, or object bytes were logged to evidence.
- Portal exposure: no portal download route or portal response shape changed.
- Trust boundary status: unit proof covers the S3 adapter surface, but the
  mandatory Docker proof is not complete because Docker Desktop is unavailable.

## REPAIR-F8-05-DOCKER-RUNTIME - Restore Docker And Finish S3 Proof

Date: 2026-06-20
Risk: High
Status: Passed
Requirements: ARCH-FILES-001, REQ-FILES-001, NFR-DATA-001, NFR-OBS-001

Evidence:
- Restored Docker Desktop by freeing disposable user/package caches on `C:` and
  restarting Docker Desktop/WSL. No Docker volumes were deleted.
- Confirmed the Docker daemon recovered on `desktop-linux`.
- Re-ran the required S3-backed compose stack with MinIO, API, Redis, worker, and
  the S3 attachment environment from `docker-compose.yml`.
- Docker proof created/used bucket `cms-auto-attachments`, created a throwaway
  local proof staff user because this Docker database had empty seed password
  hashes, logged in through `POST /auth/login`, uploaded an allowed PDF
  attachment through the staff API, confirmed pending download returned 409,
  enqueued `attachments.scan`, and verified the authorized download token points
  at `minio:9000` for the S3 bucket without logging the token.
- Proof id: `f8-05-1781939981667`; complaint: `CMP-SEED-001`; attachment:
  `cmqm121ww0009fvw1a332jyq6`.
- Worker log showed `attachments.scan` returning `{"attachmentId":"cmqm121ww0009fvw1a332jyq6","scanStatus":"CLEAN"}`.
- DB proof found the attachment as `CLEAN` with `content_type=application/pdf`.
- DB proof found audit rows for `attachment_uploaded`, `attachment_scan_clean`,
  and `attachment_download_prepared` with correlation id
  `f8-05-1781939981667`.

Verification:
- Passed: `docker version`.
- Passed: `docker system df`.
- Passed: `docker compose ps`.
- Passed: `docker compose up -d --build minio api redis worker` with S3
  attachment environment variables.
- Passed: inline Docker proof script run inside the API container for bucket
  create/use, API login, API upload, pending-download denial, worker scan mark,
  S3 object listing, and signed URL backend verification.

Security self-check:
- Roles and branch scope: proof logged in through the real staff API and used
  existing session/RBAC/branch-scope guards for upload and download. The direct
  DB write was limited to creating a local throwaway proof staff user because the
  local Docker seed users had empty password hashes.
- State changes and audit: upload metadata, scan transition, and download audit
  rows were written by the existing attachment service/repository paths. Worker
  only invoked `AttachmentsService.transitionScanStatus`.
- Secrets: proof password, cookies, CSRF value, S3 credentials, signed URL, and
  download token were not written to evidence. Output recorded only proof IDs,
  status, token host, and bucket match.
- Portal exposure: no portal route or response shape changed; proof used staff
  routes only.
- Trust boundary proof: pending attachment download returned 409 before scan;
  after the worker marked the attachment `CLEAN`, the same authorized staff route
  returned a short-lived S3-backed download token.

## F8-06 - End-to-End Smoke Proof

Date: 2026-06-20
Risk: High
Status: Passed
Requirements: ARCH-STACK-001, ARCH-FILES-001, REQ-FILES-001, NFR-OBS-001

Evidence:
- Added `tools/runtime-smoke.mjs`, which starts/reuses the Docker stack with
  MinIO, API, Redis, worker, and Postgres using S3 attachment storage.
- Added `tools/e2e-runner.mjs` and wired `corepack pnpm test:e2e` so the default
  E2E gate runs the existing web UI smoke plus the Docker runtime smoke.
- Preserved existing web E2E modes: `test:e2e -- accessibility` still routes to
  the web accessibility proof.
- Runtime smoke creates deterministic proof data inside the API container,
  including a throwaway proof staff user, SLA policy/deadline, queued
  notifications, and an S3 bucket if needed.
- Runtime smoke logs in through the real API, uploads an allowed attachment,
  verifies pending download is denied, enqueues `attachments.scan`, waits for
  `CLEAN`, and confirms the signed URL host is `minio:9000` without printing the
  signed URL.
- Runtime smoke enqueues SLA warning/breach jobs and verifies warning, breach,
  and escalation notification records exist.
- Runtime smoke enqueues email/SMS/WhatsApp dispatch jobs and verifies expected
  outcomes: email `SENT`, SMS `FAILED` by quiet-hours rules, WhatsApp `SENT`.
- Final default E2E proof id: `f8-06-1781940941106`; complaint:
  `CMP-F8-06-1781940941106`; attachment: `cmqm1mm6q00074puf0et37llf`.

Verification:
- Failed then repaired: `corepack pnpm test:e2e -- runtime-smoke` initially timed
  out on a Windows shell-based readiness probe, then failed on BullMQ job ids
  containing `:`. Repaired with a direct `curl` health check and hyphenated job
  ids.
- Failed then repaired: `corepack pnpm lint` caught
  `tools/runtime-smoke.mjs` at 301 lines. Repaired by compacting the embedded
  import block; final file is 290 lines.
- Passed: `corepack pnpm test:e2e -- runtime-smoke`
  (`f8-06-1781940861695`).
- Passed: `corepack pnpm test:e2e` (`web ui-smoke` plus runtime proof
  `f8-06-1781940941106`).
- Passed: `corepack pnpm test:e2e -- accessibility` (17 route previews).
- Passed: `corepack pnpm lint`.
- Passed: `corepack pnpm typecheck`.
- Passed: `corepack pnpm test` (46/46 tool tests; coverage gate passed).

Security self-check:
- Roles and branch scope: attachment proof logs in through the real staff API and
  uses existing session/RBAC/branch-scope guards. Direct DB writes are limited to
  deterministic local proof setup inside the Docker database.
- State changes and audit: SLA warning/breach, notification dispatch,
  attachment upload, scan transition, and download preparation are executed by
  existing services/workers. The smoke script does not add business writes
  outside setup data.
- Secrets: proof password, cookies, CSRF value, S3 credentials, signed URL, and
  download token are not printed. Output records proof IDs, statuses, and token
  host only.
- Portal exposure: no portal route or public response shape changed.
- Trust boundary proof: pending attachment download is denied before scan; after
  worker scan marks the attachment `CLEAN`, the same authorized staff route
  returns an S3-backed short-lived token.

## F8-07 - Remove Default-Parameter DI Fallbacks

Date: 2026-06-20
Risk: High
Status: Passed
Requirements: ARCH-STACK-001, NFR-OBS-001

Evidence:
- Removed production constructor default fallbacks from
  `AttachmentsRepository`, `AttachmentsService`, and `IntegrationsService`.
- `AttachmentsRepository` now requires a real `PrismaService` provider instead
  of `{} as PrismaService`.
- `AttachmentsService` now requires explicit `AuditService` and
  `ATTACHMENT_STORAGE` providers instead of constructing an audit fallback or
  in-memory storage fallback.
- `IntegrationsService` now requires explicit email, SMS, and WhatsApp provider
  tokens instead of constructing in-memory provider fallbacks.
- Updated construction smoke specs and affected attachment/integration tests to
  pass explicit test doubles or in-memory test adapters.
- Phase 8 backlog is complete; `.forge/next.md` is now the mandatory
  `PHASE-8-REVIEW` task and `.forge/state.md` is `Needs Phase Review`.

Verification:
- Passed with caveat: `rg -n "= \\{\\} as|= new InMemory|= new .*Provider|= new .*Service" apps packages`.
  The broad command still reports existing explicit test fixture construction
  under `apps/api/test`; no production source match remains.
- Passed: `rg -n "= \\{\\} as|= new InMemory|= new .*Provider|= new .*Service" apps/api/src packages`
  returned no matches.
- Passed: `corepack pnpm lint`.
- Passed: `corepack pnpm typecheck`.
- Passed: `corepack pnpm test` (46/46 tool tests; coverage gate passed).
- Passed: `corepack pnpm test:e2e -- runtime-smoke` with proof id
  `f8-06-1781941348125`; attachment `cmqm1vc9x00076m1ic61w3epq` reached
  `CLEAN`, pending download was blocked, token host was `minio:9000`, SLA
  warning/breach/escalation proof passed, and notification outcomes were email
  `SENT`, SMS `FAILED`, WhatsApp `SENT`.

Security self-check:
- Roles and branch scope: no RBAC or branch-scope logic changed. Runtime smoke
  booted the API/worker and used real staff API upload/download guards.
- State changes and audit: no state-transition or audit-write logic changed.
  Runtime smoke still exercised attachment upload, scan, download preparation,
  SLA jobs, and notification dispatch through existing services.
- Secrets: no proof password, cookies, CSRF value, S3 credentials, signed URL, or
  download token were written to evidence.
- Provider wiring: missing production DI providers now fail loudly at Nest
  construction instead of falling back to silent default objects/providers.
  Runtime smoke proves current module wiring supplies the required providers.

## P9-01A - Staff Shell Arabic And Root Direction

Date: 2026-06-20
Risk: Medium
Status: Passed
Requirements: REQ-LOCALIZATION-001 AC1, REQ-LOCALIZATION-001 AC2, UI-DESIGN-001 AC3, UI-DESIGN-001 AC4

Evidence:
- Confirmed `apps/web/src/i18n/staff-shell.ts` already contains real Arabic
  Unicode code points and no U+00C3, U+00C2, U+00D8, U+00D9, or U+FFFD mojibake
  markers.
- Added `apps/web/test/localization/staff-shell-localization.test.ts` to lock the
  staff shell Arabic strings, English language-switch target, Arabic RTL render,
  English LTR render, and root locale bridge behavior.
- Added `localization` to `tools/web-test.mjs`.
- Updated `apps/web/src/app/layout.tsx` to set root `<html lang dir>` from the
  resolved locale.
- Added `apps/web/src/middleware.ts` to bridge the URL `locale` query parameter
  into the root layout through `x-cms-locale`.
- No business or workflow authority moved into React.

Verification:
- Passed: `corepack pnpm test:web -- localization`.
- Passed: `corepack pnpm test:e2e -- ui-smoke`.
- Passed: `corepack pnpm test:e2e -- accessibility`.
- Passed: `corepack pnpm lint`.
- Passed: `corepack pnpm typecheck`.

## Phase 9 Active Evidence Index

Date: 2026-06-20
Status: Passed through P9-02

- P9-01A: Passed `corepack pnpm test:web -- localization`,
  `corepack pnpm test:e2e -- ui-smoke`,
  `corepack pnpm test:e2e -- accessibility`, `corepack pnpm lint`, and
  `corepack pnpm typecheck`.
- P9-01B: Passed `corepack pnpm test:web -- localization`,
  `corepack pnpm test:e2e -- accessibility`, `corepack pnpm lint`, and
  `corepack pnpm typecheck`.
- P9-01C: Passed `corepack pnpm test:web -- localization`,
  `corepack pnpm test:e2e -- ui-smoke`,
  `corepack pnpm test:e2e -- accessibility`, `corepack pnpm lint`, and
  `corepack pnpm typecheck`.
- P9-01D: Passed `corepack pnpm test:web -- localization`,
  `corepack pnpm test:e2e -- ui-smoke`,
  `corepack pnpm test:e2e -- accessibility`, `corepack pnpm lint`, and
  `corepack pnpm typecheck`.
- P9-01E: Passed `corepack pnpm test:web -- localization`,
  `corepack pnpm test:e2e -- ui-smoke`,
  `corepack pnpm test:e2e -- accessibility`, `corepack pnpm lint`, and
  `corepack pnpm typecheck`.
- P9-02: Passed `corepack pnpm test:web -- localization`,
  `corepack pnpm lint`, `corepack pnpm test` (48/48 tool tests; coverage gate
  passed), and `corepack pnpm typecheck`.
- AUTO PHASE stopped at `PLAN-P9-03` because shadcn adoption must be split before
  build work.

## P9-04A Repair — Golden screen: real route + components/ + colored badges

- Date: 2026-06-20
- Risk: Medium
- Status: Built
- SRS IDs: UI-DESIGN-001, ARCH-UI-001

### Changes

1. `src/i18n/staff-shell.ts` — added `unassigned` key (EN/AR) to workQueue; no existing keys changed.
2. `src/components/work-queue/index.tsx` (NEW) — clean WorkQueue without QueuePreviewState;
   `rows: ComplaintQueueItem[] | null` drives empty/error; colored Badges via design tokens
   (severity: HIGH=status-error, CRITICAL=destructive, MEDIUM=status-warning; status:
   IN_PROGRESS=brand, SUBMITTED=status-info, RESOLVED=status-success, etc.); row hover; branded action link.
3. `src/app/(staff)/layout.tsx` (NEW) — App Router staff route-group layout; locale from
   `x-cms-locale` header; session principal for role-nav; two-column shell (sidebar + children).
4. `src/app/(staff)/complaints/page.tsx` (NEW) — real Server Component route; locale from
   searchParams; calls `getStaffQueueItems`; renders WorkQueue. No preview-state props.
5. `test/shell/shell.test.ts` — added ComplaintsPage import + 7 new tests.

### Verification

- `typecheck`: **Passed** — `npx tsc -p apps/web/tsconfig.json --noEmit` clean (0 errors).
- `lint`: **Passed** — `node tools/lint.mjs` → "Lint passed".
- `test:web`: **Passed** — 124/124 tests (7 new all green; all 117 existing still pass).
- Localization: **Passed** — 11/11 localization tests pass.
- `test:e2e`, `test:visual`, screenshot review: **Not Run** (require live stack).

## P9-04B — Golden Screen Review (Accept)

- Date: 2026-06-20
- Risk: Medium
- Status: Accepted
- SRS IDs: UI-DESIGN-001, ARCH-UI-001
- Reviewer tier: BUILDER-STRONG (Sonnet 4.6); PHASE-REVIEWER preferred for phase-end gate

### Review Checklist

1. ✅ Route at `app/(staff)/complaints/page.tsx` — real App Router Server Component
2. ✅ Layout at `app/(staff)/layout.tsx` — session principal, role-based nav, RTL/LTR
3. ✅ WorkQueue in `components/work-queue/index.tsx` — NOT in `app/`
4. ✅ QueuePreviewState absent — props: `{ locale: Locale; rows: ComplaintQueueItem[] | null }`
5. ✅ Badge colors from design tokens — `bg-status-error`, `bg-brand`, `bg-status-info`,
   `bg-status-success`, `bg-status-warning`, `bg-destructive`, `bg-muted` — all confirmed
   in `tailwind.config.ts` under `status.*`, `brand`, `destructive`, `muted`
6. ✅ 124/124 tests pass; 0 typecheck errors (per P9-04A Repair evidence)
7. ✅ Pattern safe to replicate — 153/77/30-line files, i18n, null/empty/data three-state

### Non-Blocking Debt

- Badge labels show raw enum values (`IN_PROGRESS`, `HIGH`) — not localized; deferred.
- E2E/visual/screenshot: Not Run (no live stack; consistent with all prior phases).
- Pagination and filters are static placeholders — expected at this stage.

### Decision: ACCEPT — proceed to P9-04C (dashboard)

## P9-04C-1 - Dashboard Screen Golden Pattern Replication

- Date: 2026-06-20
- Risk: Medium
- Status: Passed
- Builder tier: BUILDER-STRONG (user requested)
- SRS IDs: UI-DESIGN-001, UI-SCREEN-001, REQ-LOCALIZATION-001

### Changes

1. `apps/web/src/components/dashboard-summary/index.tsx` (NEW) - render-only
   dashboard summary component using shadcn `Card` and `Skeleton`, real
   `StaffDashboardSummary | null` data, null/error, zero/empty, success, and
   loading helper states.
2. `apps/web/src/app/(staff)/dashboard/page.tsx` (NEW) - real App Router staff
   dashboard route forwarding optional `cookieHeader`/`fetchImpl` to
   `getStaffDashboardSummary`.
3. `apps/web/test/shell/shell.test.ts` - added DashboardPage EN, AR RTL,
   success, empty, error, API-call, and source-safety coverage.

### Verification

- Passed: `corepack pnpm typecheck`.
- Passed: `corepack pnpm lint`.
- Passed: `corepack pnpm test:web -- shell` (130/130 tests).
- Passed: `corepack pnpm test:web -- localization` (11/11 tests).

### Notes

- No backend module changed.
- No role or branch authority added to the component; authority remains in the
  server session/API helper path.
- `src/app/dashboard-summary.tsx` and `src/app/page.tsx` were left unchanged for
  legacy shell compatibility.

## P9-04C-2 - Password Reset Screen Golden Pattern Replication

- Date: 2026-06-20
- Risk: Medium
- Status: Passed
- Builder tier: BUILDER-STRONG
- SRS IDs: UI-DESIGN-001, UI-SCREEN-001, REQ-LOCALIZATION-001

### Changes

1. `apps/web/src/components/password-reset/index.tsx` (NEW) - render-only
   password reset component using shadcn `Card`, `Button`, `Input`, and `Label`,
   preserving safe request/token/success/invalid states and autocomplete behavior.
2. `apps/web/src/app/(staff)/auth/reset/page.tsx` (NEW) - real staff reset route
   resolving locale and reset state.
3. `apps/web/src/app/password-reset-panel.tsx` - legacy compatibility wrapper
   re-exporting the new component/type.
4. `apps/web/test/shell/shell.test.ts` - added PasswordResetPage route coverage
   and moved source safety checks to the new component path.

### Verification

- Passed: `corepack pnpm typecheck`.
- Passed: `corepack pnpm lint`.
- Passed: `corepack pnpm test:web -- shell` (133/133 tests).
- Passed: `corepack pnpm test:web -- localization` (11/11 tests).

### Notes

- No backend auth route or action changed.
- No reset token persistence, browser storage, role authority, or branch authority
  was added to the UI.

## P9-04C-3 - Notification Center Screen Golden Pattern Replication

- Date: 2026-06-20
- Risk: Medium
- Status: Passed
- Builder tier: BUILDER-STRONG
- SRS IDs: UI-DESIGN-001, UI-SCREEN-001, REQ-LOCALIZATION-001

### Changes

1. `apps/web/src/components/notification-center/index.tsx` (NEW) - render-only
   notification center component using shadcn `Card`, `Badge`, and `Button`,
   preserving loading, empty, error, success, validation, and conflict states.
2. `apps/web/src/app/(staff)/notifications/page.tsx` (NEW) - real staff
   notifications route resolving locale and notification state.
3. `apps/web/src/app/notification-center.tsx` - legacy compatibility wrapper
   re-exporting the new component/type.
4. `apps/web/test/shell/shell.test.ts` - added NotificationsPage route coverage
   and moved source safety checks to the new component path.

### Verification

- Passed: `corepack pnpm typecheck`.
- Passed: `corepack pnpm lint`.
- Passed: `corepack pnpm test:web -- shell` (136/136 tests).
- Passed: `corepack pnpm test:web -- localization` (11/11 tests).

### Notes

- No backend notification module, delivery adapter, provider, role authority, or
  branch authority changed.
- P9-04C is complete. AUTO PHASE stopped at `Ready to Plan` because P9-04D must
  be split before build work.

## P9-04D-1 - Customer/Vehicle Lookup Route Extraction

- Date: 2026-06-20
- Risk: Medium
- Status: Passed
- Builder tier: BUILDER-STRONG (user requested)
- SRS IDs: UI-DESIGN-001, UI-SCREEN-001, REQ-LOCALIZATION-001

### Changes

1. `apps/web/src/components/customer-vehicle-lookup/index.tsx` (NEW) - render-only
   lookup component using existing shadcn primitives, i18n strings, RTL/LTR dir,
   source badges, manual fallback, and loading/no-match/error roles.
2. `apps/web/src/app/(staff)/complaints/new/page.tsx` (NEW) - real staff App
   Router route resolving locale and optional lookup preview state.
3. `apps/web/src/app/customer-vehicle-lookup.tsx` - legacy compatibility
   re-export to keep the old shell import working.
4. `apps/web/test/shell/shell.test.ts` - added route coverage and moved source
   safety assertion to the new component path.

### Verification

- Passed: `corepack pnpm typecheck`.
- Passed: `corepack pnpm lint`.
- Passed: `corepack pnpm test:web -- shell` (139/139 tests).
- Passed: `corepack pnpm test:web -- localization` (11/11 tests).
- Passed: `corepack pnpm test:visual` (16 route previews).
- Passed: `corepack pnpm test:e2e -- accessibility` (17 route previews).

### Notes

- No backend lookup route, fake API client, fetch path, browser storage, cookie
  access, provider call, role authority, branch authority, or workflow/state
  authority was added to the component.
- Complaint create and attachment panels were left unchanged for P9-04D-2 and
  P9-04D-3.

## P9-04D-2 - Complaint Create Form Route Extraction

- Date: 2026-06-20
- Risk: Medium
- Status: Passed
- Builder tier: BUILDER-STRONG (user requested)
- SRS IDs: UI-DESIGN-001, UI-SCREEN-001, REQ-LOCALIZATION-001

### Changes

1. `apps/web/src/components/complaint-create-form/index.tsx` (NEW) - extracted
   the staff complaint create UI and request builder into `components/`, using
   existing shadcn primitives and preserving submit/preview states.
2. `apps/web/src/app/complaint-create-form.tsx` - legacy compatibility
   re-export to keep the old shell import and tests working.
3. `apps/web/src/app/(staff)/complaints/new/page.tsx` - now renders lookup plus
   complaint create form and resolves optional `lookup`/`create` preview states.
4. `apps/web/test/shell/shell.test.ts` - added combined route coverage and moved
   complaint create source safety assertions to the new component path.

### Verification

- Passed: `corepack pnpm typecheck`.
- Passed: `corepack pnpm lint`.
- Passed: `corepack pnpm test:web -- shell` (142/142 tests).
- Passed: `corepack pnpm test:web -- localization` (11/11 tests).
- Passed: `corepack pnpm test:visual` (16 route previews).
- Passed: `corepack pnpm test:e2e -- accessibility` (17 route previews).

### Notes

- The request builder still trims form values and excludes role, actor,
  workflow, status, branch-scope, session, token, and credential fields from the
  complaint body.
- Attachment upload was left unchanged for P9-04D-3.

## P9-04D-3 - Attachment Upload Panel Route Extraction

- Date: 2026-06-20
- Risk: Medium
- Status: Passed
- Builder tier: BUILDER-STRONG (user requested)
- SRS IDs: UI-DESIGN-001, UI-SCREEN-001, REQ-LOCALIZATION-001

### Changes

1. `apps/web/src/components/attachment-upload-panel/index.tsx` (NEW) - extracted
   the render-only attachment panel into `components/`, using existing shadcn
   primitives and preserving file rules, scan states, loading, empty, error, and
   reject confirmation UI.
2. `apps/web/src/app/attachment-upload-panel.tsx` - legacy compatibility
   re-export to keep the old shell import working.
3. `apps/web/src/app/(staff)/complaints/new/page.tsx` - now renders lookup,
   complaint create, and attachment upload with optional preview states.
4. `apps/web/test/shell/shell.test.ts` - added intake route attachment coverage
   and moved attachment source safety assertions to the new component path.

### Verification

- Passed: `corepack pnpm typecheck`.
- Passed: `corepack pnpm lint`.
- Passed: `corepack pnpm test:web -- shell` (144/144 tests).
- Passed: `corepack pnpm test:web -- localization` (11/11 tests).
- Passed: `corepack pnpm test:visual` (16 route previews).
- Passed: `corepack pnpm test:e2e -- accessibility` (17 route previews).

### Notes

- No upload transport, backend attachment API, file read, object URL, browser
  storage, cookie access, provider call, role authority, branch authority, or
  workflow/state authority was added.
- P9-04D is complete. AUTO PHASE stopped at `Ready to Plan` because P9-04E is a
  multi-screen workspace group and must be split before build work.

## P9-04E-1 - Complaint Detail Workspace Route Extraction

- Date: 2026-06-20
- Risk: Medium
- Status: Passed
- Builder tier: BUILDER-STRONG (user requested)
- SRS IDs: UI-DESIGN-001, UI-SCREEN-001, REQ-LOCALIZATION-001

### Changes

1. `apps/web/src/components/complaint-detail-workspace/index.tsx` (NEW) -
   extracted the render-only complaint detail workspace into `components/`,
   using existing shadcn primitives for the outer card, badges, buttons, labels,
   and textarea while preserving detail, comments, attachments, workflow, and
   preview states.
2. `apps/web/src/app/(staff)/complaints/[id]/page.tsx` (NEW) - added the real
   staff complaint detail route resolving locale, preview states, and route id,
   then reading detail through `getStaffComplaintDetail`.
3. `apps/web/src/app/complaint-detail-workspace.tsx` - legacy compatibility
   re-export to keep the old shell import working.
4. `apps/web/test/shell/shell.test.ts` - added route coverage and moved detail
   workspace source safety assertions to the new component path.

### Verification

- Passed: `corepack pnpm typecheck`.
- Passed: `corepack pnpm lint`.
- Passed: `corepack pnpm test:web -- shell` (145/145 tests).
- Passed: `corepack pnpm test:web -- localization` (11/11 tests).
- Passed: `corepack pnpm test:visual` (16 route previews).
- Passed: `corepack pnpm test:e2e -- accessibility` (17 route previews).

### Notes

- The route forwards only the complaint route id and server session cookie to
  `getStaffComplaintDetail`; it does not pass role, actor, workflow, branch
  scope, owner, token, credential, or client-selected authority fields.
- No workflow mutation, comment write, attachment upload/download transport,
  backend route, or OpenAPI change was added.

## P9-04E-2 - Comments/Public Updates Panel Extraction

- Date: 2026-06-20
- Risk: Medium
- Status: Passed
- Builder tier: BUILDER-STRONG (user requested)
- SRS IDs: UI-DESIGN-001, UI-SCREEN-001, REQ-LOCALIZATION-001

### Changes

1. `apps/web/src/components/complaint-comments-panel/index.tsx` (NEW) -
   extracted the render-only internal comments/public updates panel using the
   existing shadcn badge primitive and existing complaint detail i18n strings.
2. `apps/web/src/components/complaint-detail-workspace/index.tsx` - now composes
   `ComplaintCommentsPanel` and no longer owns the comments/public updates
   renderer.
3. `apps/web/test/shell/shell.test.ts` - added a focused source safety assertion
   for the extracted comments panel.

### Verification

- Passed: `corepack pnpm typecheck`.
- Passed: `corepack pnpm lint`.
- Passed: `corepack pnpm test:web -- shell` (146/146 tests).
- Passed: `corepack pnpm test:web -- localization` (11/11 tests).
- Passed: `corepack pnpm test:visual` (16 route previews).
- Passed: `corepack pnpm test:e2e -- accessibility` (17 route previews).

### Notes

- No comment write, edit history wiring, backend route, OpenAPI change,
  attachment control, workflow modal, fetch path, browser storage, cookie access,
  provider/storage URL, portal data exposure, or staff PII was added.

## P9-04E-3 - Attachment Status/Download Controls Extraction

- Date: 2026-06-20
- Risk: Medium
- Status: Passed
- Builder tier: BUILDER-STRONG (user requested)
- SRS IDs: UI-DESIGN-001, UI-SCREEN-001, REQ-LOCALIZATION-001

### Changes

1. `apps/web/src/components/complaint-attachment-controls/index.tsx` (NEW) -
   extracted the render-only complaint attachment controls using existing
   shadcn badge and button primitives and existing complaint detail i18n strings.
2. `apps/web/src/components/complaint-detail-workspace/index.tsx` - now composes
   `ComplaintAttachmentControls` and no longer owns attachment control UI.
3. `apps/web/test/shell/shell.test.ts` - moved the attachment source safety
   assertion to the extracted component path.

### Verification

- Passed: `corepack pnpm typecheck`.
- Passed: `corepack pnpm lint`.
- Passed: `corepack pnpm test:web -- shell` (146/146 tests).
- Passed: `corepack pnpm test:web -- localization` (11/11 tests).
- Passed: `corepack pnpm test:visual` (16 route previews).
- Passed: `corepack pnpm test:e2e -- accessibility` (17 route previews).

### Notes

- No upload/download wiring, file read, object URL, backend route, OpenAPI
  change, comment write, workflow modal change, fetch path, browser storage,
  cookie access, provider/storage URL, portal data exposure, or staff PII was
  added.

## P9-04E-4 - Workflow Action Modal Extraction

- Date: 2026-06-20
- Risk: Medium
- Status: Passed
- Builder tier: BUILDER-STRONG (user requested)
- SRS IDs: UI-DESIGN-001, UI-SCREEN-001, REQ-LOCALIZATION-001

### Changes

1. `apps/web/src/components/complaint-workflow-modal/index.tsx` (NEW) -
   extracted the render-only workflow action modal using existing shadcn button,
   label, and textarea primitives plus existing complaint detail and confirmation
   i18n strings.
2. `apps/web/src/components/complaint-detail-workspace/index.tsx` - now composes
   `ComplaintWorkflowModal` and no longer owns workflow modal UI.
3. `apps/web/test/shell/shell.test.ts` - moved workflow authority and conflict
   recovery source assertions to the extracted modal path.

### Verification

- Passed: `corepack pnpm typecheck`.
- Passed: `corepack pnpm lint`.
- Passed: `corepack pnpm test:web -- shell` (146/146 tests).
- Passed: `corepack pnpm test:web -- localization` (11/11 tests).
- Passed: `corepack pnpm test:visual` (16 route previews).
- Passed: `corepack pnpm test:e2e -- accessibility` (17 route previews).

### Notes

- No workflow mutation wiring, transition logic, backend route, OpenAPI change,
  comment write, attachment upload/download wiring, fetch path, browser storage,
  cookie access, provider/storage URL, portal data exposure, or staff PII was
  added.
- P9-04E is complete. AUTO PHASE stopped at `Ready to Plan` because P9-04F is a
  multi-screen admin configuration group and must be split before build work.

## P9-04F-1 - Admin Branches/Departments Route Extraction

- Date: 2026-06-20
- Risk: Medium
- Status: Passed
- Builder tier: BUILDER-STRONG (user requested)
- SRS IDs: REQ-ADMIN-001, UI-DESIGN-001, UI-SCREEN-001, REQ-LOCALIZATION-001

### Changes

1. `apps/web/src/components/admin-branches-departments/index.tsx` (NEW) -
   extracted the render-only branches/departments admin screen and switched the
   screen shell, tables, buttons, and badges to existing shadcn primitives.
2. `apps/web/src/app/(staff)/admin/branches/page.tsx` (NEW) - added the real
   staff admin route resolving locale and optional admin preview state.
3. `apps/web/src/app/admin-branches-departments.tsx` - legacy compatibility
   re-export to keep the old shell import working.
4. `apps/web/test/shell/shell.test.ts` - added route EN/AR and state coverage,
   and moved source-safety assertions to the extracted component path.

### Verification

- Passed: `corepack pnpm typecheck`.
- Passed: `corepack pnpm lint`.
- Passed: `corepack pnpm test:web -- shell` (148/148 tests).
- Passed: `corepack pnpm test:web -- localization` (11/11 tests).
- Passed: `corepack pnpm test:visual` (16 route previews).
- Passed: `corepack pnpm test:e2e -- accessibility` (17 route previews).

### Notes

- No backend admin route, OpenAPI change, user/role screen, category/SLA screen,
  notification-template screen, reports, audit viewer, fetch path, browser
  storage, cookie access, provider call, role/actor/session authority, audit
  mutation, hard delete, or backend-owned master-data decision was added.

## P9-04F-2 - Admin Users/Roles Route Extraction

- Date: 2026-06-20
- Risk: Medium
- Status: Passed
- Builder tier: BUILDER-STRONG (user requested)
- SRS IDs: REQ-ADMIN-001, UI-DESIGN-001, UI-SCREEN-001, REQ-LOCALIZATION-001

### Changes

1. `apps/web/src/components/admin-users-roles/index.tsx` (NEW) - extracted the
   render-only users/roles admin screen and switched the screen shell, table,
   buttons, and badges to existing shadcn primitives.
2. `apps/web/src/app/(staff)/admin/users/page.tsx` (NEW) - added the real staff
   admin users route resolving locale and optional admin preview state.
3. `apps/web/src/app/admin-users-roles.tsx` - legacy compatibility re-export to
   keep the old shell import working.
4. `apps/web/test/shell/shell.test.ts` - added route EN/AR and state coverage,
   and moved source-safety assertions to the extracted component path.

### Verification

- Passed: `corepack pnpm typecheck`.
- Passed: `corepack pnpm lint`.
- Passed: `corepack pnpm test:web -- shell` (150/150 tests).
- Passed: `corepack pnpm test:web -- localization` (11/11 tests).
- Passed: `corepack pnpm test:visual` (16 route previews).
- Passed: `corepack pnpm test:e2e -- accessibility` (17 route previews).

### Notes

- No backend admin route, OpenAPI change, branches/departments screen,
  category/SLA screen, notification-template screen, reports, audit viewer,
  fetch path, browser storage, cookie access, provider call, role/actor/session
  authority, audit mutation, hard delete, backend password reset authority, or
  backend-owned user/role decision was added.

## P9-04F-3 - Admin Categories/Severity/SLA Route Extraction

- Date: 2026-06-20
- Risk: Medium
- Status: Passed
- Builder tier: BUILDER-STRONG (user requested)
- SRS IDs: REQ-ADMIN-001, UI-DESIGN-001, UI-SCREEN-001, REQ-LOCALIZATION-001

### Changes

1. `apps/web/src/components/admin-categories-sla/index.tsx` (NEW) - extracted
   the render-only categories/severity/SLA admin screen and switched the screen
   shell, tables, buttons, and badges to existing shadcn primitives.
2. `apps/web/src/app/(staff)/admin/categories/page.tsx` (NEW) - added the real
   staff admin categories route resolving locale and optional admin preview
   state.
3. `apps/web/src/app/admin-categories-sla.tsx` - legacy compatibility re-export
   to keep the old shell import working.
4. `apps/web/test/shell/shell.test.ts` - added route EN/AR and state coverage,
   and moved source-safety assertions to the extracted component path.

### Verification

- Passed: `corepack pnpm typecheck`.
- Passed: `corepack pnpm lint`.
- Passed: `corepack pnpm test:web -- shell` (152/152 tests).
- Passed: `corepack pnpm test:web -- localization` (11/11 tests).
- Passed: `corepack pnpm test:visual` (16 route previews).
- Passed: `corepack pnpm test:e2e -- accessibility` (17 route previews).

### Notes

- No backend admin route, OpenAPI change, branches/departments screen,
  users/roles screen, notification-template screen, reports, audit viewer,
  fetch path, browser storage, cookie access, provider call, role/actor/session
  authority, audit mutation, hard delete, SLA calculation truth, or
  backend-owned category/SLA decision was added.

## P9-04F-4 - Admin Notification Templates Route Extraction

- Date: 2026-06-20
- Risk: Medium
- Status: Passed
- Builder tier: BUILDER-STRONG (user requested)
- SRS IDs: REQ-ADMIN-001, UI-DESIGN-001, UI-SCREEN-001, REQ-LOCALIZATION-001

### Changes

1. `apps/web/src/components/admin-notification-templates/index.tsx` (NEW) -
   extracted the render-only notification templates admin screen and switched
   the screen shell, table, buttons, and badges to existing shadcn primitives.
2. `apps/web/src/app/(staff)/admin/notification-templates/page.tsx` (NEW) -
   added the real staff admin notification templates route resolving locale and
   optional admin preview state.
3. `apps/web/src/app/admin-notification-templates.tsx` - legacy compatibility
   re-export to keep the old shell import working.
4. `apps/web/test/shell/shell.test.ts` - added route EN/AR and state coverage,
   and moved source-safety assertions to the extracted component path.

### Verification

- Passed: `corepack pnpm typecheck`.
- Passed: `corepack pnpm lint`.
- Passed: `corepack pnpm test:web -- shell` (154/154 tests).
- Passed: `corepack pnpm test:web -- localization` (11/11 tests).
- Passed: `corepack pnpm test:visual` (16 route previews).
- Passed: `corepack pnpm test:e2e -- accessibility` (17 route previews).

### Notes

- No backend admin route, OpenAPI change, branches/departments screen,
  users/roles screen, category/SLA screen, reports, audit viewer, fetch path,
  browser storage, cookie access, provider call, role/actor/session authority,
  audit mutation, hard delete, notification dispatch, or backend-owned template
  decision was added.

## P9-04F-5 - Admin Overview Route And Deactivate Confirmation Cleanup

- Date: 2026-06-20
- Risk: Medium
- Status: Passed
- Builder tier: BUILDER-STRONG (user requested)
- SRS IDs: REQ-ADMIN-001, UI-DESIGN-001, UI-SCREEN-001, REQ-LOCALIZATION-001

### Changes

1. `apps/web/src/components/admin-surfaces/index.tsx` (NEW) - extracted the
   render-only admin configuration overview surfaces and switched the shared
   deactivate confirmation to existing shadcn card/button primitives.
2. `apps/web/src/app/(staff)/admin/page.tsx` (NEW) - added the real staff admin
   overview route resolving locale and optional admin preview state.
3. `apps/web/src/app/admin-surfaces.tsx` - legacy compatibility wrapper now
   composes the extracted admin configuration surfaces and keeps the old audit
   viewer behavior until P9-04G.
4. `apps/web/test/shell/shell.test.ts` - added route EN/AR and confirmation
   coverage, and moved source-safety assertions to the extracted component path.

### Verification

- Passed: `corepack pnpm typecheck`.
- Passed: `corepack pnpm lint`.
- Passed: `corepack pnpm test:web -- shell` (156/156 tests).
- Passed: `corepack pnpm test:web -- localization` (11/11 tests).
- Passed: `corepack pnpm test:visual` (16 route previews).
- Passed: `corepack pnpm test:e2e -- accessibility` (17 route previews).

### Notes

- No backend admin route, OpenAPI change, reports route extraction, audit viewer
  extraction, customer portal change, fetch path, browser storage, cookie
  access, provider call, role/actor/session authority, audit mutation, hard
  delete, or backend-owned admin decision was added.
- P9-04F is complete. AUTO PHASE continues to P9-04G-1.

## P9-04G-1 - Reports/Export Route Extraction

- Date: 2026-06-20
- Risk: High
- Status: Passed
- Builder tier: BUILDER-STRONG
- SRS IDs: REQ-REPORT-001, UI-DESIGN-001, UI-SCREEN-001, REQ-LOCALIZATION-001

### Changes

1. `apps/web/src/components/reports-dashboard/index.tsx` (NEW) - extracted the
   render-only reports/export dashboard and switched the screen shell, table,
   buttons, and badges to existing shadcn primitives.
2. `apps/web/src/app/(staff)/reports/page.tsx` (NEW) - added the real staff
   reports route resolving locale and optional reports preview state, then
   reading report rows through `getStaffReportRows`.
3. `apps/web/src/app/reports-dashboard.tsx` - legacy compatibility re-export to
   keep the old shell import working.
4. `apps/web/test/shell/shell.test.ts` - added route EN/AR coverage, session
   cookie forwarding coverage, and moved source-safety assertions to the
   extracted component path.

### Verification

- Passed: `corepack pnpm typecheck`.
- Passed: `corepack pnpm lint`.
- Passed: `corepack pnpm test:web -- shell` (158/158 tests).
- Passed: `corepack pnpm test:web -- localization` (11/11 tests).
- Passed: `corepack pnpm test:visual` (16 route previews).
- Passed: `corepack pnpm test:e2e -- accessibility` (17 route previews).

### Security Self-Check

- Roles and branch scope come from the server session, never client input:
  `apps/web/src/app/(staff)/reports/page.tsx` forwards only the server session
  cookie to `getStaffReportRows`; `apps/web/test/shell/shell.test.ts` asserts
  no role, actor, branch, owner, token, or credential is passed in the route URL.
- Each state change writes status history and an audit entry in the same
  transaction; side effects enqueue after commit: not applicable. This task adds
  no state change, mutation, backend route, export execution, or side effect.
- No passwords, OTPs, tokens, hashes, or provider secrets are logged or
  returned: source-safety assertions cover the extracted reports component; no
  secret-bearing field or provider path was added.
- Customer portal exposure rules hold: not applicable. This task does not touch
  portal code and the reports component source guard rejects portal/DMS/private
  paths.
- Trust boundaries are tested: allowed report-row rendering through a staff
  session cookie is covered by `reports route renders real scoped rows through
  the session cookie`; denied/fallback behavior remains covered by `reports
  dashboard keeps catalog fallback when backend denies report rows`; staff role
  visibility remains covered by `reports dashboard renders RPT-001 through
  RPT-017 for report-capable roles only`.

### Notes

- No backend reports route, OpenAPI change, audit viewer, admin screen, portal
  change, browser storage, direct cookie read in React, unbounded file
  generation/download, provider call, audit mutation, hard delete, report-scope
  decision, or export authority was added.

## P9-04G-2 - Audit Viewer Route Extraction

- Date: 2026-06-20
- Risk: High
- Status: Passed
- Builder tier: BUILDER-STRONG
- SRS IDs: REQ-AUDIT-001, UI-DESIGN-001, UI-SCREEN-001, REQ-LOCALIZATION-001

### Changes

1. `apps/web/src/components/audit-viewer/index.tsx` (NEW) - extracted the
   render-only audit viewer and switched the screen shell, form controls, table,
   buttons, and badges to existing shadcn primitives.
2. `apps/web/src/app/(staff)/audit/page.tsx` (NEW) - added the real staff audit
   route resolving locale and optional audit preview state.
3. `apps/web/src/app/audit-viewer.tsx` - legacy compatibility re-export to keep
   the old shell import working.
4. `apps/web/test/shell/shell.test.ts` - added route EN/AR and state coverage,
   and moved source-safety assertions to the extracted component path.

### Verification

- Passed: `corepack pnpm typecheck`.
- Passed: `corepack pnpm lint`.
- Passed: `corepack pnpm test:web -- shell` (160/160 tests).
- Passed: `corepack pnpm test:web -- localization` (11/11 tests).
- Passed: `corepack pnpm test:visual` (16 route previews).
- Passed: `corepack pnpm test:e2e -- accessibility` (17 route previews).

### Security Self-Check

- Roles and branch scope come from the server session, never client input: not
  changed. This task adds no audit API call or role/scope parameter, and audit
  access remains Admin-only in the staff shell tests.
- Each state change writes status history and an audit entry in the same
  transaction; side effects enqueue after commit: not applicable. This task adds
  no state change, mutation, backend route, export execution, or side effect.
- No passwords, OTPs, tokens, hashes, or provider secrets are logged or
  returned: source-safety assertions cover the extracted audit component and no
  secret-bearing field or provider path was added.
- Customer portal exposure rules hold: not applicable. This task does not touch
  portal code and the audit component source guard rejects portal/DMS/private
  paths.
- Trust boundaries are tested: Admin-only visibility remains covered by `audit
  viewer renders only for admin preview with filters and export affordance`;
  route rendering/state coverage is covered by `audit route renders English and
  Arabic audit labels` and `audit route renders preview states safely`.

### Notes

- No backend audit route, OpenAPI change, reports screen, admin screen, portal
  change, direct fetch, browser storage, cookie access, blob/object URL/download
  generation, provider call, audit mutation, hard delete, redaction decision,
  role/actor/session authority, or backend-owned audit search/export decision
  was added.
- P9-04G is complete. AUTO PHASE continues to P9-04H-1.

## P9-04H-1 - Portal Submission Component Extraction

- Date: 2026-06-20
- Risk: High
- Status: Passed
- Builder tier: BUILDER-STRONG
- SRS IDs: REQ-PORTAL-001, UI-DESIGN-001, UI-SCREEN-001, REQ-LOCALIZATION-001

### Changes

1. `apps/web/src/components/portal-submission/index.tsx` (NEW) - extracted the
   render-only portal complaint submission screen and switched the screen shell,
   form fields, buttons, and cards to existing shadcn primitives.
2. `apps/web/src/app/portal/page.tsx` - kept the public portal route responsible
   for locale, preview state, and safe reference parsing, then rendered the
   extracted component.
3. `apps/web/test/shell/shell.test.ts` - moved portal submission source-safety
   assertions to the extracted component path while keeping existing route
   coverage.

### Verification

- Passed: `corepack pnpm typecheck`.
- Passed: `corepack pnpm lint`.
- Passed: `corepack pnpm test:web -- shell` (160/160 tests).
- Passed: `corepack pnpm test:web -- localization` (11/11 tests).
- Passed: `corepack pnpm test:visual` (16 route previews).
- Passed: `corepack pnpm test:e2e -- accessibility` (17 route previews).

### Security Self-Check

- Roles and branch scope come from the server session, never client input: not
  applicable. This public render-only route passes no role, branch, actor,
  owner, or session authority fields.
- Each state change writes status history and an audit entry in the same
  transaction; side effects enqueue after commit: not applicable. This task adds
  no mutation, backend route, state change, or side effect.
- No passwords, OTPs, tokens, hashes, or provider secrets are logged or
  returned: source-safety assertions cover the extracted portal submission
  component and no secret-bearing field, storage path, or provider path was
  added.
- Customer portal exposure rules hold: the component source-safety assertion
  rejects private portal data paths; the success state renders only the safe
  public reference passed by the route.
- Trust boundaries are tested: English/Arabic route rendering, validation,
  loading/error/success states, and the public render-only source guard are
  covered by the portal submission shell tests.

### Notes

- No backend portal route, OpenAPI contract, portal tracking screen, portal
  survey screen, staff route, reports screen, audit viewer, direct fetch,
  browser storage, cookie access, object URL/file read/download, provider call,
  backend-owned portal decision, or unrelated portal data exposure was added.

## P9-04H-2 - Portal Tracking Component Extraction

- Date: 2026-06-20
- Risk: High
- Status: Passed
- Builder tier: BUILDER-STRONG
- SRS IDs: REQ-PORTAL-002, UI-DESIGN-001, UI-SCREEN-001, REQ-LOCALIZATION-001

### Changes

1. `apps/web/src/components/portal-tracking/index.tsx` (NEW) - extracted the
   render-only portal tracking screen and switched the screen shell, forms,
   buttons, inputs, status badge, and cards to existing shadcn primitives.
2. `apps/web/src/app/portal/track/page.tsx` - kept the public route responsible
   for locale, preview state, and safe reference parsing, then rendered the
   extracted component.
3. `apps/web/test/shell/shell.test.ts` - moved portal tracking source-safety
   assertions to the extracted component path while keeping tracking route
   coverage.

### Verification

- Passed: `corepack pnpm typecheck`.
- Passed: `corepack pnpm lint`.
- Passed: `corepack pnpm test:web -- shell` (160/160 tests).
- Passed: `corepack pnpm test:web -- localization` (11/11 tests).
- Passed: `corepack pnpm test:visual` (16 route previews).
- Passed: `corepack pnpm test:e2e -- accessibility` (17 route previews).

### Security Self-Check

- Roles and branch scope come from the server session, never client input: not
  applicable. This public render-only route passes no role, branch, actor,
  owner, or session authority fields.
- Each state change writes status history and an audit entry in the same
  transaction; side effects enqueue after commit: not applicable. This task adds
  no mutation, backend route, state change, or side effect.
- No passwords, OTPs, tokens, hashes, or provider secrets are logged or
  returned: source-safety assertions cover the extracted tracking component and
  no secret-bearing field, storage path, or provider path was added.
- Customer portal exposure rules hold: the unverified view renders no status
  timeline, the verified preview renders only public status/timeline fields, and
  the source guard rejects private portal paths.
- Trust boundaries are tested: the shell suite covers the verification gate with
  no timeline before verified state, verified public timeline rendering,
  invalid/expired/error states, follow-up state, Arabic RTL labels, and the
  render-only source guard.

### Notes

- No backend portal route, OpenAPI contract, portal submission screen, portal
  survey screen, staff route, reports screen, audit viewer, direct fetch,
  browser storage, cookie access, object URL/file read/download, provider call,
  backend-owned portal decision, or private portal data exposure was added.

## P9-04H-3 - Portal Survey Component Extraction

- Date: 2026-06-20
- Risk: High
- Status: Passed
- Builder tier: BUILDER-STRONG
- SRS IDs: REQ-SURVEY-001, UI-DESIGN-001, UI-SCREEN-001, REQ-LOCALIZATION-001

### Changes

1. `apps/web/src/components/portal-survey/index.tsx` (NEW) - extracted the
   render-only portal survey screen and switched the screen shell, rating
   controls, textarea, buttons, and cards to existing shadcn primitives.
2. `apps/web/src/app/portal/survey/page.tsx` - kept the public route responsible
   for locale and preview state parsing, then rendered the extracted component.
3. `apps/web/test/shell/shell.test.ts` - moved portal survey source-safety
   assertions to the extracted component path while keeping survey route
   coverage.

### Verification

- Passed: `corepack pnpm typecheck`.
- Passed: `corepack pnpm lint`.
- Passed: `corepack pnpm test:web -- shell` (160/160 tests).
- Passed: `corepack pnpm test:web -- localization` (11/11 tests).
- Passed: `corepack pnpm test:visual` (16 route previews).
- Passed: `corepack pnpm test:e2e -- accessibility` (17 route previews).

### Security Self-Check

- Roles and branch scope come from the server session, never client input: not
  applicable. This public render-only route passes no role, branch, actor,
  owner, or session authority fields.
- Each state change writes status history and an audit entry in the same
  transaction; side effects enqueue after commit: not applicable. This task adds
  no mutation, backend route, state change, or side effect.
- No passwords, OTPs, tokens, hashes, or provider secrets are logged or
  returned: source-safety assertions cover the extracted survey component and no
  secret-bearing field, storage path, or provider path was added.
- Customer portal exposure rules hold: used and expired states render no
  submission form, success state does not preserve the sample comment, and the
  source guard rejects private portal paths.
- Trust boundaries are tested: the shell suite covers bounded rating controls,
  success without comment preservation, used/expired no-resubmission states,
  validation/loading/error states, Arabic RTL labels, and the render-only source
  guard.

### Notes

- No backend portal route, OpenAPI contract, portal submission screen, portal
  tracking screen, staff route, reports screen, audit viewer, direct fetch,
  browser storage, cookie access, object URL/file read/download, provider call,
  backend-owned survey decision, or private portal data exposure was added.
- P9-04H is complete. AUTO PHASE continues to P9-05A.

## P9-05A - Staff Route Visual/Accessibility Re-Baseline

- Date: 2026-06-20
- Risk: Medium
- Status: Passed
- Builder tier: BUILDER-STRONG
- SRS IDs: UI-DESIGN-001, UI-SCREEN-001, REQ-LOCALIZATION-001

### Changes

1. `tools/web-proof-cases.mjs` - re-pointed staff visual/accessibility cases at
   rebuilt staff routes for dashboard, work queue, complaint intake, complaint
   detail/workflow, admin overview, reports, and audit.
2. `tools/web-proof.mjs` - added deterministic proof data and route rendering for
   staff server-data pages, with a direction-aware staff proof frame.
3. `tools/web-visual-review.mjs` - mirrored the same real staff route rendering
   for HTML review artifacts.

### Verification

- Passed: `corepack pnpm typecheck`.
- Passed: `corepack pnpm lint`.
- Passed: `corepack pnpm test:web -- shell` (160/160 tests).
- Passed: `corepack pnpm test:web -- localization` (11/11 tests).
- Passed: `corepack pnpm test:visual` (16 route previews, now staff route
  previews for rebuilt staff surfaces).
- Passed: `corepack pnpm test:e2e -- accessibility` (17 route previews).
- Passed: `corepack pnpm web:visual-review` (16 staff route artifacts written to
  `coverage/web-visual-review`).

### Notes

- The proof data uses an in-tool fake fetch and `cms_staff_session=proof`; no
  live network call, app UI behavior, backend route, OpenAPI contract, auth/RBAC
  logic, portal screen, SMTP/deploy artifact, or production config was changed.
- Tool file sizes remain under the 300-line source budget:
  `tools/web-proof.mjs` 180 lines, `tools/web-visual-review.mjs` 111 lines, and
  `tools/web-proof-cases.mjs` 78 lines.

## P9-05B - Portal Mobile Visual-Review Re-Baseline

- Date: 2026-06-20
- Risk: Medium
- Status: Passed
- Builder tier: BUILDER-STRONG
- SRS IDs: REQ-PORTAL-001, REQ-PORTAL-002, REQ-SURVEY-001, UI-DESIGN-001,
  UI-SCREEN-001, REQ-LOCALIZATION-001

### Changes

1. `tools/web-proof-cases.mjs` - added EN/AR mobile portal visual cases for
   portal submission, tracking, and survey routes.
2. `tools/web-visual-review.mjs` - added a fixed-width review frame for cases
   that declare a mobile viewport.

### Verification

- Passed: `corepack pnpm typecheck`.
- Passed: `corepack pnpm lint`.
- Passed: `corepack pnpm test:web -- shell` (160/160 tests).
- Passed: `corepack pnpm test:web -- localization` (11/11 tests).
- Passed: `corepack pnpm test:visual` (22 route previews).
- Passed: `corepack pnpm test:e2e -- accessibility` (17 route previews).
- Passed: `corepack pnpm web:visual-review` (22 artifacts written to
  `coverage/web-visual-review`, including EN/AR mobile artifacts for portal
  submission, tracking, and survey).

### Notes

- Portal mobile review cases cover route content, direction, state messaging,
  and form/control signals. No portal UI behavior, backend portal route, OpenAPI
  contract, auth/session logic, reports, audit, SMTP, deployment artifact, or
  production config was changed.

## P9-05C - Final UI Gate And Phase Evidence

- Date: 2026-06-20
- Risk: Medium
- Status: Passed
- Builder tier: BUILDER-STRONG
- SRS IDs: UI-DESIGN-001, UI-SCREEN-001, REQ-LOCALIZATION-001, NFR-PERF-001

### Verification

- Passed: `corepack pnpm typecheck`.
- Passed: `corepack pnpm lint`.
- Passed: `corepack pnpm test:web -- shell` (160/160 tests).
- Passed: `corepack pnpm test:web -- localization` (11/11 tests).
- Passed: `corepack pnpm test:visual` (22 route previews).
- Passed: `corepack pnpm test:e2e -- accessibility` (17 route previews).
- Passed: `corepack pnpm web:visual-review` (22 staff/portal artifacts written
  to `coverage/web-visual-review`).
- Passed: `corepack pnpm web:perf` (2 route previews).

### Notes

- P9-05 is complete. Staff visual/accessibility proof now renders rebuilt staff
  routes with deterministic proof data, and portal mobile review artifacts cover
  submission, tracking, and survey in English and Arabic.
- Tool file sizes remain under the 300-line source budget:
  `tools/web-proof.mjs` 180 lines, `tools/web-visual-review.mjs` 113 lines, and
  `tools/web-proof-cases.mjs` 89 lines.
- No app UI behavior, backend route, OpenAPI contract, SMTP, deployment
  artifact, production config, or portal privacy logic was changed by P9-05C.
- AUTO PHASE continues to P9-06A.

## P9-06A - SMTP Email Provider Adapter

- Date: 2026-06-20
- Risk: High
- Status: Passed
- Builder tier: BUILDER-STRONG
- SRS IDs: REQ-NOTIFY-001, NFR-SEC-001, NFR-OBS-001

### Changes

1. `apps/api/src/modules/integrations/email-provider.port.ts` - added SMTP
   email provider types, safe config validation, an injected-transport SMTP
   adapter, and secret-safe provider failure handling. The existing in-memory
   email provider remains unchanged and still returns `provider: 'in-memory'`.
2. `apps/api/src/modules/integrations/integrations.service.ts` - made email,
   SMS, and WhatsApp validation explicit before provider property access, so
   unsafe payloads fail before any provider lookup or send call.
3. `apps/api/test/integrations/email-provider.test.ts` - added adapter tests for
   injected transport send, invalid SMTP config, and secret-safe transport
   rejection.

### Verification

- Passed: `corepack pnpm typecheck`.
- Passed: `corepack pnpm lint`.
- Failed then repaired: `corepack pnpm test:api -- notifications` initially
  exposed that SMS/WhatsApp validation could be bypassed by provider property
  access when a provider was absent. Repaired by validating into a local message
  before provider access in `IntegrationsService`.
- Passed after repair: `corepack pnpm test:api -- notifications` (39/39 tests).
- Passed: `corepack pnpm test:api -- integrations` (12/12 tests; extra focused
  proof for the new adapter).
- Passed: `corepack pnpm test` (48/48 tool tests; coverage gate passed).

### Security Self-Check

- Roles and branch scope come from the server session, never client input: not
  applicable. This task adds no route, session, role, branch, or frontend input
  authority.
- Every state change writes status history and audit in the same transaction;
  side effects enqueue after commit: not applicable. This task adds no mutation,
  notification queue write, audit write, or dispatch scheduler.
- No passwords, OTPs, tokens, hashes, or provider secrets are logged or
  returned: the SMTP adapter never logs transport errors, returns only
  `messageId/provider/accepted`, and tests assert the configured secret value is
  absent from validation and provider-failure errors. No `.env` file was
  changed.
- Customer portal privacy holds: not applicable. This task does not touch portal
  routes or response data.
- External systems go through backend adapters with a test double: the SMTP path
  is behind `EmailProviderPort` and uses an injected `SmtpEmailTransport` test
  double; production selection remains unwired until P9-06B.

### Notes

- No live SMTP credentials, provider SDK dependency, production provider
  selection, real email send, frontend code, OpenAPI route, SMS provider,
  WhatsApp provider, or DMS provider was added.
- Source file sizes remain under the 300-line budget:
  `email-provider.port.ts` 161 lines and `integrations.service.ts` 33 lines.
- AUTO PHASE continues to P9-06B.

## P9-06B - Env-Driven Email Provider Selection

- Date: 2026-06-20
- Risk: High
- Status: Passed
- Builder tier: BUILDER-STRONG
- SRS IDs: REQ-NOTIFY-001, NFR-SEC-001, NFR-OBS-001

### Changes

1. `apps/api/src/modules/integrations/email-provider.factory.ts` (NEW) - added
   backend-only email provider selection from environment, defaulting non-prod
   to in-memory and selecting SMTP only through validated config. SMTP transport
   creation is wrapped behind `SmtpEmailTransport`.
2. `apps/api/src/modules/integrations/integrations.module.ts` - changed the
   email provider binding to `emailProviderFromEnv()`. SMS and WhatsApp
   in-memory bindings are unchanged.
3. `apps/api/package.json` and `pnpm-lock.yaml` - added `nodemailer` for the
   real SMTP transport factory and `@types/nodemailer` for strict typecheck.
4. `apps/api/test/integrations/email-provider.test.ts` - added env-selection
   tests for non-prod in-memory default, SMTP selection through a test double,
   and safe fail-closed production config validation.

### Verification

- Passed: `corepack pnpm typecheck`.
- Passed: `corepack pnpm lint`.
- Passed: `corepack pnpm test:api -- integrations` (15/15 tests).
- Passed: `corepack pnpm test:api -- notifications` (39/39 tests).
- Passed: `corepack pnpm test` (48/48 tool tests; coverage gate passed).

### Security Self-Check

- Roles and branch scope come from the server session, never client input: not
  applicable. This task adds no route, session, role, branch, or frontend input
  authority.
- Every state change writes status history and audit in the same transaction;
  side effects enqueue after commit: not applicable. This task adds no mutation,
  notification queue write, audit write, or dispatch scheduler.
- No passwords, OTPs, tokens, hashes, or provider secrets are logged or
  returned: env parsing does not log values, invalid config errors use safe field
  names, tests assert configured secret values are absent from errors, and no
  real `.env` file was changed.
- Customer portal privacy holds: not applicable. This task does not touch portal
  routes or response data.
- External systems go through backend adapters with a test double: nodemailer is
  wrapped by `nodemailerSmtpTransport`; tests inject their own
  `SmtpEmailTransport` and do not send live mail.

### Notes

- No real SMTP send, staging credential, frontend code, OpenAPI route, SMS
  provider, WhatsApp provider, or DMS provider was added.
- Source file sizes remain under the 300-line budget:
  `email-provider.factory.ts` 80 lines, `email-provider.port.ts` 161 lines,
  `integrations.module.ts` 21 lines, and `integrations.service.ts` 33 lines.
- AUTO PHASE continues to P9-06C.

## P9-06C - Staging SMTP Arrival Proof And Ops Notes

- Date: 2026-06-20
- Risk: High
- Status: Blocked
- Builder tier: BUILDER-STRONG
- SRS IDs: REQ-NOTIFY-001, NFR-SEC-001, NFR-OBS-001

### Changes

1. `tools/smtp-arrival-proof.mjs` (NEW) - added `corepack pnpm smtp:proof`,
   which sends one message through the backend SMTP provider path and prints only
   secret-safe proof metadata.
2. `tools/smtp-arrival-proof.test.mjs` (NEW) - added tests for recipient
   redaction, injected-provider proof sending, secret-safe failure output, and
   CLI missing-env behavior.
3. `docs/operations/smtp-arrival-proof.md` (NEW) - added non-secret operations
   notes for required SMTP env vars, sender SPF/DKIM/DMARC checks, proof command
   execution, and arrival evidence capture.
4. `docs/PRODUCTION_READINESS.md` - linked the SMTP arrival proof runbook from
   the P-04 real email adapter workstream.

### Verification

- Passed: `corepack pnpm typecheck`.
- Passed: `corepack pnpm lint`.
- Passed: `corepack pnpm test:api -- integrations` (15/15 tests).
- Passed: `corepack pnpm test:api -- notifications` (39/39 tests).
- Failed then repaired: `corepack pnpm test` initially failed because the proof
  script imported API TypeScript at module load while the root tool test runner
  does not use `tsx`. Repaired by lazy-loading the backend factory only when the
  CLI uses the real provider path.
- Passed after repair: `corepack pnpm test` (52/52 tool tests; coverage gate
  passed).
- Blocked: `corepack pnpm smtp:proof` failed safely because no staging SMTP
  environment variables are present in this shell:
  `SMTP_HOST`, `SMTP_PORT`, `SMTP_FROM`, `SMTP_USER`, `SMTP_PASSWORD`, and
  `SMTP_PROOF_TO` all reported `Present = False`.

### Security Self-Check

- Roles and branch scope come from the server session, never client input: not
  applicable. This task adds no route, session, role, branch, or frontend input
  authority.
- Every state change writes status history and audit in the same transaction;
  side effects enqueue after commit: not applicable. This proof sends one email
  only when explicitly run with staging SMTP env vars; it adds no database
  mutation or notification queue write.
- No passwords, OTPs, tokens, hashes, or provider secrets are logged or
  returned: the proof script catches failures with a generic safe message, tests
  assert secret values are absent, and the runbook forbids committing `.env`
  values or raw provider logs.
- Customer portal privacy holds: not applicable. This task does not touch portal
  routes or response data.
- External systems go through backend adapters with a test double: the proof CLI
  lazy-loads `emailProviderFromEnv()` and therefore uses the same SMTP adapter
  path; tests inject a provider double and do not send live mail.

### Blocker

- Human action required: choose/configure a staging email sender, set
  `SMTP_HOST`, `SMTP_PORT`, `SMTP_FROM`, `SMTP_USER`, `SMTP_PASSWORD`, and
  `SMTP_PROOF_TO` in a non-committed environment, run `corepack pnpm smtp:proof`,
  then confirm the message arrives in the mailbox and is not spam. Until that
  arrival is proven, P9-06C and P9-06 remain incomplete.

### Notes

- Source file sizes remain under the 300-line budget:
  `tools/smtp-arrival-proof.mjs` 71 lines and
  `tools/smtp-arrival-proof.test.mjs` 70 lines.

## P9-06C-HUMAN - Explicitly Skipped By User

- Date: 2026-06-20
- Risk: High
- Status: Skipped / Carry-forward
- Builder tier: HUMAN
- SRS IDs: REQ-NOTIFY-001, NFR-SEC-001, NFR-OBS-001

### Decision

- The user explicitly asked to skip the live staging SMTP arrival blocker and
  continue Forge work.
- P9-06C-HUMAN, P9-06C, and P9-06 remain incomplete. The skipped proof is a
  production-readiness carry-forward, not a pass.

### Verification

- Failed / Blocked: `corepack pnpm smtp:proof` failed safely because the shell
  still lacks `SMTP_HOST`, `SMTP_PORT`, `SMTP_FROM`, `SMTP_USER`,
  `SMTP_PASSWORD`, and `SMTP_PROOF_TO`.

## P9-07A - Production Compose, Caddyfile, And Env Example

- Date: 2026-06-20
- Risk: High
- Status: Passed
- Builder tier: BUILDER-STRONG
- SRS IDs: NFR-SEC-001, NFR-AVAIL-001, NFR-OBS-001, NFR-DATA-001

### Changes

1. `docker-compose.prod.yml` (NEW) - added the Hostinger pilot stack with
   Caddy, web, API, worker, Postgres, Redis, private internal networking,
   restart policies, service healthchecks, SMTP email, and S3 attachment
   storage.
2. `Caddyfile` (NEW) - added auto-TLS site config with compression, security
   headers, `/api/*` proxying to the API, and all other traffic to the web app.
3. `.env.production.example` (NEW) - added non-secret placeholder values for
   domain, ACME email, Postgres, Redis, S3 attachment storage, SMTP, and worker
   intervals.
4. `tools/prod-deploy-artifacts.test.mjs` (NEW) - added a minimal root tool test
   that proves the required services exist and dev trust/default secrets are not
   present in the production artifacts.

### Verification

- Passed: `corepack pnpm typecheck`.
- Passed: `corepack pnpm lint`.
- Passed: `corepack pnpm test -- prod-deploy-artifacts` (54/54 root tool tests;
  coverage gate passed).
- Failed then repaired: `docker compose --env-file .env.production.example -f
  docker-compose.prod.yml config` initially failed because the compose file
  required a real `.env.production` file. Repaired by using explicit
  environment interpolation, so local validation can use the example file and
  the VPS can use `--env-file .env.production`.
- Passed after repair: `docker compose --env-file .env.production.example -f
  docker-compose.prod.yml config`.

### Security Self-Check

- Roles and branch scope come from the server session, never client input: not
  applicable. This task adds deployment artifacts only and no route or UI
  authority.
- Every state change writes status history and audit in the same transaction;
  side effects enqueue after commit: not applicable. This task adds no domain
  mutation.
- No passwords, OTPs, tokens, hashes, or provider secrets are logged or
  returned: `.env.production.example` uses placeholders only, and the test
  asserts dev defaults/trust are absent from production artifacts.
- Customer portal privacy holds: not applicable. This task does not touch portal
  response data.
- Trust boundaries are tested: production artifacts keep API/database/Redis on
  an internal network, expose only Caddy ports 80/443, and the tool test covers
  absence of dev trust/default secret posture.

### Notes

- The skipped SMTP arrival proof remains a carry-forward production gate.
- No real `.env.production` file was created.

## P9-07B - Migrate-On-Deploy And Healthcheck Proof Gates

- Date: 2026-06-20
- Risk: High
- Status: Passed
- Builder tier: BUILDER-STRONG
- SRS IDs: NFR-SEC-001, NFR-AVAIL-001, NFR-OBS-001, NFR-DATA-001

### Changes

1. `docker-compose.prod.yml` - added a one-shot `migrate` service that runs
   `prisma migrate deploy` before API startup, made API depend on successful
   migration completion, and added healthchecks for Caddy, web, worker, API,
   Postgres, and Redis.
2. `apps/api/Dockerfile` - copied the Prisma schema into the runtime image so
   the production migrate service can run from the same API image.
3. `Caddyfile` - added an internal `:8080 /health` endpoint for the Caddy
   container healthcheck.
4. `tools/prod-deploy-artifacts.test.mjs` - extended artifact proof to assert
   migration gating, restart policies, and healthchecks.

### Verification

- Passed: `corepack pnpm typecheck`.
- Passed: `corepack pnpm lint`.
- Passed: `corepack pnpm test -- prod-deploy-artifacts` (55/55 root tool tests;
  coverage gate passed).
- Passed: `docker compose --env-file .env.production.example -f
  docker-compose.prod.yml config`.

### Security Self-Check

- Roles and branch scope come from the server session, never client input: not
  applicable. This task adds deployment startup gates only.
- Every state change writes status history and audit in the same transaction;
  side effects enqueue after commit: not applicable. Database migrations are
  schema changes, not complaint workflow state changes.
- No passwords, OTPs, tokens, hashes, or provider secrets are logged or
  returned: no real `.env.production` was created, and the compose proof used
  placeholder-only `.env.production.example`.
- Customer portal privacy holds: not applicable. This task does not touch portal
  routes or response data.
- Trust boundaries are tested: artifact tests assert production services use
  health/startup gates and avoid dev trust/default secret posture.

### Notes

- The migrate service validates configuration but was not run against a real VPS
  database in this task.

## P9-07C - Production Security, Storage, And Email Config Checks

- Date: 2026-06-20
- Risk: High
- Status: Passed
- Builder tier: BUILDER-STRONG
- SRS IDs: NFR-SEC-001, NFR-AVAIL-001, NFR-OBS-001, NFR-DATA-001

### Changes

1. `tools/prod-config-check.mjs` (NEW) - added a strict production config check
   for required deployment variables, placeholder/default secret rejection, SMTP
   email driver posture, and S3-compatible attachment storage posture.
2. `tools/prod-config-check.test.mjs` (NEW) - covered real production-style
   values, example-file placeholder mode, and rejection of dev storage/email
   drivers.
3. `package.json` - added `prod:config:check`.

### Verification

- Passed: `corepack pnpm prod:config:check -- --env-file
  .env.production.example --allow-placeholders`.
- Passed: `corepack pnpm test -- prod-config-check` (58/58 root tool tests;
  coverage gate passed).
- Passed: `corepack pnpm typecheck`.
- Passed: `corepack pnpm lint`.
- Passed: `docker compose --env-file .env.production.example -f
  docker-compose.prod.yml config`.

### Security Self-Check

- Roles and branch scope come from the server session, never client input: not
  applicable. This task adds deployment config validation only.
- Every state change writes status history and audit in the same transaction;
  side effects enqueue after commit: not applicable. This task adds no domain
  mutation.
- No passwords, OTPs, tokens, hashes, or provider secrets are logged or
  returned: the checker prints variable names only on failure and tests use fake
  values/placeholders only.
- Customer portal privacy holds: not applicable. This task does not touch portal
  routes or response data.
- Trust boundaries are tested: strict config tests reject placeholder/default
  production values and dev email/storage drivers.

### Notes

- P9-07 is complete.
- P9-06C remains skipped carry-forward and is not complete.

## P9-08A - Hostinger VPS Setup And First Deploy Runbook

- Date: 2026-06-20
- Risk: Medium
- Status: Passed
- Builder tier: BUILDER-SMALL
- SRS IDs: NFR-SEC-001, NFR-AVAIL-001, NFR-OBS-001, NFR-DATA-001

### Changes

1. `docs/operations/hostinger-first-deploy.md` (NEW) - added a non-secret
   Hostinger first-deploy runbook covering Ubuntu/Docker setup, firewall ports,
   `.env.production` creation, preflight checks, first deploy, smoke checks, and
   the required carry-forward SMTP arrival proof.
2. `docs/PRODUCTION_READINESS.md` - linked the first-deploy runbook from the
   production deploy artifacts workstream.

### Verification

- Passed: `corepack pnpm lint`.
- Passed: `corepack pnpm test -- prod-config-check` (58/58 root tool tests;
  coverage gate passed).

### Notes

- No secrets or real VPS values were added.
- The skipped SMTP arrival proof remains a carry-forward production gate.

## P9-08B - Backup/Restore And Object-Storage Operations Runbook

- Date: 2026-06-20
- Risk: Medium
- Status: Passed
- Builder tier: BUILDER-SMALL
- SRS IDs: NFR-SEC-001, NFR-AVAIL-001, NFR-OBS-001, NFR-DATA-001

### Changes

1. `docs/operations/backup.md` - added Hostinger backup command shape, restore
   test command shape, Cloudflare R2/S3-compatible object storage operations,
   smoke checks, and non-secret evidence metadata.
2. `docs/PRODUCTION_READINESS.md` - linked `docs/operations/backup.md` from the
   object storage operations item.

### Verification

- Passed: `corepack pnpm lint`.
- Passed: `corepack pnpm test -- prod-config-check` (58/58 root tool tests;
  coverage gate passed).

### Notes

- No secrets, bucket keys, backup URLs, signed URLs, or real `.env.production`
  values were added.

## P9-08C - VPS Hardening, Secrets, Domain, And TLS Runbook

- Date: 2026-06-20
- Risk: Medium
- Status: Passed
- Builder tier: BUILDER-SMALL
- SRS IDs: NFR-SEC-001, NFR-AVAIL-001, NFR-OBS-001, NFR-DATA-001

### Changes

1. `docs/operations/hostinger-first-deploy.md` - added SSH key-only hardening,
   root/password login disablement, fail2ban, unattended upgrades,
   `.env.production` permissions, DNS checks, Caddy TLS checks, and safe
   evidence metadata.

### Verification

- Passed: `corepack pnpm lint`.
- Passed: `corepack pnpm test -- prod-config-check` (58/58 root tool tests;
  coverage gate passed).

### Notes

- No secrets, SSH keys, IP addresses, or real `.env.production` values were
  added.

## P9-08D - Pilot Smoke/UAT Checklist And Phase 9 Handoff

- Date: 2026-06-20
- Risk: Medium
- Status: Passed
- Builder tier: BUILDER-SMALL
- SRS IDs: NFR-SEC-001, NFR-AVAIL-001, NFR-OBS-001, NFR-DATA-001

### Changes

1. `docs/operations/pilot-smoke-uat.md` (NEW) - added deployed pilot preflight,
   staff smoke, portal smoke, runtime smoke, safe evidence metadata, and Phase 9
   handoff stop conditions.
2. `docs/PRODUCTION_READINESS.md` - linked the pilot smoke/UAT checklist from
   the real UAT/pilot ops item.

### Verification

- Passed: `corepack pnpm lint`.
- Passed: `corepack pnpm test -- prod-config-check` (58/58 root tool tests;
  coverage gate passed).

### Notes

- P9-08 is complete.
- Phase 9 is not complete: P9-06C/P9-06 and real P9-OPS gates still require
  human/environment proof.

## P9 Readiness Clarification - No VPS Yet

- Date: 2026-06-20
- Risk: High
- Status: Ready for provisioning / not production-proven
- Builder tier: BUILDER-STRONG
- SRS IDs: NFR-SEC-001, NFR-AVAIL-001, NFR-OBS-001, NFR-DATA-001

### Decision

- User clarified there is no VPS and wants the repository to be ready.
- The repository is now documented as a VPS-ready deployment package.
- Phase 9 remains blocked only on future human/environment proof, not on any
  known local build task.

### Verification

- Assumed from prior passed P9-07/P9-08 proof commands in this evidence log.
- Not Run in this clarification step: real VPS deploy, backup restore,
  object-storage smoke, SMTP mailbox arrival, and pilot UAT because no VPS exists.

## Local Web Root Usability Hotfix

- Date: 2026-06-20
- Risk: Medium
- Status: Passed
- Builder tier: BUILDER-STRONG
- SRS IDs: ARCH-UI-001, UI-DESIGN-001, QA-UI-001, UI-SCREEN-001

### Changes

1. `apps/web/src/app/page.tsx` and `apps/web/src/app/staff-auth-landing.tsx`
   - runtime `/` now renders a lightweight staff auth landing unless a real
   session exists, while direct preview rendering remains available for
   tests/proof tooling.
2. `apps/web/src/app/page.tsx` - proof shell sidebar links now point to real
   staff routes instead of `href="#"`.
3. `apps/web/src/app/staff-shell-panels.tsx` - the signed-in preview shortcut
   now opens the routed dashboard instead of adding preview query state to `/`.
4. `apps/web/next.config.mjs` - pins the Turbopack root to the repo to avoid
   wrong workspace-root inference during local dev startup.

### Verification

- Passed: `corepack pnpm lint`.
- Passed: `corepack pnpm typecheck`.
- Passed: `corepack pnpm test:web -- shell` (160/160).
- Passed: `Invoke-WebRequest http://localhost:4000/?locale=ar` returned clean
  Arabic login HTML with no `href="#"` and no mojibake marker.
- Passed: `Invoke-WebRequest http://localhost:4000/dashboard?locale=ar`
  returned clean Arabic dashboard HTML with no `href="#"` and no mojibake marker.

### Notes

- Phase 9 remains blocked on the missing VPS/provisioning proof gates recorded
  in `.forge/state.md`.

## P10-01A Task Domain Model + Next-Action Invariant

- Date: 2026-06-20
- Risk: High
- Status: Passed locally / runtime stack proof deferred
- Builder tier: BUILDER-STRONG
- SRS IDs: ARCH-UI-001, UI-DESIGN-001, UI-SCREEN-001, METHOD-MODULAR-001,
  METHOD-AUDIT-001, METHOD-TEST-001, NFR-MAINT-001

### Changes

1. Generated `apps/api/src/modules/tasks` with the module generator and filled
   `MODULE.md`.
2. Added Prisma task atom tables/enums plus migration:
   `tasks`, `task_links`, `task_participants`, and `task_status_history`.
3. Implemented `TasksService` next-action invariant:
   `OPEN` / `IN_PROGRESS` / `WAITING` require `{ what, whoId, when }`; `DONE`
   clears it.
4. Task creation/status changes write status history and task audit in the same
   repository transaction.
5. Added participant visibility read guard proof: own/participant access allowed,
   unrelated user denied.

### Verification

- Passed: `corepack pnpm --filter @cms-auto/database generate`.
- Passed: `node --import tsx --test apps/api/src/modules/tasks/tasks.service.spec.ts`
  (4/4).
- Passed: `corepack pnpm lint`.
- Passed: `corepack pnpm typecheck`.
- Passed: `corepack pnpm test` (58/58).
- Passed: `corepack pnpm prisma:validate`.
- Passed: `corepack pnpm openapi:check`.
- Not Run: live API mutation, local DB migration apply, runtime integration proof,
  Employee Today UI/web proof. The local stack remains blocked by the Docker /
  Redis / Postgres / disk-space issues carried in `state.md`.

### Security Self-Check

- Roles and branch scope from server session, never client input: P10-01A adds no
  public route. The service-level participant read guard takes actor identity as
  trusted caller context; P10-01B must derive it from the server session.
- State change history + audit in same transaction: `TasksService.create` and
  `TasksService.updateStatus` call `createStatusHistory` and `AuditService.record`
  inside `TasksRepository.transaction`; the status-update unit test asserts both
  receive the transaction client.
- No secrets logged or returned: task audit metadata contains status fields only;
  no passwords, OTPs, tokens, hashes, or provider secrets are included.
- Customer portal exposure rules: no portal route or public task exposure was
  added in this task.
- Trust boundaries tested: `tasks.service.spec.ts` covers participant allow and
  unrelated-user deny with `RBAC_FORBIDDEN`.

## P10-01B Quick-Add Capture API

- Date: 2026-06-20
- Risk: High
- Status: Passed locally / runtime stack proof deferred
- Builder tier: BUILDER-STRONG
- SRS IDs: ARCH-UI-001, UI-DESIGN-001, UI-SCREEN-001, METHOD-MODULAR-001,
  METHOD-AUDIT-001, METHOD-API-001, METHOD-TEST-001, NFR-MAINT-001

### Changes

1. Added `POST /tasks/quick-add` on `TasksController` with staff session, RBAC,
   and CSRF guards.
2. Added quick-add body parsing in `create-task.dto.ts`; the request accepts
   `title`, `what`, `whoId`, `when`, and optional due date, links, participants,
   visibility, and confidentiality.
3. The controller derives `ownerId` and audit actor from `request.principal`,
   rejects client-owned `ownerId` / `assigneeId` / `status` / `nextAction`, and
   delegates invariant/audit/history logic to `TasksService.create`.
4. Updated the canonical OpenAPI contract and regenerated `packages/contracts`.

### Verification

- Passed: `node --import tsx --test apps/api/src/modules/tasks/tasks.controller.spec.ts`
  (2/2).
- Passed: `corepack pnpm lint`.
- Passed: `corepack pnpm typecheck`.
- Passed: `corepack pnpm test` (58/58).
- Passed: `corepack pnpm openapi:check`.
- Not Run: live API mutation and browser/web proof. The local stack remains
  blocked by the Docker / Redis / Postgres / disk-space issues carried in
  `state.md`.

### Security Self-Check

- Roles and branch scope from server session, never client input: the route is
  guarded by `SessionAuthGuard` + `RbacGuard`; `ownerId` comes from
  `request.principal.userId`, and client-owned authority fields are rejected in
  the parser and tested.
- State change history + audit in same transaction: quick-add delegates to
  `TasksService.create`, already proven in P10-01A to write task status history
  and audit in the repository transaction.
- No secrets logged or returned: request parser and controller pass task fields
  only; no passwords, OTPs, tokens, hashes, or provider secrets are included in
  audit metadata or response.
- Customer portal exposure rules: no portal route or public task exposure was
  added.
- Trust boundaries tested: `tasks.controller.spec.ts` proves session-derived
  owner/audit actor and rejection of a client-supplied `ownerId`.

## P10-01C Employee Today Query/Service API

- Date: 2026-06-20
- Risk: High
- Status: Passed locally / runtime and web proof deferred
- Builder tier: BUILDER-STRONG
- SRS IDs: ARCH-UI-001, UI-DESIGN-001, UI-SCREEN-001, METHOD-MODULAR-001,
  METHOD-API-001, METHOD-TEST-001, NFR-MAINT-001

### Changes

1. Added `TasksRepository.listEmployeeToday`, scoped to visible non-DONE tasks:
   owner, assignee, next-action user, or explicit participant.
2. Added `TasksService.employeeToday`, bucketing visible tasks into due today,
   overdue, assigned to me, and waiting on me.
3. Added `GET /tasks/today`, deriving the employee identity from
   `request.principal.userId` and accepting no client `userId`.
4. Updated the canonical OpenAPI contract and regenerated `packages/contracts`.

### Verification

- Passed: `node --import tsx --test apps/api/src/modules/tasks/tasks.service.spec.ts`
  (5/5).
- Passed: `node --import tsx --test apps/api/src/modules/tasks/tasks.controller.spec.ts`
  (4/4).
- Passed: `corepack pnpm lint`.
- Passed: `corepack pnpm typecheck`.
- Passed: `corepack pnpm test` (58/58).
- Passed: `corepack pnpm openapi:check`.
- Not Run: live API query and Employee Today web proof. The local stack remains
  blocked by the Docker / Redis / Postgres / disk-space issues carried in
  `state.md`.

### Security Self-Check

- Roles and branch scope from server session, never client input: `GET /tasks/today`
  is guarded by `SessionAuthGuard` + `RbacGuard`; actor identity comes from
  `request.principal.userId`, and the controller test covers missing principal
  rejection.
- State change history + audit in same transaction: not applicable; P10-01C is
  read-only and adds no state change.
- No secrets logged or returned: the route returns task DTOs only and writes no
  logs/audit entries.
- Customer portal exposure rules: no portal route or public task exposure was
  added.
- Trust boundaries tested: service proof checks the repository is queried with
  the actor id and buckets only returned visible tasks; controller proof checks
  session-derived identity and missing-principal denial.

## Local Web Functionality Repair

- Date: 2026-06-20
- Risk: Medium
- Status: Passed locally / backend runtime still environment-blocked
- Builder tier: BUILDER-STRONG
- SRS IDs: ARCH-UI-001, UI-DESIGN-001, QA-UI-001, UI-SCREEN-001, REQ-REPORT-001

### Changes

1. `apps/web/src/components/ui/button.tsx` - explicit `type="button"` controls
   without a handler now render disabled unless the caller intentionally provides
   a handler, link child, or disabled state. This prevents render-only prototype
   controls from looking like working actions.
2. `apps/web/test/shell/button.test.tsx` - added shell proof that inert action
   buttons are disabled while submit buttons and link-backed buttons stay active.
3. `apps/web/src/app/(staff)/reports/export/route.ts` - added a Next route for
   `/reports/export?format=csv|excel` that forwards the staff cookie to the API,
   passes through file headers, rejects unsupported formats, and returns a safe
   502 when the API is unavailable.
4. `apps/web/test/api-client/report-export-route.test.ts` - added API-client
   proof for export proxying and invalid-format rejection.

### Verification

- Passed: `corepack pnpm lint`.
- Passed: `corepack pnpm typecheck`.
- Passed: `corepack pnpm test:web -- shell` (162/162).
- Passed: `corepack pnpm test:web -- api-client` (11/11).
- Passed: `corepack pnpm test:web -- localization` (11/11).
- Passed: `corepack pnpm test:visual` (22 route previews).
- Passed: `node --import tsx tools/web-proof.mjs accessibility` (17 route previews).
- Passed: `node --import tsx tools/web-proof.mjs perf` (2 route previews).
- Passed: `corepack pnpm test:e2e -- ui-smoke` (2 route previews).
- Passed: local dev server started at `http://localhost:4000`.
- Passed: `curl.exe http://localhost:4000/?locale=ar` returned 200, no mojibake
  markers, and no `href="#"`.
- Passed: `curl.exe http://localhost:4000/dashboard?locale=ar` returned 200, no
  mojibake markers, and no `href="#"`.
- Passed: `curl.exe "http://localhost:4000/?locale=ar&preview=1&session=signed-in&role=admin"`
  returned 200, no mojibake markers, no `href="#"`, and 57 disabled render-only
  action controls.
- Passed: `curl.exe "http://localhost:4000/reports/export?format=pdf"` returned
  400 instead of a missing route.
- Passed with expected backend-down behavior:
  `curl.exe "http://localhost:4000/reports/export?format=csv"` returned 502
  because the API service is not running.

### Environment Blockers

- Not Run as passed: live backend mutation/export smoke. Docker Desktop is not
  reachable, the API is not listening on port 3000, Redis is not listening on
  port 6379, and local Postgres rejects the configured development credentials.
- Local dev reliability issue found: the C: drive was full, causing Next/Turbopack
  ENOSPC cache-write failures. Generated `.next`, coverage, and temporary dev-log
  artifacts were removed; about 350 MB remained free after cleanup and about
  220 MB remained after restarting and smoking the dev server.
- Phase 9 remains blocked on the missing VPS/provisioning proof gates recorded
  in `.forge/state.md`.

## Local Staff Shell UX Repair

- Date: 2026-06-20
- Risk: Medium
- Status: Passed locally / backend runtime still environment-blocked
- Builder tier: BUILDER-STRONG
- SRS IDs: ARCH-UI-001, UI-DESIGN-001, QA-UI-001, UI-SCREEN-001, REQ-LOCALIZATION-001

### Changes

1. `apps/web/src/app/staff-top-bar.tsx` - added a shared staff app top bar with
   route-relative language switching and a persisted light/dark theme toggle.
2. `apps/web/src/app/(staff)/layout.tsx`, `apps/web/src/app/page.tsx`, and
   `apps/web/src/app/staff-auth-landing.tsx` - wired the top bar into real staff
   routes, the preview shell, and the sign-in landing. Staff nav links now keep
   the active locale query.
3. `apps/web/src/globals.css` and `apps/web/src/app/layout.tsx` - added dark-mode
   tokens, a pre-paint theme bootstrap script, and small compatibility overrides
   for existing slate/white classes so current screens theme without a full
   component rewrite.
4. `apps/web/src/app/staff-shell-panels.tsx` - moved auth/role shell panels to
   token-based colors for dark-mode compatibility.
5. `apps/web/public/favicon.svg` and root metadata - added a favicon to remove
   the visible dev-overlay console issue from `/favicon.ico` 404s.
6. `apps/web/test/shell/shell.test.ts` - added proof that the staff shell renders
   app top-bar language and theme controls.

### Verification

- Passed: `corepack pnpm lint`.
- Passed: `corepack pnpm typecheck`.
- Passed: `corepack pnpm test:web -- shell` (163/163).
- Passed: `corepack pnpm test:web -- localization` (11/11).
- Passed: `corepack pnpm test:visual` (22 route previews).
- Passed: `node --import tsx tools/web-proof.mjs accessibility` (17 route previews).
- Passed: `node --import tsx tools/web-proof.mjs perf` (2 route previews).
- Passed: Playwright opened `http://localhost:4000/dashboard?locale=en`,
  clicked the theme toggle, and the fresh snapshot showed the toggle pressed with
  "Light mode" as the next action.
- Passed: Playwright clicked the language control and stayed on
  `http://localhost:4000/dashboard?locale=ar`.
- Passed: Playwright reload after favicon addition showed no favicon 404; only
  normal React dev/HMR console messages remained.

### Notes

- The in-app browser connector failed before attach with its sandbox metadata
  error, so verification used the existing Playwright CLI skill and repo proof
  commands instead.
- C: remains critically low on free space after local dev and browser proof. The
  app is still listening on port 4000, but the machine needs disk space freed for
  stable dev-server work.
- Phase 9 remains blocked on the missing VPS/provisioning proof gates recorded
  in `.forge/state.md`.

## Local Staff Runtime Guard Repair

- Date: 2026-06-20
- Risk: Medium
- Status: Passed locally / full-stack runtime still environment-blocked
- Builder tier: BUILDER-STRONG
- SRS IDs: ARCH-UI-001, UI-DESIGN-001, QA-UI-001, UI-SCREEN-001, REQ-LOCALIZATION-001

### Changes

1. `apps/web/src/app/layout.tsx` and `apps/web/src/globals.css` - added the
   root `suppressHydrationWarning` guard for the pre-paint theme class and native
   `color-scheme` support for light/dark form controls.
2. `apps/web/src/middleware.ts` and `apps/web/src/app/(staff)/layout.tsx` -
   passed the request pathname into the staff layout and redirected signed-out
   staff routes back to the auth landing while keeping password reset accessible.
3. `apps/web/src/app/staff-shell-panels.tsx` - changed the signed-in preview link
   to the explicit root preview query instead of a now-guarded staff route.
4. `apps/web/test/shell/shell.test.ts` and
   `apps/web/test/localization/staff-shell-localization.test.ts` - added/updated
   regression proof for the staff route guard, app top bar controls, and root
   hydration guard.

### Verification

- Passed: `corepack pnpm lint`.
- Passed: `corepack pnpm typecheck`.
- Passed: `corepack pnpm test:web -- shell` (164/164).
- Passed: `corepack pnpm test:web -- api-client` (11/11).
- Passed: `corepack pnpm test:web -- localization` (11/11).
- Passed: Playwright opened `http://localhost:4000/dashboard?locale=ar` and was
  redirected to `http://localhost:4000/?locale=ar` with zero console errors or
  warnings.
- Passed: Playwright toggled the theme to dark, reloaded with
  `localStorage.cms-theme=dark`, and no hydration mismatch appeared.
- Passed: Playwright opened `http://localhost:4000/complaints/new?locale=en` and
  was redirected to `http://localhost:4000/?locale=en`; the signed-out page did
  not render the create-complaint form.

### Environment Blockers

- Failed/Blocked: full API startup. Docker Desktop is not reachable, Redis is
  not listening on port 6379, no local Redis CLI/server is installed, and the
  listening Postgres service on port 5432 rejects the configured
  `cms_auto/cms_auto_dev` development credentials.
- Failed/Blocked: safe compose bring-up on this workstation. The C: drive had
  only about 335 MB free before restarting Next and about 233 MB free after the
  dev server rebuilt cache, which is not enough for stable Docker/full-stack
  operation.
- Not Run as passed: live staff login, complaint mutation, workflow mutation,
  worker job, and API-backed export smoke. These require the API, Postgres, and
  Redis to be running with the project credentials.
- Phase 9 remains blocked on the missing VPS/provisioning proof gates recorded
  in `.forge/state.md`.

## P10-02A Manager Control Room Read Model

- Date: 2026-06-20
- Risk: High
- Status: Passed locally / runtime and web proof deferred
- Builder tier: BUILDER-STRONG
- SRS IDs: REQ-RBAC-001, NFR-SEC-002, REQ-REPORT-001, REQ-SEARCH-001,
  METHOD-MODULAR-001, METHOD-API-001, METHOD-TEST-001, UI-SCREEN-001

### Changes

1. Added `GET /tasks/manager-rollup`, guarded by staff session, manager/admin
   RBAC, and branch-scope metadata.
2. Added `TasksService.managerControlRoom`, deriving overdue-by-employee,
   due-today, stuck, and workload-by-assignee from active task rows only.
3. Added `TasksRepository.listManagerRollup`, scoped through owner/assignee/
   next-action user branch membership; no stored counters or schema change.
4. Added OpenAPI schemas for the manager control room response and registered
   `test:api -- tasks`.

### Verification

- Passed: `node --import tsx --test apps/api/src/modules/tasks/tasks.service.spec.ts`
  (7/7).
- Passed: `node --import tsx --test apps/api/src/modules/tasks/tasks.controller.spec.ts`
  (5/5).
- Passed: `node --import tsx --test apps/api/src/modules/tasks/tasks.service.spec.ts apps/api/src/modules/tasks/tasks.controller.spec.ts`
  (12/12).
- Passed: `corepack pnpm test:api -- tasks` (4/4).
- Passed: `corepack pnpm lint`.
- Failed then fixed: first `corepack pnpm typecheck` failed on a narrow enum
  allow-list inference in `tasks.service.ts`; after changing it to a `Set<string>`,
  the command passed.
- Passed: `corepack pnpm typecheck`.
- Passed: `corepack pnpm test` (58/58).
- Passed: `corepack pnpm openapi:check`.
- Not Run: live API runtime proof, manager screen proof, and web/runtime proof.
  The local stack remains deferred per Phase 10 state.

### Security Self-Check

- Roles and branch scope from server session, never client input: the controller
  passes only `request.principal.roleCode` and `request.principal.branchId` into
  the service; API tests cover session-derived scope, employee denial, and
  cross-branch query denial through `RbacGuard`.
- State change history + audit in same transaction: not applicable; P10-02A is
  read-only and adds no state change.
- No passwords, OTPs, tokens, hashes, or provider secrets are logged or returned:
  the route returns task rollup DTOs only and writes no logs on allowed reads.
- Customer portal exposure rules: no portal route or public task exposure was
  added.
- Trust boundaries tested: `test:api -- tasks` covers manager allowed, employee
  denied, cross-branch denied/audited, and derived counts from task rows.

## P10-03A Escalation Policy + Due-Date Scan Logic

- Date: 2026-06-20
- Risk: High
- Status: Passed locally / worker runtime deferred
- Builder tier: BUILDER-STRONG
- SRS IDs: SLA-CALENDAR-001, REQ-RBAC-001, NFR-SEC-002, REQ-REPORT-001,
  METHOD-MODULAR-001, METHOD-API-001, METHOD-TEST-001

### Changes

1. Added `tasks.escalation.ts`, a pure selector for due-soon and overdue task
   escalation candidates from task due dates and next-action dates.
2. Added deterministic default thresholds: due soon within 24h, team-leader
   overdue immediately, branch-manager after 24h, high-priority after 72h.
3. Wired Manager Control Room `escalated` to the pure selector, keeping the read
   path deterministic and leaving worker event persistence for P10-03B.
4. Added task API suite proof for due-soon, overdue, completed-task ignore, and
   idempotent/stable selection.

### Verification

- Passed: `corepack pnpm test:api -- tasks` (8/8).
- Passed: `node --import tsx --test apps/api/src/modules/tasks/tasks.service.spec.ts apps/api/src/modules/tasks/tasks.controller.spec.ts`
  (12/12).
- Passed: `corepack pnpm lint`.
- Passed: `corepack pnpm typecheck`.
- Passed: `corepack pnpm test` (58/58).
- Passed: `corepack pnpm openapi:check`.
- Not Run: BullMQ worker wiring, notification dispatch, live runtime scan, and
  web proof. These are P10-03B `[stack]` work and remain deferred until local
  Docker/Postgres/Redis/disk blockers are fixed.

### Security Self-Check

- Roles and branch scope from server session, never client input: no new API
  surface was added; the existing manager rollup still derives scope from
  `request.principal` and its tests still cover employee/cross-branch denial.
- State change history + audit in same transaction: not applicable; P10-03A is
  pure read/selection logic with no persisted state change.
- No passwords, OTPs, tokens, hashes, or provider secrets are logged or returned:
  the selector returns task IDs, levels, trigger timestamps, and overdue minutes
  only.
- Customer portal exposure rules: no portal route or public task exposure was
  added.
- Trust boundaries tested: `test:api -- tasks` still covers manager allowed,
  employee denied, and cross-branch denied/audited; selector tests cover the
  pure due-date behavior.

## P10-04A Deal Model + Stage Gates

- Date: 2026-06-20
- Risk: High
- Status: Passed locally / runtime and web proof deferred
- Builder tier: BUILDER-STRONG
- SRS IDs: REQ-RBAC-001, NFR-SEC-002, REQ-REPORT-001, METHOD-MODULAR-001,
  METHOD-API-001, METHOD-TEST-001, NFR-MAINT-001

### Changes

1. Generated the `deals` module skeleton and filled in the module boundary.
2. Added Prisma `DealStage` and `Deal` model with branch, owner/current holder,
   stage, due, and blocker fields plus indexes and migration.
3. Added minimal backend stage-gate authority: create a validated deal record,
   advance exactly one stage, reject skipped transitions, reject active blockers,
   and validate next holder/due date.
4. Wired `DealsModule` into the API module graph and registered `test:api --
   deals`.

### Verification

- Passed: `corepack pnpm prisma:validate`.
- Passed: `node --import tsx --test apps/api/src/modules/deals/deals.service.spec.ts apps/api/src/modules/deals/deals.controller.spec.ts`
  (4/4).
- Passed: `corepack pnpm test:api -- deals` (3/3).
- Passed: `corepack pnpm lint`.
- Passed: `corepack pnpm typecheck`.
- Failed then fixed environment: `corepack pnpm test` had all 58 subtests pass
  but failed coverage report generation while C: had about 27 MB free. Cleared
  generated `apps/web/.next` and `cms-auto-*` temp dirs, then reran.
- Passed: `corepack pnpm test` (58/58) after freeing generated cache space.
- Passed: `corepack pnpm openapi:check`.
- Not Run: live DB migration apply, runtime API proof, Deal Board UI, and web
  proof. These stay deferred until local stack repair.

### Security Self-Check

- Roles and branch scope from server session, never client input: no new HTTP
  API surface was added in P10-04A; persisted Deal model carries `branchId` for
  P10-04B/P10-04C scoped APIs.
- State change history + audit in same transaction: not applicable yet; P10-04A
  only adds pure stage-gate authority and schema. P10-04B is explicitly scoped
  to persisted transitions, generated tasks, and audit.
- No passwords, OTPs, tokens, hashes, or provider secrets are logged or returned:
  deal service returns only deal IDs, branch/holder IDs, stage, due, blocker,
  and timestamps.
- Customer portal exposure rules: no portal route or public deal exposure was
  added.
- Trust boundaries tested: deal tests cover allowed transition, denied skipped
  transition, active blocker denial, and due/holder validation.

## P10-04B Deal Stage Transitions Generate Tasks + Audit

- Date: 2026-06-20
- Risk: High
- Status: Passed locally / runtime and web proof deferred
- Builder tier: BUILDER-STRONG
- SRS IDs: METHOD-AUDIT-001, REQ-RBAC-001, NFR-SEC-002, REQ-REPORT-001,
  METHOD-MODULAR-001, METHOD-API-001, METHOD-TEST-001

### Changes

1. Added transaction-aware `TasksService.createInTransaction` so Deal flows can
   create next-holder tasks without writing task tables directly.
2. Added `DealsRepository` persistence for deal create/update inside Prisma
   transactions.
3. Added `DealsService.createPersisted` and `advanceStagePersisted`: valid
   one-step stage transition, deal update, workflow audit, and next-holder task
   creation run through the same transaction client.
4. Wired `DealsModule` to `TasksModule`, `AuditService`, and `PrismaService`.

### Verification

- Passed: `node --import tsx --test apps/api/src/modules/deals/deals.service.spec.ts apps/api/src/modules/deals/deals.controller.spec.ts`
  (5/5).
- Passed: `corepack pnpm test:api -- deals` (4/4).
- Passed: `corepack pnpm typecheck`.
- Passed: `corepack pnpm lint`.
- Passed: `corepack pnpm prisma:validate`.
- Passed: `corepack pnpm test` (58/58).
- Passed: `corepack pnpm openapi:check`.
- Not Run: live DB migration apply, runtime API proof, Deal Board UI, and web
  proof. These stay deferred until local stack repair.

### Security Self-Check

- Roles and branch scope from server session, never client input: no new HTTP
  API surface was added; persisted Deal rows carry `branchId` for scoped APIs in
  P10-04C.
- State change history + audit in same transaction: `advanceStagePersisted`
  updates the Deal, writes workflow audit, and creates the next-holder task via
  `TasksService.createInTransaction` with the same transaction client; service
  and API-suite tests assert the shared client.
- No passwords, OTPs, tokens, hashes, or provider secrets are logged or returned:
  audit metadata contains only stage codes; task creation uses deal ID/stage and
  holder IDs.
- Customer portal exposure rules: no portal route or public deal exposure was
  added.
- Trust boundaries tested: deal tests cover allowed transition, invalid
  transition denial, blocker denial, and transaction-client sharing for deal,
  audit, and task.

## P10-04C Deal Handoff Board Read Model

- Date: 2026-06-20
- Risk: High
- Status: Passed locally / web proof deferred
- Builder tier: BUILDER-STRONG
- SRS IDs: REQ-RBAC-001, NFR-SEC-002, REQ-REPORT-001, METHOD-MODULAR-001,
  METHOD-API-001, METHOD-TEST-001, UI-SCREEN-001

### Changes

1. Added `GET /deals/handoff-board`, guarded by staff session, manager/admin
   RBAC, and branch-scope metadata.
2. Added `DealsRepository.listHandoffBoard`, scoped directly by `deal.branchId`.
3. Added `DealsService.handoffBoard`, deriving by-stage buckets, stuck deals,
   delay age, and current-holder workload from deal rows only.
4. Added OpenAPI schemas for the Deal Handoff Board response.

### Verification

- Passed: `corepack pnpm test:api -- deals` (7/7).
- Passed: `node --import tsx --test apps/api/src/modules/deals/deals.service.spec.ts apps/api/src/modules/deals/deals.controller.spec.ts`
  (8/8).
- Passed: `corepack pnpm typecheck`.
- Passed: `corepack pnpm openapi:check`.
- Passed: `corepack pnpm lint`.
- Passed: `corepack pnpm prisma:validate`.
- Passed: `corepack pnpm test` (58/58).
- Not Run: Deal Handoff Board screen/web/runtime proof. This is P10-04D
  `[stack]` and remains deferred until local stack repair.

### Security Self-Check

- Roles and branch scope from server session, never client input: the controller
  passes only `request.principal.roleCode` and `request.principal.branchId` to
  the service; API tests cover manager allowed, ordinary employee denied, and
  cross-branch query denial/audit through `RbacGuard`.
- State change history + audit in same transaction: not applicable; P10-04C is
  read-only and adds no state change.
- No passwords, OTPs, tokens, hashes, or provider secrets are logged or returned:
  the board returns deal IDs, branch/holder IDs, stage/due/blocker, delay, and
  timestamps only.
- Customer portal exposure rules: no portal route or public deal exposure was
  added.
- Trust boundaries tested: `test:api -- deals` covers scoped manager board,
  employee denial, cross-branch denial/audit, and derived stuck/current-holder
  data from deal rows.

## P10-05A Promise Flag On Linked Tasks + Service Proof

- Date: 2026-06-20
- Risk: High
- Status: Passed locally / runtime and web proof deferred
- Builder tier: BUILDER-STRONG
- SRS IDs: REQ-RBAC-001, NFR-SEC-002, REQ-REPORT-001, METHOD-MODULAR-001,
  METHOD-API-001, METHOD-TEST-001

### Changes

1. Added `Task.isCustomerPromise` with a Prisma migration and regenerated the
   Prisma client.
2. Added promise validation requiring customer-, complaint-, or deal-linked
   promise tasks; unlinked promises fail before persistence.
3. Added `promiseKeptOnTime` service logic deriving promise performance from
   task status-history events instead of stored counters.
4. Wired the promise flag through task repository selects, DTOs, responses, and
   canonical OpenAPI.

### Verification

- Passed: `corepack pnpm --dir packages/database exec prisma generate --schema prisma/schema.prisma`.
- Passed: `corepack pnpm test:api -- tasks` (10/10).
- Passed: `node --import tsx --test apps/api/src/modules/tasks/tasks.service.spec.ts apps/api/src/modules/tasks/tasks.controller.spec.ts`
  (14/14).
- Passed: `corepack pnpm typecheck`.
- Passed: `corepack pnpm openapi:check`.
- Passed: `corepack pnpm lint`.
- Passed: `corepack pnpm prisma:validate`.
- Passed: `corepack pnpm test` (58/58).
- Not Run: live DB migration apply, runtime API proof, and web proof. These
  remain deferred until local stack repair.

### Security Self-Check

- Roles and branch scope from server session, never client input: no new HTTP
  route was added; existing task routes still derive authority through the
  guarded controller/service path.
- State change history + audit in same transaction: promise task creation uses
  the existing task create transaction path, including audit; status-derived
  promise performance is read-only.
- No passwords, OTPs, tokens, hashes, or provider secrets are logged or returned:
  only the boolean promise flag and derived on-time result are exposed.
- Customer portal exposure rules: no portal route or public task exposure was
  added.
- Trust boundaries tested: task API and service tests cover linked promise
  acceptance, unlinked promise denial, and on-time/late/missing completion
  derivation from task/status-history data.

## P10-05B Surface Overdue Promises In Today + Control Room + KPI

- Date: 2026-06-20
- Risk: High
- Status: Passed locally / runtime and web proof deferred
- Builder tier: BUILDER-STRONG
- SRS IDs: REQ-RBAC-001, NFR-SEC-002, REQ-REPORT-001, METHOD-MODULAR-001,
  METHOD-API-001, METHOD-TEST-001

### Changes

1. Added `overduePromises` to Employee Today, derived from visible active task
   rows where `isCustomerPromise` is true and `dueAt` is before `now`.
2. Added `overduePromises` to Manager Control Room using the already branch-
   scoped manager task set.
3. Added `promiseKpi` to Manager Control Room with open promise and overdue
   promise counts derived from the same scoped rows; no counters were stored.
4. Updated task DTOs, focused tests, API-suite tests, and canonical OpenAPI.

### Verification

- Passed: `node --import tsx --test apps/api/src/modules/tasks/tasks.service.spec.ts apps/api/src/modules/tasks/tasks.controller.spec.ts`
  (14/14).
- Passed: `corepack pnpm test:api -- tasks` (10/10).
- Passed: `corepack pnpm typecheck`.
- Passed: `corepack pnpm openapi:check`.
- Passed: `corepack pnpm lint`.
- Passed: `corepack pnpm test` (58/58).
- Passed: `git diff --check`; only CRLF normalization warnings were printed.
- Not Run: live runtime API proof and web proof. These remain deferred until
  local stack repair.

### Security Self-Check

- Roles and branch scope from server session, never client input: no new route
  was added; Today still derives actor ID from `request.principal`, and Manager
  Control Room still derives role/branch from the server principal.
- State change history + audit in same transaction: not applicable; P10-05B is
  read-only and adds no state changes.
- No passwords, OTPs, tokens, hashes, or provider secrets are logged or returned:
  the new fields expose only task DTOs already visible through the same scoped
  reads and aggregate promise counts.
- Customer portal exposure rules: no portal route or public task exposure was
  added.
- Trust boundaries tested: task API suite covers manager allowed, ordinary
  employee denied, cross-branch denied/audited, and overdue promise surfacing
  from scoped task rows; focused service tests cover Employee Today and Control
  Room derived promise buckets.

## P10-06A Generalize Complaint Into Case Schema + Migration

- Date: 2026-06-20
- Risk: High
- Status: Passed locally / runtime and web proof deferred
- Builder tier: BUILDER-STRONG
- SRS IDs: REQ-RBAC-001, NFR-SEC-002, REQ-REPORT-001, METHOD-MODULAR-001,
  METHOD-API-001, METHOD-TEST-001, NFR-MAINT-001

### Changes

1. Added additive Prisma `Case` and `CaseLink` models with `CaseType`, link
   entity types, branch, owner, status, subject, descriptions, timestamps, and
   indexes.
2. Added a SQL migration creating `cases` and `case_links` plus enum types,
   foreign keys, uniqueness, and lookup indexes.
3. Extended the schema proof gate so Case and CaseLink remain part of the core
   model contract.
4. Left the existing Complaint model, complaint APIs, and workflow tables
   untouched for P10-06C regression.

### Verification

- Passed: `corepack pnpm prisma:validate`.
- Failed then fixed: `node --test tools/schema-check.test.mjs` initially failed
  because the negative-test expected error ordering did not match the new Case
  checks; after aligning the assertion order, it passed (3/3).
- Passed: `node --test tools/schema-check.test.mjs` (3/3).
- Passed: `corepack pnpm typecheck`.
- Passed: `corepack pnpm openapi:check`.
- Passed: `corepack pnpm lint`.
- Passed: `corepack pnpm test` (58/58).
- Passed: `git diff --check`; only CRLF normalization warnings were printed.
- Not Run: live DB migration apply, runtime API proof, and web proof. These
  remain deferred until local stack repair.

### Security Self-Check

- Roles and branch scope from server session, never client input: no new route
  or service authority was added; Case rows include `branchId` for future
  server-scoped reads and writes.
- State change history + audit in same transaction: not applicable; P10-06A is
  schema-only and adds no application state-change path.
- No passwords, OTPs, tokens, hashes, or provider secrets are logged or returned:
  no runtime logging or API exposure was added.
- Customer portal exposure rules: no portal route or public Case exposure was
  added.
- Trust boundaries tested: schema proof covers the new Case/CaseLink boundary;
  existing root tests and OpenAPI drift checks still pass with current complaint
  routes unchanged.

## P10-06B Case Tasks + Timeline + Links Service Tests

- Date: 2026-06-20
- Risk: High
- Status: Passed locally / runtime and web proof deferred
- Builder tier: BUILDER-STRONG
- SRS IDs: REQ-RBAC-001, NFR-SEC-002, REQ-REPORT-001, METHOD-MODULAR-001,
  METHOD-API-001, METHOD-TEST-001, NFR-MAINT-001

### Changes

1. Generated the `cases` module boundary and wired `CasesModule` into the API
   module graph.
2. Added `CasesRepository` persistence for `cases` and `case_links`.
3. Added `CasesService.createDraft`, `timeline`, and `taskLinkForCase` with
   validated links and a task-link DTO using `TaskLinkEntityType.CASE`.
4. Added `CASE` to task links and allowed case-linked promise tasks.

### Verification

- Passed: `corepack pnpm --dir packages/database exec prisma generate --schema prisma/schema.prisma`.
- Passed: `node --import tsx --test apps/api/src/modules/cases/cases.service.spec.ts apps/api/src/modules/cases/cases.controller.spec.ts`
  (5/5).
- Passed: `corepack pnpm prisma:validate`.
- Passed: `corepack pnpm openapi:check`.
- Failed then fixed: `corepack pnpm typecheck` initially failed because a test
  fixture returned selected case links without `createdAt`; the fixture now
  matches the repository select shape.
- Passed: `corepack pnpm typecheck`.
- Passed: `corepack pnpm lint`.
- Passed: `corepack pnpm test` (58/58).
- Passed: `git diff --check`; only CRLF normalization warnings were printed.
- Not Run: live DB migration apply, runtime API proof, and web proof. These
  remain deferred until local stack repair.

### Security Self-Check

- Roles and branch scope from server session, never client input: no HTTP route
  was added; service inputs require server-provided branch/owner values in
  future guarded call sites, and Case rows carry `branchId`.
- State change history + audit in same transaction: P10-06B adds draft service
  behavior only and no public mutation route yet; P10-06C must decide the
  persisted audit/timeline pattern before exposing writes.
- No passwords, OTPs, tokens, hashes, or provider secrets are logged or returned:
  the service returns only case metadata, links, timestamps, and a task-link DTO.
- Customer portal exposure rules: no portal route or public Case exposure was
  added.
- Trust boundaries tested: focused cases tests cover case-without-vehicle,
  empty/invalid link denial, timeline shape, and task/case link validation.

## P10-06C Complaint Regression + Case-Without-Vehicle Authority Proof

- Date: 2026-06-20
- Risk: High
- Status: Passed locally / runtime and web proof deferred
- Builder tier: BUILDER-STRONG
- SRS IDs: REQ-RBAC-001, NFR-SEC-002, METHOD-AUDIT-001, METHOD-MODULAR-001,
  METHOD-API-001, METHOD-TEST-001, ARCH-WORKFLOW-001

### Changes

1. Added workflow API-suite regression coverage proving invalid complaint
   transitions are rejected before repository writes.
2. Added controller regression coverage proving transition actor role/actor ID
   are derived from the server principal, not client-owned body fields.
3. Re-ran the focused cases service proof for case-without-vehicle, link
   validation, timeline shape, and task/case link DTO behavior.

### Verification

- Passed: `corepack pnpm test:api -- workflow` (41/41).
- Passed: `node --import tsx --test apps/api/src/modules/cases/cases.service.spec.ts apps/api/src/modules/cases/cases.controller.spec.ts`
  (5/5).
- Passed: `corepack pnpm openapi:check`.
- Passed: `corepack pnpm lint`.
- Failed then fixed: `corepack pnpm typecheck` initially failed on an
  over-narrowed redundant case spec assertion; after removing it, typecheck
  passed.
- Passed: `corepack pnpm typecheck`.
- Passed: `corepack pnpm test` (58/58).
- Passed: `git diff --check`; only CRLF normalization warnings were printed.
- Not Run: live DB migration apply, runtime API proof, and web proof. These
  remain deferred until local stack repair.

### Security Self-Check

- Roles and branch scope from server session, never client input: the new
  transition route regression proves spoofed `actorRole`/`actorId` body fields
  are ignored and server principal role/actor are passed to the service.
- State change history + audit in same transaction: existing workflow API-suite
  tests still pass, including transition status-history and audit in the same
  transaction.
- No passwords, OTPs, tokens, hashes, or provider secrets are logged or returned:
  tests add no logging or API exposure.
- Customer portal exposure rules: existing workflow/portal complaint tests still
  pass; no new portal Case exposure was added.
- Trust boundaries tested: workflow suite covers invalid transition denial,
  server-owned transition authority, branch-scope denial/audit, and the existing
  allowed workflow transition paths.

## P10-07A1 Task/Promise KPI Formulas From Task Events

- Date: 2026-06-20
- Risk: High
- Status: Passed locally
- Builder tier: BUILDER-STRONG
- SRS IDs: REQ-REPORT-001, REQ-RBAC-001, NFR-SEC-002, METHOD-MODULAR-001,
  METHOD-API-001, METHOD-TEST-001

### Changes

1. Added a pure reports-side task/promise KPI helper.
2. Derived on-time completion percent, active overdue count, average delay
   hours, and customer-promise kept percent from task rows plus DONE
   status-history events.
3. Added focused tests proving event-derived completion, late/on-time math,
   active overdue handling, empty denominator zeroes, and no closed-count
   leaderboard surface.

### Verification

- Passed: `node --import tsx --test apps/api/test/reports/kpi-read-model.test.ts`
  (4/4).
- Passed: `corepack pnpm test:api -- reports` (11/11).
- Passed: `corepack pnpm typecheck`.
- Passed: `corepack pnpm openapi:check`.
- Passed: `corepack pnpm lint`.
- Passed: `corepack pnpm test` (58/58).
- Passed: `git diff --check`.

### Security Self-Check

- Roles and branch scope from server session, never client input: no HTTP route
  or service authority was added; P10-07A2/A4 will wire manager/admin scoped
  reads.
- State change history + audit in same transaction: not applicable; this is a
  read-only helper and introduces no state changes.
- No passwords, OTPs, tokens, hashes, or provider secrets are logged or
  returned: the helper has no logging and returns only numeric aggregate KPIs.
- Customer portal exposure rules: no portal route, comments, audit rows, DMS
  codes, staff PII, or customer-facing surface was added.
- Trust boundaries tested: no new trust boundary exists in this pure helper;
  focused tests prove no individual closed-count leaderboard is exposed, and
  existing reports RBAC/branch-scope route tests still pass.

## P10-07A2 Task/Promise KPI ReportsService Wiring

- Date: 2026-06-20
- Risk: High
- Status: Passed locally
- Builder tier: BUILDER-STRONG
- SRS IDs: REQ-REPORT-001, REQ-RBAC-001, NFR-SEC-002, METHOD-MODULAR-001,
  METHOD-API-001, METHOD-TEST-001

### Changes

1. Added a read-only reports repository query for task KPI rows and task
   status-history events.
2. Wired `ReportsService.taskPromiseKpis` to derive task/promise KPIs through
   the P10-07A1 helper.
3. Documented the reports module's read-only `tasks` / `task_status_history`
   reporting boundary.
4. Added tests proving branch-manager scope, admin all-branch behavior,
   event-derived completion, and no individual closed-count leaderboard output.

### Verification

- Passed: `node --import tsx --test apps/api/test/reports/kpi-read-model.test.ts`
  (6/6).
- Passed: `corepack pnpm test:api -- reports` (13/13).
- Passed: `corepack pnpm typecheck`.
- Passed: `corepack pnpm openapi:check`.
- Passed: `corepack pnpm lint`.
- Passed: `corepack pnpm test` (58/58).
- Passed: `git diff --check`; only CRLF normalization warnings were printed.

### Security Self-Check

- Roles and branch scope from server session, never client input:
  `ReportsService.taskPromiseKpis` accepts the server-side report scope and the
  focused tests prove branch-manager reads pass `branch-a` while admin reads pass
  all-branch scope (`null`); no client-owned task filter was added.
- State change history + audit in same transaction: not applicable; this is a
  read-only service method and repository query with no state changes.
- No passwords, OTPs, tokens, hashes, or provider secrets are logged or
  returned: the service returns only numeric aggregate KPI values and adds no
  logging.
- Customer portal exposure rules: no portal route or customer-facing surface was
  added, and the read model does not expose internal comments, audit rows, DMS
  codes, or staff PII.
- Trust boundaries tested: focused tests cover scoped manager branch reads and
  admin all-branch reads; existing reports route RBAC/branch-scope denial and
  audit tests still pass.

## P10-07A3 Complaint/Case KPI Formulas From Timeline Events

- Date: 2026-06-20
- Risk: High
- Status: Passed locally
- Builder tier: BUILDER-STRONG
- SRS IDs: REQ-REPORT-001, REQ-RBAC-001, NFR-SEC-002, METHOD-MODULAR-001,
  METHOD-API-001, METHOD-TEST-001

### Changes

1. Added pure reports-side complaint/case KPI formulas for reopened count,
   escalation count, average first-response hours, and average resolution hours.
2. Derived reopened/resolution/first-response values from workflow timeline
   events and escalations from SLA breach events.
3. Added focused tests for reopened, escalation, first-response, resolution,
   empty denominators, and no closed-count leaderboard output.

### Verification

- Passed: `node --import tsx --test apps/api/test/reports/kpi-read-model.test.ts`
  (8/8).
- Passed: `corepack pnpm test:api -- reports` (15/15).
- Passed: `corepack pnpm typecheck`.
- Passed: `corepack pnpm openapi:check`.
- Passed: `corepack pnpm lint`.
- Passed: `corepack pnpm test` (58/58).
- Passed: `git diff --check`; only CRLF normalization warnings were printed.

### Security Self-Check

- Roles and branch scope from server session, never client input: no HTTP route
  or service authority was added in this formula-only slice; P10-07A4 wires the
  scoped route.
- State change history + audit in same transaction: not applicable; this is a
  pure read helper with no state changes.
- No passwords, OTPs, tokens, hashes, or provider secrets are logged or
  returned: the helper has no logging and returns only numeric aggregate KPIs.
- Customer portal exposure rules: no portal route or customer-facing surface was
  added, and no internal comments, audit rows, DMS codes, or staff PII are
  exposed.
- Trust boundaries tested: no new external trust boundary exists in this pure
  helper; focused tests prove aggregate output only, and existing reports
  RBAC/branch-scope tests still pass.

## P10-07A4 Scoped KPI HTTP Route And API Proof

- Date: 2026-06-20
- Risk: High
- Status: Passed locally
- Builder tier: BUILDER-STRONG
- SRS IDs: REQ-REPORT-001, REQ-RBAC-001, NFR-SEC-002, METHOD-MODULAR-001,
  METHOD-API-001, METHOD-TEST-001

### Changes

1. Added `GET /reports/kpis` for aggregate task/promise and complaint/case KPI
   values.
2. Wired `ReportsService.kpiSummary` through read-only reports repository rows
   and the event-derived KPI helpers.
3. Added read-only reports module boundary documentation for task, complaint,
   case, and SLA KPI source tables.
4. Updated the canonical OpenAPI contract and committed contract JSON for the
   aggregate-only KPI response.
5. Added API proof for manager/admin allow, employee deny, cross-branch
   denial/audit, server-principal scope derivation, and no closed-count
   leaderboard response fields.

### Verification

- Passed: `node --import tsx --test apps/api/test/reports/kpi-read-model.test.ts`
  (9/9).
- Passed: `corepack pnpm test:api -- reports` (21/21).
- Passed: `corepack pnpm typecheck`.
- Passed: `corepack pnpm openapi:check`.
- Passed: `corepack pnpm lint`.
- Passed: `corepack pnpm test` (58/58).
- Passed: `git diff --check`; only CRLF normalization warnings were printed.

### Security Self-Check

- Roles and branch scope from server session, never client input: the KPI
  controller derives role/branch from the authenticated request principal, and
  tests prove manager branch scope ignores a spoofed query branch while admin is
  allowed.
- State change history + audit in same transaction: not applicable; this is a
  read-only route and repository query. Existing RBAC denial audit behavior is
  covered for cross-branch denial.
- No passwords, OTPs, tokens, hashes, or provider secrets are logged or
  returned: the route returns only numeric aggregate KPI values and adds no
  logging.
- Customer portal exposure rules: no portal route or customer-facing surface was
  added; KPI responses contain no internal comments, audit rows, DMS codes,
  staff PII, or customer identifiers.
- Trust boundaries tested: reports API tests cover allowed manager/admin access,
  employee denial, cross-branch denial/audit, server-principal scope derivation,
  and aggregate-only OpenAPI/response shape.

## P10-08A CAPA Model And Service Tests

- Date: 2026-06-20
- Risk: High
- Status: Passed locally / live migration apply deferred
- Builder tier: BUILDER-STRONG
- SRS IDs: REQ-REPORT-001, REQ-RBAC-001, NFR-SEC-002, METHOD-MODULAR-001,
  METHOD-API-001, METHOD-TEST-001

### Changes

1. Added `CapaAction` persistence linked to `Case` and responsible
   `Department`, with root cause, corrective action, preventive action, due
   date, effectiveness check, and repeat flag fields.
2. Added SQL migration `20260620170000_capa_model`.
3. Added case-owned CAPA create/read service behavior with focused validation
   tests.
4. Declared `capa_actions` in the cases module boundary.

### Verification

- Failed then reran with required local env: `corepack pnpm --dir packages/database exec prisma validate --schema prisma/schema.prisma`
  initially failed because `DATABASE_URL` was unset.
- Passed: `$env:DATABASE_URL='postgresql://cms:cms@localhost:5432/cms_auto'; corepack pnpm --dir packages/database exec prisma validate --schema prisma/schema.prisma`.
- Passed: `$env:DATABASE_URL='postgresql://cms:cms@localhost:5432/cms_auto'; corepack pnpm --dir packages/database exec prisma generate --schema prisma/schema.prisma`.
- Passed: `node --import tsx --test apps/api/src/modules/cases/cases.service.spec.ts`
  (6/6).
- Passed: `corepack pnpm typecheck`.
- Passed: `corepack pnpm openapi:check`.
- Passed: `corepack pnpm lint`.
- Passed: `corepack pnpm test` (58/58).
- Passed: `git diff --check`; only CRLF normalization warnings were printed.
- Not Run: live DB migration apply remains deferred until local stack repair.

### Security Self-Check

- Roles and branch scope from server session, never client input: no public route
  was added; CAPA behavior is service-level only and future route wiring must
  derive scope from server principal.
- State change history + audit in same transaction: no public state-changing
  route was introduced in this slice, so route-level audit is not yet required.
- No passwords, OTPs, tokens, hashes, or provider secrets are logged or
  returned: CAPA service returns only case/CAPA accountability fields and adds
  no logging.
- Customer portal exposure rules: no portal route or customer-facing CAPA
  surface was added.
- Trust boundaries tested: focused tests cover required CAPA accountability
  field validation and read shape; route-level allowed/denied RBAC proof is
  deferred until a public CAPA route exists.

## P10-08B Repeat Issue Detection And CAPA In Case Detail

- Date: 2026-06-20
- Risk: High
- Status: Passed locally / live migration apply deferred
- Builder tier: BUILDER-STRONG
- SRS IDs: REQ-REPORT-001, REQ-RBAC-001, NFR-SEC-002, METHOD-MODULAR-001,
  METHOD-API-001, METHOD-TEST-001

### Changes

1. Surfaced CAPA actions in the case timeline/detail response.
2. Added a backend repeat issue signal based on current case customer links plus
   matching CAPA root cause on another case, with `repeatFlag` also treated as a
   repeat signal.
3. Added focused cases tests for CAPA timeline visibility and one repeat / one
   non-repeat case.

### Verification

- Passed: `node --import tsx --test apps/api/src/modules/cases/cases.service.spec.ts`
  (8/8).
- Passed: `corepack pnpm typecheck`.
- Passed: `corepack pnpm openapi:check`.
- Passed: `corepack pnpm lint`.
- Passed: `corepack pnpm test` (58/58).
- Passed: `git diff --check`; only CRLF normalization warnings were printed.
- Not Run: live DB migration apply remains deferred until local stack repair.

### Security Self-Check

- Roles and branch scope from server session, never client input: no public route
  was added; repeat detection and CAPA timeline data remain service-level.
- State change history + audit in same transaction: no public state-changing
  route was introduced in this slice.
- No passwords, OTPs, tokens, hashes, or provider secrets are logged or
  returned: timeline additions expose only CAPA accountability fields and repeat
  aggregate signal, with no logging.
- Customer portal exposure rules: no portal route or customer-facing CAPA/repeat
  surface was added.
- Trust boundaries tested: focused tests cover CAPA visibility and repeat versus
  non-repeat behavior. Route-level RBAC proof remains deferred until a public
  CAPA/case-detail route exposes the new fields.

## P10-09A Participant ACL And Confidential Case Read Enforcement

- Date: 2026-06-20
- Risk: Critical
- Status: Passed locally / live migration apply deferred
- Builder tier: BUILDER-STRONG
- SRS IDs: REQ-RBAC-001, NFR-SEC-002, METHOD-MODULAR-001, METHOD-API-001,
  METHOD-TEST-001

### Changes

1. Added case confidentiality and participant ACL primitives, including accused
   participant role, to Prisma and the cases module boundary.
2. Wired case repository create/read selections for confidentiality and
   participants.
3. Added `CasesService.timelineForActor` to enforce confidential case reads at
   the service/query boundary.
4. Denied accused/conflicted users before role/owner allows and wrote SECURITY
   audit records for denied confidential reads.
5. Added focused tests for one allowed confidential participant path and one
   denied accused/audited path.

### Verification

- Failed then reran after required local Prisma client generation:
  `node --import tsx --test apps/api/src/modules/cases/cases.service.spec.ts`
  initially failed because the generated Prisma client did not yet include the
  new case ACL enums.
- Passed: `$env:DATABASE_URL='postgresql://cms:cms@localhost:5432/cms_auto'; corepack pnpm --dir packages/database exec prisma validate --schema prisma/schema.prisma`.
- Passed: `$env:DATABASE_URL='postgresql://cms:cms@localhost:5432/cms_auto'; corepack pnpm --dir packages/database exec prisma generate --schema prisma/schema.prisma`.
- Passed: `node --import tsx --test apps/api/src/modules/cases/cases.service.spec.ts`
  (10/10).
- Passed: `corepack pnpm typecheck`.
- Passed: `corepack pnpm openapi:check`.
- Passed: `corepack pnpm lint`.
- Passed: `corepack pnpm test` (58/58).
- Passed: `git diff --check`; only CRLF normalization warnings were printed.
- Not Run: live DB migration apply remains deferred until local stack repair.

### Security Self-Check

- Roles and branch scope from server session, never client input: no HTTP route
  was added; the new actor-aware case read method requires a server-supplied
  actor and enforces admin, branch, owner, and participant checks in the backend.
- State change history + audit in same transaction: no state change was added;
  denied confidential reads write SECURITY audit entries before throwing.
- No passwords, OTPs, tokens, hashes, or provider secrets are logged or
  returned: denial audit metadata contains only reason and case branch id.
- Customer portal exposure rules: no portal route or customer-facing case
  surface was added; confidential case data remains backend-only.
- Trust boundaries tested: focused tests cover an allowed confidential
  participant read and an accused/conflicted denial with SECURITY audit.

## P10-09B Employee-Grievance Case Type And Confidential Lifecycle

- Date: 2026-06-20
- Risk: Critical
- Status: Passed locally / live migration apply deferred
- Builder tier: BUILDER-STRONG
- SRS IDs: REQ-RBAC-001, NFR-SEC-002, METHOD-MODULAR-001, METHOD-API-001,
  METHOD-TEST-001

### Changes

1. Added `EMPLOYEE_GRIEVANCE` case type with confidential lifecycle statuses.
2. Added restricted case notes and case lifecycle history persistence.
3. Added `CasesService.createEmployeeGrievance` with confidential HR-review
   defaults.
4. Added confidential lifecycle transition validation with lifecycle history and
   WORKFLOW audit written in the same repository transaction.
5. Added restricted-note visibility only through the actor-aware confidential
   timeline read path.
6. Split case ACL/lifecycle policy helpers out of the service to keep source
   files under the agentic size budget.

### Verification

- Passed: `$env:DATABASE_URL='postgresql://cms:cms@localhost:5432/cms_auto'; corepack pnpm --dir packages/database exec prisma validate --schema prisma/schema.prisma`.
- Passed: `$env:DATABASE_URL='postgresql://cms:cms@localhost:5432/cms_auto'; corepack pnpm --dir packages/database exec prisma generate --schema prisma/schema.prisma`.
- Passed: `node --import tsx --test apps/api/src/modules/cases/cases.service.spec.ts`
  (13/13).
- Passed: `corepack pnpm typecheck`.
- Passed: `corepack pnpm openapi:check`.
- Passed: `corepack pnpm lint`.
- Passed: `corepack pnpm test` (58/58).
- Passed: `git diff --check`; only CRLF normalization warnings were printed.
- Not Run: live DB migration apply remains deferred until local stack repair.

### Security Self-Check

- Roles and branch scope from server session, never client input: no HTTP route
  was added; employee-grievance reads and lifecycle updates require the
  server-supplied actor and reuse the backend participant/conflict ACL.
- State change history + audit in same transaction: confidential lifecycle
  transitions write `case_lifecycle_history` and a WORKFLOW audit record inside
  the same repository transaction.
- No passwords, OTPs, tokens, hashes, or provider secrets are logged or
  returned: restricted-note reads return only note body/author/timestamp to
  authorized actors, and audit metadata contains lifecycle status codes only.
- Customer portal exposure rules: no portal route or customer-facing surface was
  added; restricted notes are omitted from the old non-actor timeline path.
- Trust boundaries tested: focused tests cover allowed restricted-note access,
  accused/conflicted denial with SECURITY audit, and invalid lifecycle rejection.

## P10-10A Dealership Seed Data

- Date: 2026-06-20
- Risk: High
- Status: Passed locally / live seed run deferred
- Builder tier: BUILDER-STRONG
- SRS IDs: REQ-RBAC-001, NFR-SEC-002, METHOD-MODULAR-001, METHOD-TEST-001

### Changes

1. Extended the dev seed with Phase 10 dealership demo rows: two deals, one
   stuck deal, overdue promise/internal tasks, and a confidential employee case.
2. Linked seeded vehicles to customers for realistic automotive demo data.
3. Seeded confidential task/case ACL participants, including accused denial
   intent on the employee grievance case.
4. Split Phase 10 seed rows into `phase10-seed.ts` to keep seed source files
   under the 300-line budget.
5. Added a focused static seed-shape test for demo data and confidential ACL
   intent without requiring a live database.

### Verification

- Passed: `node --import tsx --test apps/api/test/seed/dealership-seed.test.ts`
  (1/1).
- Passed: `corepack pnpm typecheck`.
- Passed: `corepack pnpm openapi:check`.
- Passed: `corepack pnpm lint`.
- Passed: `corepack pnpm test` (58/58).
- Passed: `git diff --check`; only CRLF normalization warnings were printed.
- Not Run: live `db:seed` remains deferred until local stack repair.

### Security Self-Check

- Roles and branch scope from server session, never client input: seed data adds
  role/user rows only; no route or client-trusted authorization was added.
- State change history + audit in same transaction: not applicable to static
  seed-shape proof; no runtime state-changing service behavior was added.
- No passwords, OTPs, tokens, hashes, or provider secrets are logged or
  returned: the seed keeps the existing dev-only Argon2id-shaped hash constant
  and adds no plaintext password or provider secret.
- Customer portal exposure rules: no portal route or customer-facing surface was
  added; confidential seed rows use backend ACL primitives only.
- Trust boundaries tested: focused seed test proves confidential task/case ACL
  markers, including accused participant intent, are present in the seed.

## Local Stack Repair For Phase 10 Stack Tasks

- Date: 2026-06-20
- Risk: High
- Status: Passed locally
- Builder tier: BUILDER-STRONG
- SRS IDs: ARCH-STACK-001, ARCH-DATA-001, METHOD-TEST-001

### Changes

1. Freed local C: disk from under 100 MB to about 21 GB by deleting generated
   build/package/temp caches only.
2. Restarted Docker Desktop and confirmed the Docker engine is reachable.
3. Started local project Postgres and Redis with compose project
   `cms-forge-local`. Host Postgres uses port 5433 because the Windows
   PostgreSQL service still owns 5432.
4. Applied all Prisma migrations to
   `postgres://cms_auto:cms_auto_dev@localhost:5433/cms_auto`.
5. Fixed `db:seed` workspace scripts so the root command delegates to
   `packages/database`, where Prisma is actually installed.
6. Seeded Phase 10 dealership demo data through the documented root command.
7. Recompiled and started the API on port 3000, then started the web app on port
   4000 against that API.

### Verification

- Passed: `docker version` after Docker Desktop restart.
- Passed: `docker exec cms-forge-local-postgres-1 pg_isready -U cms_auto -d cms_auto`.
- Passed: `docker exec cms-forge-local-redis-1 redis-cli ping`.
- Passed: `$env:DATABASE_URL='postgres://cms_auto:cms_auto_dev@localhost:5433/cms_auto'; corepack pnpm --dir packages/database exec prisma validate --schema prisma/schema.prisma`.
- Passed: `$env:DATABASE_URL='postgres://cms_auto:cms_auto_dev@localhost:5433/cms_auto'; corepack pnpm --dir packages/database exec prisma generate --schema prisma/schema.prisma`.
- Passed: `$env:DATABASE_URL='postgres://cms_auto:cms_auto_dev@localhost:5433/cms_auto'; corepack pnpm --dir packages/database exec prisma migrate deploy --schema prisma/schema.prisma`.
- Passed: `$env:DATABASE_URL='postgres://cms_auto:cms_auto_dev@localhost:5433/cms_auto'; corepack pnpm --dir packages/database exec prisma migrate status --schema prisma/schema.prisma`.
- Passed: `$env:DATABASE_URL='postgres://cms_auto:cms_auto_dev@localhost:5433/cms_auto'; corepack pnpm db:seed`.
- Passed: `corepack pnpm exec tsc -p apps/api/tsconfig.json`.
- Passed: `Invoke-WebRequest http://localhost:3000/health` returned 200 with
  database and Redis configured.
- Passed: `Invoke-WebRequest http://localhost:4000/?locale=en` returned 200.

### Notes

- Windows service `postgresql-x64-16` could not be stopped from this shell and
  still owns host port 5432. The Docker database is intentionally exposed on
  host port 5433 for Forge/runtime proof.
- Dev seed users intentionally have no documented plaintext password in the
  seed; login proof should use the intended auth/reset path or add an explicit
  dev credential task if product owners want one.

## P10-01D Employee Today Screen And Runtime Proof

- Date: 2026-06-21
- Risk: Medium
- Status: Passed locally
- Builder tier: BUILDER-STRONG
- SRS IDs: REQ-RBAC-001, REQ-LOCALIZATION-001, UI-DESIGN-001, METHOD-TEST-001

### Changes

1. Added a typed web API client for the existing `GET /tasks/today` read model.
   The client forwards only the staff session cookie and does not add role,
   actor, workflow, or branch authority from the browser.
2. Added `/tasks/today` with loading, empty, error, English LTR, and Arabic RTL
   states, rendering the server-provided Employee Today buckets: overdue, due
   today, waiting on me, assigned to me, and overdue promises.
3. Added `Employee Today` as the first staff navigation item and made signed-in
   non-readonly staff land on `/tasks/today` from the root shell.
4. Split Employee Today screen copy into `staff-employee-today.ts` so
   `staff-shell.ts` stays at the 300-line source budget.
5. Saved runtime visual proof at `output/playwright/employee-today.png`.

### Verification

- Passed: `$env:DATABASE_URL='postgres://cms_auto:cms_auto_dev@localhost:5433/cms_auto'; corepack pnpm db:seed`.
- Passed: `corepack pnpm lint`.
- Passed: `corepack pnpm typecheck`.
- Passed: `corepack pnpm test:web -- shell` (167/167).
- Passed: `Invoke-WebRequest http://localhost:3000/health` returned healthy API,
  database, and Redis configuration.
- Passed: `Invoke-WebRequest http://localhost:4000/tasks/today?locale=en`
  returned 200.
- Passed: browser runtime smoke with Playwright fallback at
  `http://localhost:4000/tasks/today?locale=en`, using a temporary local
  `cms_staff_session` for seeded `officer.main@cms-auto.test`. Snapshot showed
  Employee Today navigation and real seeded task buckets from the API.
- Passed: browser console check; only normal React DevTools / HMR dev messages
  were present, with no hydration or runtime errors.

### Notes

- The in-app browser connector could not be used because it failed with
  `codex/sandbox-state-meta: missing field sandboxPolicy`; terminal Playwright
  was used instead.
- The temporary Playwright auth storage file was deleted after proof, the proof
  browser was closed, and the temporary local staff session row was removed.
- The existing Employee Today API does not expose a separate employee-level
  `escalated` bucket; the UI renders only server-provided read-model sections
  and does not derive escalation in React.

### Security Self-Check

- Roles and branch scope from server session, never client input: Passed. The
  web client calls `/tasks/today` with the session cookie only, and tests assert
  no role, actor, workflow, or branch query authority.
- State change history + audit in same transaction: not applicable; this task
  adds a read-only web screen and no workflow mutation.
- No passwords, OTPs, tokens, hashes, or provider secrets are logged or
  returned: Passed. Runtime proof used a temporary local session without
  printing the raw cookie value, and cleanup removed the storage-state artifact.
- Customer portal exposure rules: not applicable; no customer portal surface was
  changed.
- Trust boundaries tested: Passed. Web tests cover real data, denied access,
  empty state, Arabic RTL, and cookie forwarding to the backend read model.

## P10-02B Manager Control Room Screen And Web Proof

- Date: 2026-06-21
- Risk: Medium
- Status: Passed locally
- Builder tier: BUILDER-STRONG
- SRS IDs: REQ-RBAC-001, REQ-LOCALIZATION-001, UI-DESIGN-001, METHOD-TEST-001

### Changes

1. Added a typed web API client for `GET /tasks/manager-rollup`. It forwards
   only the staff session cookie and does not send role, actor, workflow, owner,
   or branch authority from React.
2. Added `/tasks/manager` with loading, empty, error, English LTR, and Arabic
   RTL states, rendering the server-provided overdue-by-employee, due-today,
   stuck, workload-by-assignee, escalated, overdue-promise, and promise-KPI
   sections from real API data.
3. Added Manager Control Room navigation for manager/admin-capable roles and
   kept staff/basic navigation hidden.
4. Split manager control-room copy into `staff-manager-control-room.ts` so the
   shell localization file stays under the enforced source budget.
5. Saved runtime visual proof at `output/playwright/manager-control-room.png`.

### Verification

- Passed: `$env:DATABASE_URL='postgres://cms_auto:cms_auto_dev@localhost:5433/cms_auto'; corepack pnpm db:seed`.
- Failed then Passed: `corepack pnpm lint`. Initial failure was
  `staff-shell.ts` exceeding 300 lines; fixed by splitting manager screen copy.
- Failed then Passed: `corepack pnpm typecheck`. Initial failure was optional
  stuck-task response parsing; fixed by requiring `stuckReasons` to be an array.
- Passed: `corepack pnpm test:web -- shell` (170/170).
- Passed: `Invoke-WebRequest http://localhost:3000/health` returned healthy API,
  database, and Redis configuration.
- Passed: `Invoke-WebRequest http://localhost:4000/tasks/manager?locale=en`
  returned 200.
- Passed: browser runtime smoke at
  `http://localhost:4000/tasks/manager?locale=en`, using a temporary local
  `cms_staff_session` for seeded `cr.manager@cms-auto.test`. Snapshot showed
  Manager Control Room navigation and real seeded rollup sections from the API.
- Passed: browser console check returned zero warnings and zero errors.

### Notes

- The Playwright CLI wrote the screenshot to its scratch directory first; it was
  copied into `output/playwright/manager-control-room.png`, then the scratch
  directory was removed.
- Temporary local staff session rows created for runtime proof were deleted.

### Security Self-Check

- Roles and branch scope from server session, never client input: Passed. The web
  client calls `/tasks/manager-rollup` with the session cookie only, and tests
  assert no role, actor, workflow, owner, branch, token, or credential query
  authority.
- State change history + audit in same transaction: not applicable; this task
  adds a read-only web screen and no workflow mutation.
- No passwords, OTPs, tokens, hashes, or provider secrets are logged or returned:
  Passed. Runtime proof used a temporary local session without recording the raw
  cookie value, and cleanup deleted proof session rows.
- Customer portal exposure rules: not applicable; no customer portal surface was
  changed.
- Trust boundaries tested: Passed. Web tests cover manager/admin navigation,
  staff-hidden navigation, real rollup data, denied access, empty state, Arabic
  RTL, and cookie-only forwarding to the backend read model.

## P10-03B Reminder Escalation Worker Wiring

- Date: 2026-06-21
- Risk: High
- Status: Passed locally
- Builder tier: BUILDER-STRONG
- SRS IDs: REQ-RBAC-001, NFR-OBS-001, METHOD-TEST-001

### Changes

1. Added `tasks.escalation.scan` to the existing BullMQ notifications worker
   schedule. The worker derives manager scope internally as Admin/global for the
   scan and ignores any role or branch fields in the job payload.
2. Reused the existing backend manager rollup plus the P10-03A pure escalation
   selector to identify due-soon/overdue task escalation candidates.
3. Queued in-app escalation notifications through `NotificationsService` with a
   stable `task-escalation:{taskId}:{level}:{triggerAt}` idempotency key.
4. Added idempotent internal notification queuing: repeat runs return the
   existing in-app notification for the same template, recipient, and key instead
   of creating a duplicate row.
5. Added focused worker and notification tests for backend-owned scope,
   escalation queueing, scheduler registration, and duplicate suppression.

### Verification

- Passed: `$env:DATABASE_URL='postgres://cms_auto:cms_auto_dev@localhost:5433/cms_auto'; corepack pnpm db:seed`.
- Passed: `corepack pnpm lint`.
- Passed: `corepack pnpm typecheck`.
- Passed: `corepack pnpm test:api -- tasks` (10/10).
- Passed: `node --import tsx --test apps/api/test/worker/task-escalation-runner.test.ts apps/api/test/worker/notification-runner.test.ts apps/api/test/notifications/queue.test.ts` (12/12).
- Passed: `corepack pnpm test` (58/58 with coverage gates).
- Failed then Passed: local Redis scheduler smoke. The first inline smoke failed
  before Redis because `bullmq` is not exposed at the workspace root. Re-ran via
  `corepack pnpm --dir apps/api exec ...`, matching the API package dependency
  graph, and verified BullMQ registered `tasks.escalation.scan` on the
  `notifications` queue with `every=5000`.
- Passed: `corepack pnpm test:api -- notifications` (41/41).

### Notes

- Daily employee digest and manager-rollup batching were not implemented in this
  slice. Existing primitives support single recipient/event notifications, but
  not a digest window, recipient grouping, or rollup batching contract within the
  1-5 file scope. Follow-up task P10-03C records that work explicitly.
- The worker does not add a new scheduler framework or provider; it reuses the
  Phase-8 BullMQ worker and notification service.

### Security Self-Check

- Roles and branch scope from server session/backend authority, never client
  input: Passed. The worker scan creates its own backend manager scope and tests
  assert hostile job payload scope is ignored.
- State change history + audit in same transaction: not applicable for the scan
  decision itself; notification rows are queued through the existing backend
  notification service after the decision.
- No passwords, OTPs, tokens, hashes, credentials, or provider secrets logged or
  stored in notification payloads: Passed. Payload validation still rejects
  secret-like keys, and the idempotency key contains only task/window metadata.
- Customer portal exposure rules: not applicable; no portal route or public data
  surface changed.
- Trust boundaries tested: Passed. Tests cover one queued escalation, idempotent
  duplicate suppression, scheduler registration, and worker payload scope denial.

## P10-03C Digest And Manager Rollup Notification Batching

- Date: 2026-06-21
- Risk: High
- Status: Passed locally
- Builder tier: BUILDER-STRONG
- SRS IDs: REQ-RBAC-001, REQ-NOTIFY-001, SLA-CALENDAR-001, ARCH-INTEGRATION-001, NFR-OBS-001, METHOD-TEST-001

### Changes

1. Added a backend-owned daily UTC digest window contract for task notifications:
   `task-digest:employee:{userId}:{yyyy-mm-dd}` for employee digests and
   `task-rollup:manager:{yyyy-mm-dd}` for manager rollups.
2. Wired the Phase-8 notifications worker to schedule and execute
   `tasks.notification.batch` through the existing BullMQ notifications queue.
3. Reused `TasksService.managerControlRoom` for backend manager scope and
   `TasksService.employeeToday` for employee digest payloads; the worker does
   not query task rows directly or trust job payload role/branch fields.
4. Queued in-app digest/rollup rows through `NotificationsService.queueInternal`
   with stable idempotency keys and safe payload shapes.
5. Added focused tests for one employee digest, one manager rollup, idempotent
   rerun behavior, scheduler registration, and hostile worker payload scope.

### Verification

- Passed: `$env:DATABASE_URL='postgres://cms_auto:cms_auto_dev@localhost:5433/cms_auto'; corepack pnpm db:seed`.
- Passed: `corepack pnpm lint`.
- Passed: `corepack pnpm typecheck`.
- Passed: `corepack pnpm test:api -- tasks` (10/10).
- Passed: `corepack pnpm test:api -- notifications` (41/41).
- Passed: `node --import tsx --test apps/api/test/worker/task-escalation-runner.test.ts apps/api/test/worker/notification-runner.test.ts` (6/6).
- Passed: `corepack pnpm test` (58/58 with coverage gates).
- Passed: local Redis scheduler smoke via `corepack pnpm --dir apps/api exec ...`; BullMQ registered `tasks.notification.batch` on the `notifications` queue with `every=5000`.

### Notes

- No new provider, scheduler framework, workflow builder, AI, mobile, WhatsApp,
  or frontend authority was added.
- Manager rollup is queued as an internal manager-scope in-app row with no
  single user recipient until a later user-directory task defines explicit
  manager recipient expansion.

### Security Self-Check

- Roles and branch scope from server session/backend authority, never client
  input: Passed. The batch job derives `{ roleCode: ADMIN, branchId: null }`
  internally and tests assert hostile job payload role/branch values are ignored.
- State change history + audit in same transaction: not applicable; this task
  queues notification rows only and performs no workflow or task state mutation.
- No passwords, OTPs, tokens, hashes, credentials, or provider secrets logged or
  stored in notification payloads: Passed. Payload keys contain only window,
  task, count, scope, and recipient identifiers, and existing notification
  payload validation still rejects secret-like keys.
- Customer portal exposure rules: not applicable; no customer portal route or
  public payload surface changed.
- Trust boundaries tested: Passed. Focused worker tests cover employee digest
  recipient selection, manager rollup batching, duplicate suppression through
  stable idempotency keys, and worker payload scope denial.

## P10-04D Deal Handoff Board Screen And Web Test

- Date: 2026-06-21
- Risk: Medium
- Status: Passed locally
- Builder tier: BUILDER-STRONG
- SRS IDs: REQ-RBAC-001, ARCH-UI-001, UI-DESIGN-001, METHOD-TEST-001

### Changes

1. Added a typed staff web client for `GET /deals/handoff-board`; it forwards
   only the staff session cookie and parses the existing backend read model.
2. Added `/deals/handoff` with loading, empty, error, English LTR, and Arabic
   RTL states using the existing shadcn/ui card, badge, and table primitives.
3. Added Deal Handoff Board navigation for manager/admin-capable staff surfaces
   and kept staff/basic navigation hidden.
4. Added focused shell tests for real deal data rendering, denied/empty states,
   Arabic RTL labels, and cookie-only API forwarding.
5. Saved runtime visual proof at
   `output/playwright/deal-handoff-board.png`.

### Verification

- Passed: `$env:DATABASE_URL='postgres://cms_auto:cms_auto_dev@localhost:5433/cms_auto'; corepack pnpm db:seed`.
- Passed: `corepack pnpm lint`.
- Passed: `corepack pnpm typecheck`.
- Failed then Passed: `corepack pnpm test:web -- shell`. Initial failures were
  a bad route relative import and a missing preview-shell icon/route mapping for
  the new `handoff` nav key; both were fixed. Final run passed 173/173.
- Passed: `corepack pnpm test` (58/58 with coverage gates).
- Failed then Passed: local route/screenshot proof. Initial attempts failed
  because package-scoped scripts did not expose both Prisma and Playwright, then
  because the transient storage-state JSON had a BOM. Final run passed with
  route status 200, Chrome-channel Playwright screenshot saved, and temporary
  local staff session cleanup confirmed.

### Notes

- The screen renders the existing backend Deal Handoff Board read model; no deal
  stage/workflow authority was added to React.
- Runtime proof used a temporary local `cms_staff_session` for seeded
  `cr.manager@cms-auto.test`; the raw cookie value was not recorded in evidence
  and the session row was deleted after proof.

### Security Self-Check

- Roles and branch scope from server session, never client input: Passed. The web
  client calls `/deals/handoff-board` with only the session cookie, and tests
  assert no role, actor, workflow, branch, owner, token, or credential authority
  is sent in the URL.
- State change history + audit in same transaction: not applicable; this task is
  a read-only web screen and performs no deal/task state mutation.
- No passwords, OTPs, tokens, hashes, or provider secrets are logged or returned:
  Passed. Runtime proof avoided recording the raw cookie and removed the
  transient storage-state file plus local staff session row.
- Customer portal exposure rules: not applicable; no customer portal route or
  public data surface changed.
- Trust boundaries tested: Passed. Web tests cover manager-capable navigation,
  staff-hidden navigation, real handoff data, denied state, Arabic RTL, and
  cookie-only forwarding to the backend read model.

## P10-07B KPI Dashboard Screen And Web Test

- Date: 2026-06-21
- Risk: Medium
- Status: Passed locally
- Builder tier: BUILDER-STRONG
- SRS IDs: REQ-REPORT-001, REQ-RBAC-001, ARCH-UI-001, UI-DESIGN-001, METHOD-TEST-001

### Changes

1. Added a typed staff web client for `GET /reports/kpis`; it forwards only the
   staff session cookie and validates the backend KPI response shape.
2. Extended the existing `/reports` staff surface to render the event-derived
   accountability KPIs from the backend read model: on-time completion, active
   overdue, average delay, customer promises kept, reopened, escalations, first
   response, and resolution timing.
3. Kept Reports navigation unchanged and reused existing report/dashboard access
   surfaces; staff role preview still hides Reports.
4. Added English LTR and Arabic RTL labels plus no-KPI-data behavior for denied
   or missing-session reads.
5. Added focused web tests for real KPI data rendering, denied KPI access, and
   cookie-only forwarding.
6. Saved runtime visual proof at `output/playwright/kpi-dashboard.png`.

### Verification

- Passed: `corepack pnpm test:web -- shell` (174/174).
- Passed: `$env:DATABASE_URL='postgres://cms_auto:cms_auto_dev@localhost:5433/cms_auto'; corepack pnpm db:seed`.
- Passed: `corepack pnpm lint`.
- Passed: `corepack pnpm typecheck`.
- Passed: `corepack pnpm test` (58/58 with coverage gates).
- Passed: local API health check returned `{"status":"ok"}`.
- Passed: local `/reports?locale=en` route smoke with a temporary staff session
  returned status 200 and contained `Accountability KPIs`.
- Passed: Chrome-channel Playwright screenshot captured
  `output/playwright/kpi-dashboard.png`; temporary local staff session and
  storage-state files were removed after proof.

### Notes

- React renders the backend KPI read model only; it does not calculate KPI truth,
  branch filters, role filters, or closed-count leaderboards.
- Runtime proof used a temporary local `cms_staff_session` for seeded
  `cr.manager@cms-auto.test`; the raw cookie value was not recorded in evidence
  and the session row was deleted after proof.

### Security Self-Check

- Roles and branch scope from server session, never client input: Passed. The web
  client calls `/reports/kpis` with only the session cookie, and tests assert no
  role, actor, workflow, branch, owner, token, or credential authority is sent in
  the URL.
- State change history + audit in same transaction: not applicable; this task is
  a read-only web screen and performs no report/task/case state mutation.
- No passwords, OTPs, tokens, hashes, or provider secrets are logged or returned:
  Passed. Runtime proof avoided recording the raw cookie and removed the
  transient storage-state file plus local staff session row.
- Customer portal exposure rules: not applicable; no customer portal route or
  public data surface changed.
- Trust boundaries tested: Passed. Web tests cover report-capable access,
  staff-hidden Reports surface, real KPI data rendering, denied KPI data, Arabic
  RTL labels, and cookie-only forwarding to the backend read model.

## P10-09C1 Confidential Case Timeline HTTP Contract

- Date: 2026-06-21
- Risk: Critical
- Status: Passed locally
- Builder tier: BUILDER-STRONG
- SRS IDs: REQ-RBAC-001, NFR-SEC-002, METHOD-API-001, METHOD-AUDIT-001, METHOD-TEST-001

### Changes

1. Added authenticated `GET /cases/{caseId}/confidential-timeline` to the Cases
   controller.
2. Wired Cases module session auth through `AuthModule` and
   `SESSION_AUTH_SERVICE`; confidential read authorization stays in the case
   policy.
3. Kept ACL and redaction authority in `CasesService.timelineForActor`; the
   controller only derives actor context from the server session and delegates.
4. Added focused Cases controller tests for allowed confidential participant read
   with restricted notes and accused denial with SECURITY audit before notes can
   escape.
5. Registered the missing `test:api -- cases` suite by letting the API test
   runner discover module `*.spec.ts` files when no `apps/api/test/<suite>`
   folder exists.
6. Added the confidential timeline route and response schemas to canonical and
   generated OpenAPI JSON.

### Verification

- Passed: `$env:DATABASE_URL='postgres://cms_auto:cms_auto_dev@localhost:5433/cms_auto'; corepack pnpm db:seed`.
- Passed: `corepack pnpm lint`.
- Failed then Passed: `corepack pnpm typecheck`. Initial failure was an
  exact-optional-property mismatch in the test request helper; fixed by omitting
  `correlationId` when absent.
- Failed then Passed: `corepack pnpm test:api -- cases`. Initial failure was the
  missing suite registration; added the suite/fallback and final run passed
  16/16.
- Passed: `corepack pnpm openapi:check`.
- Passed: `corepack pnpm test` (58/58 with coverage gates).

### Notes

- No HR role was introduced; P10-09C1 uses the existing confidential participant
  ACL semantics because the current role model has no explicit HR role.
- No web screen was added; P10-09C2 will consume this route.

### Security Self-Check

- Roles and branch scope from server session, never client input: Passed. The
  controller builds actor context from `request.principal`; tests include hostile
  URL query authority and still authorize only by the session actor.
- State change history + audit in same transaction: not applicable for the read
  route. Denied confidential reads still write SECURITY audit through existing
  service policy before throwing.
- No passwords, OTPs, tokens, hashes, or provider secrets are logged or returned:
  Passed. The route returns case timeline DTOs only; tests assert denial before
  restricted notes are returned.
- Customer portal exposure rules: not applicable; no customer portal route or
  public data surface changed.
- Trust boundaries tested: Passed. Cases API tests cover allowed confidential
  participant read, accused denial/audit, restricted-note redaction, and no
  client-provided role/branch authority.

## P10-09C2 Confidential HR-Only Screen And Web Privacy Proof

- Date: 2026-06-21
- Risk: Critical
- Status: Passed locally
- Builder tier: BUILDER-STRONG
- SRS IDs: REQ-RBAC-001, NFR-SEC-002, ARCH-UI-001, UI-DESIGN-001, METHOD-TEST-001

### Changes

1. Added a typed staff web client for
   `GET /cases/{caseId}/confidential-timeline`; it forwards only the staff
   session cookie and validates the backend confidential timeline shape.
2. Added `/cases/confidential/[caseId]` staff route with loading, denied/error,
   no-note, English LTR, and Arabic RTL states.
3. Rendered restricted notes only from the backend actor-scoped response; no
   confidential ACL, role, branch, participant, or workflow logic was added to
   React.
4. Fixed the new cases HTTP route wiring so the controller, repository, service,
   and session guard resolve deterministically in the local Nest runtime.
5. Added focused web tests for real restricted-note rendering, denied/no-note
   privacy, Arabic RTL, and cookie-only forwarding.
6. Saved runtime visual proof at `output/playwright/confidential-case.png`.

### Verification

- Passed: `$env:DATABASE_URL='postgres://cms_auto:cms_auto_dev@localhost:5433/cms_auto'; corepack pnpm db:seed`.
- Passed: `corepack pnpm lint`.
- Passed: `corepack pnpm typecheck`.
- Passed: `corepack pnpm test:api -- cases` (16/16).
- Passed: `corepack pnpm test:web -- shell` (177/177).
- Passed: `corepack pnpm test` (58/58 with coverage gates).
- Failed then Passed: local API route smoke. Initial live smoke returned 500
  because the Cases HTTP route was relying on decorator metadata for guard and
  controller/service DI; fixed by narrowing the route to `SessionAuthGuard` plus
  backend case policy and adding explicit Cases module/controller injection.
- Passed: backend smoke returned status 200 and contained the seeded restricted
  note.
- Passed: web route smoke for
  `/cases/confidential/seed_case_employee_grievance?locale=en` returned status
  200, contained `Confidential case timeline`, contained the seeded restricted
  note, and had no role/actor/branch/owner/participant/token/credential query
  authority.
- Passed: Chrome-channel Playwright screenshot captured
  `output/playwright/confidential-case.png`; temporary local staff session and
  storage-state files were removed after proof.

### Notes

- No explicit HR role exists in the current role model. This screen uses a
  direct staff route plus backend confidential participant ACL; it was not added
  to broad staff navigation.
- The route is read-only. Accused/unauthorized confidential reads are still
  denied and audited by `CasesService.timelineForActor`/`assertCanReadCase`.

### Security Self-Check

- Roles and branch scope from server session, never client input: Passed. The web
  client calls the confidential route with only the session cookie, and tests
  assert no role, actor, workflow, branch, owner, participant, token, or
  credential authority is sent in the URL.
- State change history + audit in same transaction: not applicable; this task is
  read-only. Denied confidential reads still write SECURITY audit through the
  existing service policy before throwing.
- No passwords, OTPs, tokens, hashes, or provider secrets are logged or returned:
  Passed. Runtime proof avoided recording the raw cookie and removed the
  transient storage-state file plus local staff session row.
- Customer portal exposure rules: Passed. No customer portal route or public data
  surface changed; restricted notes stay on authenticated staff-only reads.
- Trust boundaries tested: Passed. Web tests cover allowed actor-scoped
  restricted-note rendering, denied/no-note states without private notes, Arabic
  RTL labels, and cookie-only backend forwarding.

## P10-10B1 Employee Today And Manager Control Room Local Proof

- Date: 2026-06-21
- Risk: High
- Status: Passed locally
- Builder tier: BUILDER-STRONG
- SRS IDs: REQ-RBAC-001, NFR-SEC-002, ARCH-UI-001, UI-DESIGN-001,
  METHOD-TEST-001, UAT-SCRIPT-001

### Changes

1. Proved the existing seeded Employee Today and Manager Control Room API/web
   surfaces against the local Docker Postgres/Redis stack.
2. Fixed runtime RBAC-denial auditing for `TasksModule` by wiring
   `AuditService` with the same explicit Prisma factory pattern used by auth and
   audit modules.
3. Added a focused tasks API regression that asserts the runtime tasks module
   provides Prisma-backed audit service wiring for RBAC denies.
4. Wrote sanitized route-smoke artifacts to `output/p10-10b1/`.

### Verification

- Passed: `$env:DATABASE_URL='postgres://cms_auto:cms_auto_dev@localhost:5433/cms_auto'; corepack pnpm db:seed`.
- Failed then Passed: `corepack pnpm test:api -- tasks`. Initial added
  metadata assertion did not hold under the test transpiler; replaced with a
  direct `TasksModule` provider-wiring assertion. Final run passed 11/11.
- Passed: `corepack pnpm test:web -- shell` (177/177).
- Passed: `corepack pnpm test` (58/58 with coverage gates).
- Passed: `corepack pnpm lint`.
- Passed: `corepack pnpm exec tsc -p apps/api/tsconfig.json --noEmit`.
- Passed: `corepack pnpm exec tsc -p apps/api/tsconfig.json`.
- Failed then Passed: live API route smoke. Initial employee denial for
  `GET /tasks/manager-rollup` returned 500 because RBAC denial audit used a
  runtime `AuditService` without Prisma injection in `TasksModule`; fixed by
  explicit provider factory. Final live smoke returned 403 for employee denial.
- Passed: live API `GET /tasks/today` with seeded
  `officer.main@cms-auto.test` session returned bucket counts
  dueToday=0, overdue=2, overduePromises=1, assignedToMe=1, waitingOnMe=1.
- Passed: live API `GET /tasks/manager-rollup` with seeded
  `cr.manager@cms-auto.test` session returned overdueByEmployee=2,
  dueToday=0, stuck=2, workloadByAssignee=2, escalated=2,
  overduePromises=1, promiseKpi open=1/overdue=1.
- Passed: live web route smokes for `/tasks/today?locale=en`,
  `/tasks/today?locale=ar`, `/tasks/manager?locale=en`, and
  `/tasks/manager?locale=ar` rendered seeded task signals and RTL Arabic.
- Passed: cleanup check found `p10_10b1_session_count=0`; `rg` found no
  `cms_staff_session`, token hash, password, secret, or credential strings in
  `output/p10-10b1`; no storage-state/cookie/session artifact files remained.

### Artifacts

- `output/p10-10b1/summary.json`
- `output/p10-10b1/api-tasks-today.json`
- `output/p10-10b1/api-manager-rollup.json`
- `output/p10-10b1/web-tasks-today-en.html`
- `output/p10-10b1/web-tasks-today-ar.html`
- `output/p10-10b1/web-tasks-manager-en.html`
- `output/p10-10b1/web-tasks-manager-ar.html`

### Notes

- Fixed seed dates mean the due-today buckets are empty on 2026-06-21; the
  seeded employee proof covers overdue, assigned-to-me, waiting-on-me, and
  overdue promise work.
- The API proof process started for the smoke was stopped after proof. The
  pre-existing web server on port 4000 was left alone.

### Security Self-Check

- Roles and branch scope from server session, never client input: Passed.
  `TasksController` derives actor/scope from `request.principal`; web clients
  forward only the staff session cookie, and tests assert no client role, actor,
  branch, owner, token, or credential authority is sent.
- State change history + audit in same transaction: not applicable for the
  read-only proof surfaces. The runtime denial path now writes SECURITY audit
  through a Prisma-backed `AuditService` before returning 403.
- No passwords, OTPs, tokens, hashes, or provider secrets are logged or
  returned: Passed. Raw cookies were kept in memory only, output artifacts are
  sanitized, and proof session rows were deleted.
- Customer portal exposure rules: not applicable; no customer portal route or
  public data surface changed.
- Trust boundaries tested: Passed. API tests cover manager/admin allow,
  ordinary employee deny, cross-branch deny with audit, and live proof confirms
  employee denial returns 403 on `/tasks/manager-rollup`.

## P10-10B2 Deal Handoff Board Local Proof

- Date: 2026-06-21
- Risk: High
- Status: Passed locally
- Builder tier: BUILDER-STRONG
- SRS IDs: REQ-RBAC-001, NFR-SEC-002, ARCH-UI-001, UI-DESIGN-001,
  METHOD-TEST-001, UAT-SCRIPT-001

### Changes

1. Proved the existing Deal Handoff Board API/web surfaces against the local
   Docker Postgres/Redis stack and P10-10A seeded dealership data.
2. Fixed runtime RBAC-denial auditing for `DealsModule` by wiring
   `AuditService` with explicit Prisma factory injection, matching the tasks
   module repair and existing auth/audit factory pattern.
3. Added a focused deals API regression that asserts the runtime deals module
   provides Prisma-backed audit service wiring for RBAC denies.
4. Wrote sanitized route-smoke artifacts to `output/p10-10b2/`.

### Verification

- Passed: `$env:DATABASE_URL='postgres://cms_auto:cms_auto_dev@localhost:5433/cms_auto'; corepack pnpm db:seed`.
- Passed: `corepack pnpm test:api -- deals` (8/8).
- Passed: `corepack pnpm test:web -- shell` (177/177).
- Passed: `corepack pnpm test` (58/58 with coverage gates).
- Passed: `corepack pnpm lint`.
- Passed: `corepack pnpm exec tsc -p apps/api/tsconfig.json --noEmit`.
- Passed: `corepack pnpm exec tsc -p apps/api/tsconfig.json`.
- Passed: live API `GET /deals/handoff-board` with seeded
  `branch.mgr.north@cms-auto.test` session returned stuck deal
  `seed_deal_stuck`, title `Sonata finance handoff`, stage `QUALIFIED`,
  blocker `Finance approval missing`, positive delay age, and holder matching
  the north branch manager session.
- Passed: live API branch-scope proof excluded main-branch `seed_deal_active`
  from the north branch manager's stuck board.
- Passed: live API denied proof returned 403 for seeded
  `officer.main@cms-auto.test` on `/deals/handoff-board`.
- Passed: live web route smokes for `/deals/handoff?locale=en` and
  `/deals/handoff?locale=ar` rendered the seeded stuck deal, blocker, stage, and
  RTL Arabic.
- Passed: cleanup check found `p10_10b2_session_count=0`; `rg` found no
  `cms_staff_session`, token hash, password, secret, or credential strings in
  `output/p10-10b2`; no storage-state/cookie/session artifact files remained.

### Artifacts

- `output/p10-10b2/summary.json`
- `output/p10-10b2/api-deals-handoff-board.json`
- `output/p10-10b2/web-deals-handoff-en.html`
- `output/p10-10b2/web-deals-handoff-ar.html`

### Notes

- The route is read-only. No deal stage mutation, production deploy, SMTP,
  WhatsApp, AI, mobile, or HR-platform work was introduced.
- The API proof process started for the smoke was stopped after proof. The
  pre-existing web server on port 4000 was left alone.

### Security Self-Check

- Roles and branch scope from server session, never client input: Passed.
  `DealsController` derives scope from `request.principal`; web clients forward
  only the staff session cookie, and tests assert no role, actor, workflow,
  branch, owner, token, or credential authority is sent.
- State change history + audit in same transaction: not applicable for the
  read-only proof surfaces. Runtime denied reads write SECURITY audit through a
  Prisma-backed `AuditService` before returning 403.
- No passwords, OTPs, tokens, hashes, or provider secrets are logged or
  returned: Passed. Raw cookies were kept in memory only, output artifacts are
  sanitized, and proof session rows were deleted.
- Customer portal exposure rules: not applicable; no customer portal route or
  public data surface changed.
- Trust boundaries tested: Passed. API tests cover manager/admin allow,
  ordinary employee deny, cross-branch deny with audit, and live proof confirms
  employee denial returns 403 on `/deals/handoff-board`.

## P10-10B3 Worker Escalation Local Proof

- Date: 2026-06-21
- Risk: High
- Status: Passed locally
- Builder tier: BUILDER-STRONG
- SRS IDs: REQ-RBAC-001, NFR-SEC-002, METHOD-TEST-001, UAT-SCRIPT-001

### Changes

1. Proved the existing BullMQ `notifications` worker path for
   `tasks.escalation.scan` against the local Docker Postgres/Redis stack and
   P10-10A seeded task data.
2. Ran the compiled worker entrypoint `apps/api/dist/worker/index.js`; no
   alternate service path or repository shortcut was used for the proof.
3. Proved `seed_task_overdue_promise` creates exactly one queued in-app
   `task.escalation.internal` notification with a stable idempotency key.
4. Proved a rerun with hostile client payload role/branch values did not create
   a duplicate; the target notification row id stayed the same.
5. Wrote sanitized worker/data proof artifacts to `output/p10-10b3/`.

### Verification

- Passed: `$env:DATABASE_URL='postgres://cms_auto:cms_auto_dev@localhost:5433/cms_auto'; corepack pnpm db:seed`.
- Passed: `corepack pnpm exec tsc -p apps/api/tsconfig.json`.
- Passed: compiled worker startup with `REDIS_URL=redis://localhost:6379`;
  worker log showed `worker ready queues=sla,notifications,attachments-scan`.
- Passed: worker processed the scheduled `tasks.escalation.scan` job once on
  startup, then the controlled proof deleted those proof-surface notification
  rows before the explicit run.
- Passed: explicit job `p10-10b3-escalation-first` returned
  `{ scanned: 2, queued: 2 }` and created one target notification for
  `seed_task_overdue_promise`; payload contained
  `task-escalation:seed_task_overdue_promise:BRANCH_MANAGER:2026-06-18T08:30:00.000Z`.
- Passed: explicit rerun job `p10-10b3-escalation-rerun` returned
  `{ scanned: 2, queued: 2 }`, left `afterRerunTargetCount=1`, and preserved the
  same target row id.
- Passed: cleanup removed proof notification rows; final DB probe returned
  `{"proofTemplates":0,"target":0}`.
- Passed: explicit Redis proof jobs were removed; final queue probe returned
  `{"proofJobCount":0}`.
- Passed: worker process was stopped; `worker_alive=False`.
- Passed: artifact secret scan found no `cms_staff_session`, token, password,
  secret, credential, OTP, or hash strings under `output/p10-10b3`.
- Passed: `corepack pnpm test:api -- tasks` (11/11).
- Passed: `corepack pnpm test:api -- notifications` (41/41).
- Passed: `corepack pnpm test` (58/58 with coverage gates).
- Passed: `git diff --check` (line-ending warnings only).

### Artifacts

- `output/p10-10b3/summary.json`
- `output/p10-10b3/worker.stdout.log`
- `output/p10-10b3/worker.stderr.log`

### Notes

- The proof did not require SMTP, VPS, WhatsApp, AI, mobile, or HR-platform
  services. External notification dispatch was not invoked for the escalation
  proof; the worker queued internal in-app notifications only.
- The worker ignores job payload authority for escalation scans; candidates are
  derived from backend manager rollup scope `{ roleCode: ADMIN, branchId: null }`
  and task rows.

### Security Self-Check

- Roles and branch scope from server session/backend-owned context, never client
  input: Passed. The worker uses backend manager scope for escalation selection
  and ignored hostile job payload role/branch values in the proof.
- State change history + audit in same transaction: not applicable; the task
  proof creates idempotent internal notification rows and performs no workflow
  state mutation.
- No passwords, OTPs, tokens, hashes, or provider secrets are logged or
  returned: Passed. Artifacts contain no session cookies or provider secrets,
  and proof rows/jobs were removed after measurement.
- Customer portal exposure rules: not applicable; no customer portal route or
  public data surface changed.
- Trust boundaries tested: Passed. Focused task/worker tests cover payload
  authority being ignored, and the live proof confirmed notification idempotency
  through the real BullMQ worker path.

## P10-10B4 KPI Movement From Timeline Local Proof

- Date: 2026-06-21
- Risk: High
- Status: Passed locally
- Builder tier: BUILDER-STRONG
- SRS IDs: REQ-REPORT-001, REQ-RBAC-001, NFR-SEC-002, METHOD-TEST-001,
  UAT-SCRIPT-001

### Changes

1. Proved the existing `/reports/kpis` API and `/reports` web route against the
   local Docker Postgres/Redis stack and P10-10A seeded data.
2. Captured baseline manager/admin KPI values, inserted one proof-only main
   branch task row with a real `task_status_history` DONE event, and proved
   backend KPI values moved from persisted event data.
3. Proved ordinary employee access to `/reports/kpis` returned 403 and the north
   branch manager KPI payload stayed unchanged after the main branch proof
   mutation.
4. Rendered `/reports?locale=en` and `/reports?locale=ar` through the live web
   server with the manager session cookie and saved sanitized HTML artifacts.
5. Removed proof sessions and proof task/status-history data after measurement.

### Verification

- Passed: `$env:DATABASE_URL='postgres://cms_auto:cms_auto_dev@localhost:5433/cms_auto'; corepack pnpm db:seed`.
- Passed: local API startup on `PORT=3000`; `/health` returned
  `{"status":"ok","service":"api","databaseConfigured":true,"redisConfigured":true}`.
- Passed: baseline manager/admin API reads returned 200.
- Passed: after inserting proof-only task `p10_10b4_done_promise_task` plus a
  `task_status_history` DONE event, manager KPI movement was:
  `onTimeCompletionPercent 0 -> 100`,
  `customerPromiseKeptPercent 0 -> 100`, and `activeOverdueCount 2 -> 2`.
- Passed: admin API read returned 200 after the mutation.
- Passed: ordinary employee API read returned 403.
- Passed: north branch manager KPI payload was unchanged after the main branch
  mutation.
- Passed: live web `/reports?locale=en&reports=success` and
  `/reports?locale=ar&reports=success` returned 200 and rendered the moved
  `100%` KPI value.
- Passed: cleanup removed 4 proof staff sessions and 1 proof task; final DB
  probe returned `{"sessions":0,"task":0}`.
- Passed: artifact secret scan found no `cms_staff_session`, token, password,
  secret, credential, OTP, or hash strings under `output/p10-10b4`.
- Passed: `corepack pnpm test:api -- reports` (21/21).
- Passed: `corepack pnpm test:web -- shell` (177/177).
- Passed: `corepack pnpm test` (58/58 with coverage gates).
- Passed: `git diff --check` (line-ending warnings only).

### Artifacts

- `output/p10-10b4/summary.json`
- `output/p10-10b4/api-kpis-before-manager.json`
- `output/p10-10b4/api-kpis-after-manager.json`
- `output/p10-10b4/api-kpis-after-admin.json`
- `output/p10-10b4/api-kpis-employee-denied.json`
- `output/p10-10b4/web-reports-en.html`
- `output/p10-10b4/web-reports-ar.html`

### Notes

- No React KPI calculation or client counter was added. The web route rendered
  the existing typed backend `/reports/kpis` response only.
- The proof did not require SMTP, VPS, WhatsApp, AI, mobile, HR-platform, or
  production deploy work.
- The temporary API process started for the smoke was stopped after proof. The
  pre-existing web server on port 4000 was left alone.

### Security Self-Check

- Roles and branch scope from server session, never client input: Passed. API
  reads used temporary server-side staff sessions; manager/admin were allowed,
  ordinary employee was denied, and north branch scope remained unchanged by
  main branch proof data.
- State change history + audit in same transaction: not applicable to product
  workflow behavior. The proof used a local-only direct DB setup to add one
  throwaway task row plus its status-history event, then deleted it.
- No passwords, OTPs, tokens, hashes, or provider secrets are logged or
  returned: Passed. Raw session cookie values stayed in process memory only,
  artifacts are sanitized, and proof sessions were deleted.
- Customer portal exposure rules: not applicable; no customer portal route or
  public data surface changed.
- Trust boundaries tested: Passed. API tests cover report-capable allow,
  employee deny, cross-branch denial/audit, aggregate-only KPI shape, and the
  live proof confirmed branch scope plus backend-derived KPI movement.

## P10-AUTH-LOCAL Real Local Staff Login Hardening

- Date: 2026-06-21
- Risk: High
- Status: Passed locally
- Builder tier: BUILDER-STRONG
- SRS IDs: ARCH-AUTH-001, REQ-AUTH-001, REQ-RBAC-001, NFR-SEC-001,
  NFR-SEC-002, METHOD-TEST-001

### Changes

1. Removed visible preview sign-in/error shortcuts from the staff login panel.
2. Changed real browser requests to `/` so query parameters cannot bypass the
   backend session check into a signed-in preview shell.
3. Added `corepack pnpm staff:bootstrap`, which creates or updates a local staff
   account from operator-supplied environment variables, stores an Argon2id
   password hash, activates the user, clears lock state, and assigns a database
   role plus optional branch scope.
4. Added auth/web regression tests that reject reintroducing preview sign-in
   links and verify the bootstrap script requires operator-owned credentials.

### Verification

- Passed: `corepack pnpm test:api -- auth` (35/35).
- Passed: `corepack pnpm test:web -- shell` (178/178).
- Passed: `corepack pnpm lint`.
- Passed: `corepack pnpm typecheck`.
- Passed: live bootstrap proof against local Postgres using generated
  proof-only env credentials: `corepack pnpm staff:bootstrap` created the
  proof admin account, a package-local verifier confirmed the stored Argon2id
  hash matched the generated password and role `ADMIN`, then deleted the proof
  user.
- Passed: final DB cleanup probe returned `proof.bootstrap users: 0`.
- Passed: live web root smoke against `http://localhost:4000/?session=signed-in&role=admin&locale=en`
  rendered the staff login form and did not expose the signed-in shell, role
  preview, or admin navigation.
- Passed: `git diff --check` (line-ending warnings only).

### Notes

- No default password, plaintext credential, seed password, or mocked user was
  added. Operators must choose the local account password with
  `CMS_BOOTSTRAP_PASSWORD`.
- Existing auth routes remain the authority: `/auth/login`, `/auth/logout`, and
  `/auth/me` still own session creation/validation.
- The old render-test preview shell still exists for web tests, but real Next.js
  browser requests to `/` now return either a backend-session redirect or the
  login form.
- No production deploy, SMTP, WhatsApp, VPS, AI, mobile, or HR-platform work was
  introduced.

### Security Self-Check

- Roles and branch scope from server session, never client input: Passed. Real
  browser root requests use `/auth/me` via the server cookie; query-preview
  parameters no longer bypass auth. The bootstrap script writes role/branch onto
  the database user only.
- State change history + audit in same transaction: not applicable to complaint
  workflow state. Existing auth tests still prove login success/failure,
  logout, and password reset audit behavior.
- No passwords, OTPs, tokens, hashes, or provider secrets are logged or
  returned: Passed. Bootstrap reads the password from env, stores only Argon2id
  hash material, does not print the password, and the regression test rejects
  obvious default plaintext credentials.
- Customer portal exposure rules: not applicable; no customer portal route or
  public data surface changed.
- Trust boundaries tested: Passed. `test:api -- auth` covers server-derived
  session principal, RBAC allow/deny, branch allow/deny, safe errors, and safe
  cookie/session behavior; `test:web -- shell` covers removal of preview login
  shortcuts.

## P10-DATA-LOCAL Complaint Data Plumbing Repair

- Date: 2026-06-21
- Risk: High
- Status: Passed locally
- Builder tier: BUILDER-STRONG
- SRS IDs: REQ-COMPLAINT-001, REQ-COMPLAINT-002, REQ-RBAC-001,
  REQ-ADMIN-001, METHOD-API-001, METHOD-TEST-001, UI-DESIGN-001

### Changes

1. Added backend `/complaints/form-options`, returning DB-backed active
   branches, active categories, and severity values scoped from the server
   staff principal.
2. Updated complaint queue/search/detail read models to include readable
   `branchName` and `ownerName` alongside IDs.
3. Wired complaint creation to fetch form options through the staff session
   cookie and removed the visible `Sample option` fallback from real route data.
4. Updated work queue rendering so it shows owner and branch names instead of
   raw database IDs when the API provides names.
5. Updated the OpenAPI canonical contract and committed contract for the new
   route and response fields.

### Verification

- Passed: `corepack pnpm test:api -- workflow` (43/43).
- Passed: `corepack pnpm test:api -- search` (4/4).
- Passed: `corepack pnpm test:web -- shell` (179/179).
- Passed: `corepack pnpm openapi:check`.
- Passed: `corepack pnpm lint`.
- Passed: `corepack pnpm typecheck`.
- Passed: rebuilt API output with `corepack pnpm exec tsc -p apps/api/tsconfig.json`,
  restarted the local API process on port 3000, and confirmed unauthenticated
  `/complaints/form-options` returns 401.
- Passed: live local API smoke with a temporary proof admin account:
  `/auth/login` returned 201 and `/complaints/form-options` returned
  `branches=2`, `categories=5`, `severities=4`.
- Passed: proof account cleanup removed sessions and deactivated proof users;
  cleanup probe returned `active=0`.
- Passed: `git diff --check` (line-ending warnings only).

### Notes

- This repair does not implement full admin CRUD. It makes complaint creation
  and queue display use real backend data now, then queues P10-ADMIN-REAL for
  audited admin account/master-data management.
- The current local seed already contains branches, roles, staff users,
  categories, customers, vehicles, complaints, deals, and tasks. Category data is
  currently flat; hierarchical category editing belongs in P10-ADMIN-REAL.
- Proof option users were deactivated rather than deleted because login audit
  rows are append-only and must keep actor linkage intact.
- No production deploy, SMTP, WhatsApp, VPS, AI, mobile, or HR-platform work was
  introduced.

### Security Self-Check

- Roles and branch scope from server session, never client input: Passed.
  `/complaints/form-options` reads the authenticated server principal and tests
  prove non-admin branch scoping plus route RBAC allow/deny behavior.
- State change history + audit in same transaction: not applicable to this
  read-model/options repair. Existing workflow tests still cover complaint
  creation/transition history and audit transactions.
- No passwords, OTPs, tokens, hashes, or provider secrets are logged or
  returned: Passed. The new route returns only branch/category labels and enum
  severity values.
- Customer portal exposure rules: not applicable; no customer portal route or
  public data surface changed.
- Trust boundaries tested: Passed. Workflow tests cover form-options RBAC
  denial with security audit, server-derived branch scope, queue branch scope,
  and cross-branch denial behavior.

## P10-ADMIN-REAL Admin Users Slice

- Date: 2026-06-21
- Risk: High
- Status: Passed locally
- Builder tier: BUILDER-STRONG
- SRS IDs: REQ-ADMIN-001, REQ-RBAC-001, METHOD-AUDIT-001, METHOD-API-001,
  METHOD-TEST-001, UI-DESIGN-001

### Changes

1. Added a backend `AdminModule` with admin-only staff user management:
   `GET /admin/users`, `POST /admin/users`,
   `POST /admin/users/:id/deactivate`, and
   `POST /admin/users/:id/reactivate`.
2. Admin user create stores only an Argon2id password hash. Deactivate and
   reactivate update user state and write admin audit entries inside the same
   Prisma transaction.
3. Wired the admin users web route to the real backend session and API. The
   main `/admin` screen now renders real account management instead of preview
   rows, placeholder users, disabled fake buttons, or reset-link stubs.
4. Added real server actions for create/deactivate/reactivate and a typed web
   API client for admin user data.
5. Updated OpenAPI canonical and generated contracts with the new admin routes,
   request schema, option schema, and response schema.

### Verification

- Passed: `corepack pnpm test:api -- admin` (20/20).
- Passed: `corepack pnpm test:web -- shell` (180/180).
- Passed: `corepack pnpm typecheck`.
- Passed: `corepack pnpm lint`.
- Passed: `corepack pnpm openapi:check`.
- Passed: `corepack pnpm exec tsc -p apps/api/tsconfig.json`.
- Passed: `git diff --check` (line-ending warnings only).
- Passed: local API health on `http://localhost:3000/health` returned OK with
  database and Redis configured.
- Passed: live authenticated API smoke for `/admin/users` returned real user,
  role, and branch option data from the local database.
- Passed: live web smoke for `/admin?locale=en` rendered admin user management,
  create-user controls, the local admin account, no preview placeholder row, no
  old branch/departments preview surface, and zero disabled button attributes.
- Passed: in-app browser at `http://localhost:4000/admin?locale=en` showed
  active `Create user`, `Deactivate`, and `Reactivate` buttons.

### Notes

- This slice made staff account management real. Branch/category/severity/
  template master-data CRUD remains a separate admin slice and is now the next
  Forge task.
- The app is running locally with Docker Postgres on host port `5433`, Redis on
  `6379`, API on `3000`, and web on `4000`.
- No production deploy, SMTP, WhatsApp, VPS, AI, mobile, or HR-platform work was
  introduced.

### Security Self-Check

- Roles and branch scope from server session, never client input: Passed. All
  admin routes use `SessionAuthGuard` plus admin RBAC; the web only forwards the
  existing staff session cookie.
- State change history + audit in same transaction: Passed for create,
  deactivate, and reactivate admin user mutations.
- No passwords, OTPs, tokens, hashes, or provider secrets are logged or returned:
  Passed. The create endpoint accepts an operator-entered initial password and
  stores only Argon2id hash material.
- Customer portal exposure rules: not applicable; no customer portal route or
  public data surface changed.
- Trust boundaries tested: Passed. API tests cover admin allow, non-admin deny,
  CSRF enforcement, audit creation, password hashing, deactivation, and
  reactivation.

## P10-ADMIN-DROPDOWNS Admin Intake Values Visibility

- Date: 2026-06-21
- Risk: Medium
- Status: Passed locally
- Builder tier: BUILDER-STRONG
- SRS IDs: REQ-ADMIN-001, REQ-RBAC-001, METHOD-API-001, METHOD-TEST-001,
  UI-DESIGN-001

### Changes

1. Updated `/admin` to fetch admin users and `/complaints/form-options` in
   parallel, using the existing staff session cookie.
2. Added a real `Complaint intake dropdowns` section under admin that displays
   live branch, category/subcategory, and severity values from the same backend
   data source used by complaint creation.
3. Kept old branch/category preview cards out of `/admin`; no fake edit buttons
   were added for master data.
4. Repaired `staff-admin-users` Arabic text with real Arabic code points and
   added localized labels for the intake dropdown section.
5. Added a web shell regression proving `/admin` renders backend-provided
   branches, category hierarchy, and severities without disabled fake buttons.

### Verification

- Passed: `corepack pnpm test:web -- shell` (181/181).
- Passed: `corepack pnpm typecheck`.
- Passed: `corepack pnpm lint`.
- Passed: `corepack pnpm test:web -- localization` (11/11).
- Passed: live in-app browser verification at `http://localhost:4000/admin?locale=en`
  showed users, complaint intake dropdowns, branches, categories/subcategories,
  severity values, `Main branch`, seeded categories, `HIGH`, and zero disabled
  buttons.
- Passed: `git diff --check` (line-ending warnings only).

### Notes

- This is a read/display repair using the existing backend options endpoint; it
  does not claim full branch/category/SLA CRUD is finished.
- P10-ADMIN-MASTER-DATA remains the next task for audited create/update/
  deactivate/reactivate flows for branch, category, severity/SLA, and template
  master data.

### Security Self-Check

- Roles and branch scope from server session, never client input: Passed. The
  admin page forwards the server staff session cookie only; option data comes
  from the existing guarded backend endpoint.
- State change history + audit in same transaction: not applicable. This slice
  adds no new mutation.
- No passwords, OTPs, tokens, hashes, or provider secrets are logged or returned:
  Passed. The new section renders only branch/category labels and severity
  enum values.
- Customer portal exposure rules: not applicable; no customer portal route or
  public data surface changed.
- Trust boundaries tested: Passed. The web regression proves route fetches go
  through backend data and do not reintroduce disabled preview controls.

## P10-ADMIN-MASTER-DATA-A Branch And Category Add/Edit

- Date: 2026-06-21
- Risk: High
- Status: Passed locally
- Builder tier: BUILDER-STRONG
- SRS IDs: REQ-ADMIN-001, REQ-RBAC-001, METHOD-AUDIT-001, METHOD-API-001,
  METHOD-TEST-001, UI-DESIGN-001

### Changes

1. Added real Add/Save forms to the `/admin` `Complaint intake dropdowns`
   section for branches and complaint categories.
2. Reused the existing audited `/branches` POST/PATCH routes for branch
   create/update instead of duplicating branch authority in React.
3. Added guarded `/admin/categories` POST/PATCH backend routes, repository, and
   service for hierarchical category create/update.
4. Category writes validate required fields, reject invalid/self parents, enforce
   admin-only RBAC plus CSRF, and write CONFIG audit entries in the same
   transaction as the database mutation.
5. Updated OpenAPI canonical and generated contracts for the new category write
   routes and schemas.
6. Kept severity values read-only because they are currently system enum codes;
   SLA policy editing remains a separate slice.

### Verification

- Passed: `corepack pnpm test:api -- admin` (23/23).
- Passed: `corepack pnpm test:web -- shell` (181/181).
- Passed: `corepack pnpm openapi:check`.
- Failed then repaired: `corepack pnpm typecheck` initially caught
  `exactOptionalPropertyTypes` issues in the new admin master-data component.
- Passed after repair: `corepack pnpm typecheck`.
- Passed: `corepack pnpm lint`.
- Passed: `corepack pnpm test:web -- localization` (11/11).
- Passed: `corepack pnpm exec tsc -p apps/api/tsconfig.json`.
- Passed: API restart on `http://localhost:3000`; `/health` returned OK with
  database and Redis configured.
- Passed: `git diff --check` (line-ending warnings only).
- Passed: live in-app browser smoke at `http://localhost:4000/admin?locale=en`
  showed `Complaint intake dropdowns`, branches, categories/subcategories,
  `Add`, seven `Save` buttons, nine code inputs, and zero disabled buttons.
- Passed: browser console error check returned no errors.

### Notes

- This slice does not hard-delete or deactivate master data.
- Department CRUD, branch deactivate/reactivate controls, category
  deactivate/reactivate, severity/SLA policy management, and notification
  template management remain follow-up slices.
- No production deploy, SMTP, WhatsApp, AI, mobile, HR-platform, or VPS work was
  introduced.

### Security Self-Check

- Roles and branch scope from server session, never client input: Passed.
  Branch/category writes are admin-only backend routes guarded by
  `SessionAuthGuard`, `RbacGuard`, and `CsrfGuard`; the web server action only
  forwards the existing staff session cookie and CSRF cookie/header.
- State change history + audit in same transaction: Passed for category
  mutations through CONFIG audit. Branch mutations reuse the existing branch
  service transaction/audit path. No complaint workflow state was changed.
- No passwords, OTPs, tokens, hashes, or provider secrets are logged or returned:
  Passed. The new category route accepts only category labels/codes/parent IDs;
  the UI does not render credential material.
- Customer portal exposure rules: not applicable; no customer portal route or
  public data surface changed.
- Trust boundaries tested: Passed. API tests cover admin allow, non-admin deny
  with SECURITY audit, CSRF guard presence, invalid parent rejection, and
  same-transaction CONFIG audit. Web tests cover backend-sourced visible
  Add/Save controls with no disabled preview buttons.
