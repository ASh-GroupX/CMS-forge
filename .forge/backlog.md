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

- [x] F6-01: Operational shell, auth entry, navigation, RTL/LTR
  - [x] F6-01A: Bootstrap Next.js staff shell with localized RTL/LTR navigation
  - [x] F6-01B: Add staff login/logout UI with generic safe errors and session-aware shell states
  - [x] F6-01C: Add role-aware navigation visibility for staff/admin/management routes
  - [x] F6-01D: Staff password reset flow
    - [x] F6-01D1: Add backend password-reset request token persistence and generic service result
    - [x] F6-01D2: Add backend password-reset consume behavior with expiry, single-use enforcement, password update, and audit
    - [x] F6-01D3: Add password-reset request/consume HTTP routes with OpenAPI and auth API tests
    - [x] F6-01D4: Add staff password-reset UI contract
- [x] F6-02: Staff home dashboard and work queues
  - [x] F6-02A: Add minimal typed web API client/error mapping for staff complaint reads
  - [x] F6-02B: Add role-specific dashboard summary cards for open, overdue, SLA warning, closed, and average TAT
  - [x] F6-02C: Add complaint work queue table with filters, pagination, loading, empty, and error states
  - [x] F6-02D: Add queue responsive and RTL/LTR web tests at staff breakpoints
- [x] F6-03: Complaint create form
  - [x] F6-03A: Add customer/vehicle lookup panel with manual fallback UI
  - [x] F6-03B: Add localized complaint create form with category, severity, branch, incident date, subject, and description validation
  - [x] F6-03C: Add attachment upload panel with file-rule messages and scan-status display
  - [x] F6-03D: Submit complaint through backend API with success, validation error, and preserved-input states
    - [x] F6-03D1: Add staff complaint create write-client with CSRF and validation-error mapping
    - [x] F6-03D2: Wire complaint create form submission with success, validation error, and preserved-input states
- [x] F6-04: Complaint detail workspace
  - [x] F6-04A: Add complaint detail layout with facts, customer/vehicle data, current owner, SLA timer, timeline, and survey results
  - [x] F6-04B: Add comments and public-update panels with visibility badges
  - [x] F6-04C: Add attachment upload/download controls using backend authorization and scan-status states
  - [x] F6-04D: Add workflow action modal for allowed backend transitions with required comments and validation
  - [x] F6-04E: Add optimistic-concurrency conflict recovery and detail workspace RTL/LTR tests
- [x] F6-05: Admin, audit, and notification screens
  - [x] F6-05A: Add Admin branches/departments screen using the golden CRUD UI pattern
  - [x] F6-05B: Add Admin users/roles/branch-scope screen and password-reset admin UI contract
  - [x] F6-05C: Add Admin categories/severity/SLA policy screens with localized validation states
  - [x] F6-05D: Add Admin notification template screen for Arabic/English templates, channels, preview, activate, and deactivate
  - [x] F6-05E: Add Audit viewer screen with filters, export affordance, and Admin-only visibility
  - [x] F6-05F: Add in-app notification center with read/unread states and scoped complaint links
- [x] F6-06: Staff reports entry surfaces
  - [x] F6-06A: Add reports dashboard navigation and placeholder states for RPT-001 through RPT-017 pending Phase 7 APIs
  - [x] F6-06B: Add export affordance UI states without client-side unbounded export behavior
- [x] F6-07: UI quality gate: visual regression, accessibility, RTL/LTR, and frontend performance proof
  - [x] F6-07A: Replace fail-loud web proof placeholders with real `test:web`, `test:visual`, accessibility, and performance runners
  - [x] F6-07B: Add visual regression coverage for dashboard, queue, create, detail, workflow modal, admin, reports, and audit in Arabic and English
  - [x] F6-07C: Add accessibility coverage for keyboard focus, labels, icon-button names, feedback announcements, and reduced motion
  - [x] F6-07D: Add frontend performance smoke budgets and write the Phase 6 review task

## Phase 7 - Reports, UAT, And Ops

Decomposed by `PLAN-F7-01` (2026-06-19) from SRS milestone `PLAN-M6` plus the
homeless `PLAN-M5` portal UI screens and the five PHASE-6-REVIEW carry-forward
conditions. Order is backend-first, then real session-bound UI wiring, then
portal UI, then pre-pilot quality/ops/UAT/deploy. Each lettered subtask targets
1-5 files plus tests and stays under the 300-line source budget; the SRS wins on
any conflict. Carry-forward condition mapping is annotated inline.

