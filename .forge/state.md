# Current State

Status: Business readiness Slice 1 complete
Phase: business-readiness-remediation
Next Task: Slice 2 - Submission SLA and Acknowledgement
Model Tier: GPT-5.5 Extra High

## How to use this file

SNAPSHOT only. REPLACE each run, never append. Per-task detail -> evidence.md.
Prior state history is in .forge/archive/state-archive.md.

## Snapshot

- Branch `codex/user-scoped-ux-redesign` is active.
- Slice 0 still lacks human signoff for report deferrals, DMS mode, compensation scope, and approved notification channels. Slice 1 could proceed using the SRS default OTP method: code to complaint primary phone.
- Slice 1 now queues customer OTP delivery through the existing notification queue as SMS, with English/Arabic body text selected by portal locale.
- Portal verification persistence remains hash-only for OTP values; API responses, portal tracking data, audit records, session records, and web storage do not expose OTP hashes or session hashes.
- OTP SMS dispatch bypasses preference/quiet-hour skips because the code is requested by the customer and must reach the primary complaint phone.
- Proof passed: `test:api -- portal.tracking`, `test:api -- notifications`, `test:web -- api-client`, `test:e2e -- customer-portal-track`, `openapi:check`, `typecheck`, `lint`, and `test:visual`.

## Current Stop

Ready to commit Slice 1, then start Slice 2.

## Open Carry-Forward / Known Debt

- Human signoff is still needed before slices that depend on report deferrals, DMS live/manual mode, compensation scope, or notification-channel approval.
- Live browser screenshots for wrong-code, expired, and exhausted OTP states were not run; registered visual proof renders route previews and the customer portal e2e proof covers those states without a browser.
- Existing unrelated dirty `apps/api/src/modules/integrations/integrations.module.ts` and untracked proof artifacts remain untouched.
