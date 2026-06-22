# READY TO BUILD - P11C-TASK-UPDATE-STAFF-PICKERS

Status: Ready to Build
Required model tier: GPT-5 High or Opus 4.8 Max
Phase: Phase 11 - Operator UX Foundation
Risk: High
SRS IDs: REQ-RBAC-001, REQ-LOCALIZATION-001, UI-DESIGN-001

## Context

P11A and P11B are complete:

- Username login works for staff users.
- Quick Add assignee uses a server-session scoped staff picker.
- Quick Add related records use a server-session scoped picker for customers,
  complaints, cases, and deals.
- Quick Add no longer requires raw user IDs or raw related-record IDs in the
  normal operator workflow.

The remaining Today task update controls still expose raw staff IDs for
assignee and next follow-up ownership. Dealership staff should choose people by
name, role, and branch instead.

Read `docs/OPERATOR_UX_FOUNDATION_PLAN.md` before implementation.

## Scope

Implement only P11C:

1. Reuse or minimally extend the existing server-session scoped assignable staff
   lookup.
   - Results must respect RBAC and branch scope.
   - Do not accept role/branch authority from client input.
2. Replace Today task update raw assignee ID input with a localized staff picker.
3. Replace Today next follow-up raw person ID input with a localized staff picker.
4. Selected values submit user IDs silently.
5. No raw staff ID is visible in the normal task update workflow.
6. Keep existing Done, Waiting, status, and next action behavior intact.
7. Localize all touched task update strings in English and Arabic.
8. Verify RTL layout for Arabic Today task update controls.

## Guardrails

- Backend owns authority; roles and branch scope come from the server session.
- Do not roll pickers across every form yet.
- Do not change Quick Add related-record picker behavior except where necessary
  for shared staff picker reuse.
- Do not add admin screens, AI, WhatsApp, mobile, deploy, or workflow builder.
- Keep source files under 300 lines or split naturally.
- No hardcoded user-facing strings in components.
- Use existing shadcn/Radix/Tailwind patterns.

## Required Proof

- `corepack pnpm test:api -- tasks`
- `corepack pnpm test:web -- shell`
- `corepack pnpm test:web -- localization`
- `corepack pnpm openapi:check`
- `corepack pnpm typecheck`
- `corepack pnpm lint`
- `git diff --check`
- Live smoke: login as staff, open Today, update assignee and next follow-up
  person through staff picker controls without typing or pasting raw IDs, then
  verify Arabic task update labels and RTL layout.
