# Trust Log

Append review decisions (VERIFY / PHASE REVIEW) here, newest at the bottom.

## Read and write rules (context hygiene)

- APPEND-ONLY. Readers take only the LATEST relevant entries - never the whole file.
- History through Phase 7 / F7-02 is archived in
  `.forge/archive/trust-archive.md` (and git). Open carry-forward conditions are
  summarized in `.forge/state.md`.
- Rotate older phases into the archive as this log grows.

---

## F8-00 - Job-Runtime Gate (FORGE-JOB-RUNTIME-001)

- Date: 2026-06-20
- Risk: Low
- Recommendation: Accept
- Notes:
  - Closes the blind spot behind the whole async-layer leak: static/unit gates prove
    structure, never runtime actuation. This gate asserts every background job has a
    real driver and ratchets the 6 current orphans so Phase 8 must wire them.
  - Honest scope: enforcement, not the fix. The behavioral fix (runner, S3, e2e) is
    F8-01..06 and needs the Docker stack to prove end-to-end.
  - The registry is explicit (6 jobs); add survey-link scheduling when its entrypoint
    is wired so it is gated too.

(active-phase review decisions append below)

## F7-03A1 Builder Trust Note

Date: 2026-06-19
Risk: High
Recommendation: Continue

The build made `/auth/me` usable as a session-principal endpoint without making
the frontend an authority source. Required proof passed through `corepack pnpm`.
Residual condition: the web shell still has preview `?role=` authority until
F7-03A2 removes it from signed-in behavior.

## F7-03A2 Builder Trust Note

Date: 2026-06-19
Risk: High
Recommendation: Continue

The web shell now prefers the server-session `/auth/me` principal over preview
query params and forwards only the HttpOnly session cookie from the server side.
Residual condition: the login/logout controls still need real auth API form
actions before F7-03A can close.

## F7-03A3 Builder Trust Note

Date: 2026-06-19
Risk: High
Recommendation: Continue

F7-03A is complete: staff login/logout controls now use server actions, the
server component forwards the HttpOnly session cookie to `/auth/me`, and signed-in
role/navigation comes from the server principal. Continue to F7-03B real
dashboard reads.

## F7-03B Builder Trust Note

Date: 2026-06-19
Risk: High
Recommendation: Continue

Dashboard summary values now come from the guarded backend reports endpoint when
a session is present, with preview fallback on denial/no session. Continue to
F7-03C for reports catalog/export wiring.

## F7-03C Builder Trust Note

Date: 2026-06-19
Risk: High
Recommendation: Continue

Reports dashboard rows now render from guarded `/reports` when available, and
CSV/Excel controls point at backend export routes instead of browser file
generation. F7-03D is split into queue first, then detail, to stay inside scope.

## F7-03D1 Builder Trust Note

Date: 2026-06-19
Risk: High
Recommendation: Continue

Work queue rows now render from guarded `GET /complaints` when available, with
no client-sourced role/branch authority. Continue to D2 for complaint detail.

## F7-03D2 Builder Trust Note

Date: 2026-06-19
Risk: High
Recommendation: Continue

F7-03 is complete: staff auth, dashboard, reports, queue, and complaint detail
reads now use guarded backend endpoints with the server-session cookie as the
authority source. Continue to F7-04A for the customer portal submission UI.

## F7-04A Builder Trust Note

Date: 2026-06-19
Risk: High
Recommendation: Continue

The public portal submission screen is represented at `/portal` with localized
RTL/LTR form states, attachment affordance, and reference-number confirmation
without exposing internal data. Continue to F7-04B for verified portal tracking.

## F7-04B Builder Trust Note

Date: 2026-06-19
Risk: High
Recommendation: Continue

The public tracking screen is represented at `/portal/track` with an explicit
verification gate before status/timeline rendering and a post-verification
follow-up affordance. Continue to F7-04C for the survey UI.

## F7-04C Builder Trust Note

Date: 2026-06-19
Risk: High
Recommendation: Continue

F7-04 is complete: portal submission, verified tracking, follow-up affordance,
and survey screens are represented with localized RTL/LTR states and privacy
guards. Continue to F7-05A for stronger accessibility proof.

## F7-05A Builder Trust Note

Date: 2026-06-19
Risk: High
Recommendation: Continue

Accessibility proof now renders staff and portal public route previews in English
and Arabic, with deterministic checks for focus affordances, labels, named
buttons, feedback roles, direction, and contrast/focus tokens. Remaining gap:
this is not real-browser axe scanning. Continue to F7-05B for destructive
confirmation UI states.

## F7-05B Builder Trust Note

Date: 2026-06-19
Risk: High
Recommendation: Continue

