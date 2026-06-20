# Forge Policy

## Core Rules

1. Read `.forge/next.md` before editing.
2. Stay inside the declared scope.
3. Do not weaken acceptance criteria, tests, security, audit, or RBAC.
4. Do not claim a check passed unless it actually ran.
5. Record assumptions and gaps.
6. Keep the chain alive: update `next.md` and `state.md` before finishing.
7. When a backlog phase is complete, stop and run `PHASE-REVIEWER` before the
   next phase starts.
8. Keep the codebase agentic: small files, small tasks, enforced boundaries.
9. Auto phase mode may continue between successful build tasks, but it never
   skips proof commands, evidence, planner stops, blockers, or phase review.
10. High and Critical tasks record a security self-check before acceptance.
11. Context hygiene: `state.md` is a small snapshot - replace it each run, never
    append. `evidence.md` and `trust.md` are append-only logs; read only the latest
    entries and rotate older phases into `.forge/archive/`.

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
- UI tooling is mandatory: build components with the shadcn/ui CLI (never hand-roll
  primitives), use the design tokens, and render + screenshot + self-review each screen
  against the golden screen before a UI task is done. UI built blind is not done.
- Architectural consistency must be enforced by checks where possible:
  boundaries, coverage, OpenAPI drift, strict typecheck, lint, visual,
  accessibility, and frontend performance.
- Prefer generator/template output or the golden reference module over
  inventing a new module shape.
- Module `MODULE.md` files are OKF-style markdown concept docs: YAML frontmatter
  (`type: forge.module`, title, description, tags) plus the human-readable boundary.
- A module manifest is not trusted by shape alone. Forge hardening must check
  declared owned tables, allowed dependencies, and runtime wiring against code.
- Phase completion is not accepted by the builder. It requires a fresh
  `PHASE-REVIEWER` pass using Opus 4.8 Max or GPT-5.5 Extra High.
- App/package/tool source files must stay under the 300-line agentic budget
  unless they are explicit canonical exceptions: tests, DTOs, Prisma schema,
  OpenAPI, migrations, generated files, or docs.
- If a task cannot stay near 1 to 5 files plus tests, stop and replan instead of
  building a large diff.

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

High and critical work needs proof commands, security self-checks, and the phase-end review before phase acceptance.

## Security Self-Check

Every High or Critical risk task records these in `.forge/evidence.md` before it
counts as done, citing where each is enforced or tested:

- Roles and branch scope come from the server session, never client input.
- Each state change writes status history and an audit entry in the same
  transaction; side effects enqueue after commit.
- No passwords, OTPs, tokens, hashes, or provider secrets are logged or returned.
- Customer portal exposure rules hold: no internal comments, audit, DMS codes, or
  staff PII reach the portal.
- Trust boundaries are tested: at least one allowed and one denied case.

A self-check is the minimum the builder proves on its own. It does not replace the
phase-end `PHASE-REVIEWER`.

## Testing Rules

- New business logic needs at least one behavior test.
- Trust-boundary validation must be tested.
- Avoid implementation-only tests.
- Do not add broad test scaffolding unless the task needs it.
