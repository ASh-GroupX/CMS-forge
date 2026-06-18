# CMS-Auto Architecture

This is the **how**. The SRS (`docs/CMS_AUTO_SRS.md`) is the **what**.

**Precedence:** SRS numbered requirements and acceptance criteria win over this
document. This document wins over personal preference or convenience. If this
document and the SRS disagree, fix this document and log it — do not silently
diverge.

Audience: AI build agents and humans. Every backend module and frontend feature
must follow these patterns so the system stays uniform when built one task at a
time in fresh context. When in doubt, **copy the golden reference module** or use
the generator — do not invent a new shape.

---

## 1. Stack

| Layer | Choice |
|---|---|
| Frontend | Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui, Radix UI, Lucide icons |
| Backend | NestJS, TypeScript |
| Database | PostgreSQL via Prisma |
| Cache / jobs | Redis via BullMQ |
| Contract | OpenAPI 3.1 + Swagger |
| Storage | S3-compatible object storage |
| Tests | Jest (unit/API), Playwright (E2E, visual, a11y) |
| Quality | ESLint, Prettier, dependency-cruiser, strict TypeScript |
| Packaging | Docker |

Forbidden (from `ARCH-STACK-001`): MongoDB as primary DB, microservices for MVP,
client-side-only auth, business/workflow logic in React components, direct DMS or
provider calls from the frontend.

---

## 2. Monorepo layout

Maps to `ARCH-STACK-001` AC1 (separate web, api, database, contract boundaries).

```
cms-auto/
  apps/
    web/                  # Next.js — staff app + customer portal
    api/                  # NestJS — all business logic and authority
  packages/
    database/             # Prisma schema, migrations, seed, generated client
    contracts/            # OpenAPI spec + generated typed client + shared error codes/enums
    config/               # shared tsconfig, eslint, prettier, dependency-cruiser rules
  docs/                   # SRS, this file, runbooks
  infra/                  # docker-compose, deployment, ops
  tools/                  # module generator (plop), scripts
```

Rules:
- `apps/web` talks to `apps/api` **only** through the typed client in
  `packages/contracts`. Never imports from `apps/api/**`.
- `apps/api` is the only place that imports `packages/database` (Prisma).
- Shared enums, error codes, and DTO types live in `packages/contracts` so both
  sides use one definition (`REQ-LOCALIZATION-001` AC4: stable codes).

---

## 3. Backend module pattern (the skeleton every module copies)

One folder per business capability under `apps/api/src/modules/`. The capability
set (from `METHOD-MODULAR-001` + the data dictionary): `auth`, `users`,
`branches`, `departments`, `categories`, `customers`, `vehicles`, `complaints`,
`workflow`, `sla`, `comments`, `attachments`, `compensation`, `notifications`,
`surveys`, `reports`, `search`, `audit`, `integrations`, `portal`, `admin`.

```
apps/api/src/modules/<module>/
  MODULE.md                   # agent context manifest: public surface, owned tables,
                              #   allowed deps, SRS IDs — load this before editing
  <module>.module.ts          # Nest module wiring; exports the service only
  <module>.controller.ts      # HTTP only: validate, delegate, OpenAPI decorators
  <module>.service.ts         # business rules; the unit of authority
  <module>.repository.ts      # Prisma access for THIS module's aggregate only
  dto/
    create-<x>.dto.ts         # class-validator request DTOs
    update-<x>.dto.ts
    <x>-response.dto.ts       # explicit response shape — never leak Prisma models
  <module>.service.spec.ts    # unit tests (business rules)
  <module>.controller.spec.ts # API/integration tests (auth, validation, persistence)
```

`MODULE.md` is the module's agent boundary: a fresh-context agent reads it to know
the one public service, which tables the module owns, what it may depend on, and the
SRS IDs it serves — without scanning the whole tree. The generator emits it and
`lint` fails any module missing it or its required fields.

Layer responsibilities — keep them strict:
- **Controller**: HTTP shape, DTO validation, OpenAPI docs, calls the service. No
  business rules, no Prisma. (`NFR-MAINT-001` AC3.)
