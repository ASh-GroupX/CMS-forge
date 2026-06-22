# READY TO PLAN - AFTER P11 OPERATOR UX RELEASE REVIEW

Status: P11 Operator UX Foundation Release Ready
Required model tier: GPT-5 High or Opus 4.8 Max
Phase: Phase 11 - Operator UX Foundation
Risk: Medium
SRS IDs: REQ-RBAC-001, REQ-LOCALIZATION-001, UI-DESIGN-001

## Context

P11A, P11B, P11C, P11D Deals, P11D CAPA / Case, P11D Reports filter picker
cleanup, the Reports export live smoke repair, and P11E Operator UX Arabic
completion pass are complete and release-reviewed.

Final release review:

- Confirmed touched operator flows use dropdown/picker controls for staff and
  related-record selection; IDs submit silently where backend contracts require
  them.
- Hardened confidential case display so it shows case topic, branch name, and
  human owner labels instead of raw case/branch/author IDs.
- Cleaned generated `output/run-app/web.stdout.log`; retained P11E screenshots
  under `output/playwright/` as release evidence.
- Final proof passed: API auth/tasks/deals/cases/reports, web shell and
  localization, OpenAPI, typecheck, lint, and `git diff --check`.
- Preserved backend authority, report calculations, workflow behavior, password
  policy, and customer portal privacy.

## Plan Needed

Pick the next scoped post-P11 task. Keep it small, usually 1-5 files plus
focused tests.

## Guardrails

- Backend owns authority; roles and branch scope come from the server session.
- Do not accept role/branch authority from client input.
- Do not weaken password policy.
- Do not change customer portal privacy.
- Do not redesign release-reviewed P11 screens unless the next scoped task
  explicitly asks for it.
- No admin screens, AI, WhatsApp, mobile, deploy, or workflow builder unless the
  next scoped task explicitly asks for it.
