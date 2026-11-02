# Reports command center redesign
Status: Verified, including attachment proxy test repair
Risk: High
Required model tier: High or equivalent
SRS: REQ-REPORT-001, REQ-RBAC-001, NFR-SEC-002, NFR-PERF-001,
ARCH-UI-001, UI-DESIGN-001, METHOD-API-001, METHOD-TEST-001

Redesign the CMS Reports page as the primary enterprise reporting surface while
keeping the separate CRM completely out of scope. Preserve server-session RBAC
and department/branch scope. Replace browser-only filtering of the first page
with backend-filtered, paginated reads and aggregate KPI queries. Add scoped,
audited complete-record ZIP downloads containing PDF reports, JSON, a manifest,
and original available attachments. Keep regulatory delivery material available
as a collapsed appendix. Verify English/Arabic, desktop/mobile, OpenAPI, build,
and allowed/denied export cases. Do not deploy this feature branch.

Follow-up completed 2026-11-02: repaired attachment download proxy behavior and
the four failing API client assertions. The full `test:web -- api-client` suite
now passes (95/95). The feature branch remains undeployed.

Follow-up completed 2026-11-02: admin department selection now expands the
department detail inline beneath the comparison table. The comparison remains
visible, and the detail panel has a close control in its top header.