- **Service**: all business rules, transactions, audit, side-effect scheduling.
  The only layer other modules may depend on.
- **Repository**: typed Prisma queries for this module's tables only.

---

## 4. Dependency direction (enforced by dependency-cruiser)

```
web ──(contracts client)──▶ api
                             api: controller ─▶ service ─▶ repository ─▶ prisma
                             api: service ─▶ core/* (audit, rbac, errors, jobs)
                             api: service ─▶ other module's PUBLIC service
```

Hard rules — a violation **fails the build**:
- A module never imports another module's `*.repository.ts`, `dto/`, or Prisma
  models. Cross-module work goes through the other module's exported **service**.
- No cross-module database writes through another module's tables
  (`METHOD-MODULAR-001` forbidden).
- `core/*` (shared kernel) never imports a domain module. Dependencies point
  inward, toward the kernel.
- No circular module dependencies (`NFR-MAINT-001` forbidden).
- `apps/web` never imports `apps/api`, Prisma, or any provider SDK.

---

## 5. Shared kernel (`apps/api/src/core/`)

Cross-cutting concerns live here once and are reused everywhere. Domain modules
depend on the kernel; the kernel depends on nothing domain-specific.

```
apps/api/src/core/
  prisma/         # PrismaService + withTransaction() helper
  auth/           # session validation, @Roles / @BranchScoped decorators, RbacGuard
  audit/          # AuditService.record() — append-only writer
  errors/         # AppException, error codes, global ExceptionFilter
  correlation/    # middleware that assigns/propagates correlationId
  config/         # env schema validation; secrets only from env/secret manager
  jobs/           # BullMQ queues, base idempotent worker
  logging/        # structured logger; redacts secrets
```

---

## 6. Canonical patterns — the one way to do each thing

### 6.1 Errors (`ARCH §23`)
Throw `AppException(code, message?, fieldErrors?)`. A single global
`ExceptionFilter` renders the standard envelope and attaches `correlationId`:

```json
{ "error": { "code": "COMPLAINT_INVALID_TRANSITION", "message": "...",
  "fieldErrors": [{ "field": "...", "code": "REQUIRED", "message": "..." }],
  "correlationId": "req_..." } }
```

Use the stable error codes from SRS §23 (`AUTH_INVALID_CREDENTIALS`,
`RBAC_FORBIDDEN`, `BRANCH_SCOPE_FORBIDDEN`, `VALIDATION_FAILED`,
`COMPLAINT_INVALID_TRANSITION`, …). Never invent ad-hoc error strings. Validation
failures from class-validator map to `VALIDATION_FAILED` with `fieldErrors`.

### 6.2 RBAC and branch scope (`REQ-RBAC-001`, `NFR-SEC-002`)
Decorate controllers: `@Roles(Role.CR_MANAGER, Role.ADMIN)` and `@BranchScoped()`.
`RbacGuard` resolves role and branch scope **from the server-side session**, never
from client input. On deny: throw `RBAC_FORBIDDEN` / `BRANCH_SCOPE_FORBIDDEN`
**and** emit a `SECURITY` audit event. Hidden UI actions must still be enforced
here (`UI-SCREEN-001` AC3).

### 6.3 Audit (`METHOD-AUDIT-001`)
Any business-critical state change calls `AuditService.record({...})` **inside the
same transaction** as the change. Audit rows are append-only — never updated or
deleted by application flows. Use the SRS §23 event types (`AUTH`, `WORKFLOW`,
`COMPLAINT`, `ATTACHMENT`, `CONFIG`, `SECURITY`, …). Never log passwords, OTPs,
tokens, or provider credentials.

### 6.4 Transactions and side effects (`ARCH-WORKFLOW-001`)
Domain write + status history + audit entry happen in **one** `prisma.$transaction`.
Side effects (notifications, SLA jobs) are **enqueued after commit**, never inside
the transaction. This keeps state consistent and side effects retryable.

