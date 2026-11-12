# Complaint form configuration and booking vehicle catalog

Status: Complete — implementation and local proof; production deployment tracked in state/evidence
Date: 2026-11-12
Risk: High
SRS: REQ-PORTAL-001, REQ-WORKFLOW-002, REQ-NOTIFY-001/002, REQ-ADMIN-001, REQ-INT-DATA-001, PORTAL-SEC-001, WORKFLOW-MATRIX-001, UI-DESIGN-001

Scope: sequential slices (1) versioned field definitions, required VIN default and custom answer persistence with all fields configurable as optional per explicit user reply; (2) shared active booking make/model catalog for public and normal complaint creation plus backend validation; (3) Admin fields page, dynamic public form and intake custom-answer editing/display; (4) migration, privacy/RBAC, browser/OpenAPI/review and release proof. Preserve existing complaint data and shared customers/vehicles. SMS remains deferred.

Proof: focused API suites, settings allowed/denied/conflict, required/optional/custom field validation, stale/invalid make-model pairs, typecheck, lint, OpenAPI, migration/index checks, public/staff EN/AR responsive browser/axe and end-to-end persistence. Preserve tmp/ and uploads/.
