# Build Task: P10-10B - End-To-End Local Phase 10 Proof Split

Status: Ready to Plan
Required model tier: BUILDER-STRONG
Phase: Phase 10 - Dealership Accountability Layer (local-first)
Risk: High

## Context

P10-09 is complete. Phase 10's remaining build item is P10-10B:
end-to-end local proof across Employee Today, Manager Control Room, Deal Handoff,
worker escalation, and KPI movement from the event timeline.

This crosses several existing Phase 10 surfaces and should be split before
build so the implementation stays near 1-5 files per task.

## Scope

1. Read `docs/PRODUCT_DESIGN.md` and the Phase 10 backlog context for P10-10B.
2. Split P10-10B into small executable proof tasks.
3. Preserve local-first proof: no production deploy, no SMTP/VPS dependency.
4. Each split task must name its exact route/job/API proof and expected evidence.
5. Keep confidential-case privacy, backend-owned role/scope, and event-derived KPI
   authority intact.

## Guardrails

- Do not build P10-10B as one large diff.
- Do not add client-side workflow/KPI truth.
- Do not introduce production deploy, SMTP, WhatsApp, AI, mobile, or HR platform
  work.
- Use the existing local Docker Postgres/Redis stack and seeded dealership data.
- Keep proof artifacts secret-safe; remove temporary sessions and cookies.

## Acceptance

- `.forge/backlog.md` contains split P10-10B subtasks with clear order and proof.
- `.forge/next.md` points to the first buildable P10-10B split task.
- `.forge/state.md` records the split and local stack assumptions.

## Proof Commands

- Documentation/planning only. Run `git diff --check`.
