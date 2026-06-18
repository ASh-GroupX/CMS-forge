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

## Phase 1 - Security Baseline

- [x] F1-00A: Generate and apply the F0-08 Prisma migration
- [x] F1-00B: Bootstrap NestJS API and minimal core kernel
- [x] F1-01A: Auth data foundation and API test harness
- [x] F1-01B: Auth module credential verification with Argon2id and generic denial
- [x] F1-01C: Staff session persistence and secure cookie issuance
- [x] F1-01D: Session validation and logout invalidation
- [ ] F1-01E: Auth audit entries, OpenAPI contract, and security proof (Verify Gate: required)
- [ ] F1-02: RBAC and branch-scope enforcement
- [ ] F1-03: Audit log search/export and append-only enforcement
- [ ] F1-04: Stable API error shape and correlation IDs
- [ ] F1-05: Build golden CRUD reference module for branches or categories and freeze its pattern

## Phase 2 - Complaint Core

- [ ] F2-01: Complaint domain schema and migrations
- [ ] F2-02: Backend complaint state machine
- [ ] F2-03: Complaint creation and staff queues
- [ ] F2-04: Complaint detail timeline, comments, and history

## Phase 3 - SLA And Workflow Operations

- [ ] F3-01: SLA policy model and deterministic deadline calculation
- [ ] F3-02: SLA warning and breach jobs
- [ ] F3-03: Escalation notification events
- [ ] F3-04: Reopen, send-back, resolve, and close workflows

## Phase 4 - Customer Portal

- [ ] F4-01: Customer complaint submission
- [ ] F4-02: Portal tracking with reference plus OTP verification
- [ ] F4-03: Portal-safe public timeline
- [ ] F4-04: Portal privacy tests

## Phase 5 - Attachments And Notifications

- [ ] F5-01: Secure attachment upload/download
- [ ] F5-02: Malware scan hook states
- [ ] F5-03: Email adapter and in-memory provider
- [ ] F5-04: SMS/WhatsApp-ready adapter interfaces
- [ ] F5-05: Notification templates and delivery log

## Phase 6 - Staff UI

- [ ] F6-01: Operational shell, navigation, RTL/LTR
- [ ] F6-02: Staff work queues
- [ ] F6-03: Complaint create form
- [ ] F6-04: Complaint detail workspace
- [ ] F6-05: Admin screens for users, roles, branches, categories, SLA
- [ ] F6-06: UI quality gate: visual regression, accessibility, RTL/LTR, and frontend performance proof

## Phase 7 - Reports, UAT, And Ops

- [ ] F7-01: Operational dashboards and scoped exports
- [ ] F7-02: OpenAPI contract generation and drift check
- [ ] F7-03: UAT scripts with realistic automotive complaint data
- [ ] F7-04: Deployment and operations runbook
