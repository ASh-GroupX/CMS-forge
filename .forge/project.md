# Project

## Name

CMS-Auto

## Source Of Truth

The product contract is `docs/CMS_AUTO_SRS.md`.

If this Forge disagrees with the SRS, the SRS wins. Numbered requirement IDs and
acceptance criteria win over general prose.

## Product

CMS-Auto is an automotive dealership complaint management system for staff and
customers. It manages complaint intake, routing, SLA tracking, escalation,
auditability, customer portal privacy, notifications, reports, and UAT proof.

## Stack

- Next.js
- NestJS
- TypeScript
- Tailwind CSS
- shadcn/ui
- Radix UI
- Lucide icons
- PostgreSQL
- Prisma
- Redis
- BullMQ
- OpenAPI 3.1 and Swagger
- Docker
- Jest
- Playwright
- ESLint and Prettier
- S3-compatible object storage

## MVP Priorities

1. Auth, RBAC, branch scope, and audit logging
2. Complaint lifecycle with backend-owned state machine
3. SLA warnings, breaches, and escalations
4. Customer portal submission and verified tracking
5. Attachments with secure access
6. Notifications through adapters
7. Operational reports and scoped exports
8. Modern operational UI/UX with shared design tokens and visual proof
9. Arabic RTL and English LTR operational UI
10. OpenAPI contract, deployment runbook, and UAT evidence

## Non-Goals For MVP

- Full CRM replacement
- Accounting, inventory, HR, or DMS implementation
- Native mobile apps
- AI classification, sentiment, chatbot, transcription, or prediction
- Visual workflow designer
- Marketplace or external developer platform
- Kubernetes before Docker deployment is stable
- Payment execution or accounting ledger mutation

## Architecture Rules

- Modular monolith for MVP.
- Backend owns workflow authority.
- Frontend never decides complaint state transitions.
- PostgreSQL is the source of truth.
- Redis is for cache, jobs, and scheduling, not durable domain state.
- External systems go through backend adapters.
- Customer portal never exposes internal comments, audit logs, DMS codes, or
  unrelated complaints.
- Every sensitive action must be audit logged.
- Every public API must be documented in OpenAPI.
- MVP frontend uses the UI-DESIGN-001 contract from the SRS: Tailwind CSS,
  shadcn/ui, Radix UI, shared design tokens, visual regression, accessibility,
  and frontend performance checks.
- Modularity must be machine-enforced with boundary lint or equivalent checks,
  not only documented.
- New modules should be generated or copied from a golden reference module.
- Auth and audit are not normal CRUD reference modules. Prefer `branches` or
  `categories` as the golden CRUD module, then add separate references for
  workflow transitions and async jobs when those patterns appear.

## Proof Levels

- L1: Static/code review only
- L2: Automated unit or integration test
- L3: End-to-end or browser/API workflow proof
- L4: UAT or operational proof with realistic seeded data

Default proof target: L2. High-risk workflow, privacy, security, SLA, and UAT
items should use L3 where practical.