- [x] F7-01: Operational reports, dashboards, and scoped exports (REQ-REPORT-001,
      RBAC-MATRIX-001, REQ-AUDIT-001)
  - [x] F7-01A: Generate `reports` backend module boundary + `MODULE.md`; wire
        `ReportsModule` into the API root module (behavior-free scaffold)
  - [x] F7-01B: Decide + implement cross-module reporting read access (declared
        allowed deps on complaints/SLA/surveys public services or a read-only
        query model — must pass the manifest truth gate, never import another
        module's repository)
  - [x] F7-01C: Dashboard summary read model — open, overdue, SLA-warning, closed,
        and average TAT — with role + branch-scope filtering (REQ-REPORT-001 AC1,
        AC4)
  - [x] F7-01D: Filtered report read models for the RPT-001..RPT-017 families with
        date/branch/category/severity/owner filters and role + branch scope
        (REQ-REPORT-001 AC2, AC4)
  - [x] F7-01E: Dashboard + report HTTP read routes with RBAC, branch scope, and
        canonical OpenAPI (REQ-REPORT-001 AC1, AC2, AC4)
  - [x] F7-01F: Scoped CSV/Excel export route with configured row limit and a
        same-transaction export audit entry; no unbounded export (REQ-REPORT-001
        AC3, AC4; RBAC-MATRIX-001)
- [x] F7-02: Complaint search read model and API (REQ-SEARCH-001, NFR-PERF-001) —
      builder reads REQ-SEARCH-001 first; may extend existing branch-scoped queue
      filtering rather than duplicate it
  - [x] F7-02A: Branch-scoped complaint search service (reference, customer,
        status, severity, owner, date-range) with RBAC + branch scope
  - [x] F7-02B: Search HTTP route with pagination, RBAC, branch scope, and OpenAPI
        (`test:api -- search`)
- [x] F7-03: Real session-bound staff UI data wiring (REQ-RBAC-001, UI-SCREEN-001
      AC2/AC3; **PHASE-6 carry-forward condition 1**)
  - [x] F7-03A: Real staff login + session-aware web data layer — call
        `POST /auth/login`, forward the HttpOnly session cookie from server
        components, resolve role/branch from `/auth/me`; the `?role=` query param
        must no longer be an authority source (split further if oversized)
    - [x] F7-03A1: Make `GET /auth/me` a session-principal endpoint for any
          authenticated staff role
    - [x] F7-03A2: Resolve the staff shell role from `/auth/me` by forwarding the
          HttpOnly session cookie from the server component; keep preview params
          non-authoritative
    - [x] F7-03A3: Add staff login/logout form actions that call the auth API and
          apply HttpOnly session cookie changes server-side
  - [x] F7-03B: Wire staff dashboard summary cards to the real dashboard read
  - [x] F7-03C: Wire reports dashboard + export affordance to the real report
        reads and export route
  - [x] F7-03D: Wire work queue + complaint detail reads to real branch-scoped data
    - [x] F7-03D1: Wire work queue rows to the real `GET /complaints` read
    - [x] F7-03D2: Wire complaint detail workspace to the real
          `GET /complaints/{id}` read
- [x] F7-04: Customer portal UI — homeless MVP/`must` screens; portal backend
      already exists (REQ-PORTAL-001, REQ-PORTAL-002, REQ-SURVEY-001,
      UI-DESIGN-001; **PHASE-6 carry-forward condition 4**). If any screen is cut,
      record an explicit commercial exclusion per UI-SCREEN-001 AC5.
  - [x] F7-04A: Portal submission UI (UI-018) — localized RTL/LTR form, attachment
        upload, reference-number result; no internal data exposed
  - [x] F7-04B: Portal tracking UI (UI-019) — reference + verification, public
        status timeline, follow-up when allowed; no internal comments/audit/DMS/
        staff PII
  - [x] F7-04C: Survey UI (UI-020) — one-time expiring link, 1-5 rating, optional
        comment, used/expired handling
- [x] F7-05: Pre-pilot UI quality debt (QA-UI-001, UI-DESIGN-001; **PHASE-6
      carry-forward conditions 2 and 3**)
  - [x] F7-05A: Real accessibility proof — keyboard traversal, focus visibility,
        and WCAG contrast (axe/browser) beyond the static render checks
  - [x] F7-05B: `destructive confirmation` UI state + proof for deactivate, reject,
        and close affordances
- [x] F7-06: OpenAPI contract finalization and Swagger UI (ARCH-API-001; original
      "F7-02 OpenAPI contract generation and drift check") — confirm every
      public/staff route is documented and `openapi:check` drift-enforced
- [x] F7-07: Operations and observability hardening (NFR-AVAIL-001, NFR-OBS-001,
      NFR-DATA-001, NFR-PERF-001)
  - [x] F7-07A: Make `ops:backup:check` a real backup/health check (replace the
        fail-loud placeholder)
  - [x] F7-07B: Make `test:performance` a real performance baseline (replace the
        fail-loud placeholder)
  - [x] F7-07C: Wire `security:check` to the real security/auth/admin/audit suites
        (**PHASE-6 carry-forward condition 5**; carried from PHASE-1)
- [x] F7-08: UAT scripts with realistic automotive complaint data (UI-SCREEN-001
      AC1) — UAT checklist covering every MVP screen and the L4 seeded dataset
- [x] F7-09: Deployment and operations runbook (NFR-SEC-001 AC4) — HTTPS redirect
      at the gateway and parameterizing `POSTGRES_HOST_AUTH_METHOD` off `trust`
      before any non-dev deploy
