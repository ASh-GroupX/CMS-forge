# Review Task: P9-04B - Golden Screen Review Gate

Status: Needs Review
Required model tier: PHASE-REVIEWER
Phase: Phase 9 - Production Readiness (Pilot on Hostinger)
Risk: Medium
Requirements: UI-DESIGN-001 AC1, UI-DESIGN-001 AC2, UI-DESIGN-001 AC3, UI-DESIGN-001 AC4, UI-DESIGN-001 AC5, UI-DESIGN-001 AC6, UI-SCREEN-001 AC1, UI-SCREEN-001 AC2, UI-SCREEN-001 AC3

## Goal

Review P9-04A before the work queue pattern is copied to other screens.

## Inputs

- `.forge/evidence.md` entry `P9-04A - Work Queue Golden Screen`
- `.forge/trust.md` entry `P9-04A Builder Trust Note`
- `coverage/web-visual-review/en-work-queue-visual-regression.html`
- `coverage/web-visual-review/ar-work-queue-visual-regression.html`
- P9-04A source changes

## Review Checks

- The work queue is acceptable as the redesign golden screen.
- No fallback complaint rows remain in `work-queue.tsx`.
- Rows render only from the typed staff queue API data path.
- Loading, empty, error, success, and conflict states have correct accessible feedback roles.
- EN/AR RTL/LTR layout is acceptable, including horizontal table overflow.
- Backend authority remains intact: no role, branch scope, workflow, owner, or state authority is derived in React.

## Output

- Accept: write P9-04C to `.forge/next.md`, set `.forge/state.md` to `Ready to Build`.
- Repair: write the smallest P9-04A repair task to `.forge/next.md`, set `.forge/state.md` to `Needs Repair`.
