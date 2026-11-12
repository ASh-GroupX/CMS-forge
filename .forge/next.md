# QR intake — release verified non-SMS workflow

Status: Release in progress
Risk: High
Required model tier: GPT-6 Sol or higher
SRS: REQ-PORTAL-001, REQ-WORKFLOW-002, REQ-NOTIFY-001/002, REQ-ADMIN-001, REQ-INT-DATA-001, PORTAL-SEC-001, WORKFLOW-MATRIX-001, UI-DESIGN-001

Scope: commit/push verified workflow, monitor migration-before-API deployment, verify revision/health and protected routes, record release outcome. SMS acknowledgement remains deferred. Preserve tmp/ and uploads/.

Implementation/proof slices completed: settings persistence/authority and generated module boundary; public form/snapshots; scoped customer export; claim/queue/correction; atomic redirect/assignment/history/audit; staff UI/visibility; post-commit team notifications; isolated database + HTTP/browser/security proof. No live-provider SMS integration is claimed.