### 6.5 Workflow transitions (`ARCH-WORKFLOW-001`, `WORKFLOW-MATRIX-001`)
Only the `workflow`/`complaints` service may change `complaint.current_state`. Every
transition runs through the explicit state machine that validates `(fromState,
action, role)` and returns a deterministic `409/400` with a stable code on invalid
moves. Each valid transition writes status history + audit in one tx, then enqueues
notifications/SLA jobs. No status authority in controllers or React.

### 6.6 Jobs (`SLA-CALENDAR-001`)
Producers enqueue typed BullMQ jobs after commit. Workers are **idempotent** — SLA
warning/breach and escalation must not double-fire on retry. Every job logs
provider/result/latency/correlationId and exposes success/failure metrics
(`NFR-OBS-001`).

### 6.7 Integrations / adapters (`ARCH-INTEGRATION-001`)
Each external system (DMS, SMS, WhatsApp, email) is an **interface** + a real impl +
an in-memory test double. Domain services depend on the interface only. Provider
credentials come from config; never reach the browser. DMS failure must not block
manual complaint creation (`REQ-CUSTOMER-001` AC3). Log every call with a
correlation ID.

### 6.8 DTOs and validation
Request DTOs use class-validator. Response DTOs are explicit and never expose
internal fields — e.g. password hashes are never returned (`ARCH-AUTH-001` AC2),
internal comments never reach the portal (`PORTAL-SEC-001`). Every route declares
request, response, error, and auth in OpenAPI (`METHOD-API-001`).

### 6.9 API conventions
REST, plural resource nouns, camelCase JSON. Standard pagination (`page`,
`pageSize`) and consistent filter params. Every public/frontend route is in the
OpenAPI spec; generated client in `packages/contracts` is the only way the web app
calls the API. Contract drift fails CI (`ARCH-API-001` AC3).

---

## 7. Data layer (`ARCH-DATA-001`)

- Prisma is the single schema + migration + typed-access tool. One coherent schema
  drafted **before** feature migrations (backlog `F2-00`).
- Core tables: users, roles, branches, departments, customers, vehicles,
  complaints, complaint_status_history, approvals, attachments, comments,
  sla_policies, notifications, surveys, compensation, audit_logs, plus config.
- Complaint state changes are persisted as **history** rows, not just a column.
- Audit logs are **append-only** from application behavior.
- **Soft delete** business records that must stay auditable; never hard-delete
  master data referenced by complaints (`REQ-ADMIN-001` AC4).
- Stored enums use stable codes, independent of display language.
- Index for the query shapes the SRS calls out: status, branch, severity,
  created_at, owner, reference_number (`NFR-SCALE-001` AC2, `REF-STD-001` AC2).

---

## 8. Frontend (`ARCH-UI-001`, `UI-DESIGN-001`)

- Operational, dense, scannable — **not** a marketing page. First screen after
  login is a role-specific work queue.
- **No business or workflow authority in components** — they call the typed API
  client and render. State transitions are decided by the API.
- One shared design system: tokens (color, type, spacing, radius, shadow, focus,
  state colors) + shadcn/Radix components. Custom components wrap primitives;
  no one-off UI.
- Every screen implements the required states: loading (skeleton), empty, error,
  success, **optimistic-concurrency conflict**, and destructive-action confirm.
- RTL (Arabic) and LTR (English) from the start; logical spacing; no hardcoded
  user-facing strings in business components.
- Accessibility is mandatory (WCAG 2.1 AA): keyboard reachable, visible focus,
  labels, icon-button names, `prefers-reduced-motion`.

---

## 9. Testing (`METHOD-TEST-001`)

Proof pyramid — prefer fast tests, reserve E2E for critical journeys:
- **Unit** (Jest): service business rules, SLA math, workflow guards, validators.
- **API/integration** (Jest): controllers with real auth, validation, persistence,
  adapter failure paths.
- **E2E** (Playwright): login, complaint lifecycle, portal submit/track, reports —
  critical workflows only.
- **Visual + a11y** (Playwright): the screens in `UI-DESIGN-001` AC3, in AR and EN.

Rules: trust-boundary validation must be tested; cover at least one allowed and
one denied case per role (`RBAC-MATRIX-001` AC1); test behavior, not implementation
details; no E2E-only proof for core domain rules.

