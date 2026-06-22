# READY TO PLAN - NEXT OPERATOR UX SLICE

Status: Ready to Plan
Required model tier: GPT-5 High or Opus 4.8 Max
Phase: Phase 11 - Operator UX Foundation
Risk: Medium
SRS IDs: REQ-RBAC-001, REQ-LOCALIZATION-001, UI-DESIGN-001

## Context

P11A, P11B, P11C, P11D Deals, P11D CAPA / Case, P11D Reports filter picker
cleanup, and the Reports export live smoke repair are complete.

Reports export repair:

- Reproduced the live local `GET /reports/export` HTTP 500.
- Fixed reports module runtime DI/controller binding for local API export.
- Preserved selected filters, RBAC, branch scope, row limits, and REPORT audit
  behavior.
- Verified allowed filtered export returns 200 and out-of-scope branch export
  returns 403.
- Did not change report KPI calculations or redesign Reports UI.

## Plan Needed

Pick the next scoped Operator UX Foundation task. Keep it small, usually 1-5
files plus focused tests.

## Guardrails

- Backend owns authority; roles and branch scope come from the server session.
- Do not accept role/branch authority from client input.
- Do not weaken password policy.
- Do not change customer portal privacy.
- Do not redesign completed screens unless the next scoped task explicitly asks
  for it.
- No admin screens, AI, WhatsApp, mobile, deploy, or workflow builder unless the
  next scoped task explicitly asks for it.
