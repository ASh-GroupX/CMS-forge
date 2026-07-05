# CMS-Auto UI/UX Refactor Packet

Status: Active
Phase: ui-ux-redesign
Design direction: Precision Ops

## Design Read

Reading this as an existing regulated operational SaaS redesign for dealership
complaint staff plus a public customer portal. Staff screens need a dense
complaint-operations workbench. Portal screens need a calmer trust-first service
flow. This is not a marketing redesign and not a decorative dashboard.

## Skills Applied

- `ui-ux-pro-max`: primary UI/UX planning skill for SaaS, admin panels,
  dashboards, forms, tables, navigation, accessibility, responsive behavior,
  interaction states, and Next.js/shadcn/Tailwind stack guidance.
- `redesign`: audit-first redesign discipline. Preserve routes, data flow,
  accessibility wins, behavior, and authority boundaries; apply tokens first,
  then typography, spacing, states, and motion.
- `design-qa`: proof gates for token lint, hardcoded-value lint, axe,
  visual regression, RTL/LTR screenshots, keyboard paths, and performance.
  Local note: the skill references `workflows/design-qa.md`, but that file is
  missing, so this project uses the repo proof scripts directly.
- `design-taste-frontend` from `taste-skill`: anti-slop and anti-generic checks.
  Scope note: the skill explicitly says dense dashboards/admin panels are not
  its primary lane, so it is a supporting skill here, not the source of truth.
- `ponytail` mode: keep slices small, reuse existing shadcn/Radix/Lucide/Tailwind,
  avoid speculative abstractions, and skip one-shot whole-app rewrites.

## Product Dials

Staff app:

- `DESIGN_VARIANCE: 4`
- `MOTION_INTENSITY: 2`
- `VISUAL_DENSITY: 9`

Customer portal:

- `DESIGN_VARIANCE: 3`
- `MOTION_INTENSITY: 2`
- `VISUAL_DENSITY: 5`

## Non-Negotiables

- Backend owns workflow state, RBAC, branch scope, audit, SLA, attachments,
  reports, notifications, and portal verification.
- React never decides complaint state transitions or staff authority.
- Customer portal never exposes internal comments, audit logs, DMS codes, staff
  PII, or unrelated complaints.
- No new UI library unless shadcn/Radix/Lucide/Tailwind cannot cover a required
  primitive.
- No production `PreviewState`, fake query-state modes, fake dialogs, empty
  `href`, or hardcoded user-facing English outside dictionaries.
- Semantic tokens only for migrated surfaces. Raw slate/white/status utilities
  must shrink over time.

## Slice 0 - Proof Harness and Token Spine

Status: Complete

Purpose:

- Stop redesigning blind.
- Render proof artifacts in Chromium with compiled Tailwind CSS.
- Add semantic Precision Ops tokens.
- Add a lint ratchet for new raw color utility debt.

Completed artifacts:

- `tools/web-browser-check.mjs`
- `tools/web-proof.mjs`
- `tools/web-visual-review.mjs`
- `apps/web/src/globals.css`
- `apps/web/tailwind.config.ts`
- `apps/web/src/lib/tokens.ts`
- `tools/lint.mjs`
- `tools/lint.test.mjs`

## Slice 1B - Shared Shell Primitives

Status: Complete

Purpose:

- Build or consolidate `AppShell` and `PortalShell`.
- Make navigation, language switching, skip link, active route, and role-aware
  shell behavior consistent.
- Move shell surfaces to semantic tokens.

Acceptance:

- Staff shell has skip link, visible focus, active route, role-aware nav,
  compact sidebar/topbar, and stable keyboard order.
- Portal shell has language switch, privacy/trust footer, larger touch targets,
  and relaxed portal spacing.
- No route contract or backend authority changes.

## Slice 2 - Shared UI Primitives

Status: Complete

Build the smallest useful shared primitives:

