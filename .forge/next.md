# Department customer phone duplicate rule
Status: Implemented locally; tests passed; policy-tier review pending
Risk: High
SRS: REQ-RBAC-001, METHOD-API-001, METHOD-TEST-001, UI-DESIGN-001

Admin adds a custom field with Customer phone duplicate rule. Server forces TEXT
and required international phone; no default local country. Normalize +/00 prefix,
spacing/punctuation and Arabic/Persian digits. Check all tickets readable by the
session across accessible departments. Show at most20 minimal ticket links.
User opens prior ticket to follow up in existing notes, or explicitly acknowledges
that phone field for a different problem. Editing input clears acknowledgement.

Replanned bounded steps completed: schema/index, server helper+integration,
admin/UI, generated contracts/client and verification. Existing fields default
false; no existing values reinterpreted or indexed automatically. Rule is immutable
on an existing field; add a new rule field to enable it. Phone records remain if
field is later deleted, preserving prior duplicate detection history.

Passed full suite74/74 (89.78% lines), internal ticket API8/8 incl real HTTP
401/200/400/404, API-client103/103, shell228/228, lint/typecheck/build/OpenAPI and
generated client check. EN/AR browser proof and screenshots inspected. PostgreSQL
migration/defaults, cross-department allowed/denied/admin visibility and concurrent
create lock/recheck passed. Temporary database stopped after proof.

Independent fresh reviewer found no additional confirmed blocker after typed
client/HTTP coverage repairs. Named High reviewer tier unavailable; not claimed
as phase acceptance. No push/merge/deployment. Next release must retain this
limitation honestly. Preserve unrelated tmp/ and uploads/.

Release direction: user explicitly authorized pushing waleed and merging
production on 2026-11-05 after the test report. Existing verification/reviewer
limitations remain recorded; named-tier review is not relabeled as passed.
