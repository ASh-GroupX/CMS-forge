# Backlog

Planned from `docs/CMS_AUTO_SRS.md`. Keep this file current; do not copy old
history from another project.

## Phase 0 - Repository Foundation

- [x] F0-00: Agent rulebook and architecture blueprint (`CLAUDE.md`, `AGENTS.md`, `docs/ARCHITECTURE.md`)
- [x] F0-01: Create monorepo scaffold for web, api, database, shared contracts
- [x] F0-02: Add lint, typecheck, test, build, and OpenAPI scripts
- [x] F0-03: Add Docker local stack for PostgreSQL, Redis, API, web
- [x] F0-04: Add seed data for branches, roles, users, categories, vehicles, complaints
- [x] F0-05: Add frontend design tokens and shared UI component foundation
- [x] F0-06: Add architecture rules, boundary lint, coverage gates, OpenAPI drift, visual/a11y/perf checks
- [x] F0-07: Add module generator template and designate golden CRUD reference module
- [x] F0-08: Draft coherent Prisma data model before feature migrations

## Forge Hardening

- [x] FORGE-OKF-TRUTH-001: Add manifest truth gate (`MODULE.md` owned tables, allowed deps, and module wiring checked against code)

## Phase 1 - Security Baseline

- [x] F1-00A: Generate and apply the F0-08 Prisma migration
- [x] F1-00B: Bootstrap NestJS API and minimal core kernel
- [x] F1-01A: Auth data foundation and API test harness
- [x] F1-01B: Auth module credential verification with Argon2id and generic denial
- [x] F1-01C: Staff session persistence and secure cookie issuance
- [x] F1-01D: Session validation and logout invalidation
- [x] F1-01E1: Auth HTTP login/logout routes and module wiring
- [x] F1-01E2: Auth audit entries for login success, login failure, and logout
- [x] F1-01E3: Auth OpenAPI contract and final security proof (Verify Gate: required)
- [x] F1-02: RBAC and branch-scope enforcement
- [x] F1-03A: Audit log search endpoint for authorized admins (Verify Gate: required)
- [x] F1-03B: Audit log export endpoint with configured limits and branch/role scope
- [x] F1-03C: Audit append-only enforcement proof
- [x] F1-04: Stable API error shape and correlation IDs
- [x] F1-05: Build golden CRUD reference module for branches or categories and freeze its pattern
- [x] F1-05A: Nest-ready module generator
- [x] F1-05B: Generate branches module shell and manifest
- [x] F1-05C: Branch read/list service and repository behavior
- [x] F1-05D: Branch read/list HTTP endpoints with Admin RBAC and OpenAPI
- [x] F1-05E: Branch create/update/deactivate service behavior with audit entries
- [x] F1-05F: Branch write HTTP endpoints, API tests, and golden CRUD pattern freeze
- [x] F1-06A: Login rate limiting by account and IP on `POST /auth/login` (NFR-SEC-001 AC3) — split from F1-06 by PLAN-F1-06
- [x] F1-06B: CSRF kernel guard, token issuance, and enforcement on auth mutation routes (`POST /auth/logout`) (NFR-SEC-001 AC5) (Verify Gate: required) — split from F1-06 by PLAN-F1-06
- [x] F1-06C: Enforce CSRF on branch admin mutation routes (`POST /branches`, `PATCH /branches/:id`, `POST /branches/:id/deactivate`) with OpenAPI and admin test fixups (NFR-SEC-001 AC5) — split from F1-06 by PLAN-F1-06

## Phase 2 - Complaint Core

- [x] F2-01: Complaint domain schema and migrations
  - [x] F2-01A: Add complaint transition history metadata schema and migration
  - [x] F2-01B: Generate complaints module shell and fill `MODULE.md`
- [x] F2-02: Backend complaint state machine
  - [x] F2-02A: Add workflow transition matrix validation with service tests
  - [x] F2-02B: Persist complaint transitions with status history and same-transaction audit (Verify Gate: required)
  - [x] F2-02C: Add complaint transition HTTP route, RBAC/branch-scope tests, and OpenAPI
- [x] F2-03: Complaint creation and staff queues
  - [x] F2-03A: Add complaint creation service behavior with validation, reference generation, history, and audit
  - [x] F2-03B: Add complaint creation HTTP route, OpenAPI, and allowed/denied API tests
  - [x] F2-03C: Add branch-scoped staff complaint queues