---

## 10. Script inventory (the SRS proof contract)

The root exposes these exact script names (the SRS Proof Requirements call them).
The package manager is chosen in `F0-01`, but the names are fixed:

```
build  lint  typecheck  test  test:api  test:e2e  test:web
test:visual  web:perf  test:performance
openapi:generate  openapi:check
db:migrate:test  db:index:check
security:check  ops:backup:check
```

A proof command that does not exist yet must be created as a real (even if minimal)
script — never reported as passing when it did not run (Forge honesty rule).

---

## 11. Enforcement — what fails the build

Consistency is enforced, not hoped for. CI and pre-commit run:
- `tsc --strict` (no implicit any, no unchecked access).
- ESLint + Prettier (no warnings in CI).
- **dependency-cruiser**: module-boundary and direction rules from §4.
- **Coverage threshold** on `apps/api` domain services (set in `F0-06`).
- **OpenAPI drift**: generated contract must match committed (`openapi:check`).
- **Visual + a11y + perf** gates for UI (`UI-DESIGN-001`).
- No `TODO`/`FIXME` in core behavior paths (`NFR-MAINT-001` forbidden).

---

## 12. Golden reference module and generator

- The **structural skeleton** (§3 layout, layering, test files, naming) is frozen
  in the `F0-07` generator and is used for **every** module — including `auth`.
  Generate modules; do not hand-roll their shape.
- The **golden CRUD behavior exemplar** is `branches` (or `categories`), built and
  frozen in `F1-05`. It demonstrates the canonical CRUD + RBAC + audit + DTO +
  test pattern. Later CRUD modules copy it.
- `auth`, `workflow`, and async-`jobs` are **not** golden CRUD references — they are
  special-case patterns documented in their own sections here. Do not cargo-cult
  security or state-machine code into plain CRUD.

---

## 13. Naming conventions

- Files: kebab-case (`complaint-status.service.ts`). Classes: PascalCase.
  Variables/functions: camelCase. DB columns: snake_case. Enums: stable
  UPPER_SNAKE codes.
- One exported service per module is the public surface; everything else is
  internal.

---

## 14. Agentic codebase rules

Fresh-context agents work best with small, boring files. Keep the code easy to
scan before making it clever.

- Default source-file budget: 300 lines. `lint` fails oversized app/package/tool
  source files. Tests (`*.spec.ts`, `*.test.*`) and DTO/type files (`*.dto.ts`) are
  exempt — padding them out is healthy, not a smell. Line count is a crude proxy;
  the real target is a logic file that has outgrown a single agent context.
- Every backend module carries a `MODULE.md` manifest (public surface, owned tables,
  allowed deps, SRS IDs). The generator emits it; `lint` requires it. It is the unit
  of agent context — prefer loading one module's manifest over reading the tree.
- Default task budget: 1 to 5 files plus focused tests. If prerequisites make a
  task bigger, stop and replan before coding.
- Split by responsibility, not by abstraction: controller, service, repository,
  DTO, test. No one-implementation interfaces or speculative factories. Splitting a
  cohesive unit just to dodge the line budget is itself an anti-pattern.
- Large canonical artifacts are exceptions, not a style: Prisma schema, OpenAPI,
  migrations, generated files, and docs may be larger when they are the source of
  truth.
- `schema.prisma` is allowed to be large in Prisma 5.22. Edit it by focused model
  block and protect changes with schema tests. Do not adopt preview multi-file
  Prisma schemas unless a task explicitly accepts that tooling risk.

## 15. Definition of Done (per module/task)

A task is done when:
- It stays within the `next.md` scope (usually 1–5 files + tests).
- Structure came from the generator/golden module, not improvised.
- Canonical patterns (§6) are used — no new error/audit/RBAC mechanism.
- Required tests pass and actually ran; trust boundaries covered.
- New/changed routes are in OpenAPI; `openapi:check` passes.
- Boundary lint, typecheck, lint, and coverage pass.
- Audit entries exist for state changes; no secrets logged.
- Requirement IDs from the SRS are cited in evidence.
