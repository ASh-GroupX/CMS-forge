# Current State

Status: Ready to Plan
Phase: Phase 9 - Production Readiness (Pilot on Hostinger)
Next Task: P9-04 - Plan one golden screen and screen refactor split
Model Tier: PLANNER

## How to use this file

SNAPSHOT only. REPLACE each run, never append. Per-task detail -> evidence.md.
Prior state history is in .forge/archive/state-archive.md.

## Snapshot

- P9-01A..P9-01E passed: all Arabic i18n bundles are verified as real Arabic
  Unicode, root `html` resolves `lang`/`dir` from locale, and RTL/LTR proof
  passes.
- P9-02 passed: `corepack pnpm lint` now includes an Arabic i18n mojibake and
  Arabic-codepoint gate.
- PLAN-P9-03 split shadcn adoption into P9-03A..P9-03F so each build stays near
  1-5 files plus focused proof.
- P9-03A passed: `apps/web/components.json` now defines the shadcn/ui project
  contract for the existing Next/Tailwind app paths, and no primitives were added.
- P9-03B passed: shadcn generated `button`, `input`, `label`, `textarea`,
  `select`, and `badge`; `@/*` now resolves to `apps/web/src/*`.
- P9-03C passed: shadcn generated `card`, `table`, `dialog`, `tabs`,
  `skeleton`, and `sonner`; a generated `sonner` exact-optional typing issue
  was repaired.
- P9-03D passed: Tailwind and global CSS now expose shadcn aliases while keeping
  existing `brand`, `neutral`, `status`, `state`, radius, shadow, and focus tokens.
- P9-03E passed: required frontend proof packages are installed and lint now
  resolves them.
- P9-03F passed: `web:visual-review` now writes ignored review artifacts for the
  existing visual cases under `coverage/web-visual-review`.
- AUTO PHASE stopped because P9-04 is a planning task requiring PLANNER before
  any screen refactor starts.

## Open carry-forward / known debt

- P9-04 must choose one golden screen, build it to an approved visual bar, then
  split the remaining screen refactors into small tasks with visual review gates.
