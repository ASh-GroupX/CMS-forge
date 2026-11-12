# Redirected portal complaint subject and vehicle display

Status: In progress
Date: 2026-11-12
Risk: High
SRS: REQ-PORTAL-001, REQ-WORKFLOW-002, PORTAL-SEC-001, UI-DESIGN-001

Scope: Sequential repair slices: (1) make customer name the subject for new public complaints and staff redirect corrections; (2) backfill only existing redirected public complaints whose subject still exactly matches the generated make/model string, recovering missing snapshots from a unique booking catalog match, with metadata-only audit; (3) retain submitted make/model/VIN and added answers through the staff API mapper, show submitted vehicle data with its verification reason in the receiving complaint, and keep that detail usable on phones. Use CMS-2026-KHALDA-000004 screenshots as regression evidence. Preserve public privacy, verified vehicle identity, and all other complaint subjects.

Proof: focused portal/redirect API tests, targeted web rendering, migration validation and isolated PostgreSQL backfill proof, typecheck, lint, OpenAPI, browser visual/axe at phone and desktop, production read-only case check after deployment where authorized. Preserve tmp/ and uploads/.