- [x] F2-04: Complaint detail timeline, comments, and history
  - [x] F2-04A: Add complaint detail read model with status-history timeline
  - [x] F2-04B: Add internal/public comment service behavior with privacy and audit tests
  - [x] F2-04C: Add complaint detail/comment HTTP routes and OpenAPI
- [x] REPAIR-PHASE-2-TRANSITION-BRANCH-SCOPE: Enforce target complaint branch scope before transitions
- [x] REPAIR-PHASE-2-TRANSITION-ROLE-DENIAL-AUDIT: Audit transition-specific unauthorized role denials

## Phase 3 - SLA And Workflow Operations

- [x] F3-01: SLA policy model and deterministic deadline calculation
  - [x] F3-01A: Generate SLA module and deterministic deadline calculator (Verify Gate: required)
  - [x] F3-01B: Resolve active SLA policies by complaint severity, stage, and scope
  - [x] F3-01C: Record SLA deadline events when complaints enter SLA-governed states
- [x] F3-02: SLA warning and breach jobs
  - [x] F3-02A: Add idempotent SLA warning job at configured threshold
  - [x] REPAIR-F3-02A: Honest SLA warning job results and malformed policy skip
  - [x] F3-02B: Add idempotent SLA breach job and reportable breach event
- [x] F3-03: Escalation notification events
  - [x] F3-03A1: Generate notifications module boundary and manifest
  - [x] F3-03A2: Add queued internal notification public service (Verify Gate: required)
  - [x] F3-03A3: Queue escalation notification events after SLA breach commit
- [x] F3-04: Reopen, send-back, resolve, and close workflows
  - [x] F3-04A: Enforce send-back/reopen reasons and resolution requirements
  - [x] F3-04B: Add closure/reopen side-effect scheduling without in-transaction side effects

## Phase 4 - Customer Portal

- [x] F4-01: Customer complaint submission
  - [x] F4-01A: Generate portal module boundary and manifest
  - [x] F4-01B: Add portal complaint submission service path
  - [x] F4-01C: Add public submission HTTP route, OpenAPI, rate limit, and portal API tests (Verify Gate: required)
  - [x] REPAIR-F4-01C: Remove DMS customer number from public portal submission
- [x] F4-02: Portal tracking with reference plus OTP verification
  - [x] F4-02A: Add portal OTP request persistence and notification queueing
  - [x] F4-02B: Add OTP verification and expiring portal session issuance (Verify Gate: required)
  - [x] REPAIR-F4-02B: Audit OTP verification failure outcomes
  - [x] F4-02C: Add verified portal tracking endpoint
- [x] F4-03: Portal-safe public timeline
  - [x] F4-03A: Add portal-safe timeline read model
  - [x] F4-03B: Add portal follow-up path for non-closed complaints
- [x] F4-04: Portal privacy tests
  - [x] F4-04A: Add explicit portal privacy regression tests

## Phase 5 - Attachments And Notifications

- [x] F5-01: Secure attachment upload/download
  - [x] F5-01A: Generate attachments module boundary and manifest
  - [x] F5-01B: Add attachment upload metadata policy validation
  - [x] F5-01C: Add attachment storage port and in-memory adapter
  - [x] F5-01D: Persist attachment metadata with upload audit
  - [x] F5-01E: Add staff attachment upload route with RBAC, branch scope, and OpenAPI
  - [x] F5-01F: Add staff attachment download authorization and short-lived URL route
  - [x] F5-01G: Add portal attachment upload path for verified non-closed complaints
  - [x] F5-01H: Add portal attachment download/privacy regression coverage
- [x] F5-02: Malware scan hook states
  - [x] F5-02A: Add attachment scan status transition service
  - [x] F5-02B: Enforce scan status in attachment download behavior
- [x] F5-03: Email adapter and in-memory provider
  - [x] F5-03A: Generate integrations module boundary and manifest
  - [x] F5-03B: Add email provider adapter with in-memory test double
  - [x] F5-03C: Dispatch queued email notifications with failure status
- [x] F5-04: SMS/WhatsApp-ready adapter interfaces
  - [x] F5-04A: Add SMS provider adapter with in-memory test double
  - [x] F5-04B: Add WhatsApp provider adapter with in-memory test double
  - [x] F5-04C: Dispatch queued SMS/WhatsApp notifications with failure status
- [x] F5-05: Notification templates and delivery log
  - [x] F5-05A: Add notification template schema and migration
  - [x] F5-05B: Add Arabic/English notification template resolution service
  - [x] F5-05C: Add Admin notification template routes with RBAC and OpenAPI
  - [x] F5-05D: Add notification delivery attempt log and retry-safe status updates