- `PageHeader`
- `StateBlock`
- `Field`
- `ActionDialog`
- `FilterBar`
- `DataTable`
- `StatusBadge`
- `MetricStrip`
- `Timeline`
- `AttachmentDropzone`

Rules:

- Use existing shadcn/Radix/Lucide primitives.
- Use native controls where enough.
- Add only the props the current screens need.

## Slice 3 - Staff Dashboard and Work Queue

Status: Complete

Purpose:

- Make work queue the primary operational surface.
- Redesign dashboard as a compact accountability summary, not an equal-weight
  KPI grid.

Required prominence:

- SLA
- Severity
- Owner
- Branch
- Next action
- Age
- Status

Acceptance:

- Filters are URL-backed.
- Tables use compact density and horizontal containment.
- Status and severity use token-backed badges with text plus non-color cues.

## Slice 4 - Complaint Create, Lookup, and Attachments

Status: Complete

Purpose:

- Rebuild intake as one structured flow.

Required sections:

- Customer lookup
- Vehicle lookup
- Manual fallback
- Complaint facts
- Attachments
- Validation
- Submit result

Acceptance:

- Real typed API client only.
- Backend still owns authority.
- Attachment validation and scan status are clear.
- Error summary and field-level recovery paths exist.

## Slice 5 - Complaint Detail and Workflow

Status: Ready in `.forge/next.md`

Purpose:

- Convert detail view into a real workbench.

Workbench regions:

- Summary
- SLA and current owner
- Facts
- Timeline
- Comments
- Attachments
- Related complaints
- Next action

Acceptance:

- Workflow action is a real Radix dialog or a clear inline action panel.
- No fake `role="dialog"` on a normal section.
- Conflict state offers reload latest and retry without empty links.

## Slice 6 - Admin, Reports, Audit, and Notifications

Status: Pending

Purpose:

- Migrate operational admin surfaces onto shared primitives.

Acceptance:

- Admin tables/forms use shared states and fields.
- Reports use hierarchy: one primary metric, supporting metrics, catalog,
  scoped exports.
- Audit viewer stays dense, searchable, and backend-redacted.
- Notifications show read/unread and scoped complaint links clearly.

## Slice 7 - Customer Portal

Status: Pending

Purpose:

- Give public users a separate trust-first layout.

Portal surfaces:

- Submit
- Track
- Follow-up
- Attachments
- Survey

Acceptance:

- Larger touch targets.
- Fewer panels.
- Stronger privacy messaging.
- No internal staff visual language leaks into the portal.

## Slice 8 - Cleanup and Hardening

Status: Pending

Remove:

- Remaining production `PreviewState`
- Fake query-state modes
- Empty `href`
- Fake modal semantics
- Raw visual utility classes in migrated surfaces
- Any hardcoded user-facing English outside dictionaries

Acceptance:

- Raw color lint baseline shrinks from 455.
- Every migrated screen has loading, empty, error, success, conflict, and
  destructive-confirm states where applicable.

## Slice 9 - Final Visual QA Gate

Status: Pending

Required review:

- English and Arabic screenshots for every redesigned screen.
- 390px, 430px, 768px, 1024px, 1280px, and 1440px where applicable.
- Keyboard-only paths through navigation, filters, forms, workflow actions,
  portal verification, portal submit, and portal track.
- Axe serious/critical violations at zero.
- No page-level horizontal overflow.
- No clipped or overlapping Arabic text.

## Proof Set For Every Slice

- `corepack pnpm typecheck`
- `corepack pnpm lint`
- `corepack pnpm test:web -- shell`
- `corepack pnpm test:web -- localization`
- `corepack pnpm test:visual`
- `corepack pnpm web:visual-review`
- `corepack pnpm test:e2e -- accessibility`
- `corepack pnpm web:perf`
- `git diff --check`

## Carry-Forward Business Blockers

- Compensation Slice 11 still needs signed deferral or minimal metadata approval.
- Remaining report deferrals still need business signoff or implementation approval.
- Notification channels for remaining pilot/UAT proof still need signoff.
