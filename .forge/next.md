# Hide empty ticket draft notice
Status: Implemented; final EN/AR browser proof recorded in evidence
Risk: Medium
SRS: UI-DESIGN-001, METHOD-TEST-001

User clarified the entire draft message and discard action must disappear after
confirmed discard, then return only when new meaningful input exists. The form
now renders the entire notice only when hasTicketDraft is true. No persistent
success box. Retain confirmation, full reset/files/cache, cancel preservation,
error clearing, submit-time disabling and title focus.
Scope: existing ticket form and real Next browser proof plus Forge docs.
Proof: real Next EN/AR discard/reset/reload/notice return; lint/typecheck/web build.
Independent static review found no blockers; policy-named tier unavailable and
not claimed as passed. Earlier navigation proofs remain recorded. No new backend,
workflow/auth/portal changes. Keep unrelated tmp/uploads.

User authorizes push and merge. Release verified fix via waleed to production;
monitor existing validation/deployment workflow and live revision/health.
