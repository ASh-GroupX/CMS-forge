# QR complaint intake destination and customer navigation

Status: Complete
Date: 2026-11-14
Risk: High
SRS: REQ-PORTAL-001, REQ-WORKFLOW-002, REQ-ADMIN-001, PORTAL-SEC-001, WORKFLOW-MATRIX-001, UI-DESIGN-001

Scope: Sequential slices: (1) remove Track and Survey entry points from the public QR complaint page and success state while preserving verified tracking and survey backend workflows; (2) add Admin-configured suggested destination branch and department, validate active targets and write versioned audit; (3) preselect the suggestion in the claimed intake editor and permit only the configured, claimed intake redirect command to transfer a complaint to another branch, with the existing atomic history, audit, and assignment behavior. Preserve source-branch queue scope until redirect and hide routing from customers. The preceding subject/vehicle repair deployed successfully as d407fcd.

Proof: Passed focused portal/redirect API tests, fresh 64-migration isolated PostgreSQL and real HTTP cross-branch workflow, typecheck, lint, OpenAPI, visual/accessibility/performance, authenticated local browser at phone/desktop, production deployment 43566832522, live health/options/portal smoke, and read-only production portal EN/AR at 390/1440. Preserve tmp/ and uploads/. SMS remains deferred. Configuring real destination/team values is an Admin operation; no production complaint was submitted for proof.
