# Forge Policy

## Core Rules

1. Read `.forge/next.md` before editing.
2. Stay inside the declared scope.
3. Do not weaken acceptance criteria, tests, security, audit, or RBAC.
4. Do not claim a check passed unless it actually ran.
5. Record assumptions and gaps.
6. Keep the chain alive: update `next.md` and `state.md` before finishing.

## CMS-Auto Rules

- Requirement IDs from `docs/CMS_AUTO_SRS.md` must appear in tasks and evidence.
- Security, audit, RBAC, branch scope, and portal privacy requirements override
  convenience.
- Workflow authority belongs in the API, not React components.
- Complaint state changes must write history and audit entries.
- Customer portal access requires verification, not reference number alone.
- Reports and exports must respect RBAC and branch scope.
- Arabic RTL and English LTR are acceptance criteria, not polish.
- UI-DESIGN-001 is mandatory: use the shared design system, prove loading,
  empty, error, success, conflict, accessibility, RTL/LTR, and visual states.
- Architectural consistency must be enforced by checks where possible:
  boundaries, coverage, OpenAPI drift, strict typecheck, lint, visual,
  accessibility, and frontend performance.
- Prefer generator/template output or the golden reference module over
  inventing a new module shape.

## Verification Labels

- `Passed`: command or check ran and passed
- `Failed`: command or check ran and failed
- `Not Run`: not executed
- `Assumed`: reasoned from code but not verified
- `Needs Human Review`: judgment or UAT required

## Risk Rules

- Low: docs, copy, simple UI polish
- Medium: normal UI/API feature
- High: auth, RBAC, branch scope, workflow, SLA, attachments, reports
- Critical: portal privacy leak, data loss, audit bypass, deployment blocker

High and critical work needs verification or review before acceptance.

## Testing Rules

- New business logic needs at least one behavior test.
- Trust-boundary validation must be tested.
- Avoid implementation-only tests.
- Do not add broad test scaffolding unless the task needs it.
