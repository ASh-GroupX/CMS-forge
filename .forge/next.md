# QR complaint intake destination and customer navigation

Status: In progress
Date: 2026-11-14
Risk: High
SRS: REQ-PORTAL-001, REQ-WORKFLOW-002, REQ-ADMIN-001, PORTAL-SEC-001, WORKFLOW-MATRIX-001, UI-DESIGN-001

Scope: Sequential slices: (1) remove Track and Survey entry points from the public QR complaint page and success state while preserving verified tracking and survey backend workflows; (2) add Admin-configured suggested destination branch and department, validate active targets and write versioned audit; (3) preselect the suggestion in the claimed intake editor and permit only the configured, claimed intake redirect command to transfer a complaint to another branch, with the existing atomic history, audit, and assignment behavior. Preserve source-branch queue scope until redirect and hide routing from customers. The preceding subject/vehicle repair deployed successfully as d407fcd.

Proof: focused portal/redirect API tests, migration validation and isolated PostgreSQL proof, typecheck, lint, OpenAPI, browser visual/axe at phone and desktop, and production release smoke. Preserve tmp/ and uploads/. SMS remains deferred.