F7-05 is complete: accessibility proof now includes staff and portal route
previews, and destructive deactivate/reject/close affordances have explicit
confirmation UI states with proof. Continue to F7-06 for OpenAPI finalization.

## F7-06 Builder Trust Note

Date: 2026-06-19
Risk: High
Recommendation: Continue

OpenAPI drift enforcement is active and the canonical contract now includes the
real health routes alongside the existing staff and portal route families. Portal
schema privacy remains covered by API tests. Continue to F7-07A for backup/health
ops proof.

## F7-07A Builder Trust Note

Date: 2026-06-19
Risk: High
Recommendation: Continue

`ops:backup:check` now performs a deterministic local backup/readiness posture
check and fails non-dev environments that still use Postgres trust auth. It also
documents the backup schedule, restore test steps, attachment replication plan,
and RPO/RTO without printing secrets. Continue to F7-07B for the performance
baseline script.

## F7-07B Builder Trust Note

Date: 2026-06-19
Risk: High
Recommendation: Continue

`test:performance` now runs the same deterministic frontend performance proof as
`web:perf`, and a scaffold regression test prevents it from pointing back to the
placeholder. Continue to F7-07C to wire `security:check`.

## F7-07C Builder Trust Note

Date: 2026-06-19
Risk: High
Recommendation: Continue

F7-07 is complete: backup, frontend performance, and security proof scripts now
run real deterministic checks instead of placeholders. The security carry-forward
placeholder condition is closed. Continue to F7-08 for UAT scripts with realistic
automotive complaint data.

## F7-08 Builder Trust Note

Date: 2026-06-19
Risk: High
Recommendation: Continue

The Phase 7 UAT checklist now covers every MVP screen ID, required UAT scenario,
seeded automotive complaint reference, Arabic RTL/English LTR checks, and
evidence capture rules. Deterministic tooling enforces coverage but does not
pretend human UAT sign-off has happened. Continue to F7-09 for deployment and
operations runbook hardening.

## F7-09 Builder Trust Note

Date: 2026-06-19
Risk: High
Recommendation: Needs Phase Review

F7-09 is complete: the deployment/operations runbook now covers the required
pilot sections, HTTPS redirect/TLS enforcement is assigned to the production
gateway, and Postgres host auth is parameterized with proof that non-dev trust
posture fails. All Phase 7 backlog items are complete; stop for the mandatory
phase review gate.

## PHASE-7-REVIEW - Reports, UAT, And Ops Acceptance Review

Date: 2026-06-20
Risk: High
Decision: Accept With Conditions
Reviewer tier: PHASE-REVIEWER

Phase 7 is accepted after repair. The review verified that F7-01 through F7-09
are complete and evidenced across active and archived forge logs, and final proof
commands pass for lint, typecheck, unit coverage, shell UI, accessibility,
performance, OpenAPI, security, and ops backup readiness.

Review findings:
- Repaired before acceptance: the first phase-review `lint` rerun found
  `apps/web/src/app/page.tsx`, `tools/openapi-check.mjs`, and
  `tools/web-proof.mjs` over the 300-line source budget. The repair split staff
  panels, web proof cases, and canonical OpenAPI data into smaller files.
- Repaired before acceptance: the first post-extraction web proof rerun failed
  because `staff-shell-panels.tsx` needed the React import and one
  source-inspection test still read the old file. Final reruns pass.
- Accepted condition: known carry-forward debt remains explicit and non-blocking
  for Phase 7 acceptance: username login is email-only until a username model
  column exists; attachment storage/scan runtime is still in-memory/proof-level;
  Prisma/Audit provider duplication can be simplified later.

Final verification:
- Passed: `corepack pnpm lint`.
- Passed: `corepack pnpm typecheck`.
- Passed: `corepack pnpm test` (42/42 tool tests; coverage gate passed).
- Passed: `corepack pnpm test:web -- shell` (117/117 tests).
- Passed: `corepack pnpm test:e2e -- accessibility` (17 route previews).
- Passed: `corepack pnpm test:performance` (2 route previews).
- Passed: `corepack pnpm openapi:check`.
- Passed: `corepack pnpm security:check`.
- Passed: `corepack pnpm ops:backup:check`.

Recommendation: Phase 7 complete. No next unfinished phase is declared in the
current backlog; mark the forge goal complete.

## F8-01 Builder Trust Note

Date: 2026-06-20
Risk: High
Recommendation: Continue

F8-01 is complete: BullMQ is installed, the worker process boots the Nest DI
context beside the API, connects to Redis for all three phase queues, and
processes an enqueued smoke job through the noop processor. The job-runtime
ratchet remains at 6 by design because this task added no business job calls.
Continue to F8-02 to drive the SLA warning and breach jobs and remove those two
ratchet entries.
