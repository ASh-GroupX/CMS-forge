# Phase Review Task: PHASE-8-REVIEW - Operational Completion Acceptance Review

Status: Needs Phase Review
Required model tier: PHASE-REVIEWER
Risk: High
Phase: Phase 8 - Operational Completion

## Scope

Review Phase 8 end to end before any next-phase or post-phase work starts.
Validate that the operational runtime now actually runs: background jobs are
driven, durable attachment storage is wired, the E2E runtime smoke gate exists,
and missing DI providers fail loudly.

## Acceptance criteria

- AC1 [must] Every Phase 8 backlog item is checked done and has evidence.
- AC2 [must] Evidence uses honest verification labels and includes executed
  Docker/runtime proofs, not only static or unit checks.
- AC3 [must] No SRS, architecture, RBAC, audit, portal privacy, OpenAPI, or
  security boundary was weakened by Phase 8 changes.
- AC4 [must] Required proof commands are rerun or any gap is explicitly recorded
  as blocking or acceptable.
- AC5 [must] Output one PHASE REVIEW decision: `Accept Phase`,
  `Accept With Conditions`, `Repair Required`, or `Redo Phase`.

## Suggested proof surface

- Review `.forge/backlog.md`, `.forge/evidence.md`, `.forge/trust.md`,
  `.forge/state.md`, `.forge/next.md`, `AGENTS.md`, `docs/ARCHITECTURE.md`, and
  relevant Phase 8 source changes.
- `corepack pnpm lint`
- `corepack pnpm typecheck`
- `corepack pnpm test`
- `corepack pnpm test:e2e`

## Guardrails

- Do not start new build work during the review.
- If repair is required, write the smallest repair task to `.forge/next.md` and
  set state `Needs Repair`.
- If accepted, write the next legitimate post-phase task and set state according
  to the PHASE REVIEW protocol.
