# Current State

Status: Business readiness Slice 8 complete
Phase: business-readiness-remediation
Next Task: Slice 9 - Staff Intake Attachments
Model Tier: GPT-5.5 Extra High

## How to use this file

SNAPSHOT only. REPLACE each run, never append. Per-task detail -> evidence.md.
Prior state history is in .forge/archive/state-archive.md.

## Snapshot

- Branch `codex/user-scoped-ux-redesign` is active.
- Slice 0 still lacks human signoff for report deferrals, DMS mode, compensation scope, and approved notification channels.
- Slice 1 queues customer OTP delivery through the existing notification queue as SMS, with English/Arabic body text selected by portal locale.
- Slice 2 queues submit notifications and creates intake SLA deadline events after submitted complaint creation commits; drafts still create no active SLA deadline or submit notification.
- Slice 3 enforces backend management-readonly masking for complaint search/detail sensitive values using the server-derived role.
- Slice 4 wires the audit viewer to backend search/export through the staff session cookie, with filters, localized states, and backend-redacted metadata.
- Slice 5 adds real admin category list/create/edit/deactivate UI and minimal SLA policy list/edit UI backed by guarded API routes and CONFIG audit entries.
- Slice 6 keeps the guarded RPT-001 through RPT-017 matrix visible, labels generic exports as operational report rows, and marks incomplete reports as deferred pending business signoff instead of implying delivery.
- Slice 7 wires staff internal/public comments and verified portal public timeline updates; internal comments remain hidden from portal tracking.
- Slice 8 schedules closure surveys after workflow commit, sends tokenized survey links through the existing notification path, wires portal survey submit/terminal states, and shows authorized CSAT in staff detail.
- Proof passed for Slice 8: `test:api -- surveys`, `test:api -- workflow`, `test:web -- api-client`, `test:web -- shell`, `test:web -- localization`, `typecheck`, `lint`, `git diff --check`, and portal survey screenshots.

## Current Stop

Ready to commit Slice 8, then start Slice 9.

## Open Carry-Forward / Known Debt

- Human signoff is still needed before final acceptance of report deferrals, DMS live/manual mode, compensation scope, or notification-channel approval.
- Exact report decision still needed: either sign MVP deferral for RPT-002, RPT-003, RPT-005 through RPT-012, RPT-014, RPT-015, and RPT-016, or approve implementation of those missing report-specific outputs.
- Existing unrelated dirty `apps/api/src/modules/integrations/integrations.module.ts` and untracked proof artifacts remain untouched.
