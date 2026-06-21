# READY TO BUILD - P11A-OPERATOR-UX-FOUNDATION

Status: Ready to Build
Required model tier: GPT-5 High or Opus 4.8 Max
Phase: Phase 11 - Operator UX Foundation
Risk: High
SRS IDs: REQ-AUTH-001, REQ-RBAC-001, REQ-LOCALIZATION-001, UI-DESIGN-001

## Context

Phase 10 task collaboration is complete. The next product gap is operator UX:
staff should not type raw IDs or understand technical field names. Arabic must
be complete and native-feeling, not partial.

Read `docs/OPERATOR_UX_FOUNDATION_PLAN.md` before implementation.

## Scope

Implement only the first slice:

1. Add username support for staff login.
   - Login should accept username or email.
   - UI should say Username + Password.
   - Seed simple dev usernames such as `admin`, `layla`, `omar`, `sara`.
   - Do not weaken production password security. Use dev/demo credentials or
     bootstrap overrides for simple local login.
2. Add a server-session scoped staff lookup for assignable users.
3. Replace Quick Add Task assignee free-text ID with a searchable staff picker.
4. Make the touched login and Quick Add UI Arabic-complete.
5. Keep raw IDs out of the visible normal workflow.

Do not implement every picker in this slice. After P11A, update `next.md` for
P11B related-record picker.

## Guardrails

- Backend owns authority; roles and branch scope come from the server session.
- No raw `ownerId`, `assigneeId`, `branchScope`, or role authority from client
  input.
- Customer portal privacy must not change.
- No admin screens, AI, WhatsApp, mobile, deploy, or workflow builder.
- Keep source files under 300 lines or split naturally.
- No hardcoded user-facing strings in components.
- Use existing shadcn/Radix/Tailwind patterns.

## Required Proof

- `corepack pnpm test:api -- auth`
- `corepack pnpm test:api -- tasks`
- `corepack pnpm test:web -- shell`
- `corepack pnpm test:web -- localization`
- `corepack pnpm openapi:check`
- `corepack pnpm typecheck`
- `corepack pnpm lint`
- `git diff --check`
- Live smoke: login with username, switch/open Arabic shell, create a task from
  Today using the staff picker, verify no assignee ID typing was needed.