- [x] F5-06: Notification preferences and quiet hours
  - [x] F5-06A: Add customer notification preference schema and service
  - [x] F5-06B: Enforce quiet hours and channel preference during dispatch
  - [x] REPAIR-F5-06B-CRITICAL-QUIET-HOUR-BYPASS: Honor critical SMS quiet-hour bypass
- [x] F5-07: Survey link flow
  - [x] F5-07A: Generate surveys module boundary and manifest
  - [x] F5-07B: Schedule survey links from closure notification events
  - [x] F5-07C: Add one-time expiring portal survey submission API
  - [x] F5-07D: Expose submitted survey results to authorized staff read models

## Phase 6 - Staff UI

- [ ] F6-01: Operational shell, auth entry, navigation, RTL/LTR
  - [x] F6-01A: Bootstrap Next.js staff shell with localized RTL/LTR navigation
  - [x] F6-01B: Add staff login/logout UI with generic safe errors and session-aware shell states
  - [x] F6-01C: Add role-aware navigation visibility for staff/admin/management routes
  - [ ] F6-01D: Add staff password-reset UI contract or stop for backend reset-route repair if endpoints are still absent
- [ ] F6-02: Staff home dashboard and work queues
  - [ ] F6-02A: Add minimal typed web API client/error mapping for staff complaint reads
  - [ ] F6-02B: Add role-specific dashboard summary cards for open, overdue, SLA warning, closed, and average TAT
  - [ ] F6-02C: Add complaint work queue table with filters, pagination, loading, empty, and error states
  - [ ] F6-02D: Add queue responsive and RTL/LTR web tests at staff breakpoints
- [ ] F6-03: Complaint create form
  - [ ] F6-03A: Add customer/vehicle lookup panel with manual fallback UI
  - [ ] F6-03B: Add localized complaint create form with category, severity, branch, incident date, subject, and description validation
  - [ ] F6-03C: Add attachment upload panel with file-rule messages and scan-status display
  - [ ] F6-03D: Submit complaint through backend API with success, validation error, and preserved-input states
- [ ] F6-04: Complaint detail workspace
  - [ ] F6-04A: Add complaint detail layout with facts, customer/vehicle data, current owner, SLA timer, timeline, and survey results
  - [ ] F6-04B: Add comments and public-update panels with visibility badges
  - [ ] F6-04C: Add attachment upload/download controls using backend authorization and scan-status states
  - [ ] F6-04D: Add workflow action modal for allowed backend transitions with required comments and validation
  - [ ] F6-04E: Add optimistic-concurrency conflict recovery and detail workspace RTL/LTR tests
- [ ] F6-05: Admin, audit, and notification screens
  - [ ] F6-05A: Add Admin branches/departments screen using the golden CRUD UI pattern
  - [ ] F6-05B: Add Admin users/roles/branch-scope screen and password-reset admin UI contract
  - [ ] F6-05C: Add Admin categories/severity/SLA policy screens with localized validation states
  - [ ] F6-05D: Add Admin notification template screen for Arabic/English templates, channels, preview, activate, and deactivate
  - [ ] F6-05E: Add Audit viewer screen with filters, export affordance, and Admin-only visibility
  - [ ] F6-05F: Add in-app notification center with read/unread states and scoped complaint links
- [ ] F6-06: Staff reports entry surfaces
  - [ ] F6-06A: Add reports dashboard navigation and placeholder states for RPT-001 through RPT-017 pending Phase 7 APIs
  - [ ] F6-06B: Add export affordance UI states without client-side unbounded export behavior
- [ ] F6-07: UI quality gate: visual regression, accessibility, RTL/LTR, and frontend performance proof
  - [ ] F6-07A: Replace fail-loud web proof placeholders with real `test:web`, `test:visual`, accessibility, and performance runners
  - [ ] F6-07B: Add visual regression coverage for dashboard, queue, create, detail, workflow modal, admin, reports, and audit in Arabic and English
  - [ ] F6-07C: Add accessibility coverage for keyboard focus, labels, icon-button names, feedback announcements, and reduced motion
  - [ ] F6-07D: Add frontend performance smoke budgets and write the Phase 6 review task

## Phase 7 - Reports, UAT, And Ops

- [ ] F7-01: Operational dashboards and scoped exports
- [ ] F7-02: OpenAPI contract generation and drift check
- [ ] F7-03: UAT scripts with realistic automotive complaint data
- [ ] F7-04: Deployment and operations runbook
