# Business Readiness Audit

Date: 2026-07-02
Scope: business/operator acceptance risks for the current CMS-Auto app.
Mode: audit only. No code implementation, staging, commit, or Forge update.

Companion files:

- Target solution: `docs/BUSINESS_READINESS_SOLUTION.md`
- Execution order: `docs/BUSINESS_READINESS_PLAN.md`

## Summary

The app has real foundations for complaints, workflow, portal privacy, reports,
attachments, audit, and localization. The business risk is that several MVP
surfaces look present but are not yet usable as operating controls. The highest
risk gaps are customer OTP delivery, initial SLA/notification side effects,
audit viewer wiring, report delivery scope, and management-readonly masking.

## P0 - Blocking / Acceptance Risks

### BIZ-P0-01 - Portal tracking OTP is not deliverable

- Page / route / component: `/portal/track`, `PortalTracking`, portal tracking API.
- User tries to do: customer requests an OTP and enters the latest code sent to
  the complaint phone.
- What happens: the backend generates an OTP and stores only its hash, then
  queues internal metadata without a customer-facing OTP payload or channel.
- Why this is a problem: customer tracking cannot complete in production without
  an approved SMS, WhatsApp, or email delivery path. This blocks UAT-009.
- Likely files:
  - `apps/api/src/modules/portal/portal.service.ts:82`
  - `apps/api/src/modules/portal/portal.service.ts:89`
  - `apps/web/src/components/portal-tracking/index.tsx:139`
- Suggested fix: generate the OTP once, send it through the configured customer
  notification channel, store only the hash, and keep tests proving no OTP leaks
  to logs or API responses.
- Proof: `corepack pnpm test:api -- portal.tracking` passed, but the tests prove
  hash-only metadata, not real customer delivery. SRS requires OTP to complaint
  primary phone in `docs/CMS_AUTO_SRS.md:2661`.

### BIZ-P0-02 - Initial complaint submission can miss SLA and acknowledgement side effects

- Page / route / component: staff complaint intake, customer portal submission,
  `POST /complaints`.
- User tries to do: submit a complaint and expect the system to start the SLA
  clock and notify the right actors.
- What happens: complaint creation writes the complaint, status history, audit,
  and case, but workflow side effects are only queued from later transitions.
- Why this is a problem: a newly submitted complaint can exist without the
  reportable SLA deadline, warning/breach path, or acknowledgement expected by
  the business process.
- Likely files:
  - `apps/api/src/modules/complaints/complaints.service.ts:80`
  - `apps/api/src/modules/complaints/complaints.service.ts:199`
  - `apps/api/src/modules/complaints/complaint-workflow-side-effects.ts:60`
  - `apps/api/src/modules/sla/sla.repository.ts:158`
- Suggested fix: after creation commits into `SUBMITTED`, reuse the existing
  workflow side-effect path for submit notification and SLA deadline creation.
- Proof: `corepack pnpm test:api -- workflow` passed transition tests. SRS
  requires SLA deadline calculation when entering an SLA-governed state in
  `docs/CMS_AUTO_SRS.md:2736`.

### BIZ-P0-03 - Audit viewer is a placeholder, not an operational control

- Page / route / component: `/audit`, `AuditViewer`.
- User tries to do: admin searches and exports audit records for security,
  workflow, attachment, report, or configuration events.
- What happens: the UI renders hardcoded placeholder rows and inert filter/export
  buttons, even though backend audit search/export endpoints exist.
- Why this is a problem: auditability cannot be demonstrated through the app UI,
  blocking operations, incident review, and UAT evidence.
- Likely files:
  - `apps/web/src/components/audit-viewer/index.tsx:13`
  - `apps/web/src/components/audit-viewer/index.tsx:27`
  - `apps/web/src/app/(staff)/audit/page.tsx:10`
  - `apps/api/src/modules/audit/audit.controller.ts:26`
- Suggested fix: wire the existing backend search/export APIs into the viewer,
  with real filters, empty/error/loading states, and export feedback.
- Proof: `corepack pnpm test:api -- audit` backend TAP tests passed, but the full
  command failed because Docker append-only proof could not start Postgres.
  SRS audit acceptance is in `docs/CMS_AUTO_SRS.md:1336`.

### BIZ-P0-04 - Most required reports are deferred, not delivered

- Page / route / component: `/reports`, `ReportsDashboard`, `/reports/catalog`,
  `/reports/export`.
- User tries to do: management answers overdue, SLA warning, branch performance,
  category, owner workload, DMS failure, notification delivery, CSAT, and
  compensation questions.
- What happens: only RPT-001, RPT-004, RPT-013, and RPT-017 are delivered; most
  report IDs are marked `DEFERRED`, and export is a generic complaint row dump.
- Why this is a problem: the app can pass a catalog reconciliation test while
  still not answering the business questions required for sign-off unless every
  deferral is explicitly signed.
- Likely files:
  - `apps/api/src/modules/reports/report-matrix.ts:31`
  - `apps/api/src/modules/reports/report-matrix.ts:73`
  - `apps/web/src/components/reports-dashboard/index.tsx:43`
- Suggested fix: either ship report-specific outputs for the MVP report matrix
  or obtain signed scope deferrals and show those limits clearly in the UI.
- Proof: `corepack pnpm test:api -- reports` passed. The test accepts signed
  deferrals; SRS requires RPT-001 through RPT-017 delivered or explicitly
  deferred in signed scope in `docs/CMS_AUTO_SRS.md:2642`.

### BIZ-P0-05 - Management-readonly users can see sensitive row-level data

- Page / route / component: staff navigation, complaint queue/detail for
  `MGMT_READONLY`.
- User tries to do: management reviews dashboards and scoped reports without
  operational mutation access.
- What happens: management-readonly has `COMPLAINT_VIEW_BRANCH`, staff nav shows
  queue/detail surfaces, and complaint detail returns phone, DMS identifier, VIN,
  and plate data without role-based masking.
- Why this is a problem: it violates the SRS privacy model and can expose
  customer and vehicle identifiers to users intended to see aggregate operational
  data by default.
- Likely files:
  - `packages/database/prisma/role-permissions.ts:42`
  - `apps/web/src/app/(staff)/layout.tsx:33`
  - `apps/api/src/modules/complaints/complaints.service.ts:222`
  - `apps/api/src/modules/complaints/complaints.repository.ts:175`
- Suggested fix: enforce server-side masking by permission for management views,
  including customer phone/email, VIN, plate, compensation notes, staff private
  contact details, and attachment filenames.
- Proof: SRS masking rule is explicit in `docs/CMS_AUTO_SRS.md:2337`.

## P1 - Serious Workflow Issues

### BIZ-P1-01 - Admin category and SLA management is not usable

- Page / route / component: `/admin/categories`, `AdminCategoriesSla`.
- User tries to do: admin creates/edits/deactivates categories and changes SLA
  defaults.
- What happens: the UI uses preview data and inert create/edit/deactivate
  buttons. Backend category and SLA endpoints exist only partially in the UI.
- Why this is a problem: UAT-012 cannot be completed from the product.
- Likely files:
  - `apps/web/src/components/admin-categories-sla/index.tsx:26`
  - `apps/web/src/components/admin-categories-sla/index.tsx:111`
  - `apps/api/src/modules/admin/admin-categories.controller.ts:16`
  - `apps/api/src/modules/sla/sla.controller.ts:14`
- Suggested fix: wire the smallest real admin flow first: list categories,
  create/update/deactivate, and edit active SLA policy values with audit feedback.
- Proof: code reference; SRS requires admin category/SLA screens in
  `docs/CMS_AUTO_SRS.md:2197`.

### BIZ-P1-02 - DMS lookup is forced to disabled in-memory mode

- Page / route / component: staff customer/vehicle lookup.
- User tries to do: match a customer/vehicle by phone, customer number, VIN, or
  plate during intake.
- What happens: the integration module always provides `InMemoryDmsProvider`,
  whose default status is `DISABLED`. Manual fallback exists.
- Why this is a problem: matched-customer/VIN UAT cannot prove live or realistic
  DMS behavior unless manual-DMS scope is signed.
- Likely files:
  - `apps/api/src/modules/integrations/integrations.module.ts:34`
  - `apps/api/src/modules/integrations/dms-provider.port.ts:59`
  - `apps/api/src/modules/integrations/integrations.service.ts:49`
  - `apps/web/src/components/customer-vehicle-lookup/index.tsx:187`
- Suggested fix: either sign manual-DMS pilot scope or wire a real/test DMS
  adapter with provider-down, multiple-match, and not-found telemetry.
- Proof: code reference; SRS DMS outage/manual behavior is in
  `docs/CMS_AUTO_SRS.md:2530`.

### BIZ-P1-03 - Staff comments and public updates are not wired in detail UI

- Page / route / component: complaint detail, `ComplaintCommentsPanel`.
- User tries to do: investigator adds an internal note and a public update.
- What happens: UI renders placeholder internal/public text; backend comment
  routes and permission checks exist.
- Why this is a problem: UAT-006 cannot be done through the staff UI, and portal
  public timeline proof is incomplete.
- Likely files:
  - `apps/web/src/components/complaint-comments-panel/index.tsx:25`
  - `apps/web/src/i18n/staff-complaint-detail.ts:21`
  - `apps/api/src/modules/complaints/complaints.controller.ts:130`
  - `apps/api/src/modules/complaints/complaints.service.ts:128`
- Suggested fix: add a simple comment composer/list using the existing comment
  endpoint, with visibility selection and portal-safe public output.
- Proof: code reference; UAT-006 is in `docs/CMS_AUTO_SRS.md:2862`.

### BIZ-P1-04 - Closure survey is not wired end to end

- Page / route / component: close workflow, `/portal/survey`,
  `PortalSurveyScreen`.
- User tries to do: close a complaint and have the customer receive/submit CSAT.
- What happens: close side effects queue `survey.schedule.internal`; the real
  survey scheduler exists separately; portal survey screen is a static form.
- Why this is a problem: UAT-008 and CSAT reporting cannot be proven from the
  real product flow.
- Likely files:
  - `apps/api/src/modules/complaints/complaint-workflow-side-effects.ts:43`
  - `apps/api/src/modules/surveys/surveys.service.ts:55`
  - `apps/web/src/components/portal-survey/index.tsx:42`
  - `apps/web/src/app/portal/survey/page.tsx:17`
- Suggested fix: call the existing survey scheduler on close, send the tokenized
  customer link, and wire portal submission to the submit endpoint.
- Proof: `corepack pnpm test:api -- surveys` passed the service tests, not the
  complaint-close-to-portal flow.

### BIZ-P1-05 - Staff intake attachments are visual-only

- Page / route / component: `/complaints/new`, `AttachmentUploadPanel`,
  `ComplaintCreateForm`.
- User tries to do: attach evidence while creating a staff complaint.
- What happens: the intake page renders a file chooser, but the complaint create
  form does not submit files. Detail-page attachment upload is real.
- Why this is a problem: intake evidence capture is incomplete and can force
  staff into a second path after creation.
- Likely files:
  - `apps/web/src/app/(staff)/complaints/new/page.tsx:34`
  - `apps/web/src/components/attachment-upload-panel/index.tsx:33`
  - `apps/web/src/components/complaint-create-form/index.tsx:61`
  - `apps/web/src/components/complaint-attachment-controls/index.tsx:62`
- Suggested fix: after complaint creation succeeds, upload selected files through
  the existing attachment route and show partial-failure feedback.
- Proof: `corepack pnpm test:api -- attachments` passed backend policy tests.

### BIZ-P1-06 - Compensation metadata is modeled but not productized

- Page / route / component: no visible compensation module or complaint detail
  compensation surface.
- User tries to do: record proposed or approved compensation metadata.
- What happens: schema and permissions exist, but no module/UI/report path was
  found. RPT-014 is deferred.
- Why this is a problem: if compensation metadata is in MVP scope, this flow is
  missing despite permissions suggesting it exists.
- Likely files:
  - `packages/database/prisma/schema.prisma:780`
  - `packages/database/prisma/role-permissions.ts:20`
  - `apps/api/src/modules/reports/report-matrix.ts:43`
- Suggested fix: sign as out of MVP or add the minimum complaint-detail metadata
  record/read path with RBAC and audit.
- Proof: code search found no API module or UI surface for compensation.

### BIZ-P1-07 - Product scope is split between complaint MVP and dealership accountability

- Page / route / component: root redirect, staff nav, product docs.
- User tries to do: run the contracted complaint MVP.
- What happens: current product direction prioritizes employee today, promises,
  handoff, and manager control room, while the SRS still governs complaint MVP.
  Root redirects non-management staff to `/tasks/today`.
- Why this is a problem: business acceptance can drift. Complaint-critical flows
  remain incomplete while newer accountability surfaces appear first.
- Likely files:
  - `docs/PRODUCT_DESIGN.md:68`
  - `apps/web/src/app/page.tsx:83`
  - `apps/web/src/app/(staff)/layout.tsx:11`
- Suggested fix: make a scope decision explicit: complaint MVP sign-off first, or
  update the contract/UAT to the dealership accountability product.
- Proof: code and doc references.

## P2 - Confusing / Missing Polish

### BIZ-P2-01 - Report exports look more complete than they are

- Page / route / component: `/reports`, export buttons.
- User tries to do: export a named business report.
- What happens: delivered/deferred catalog is visible, but export remains a
  generic filtered complaint row output.
- Why this is a problem: users may treat a generic extract as an official report.
- Likely files:
  - `apps/web/src/components/reports-dashboard/index.tsx:43`
  - `apps/api/src/modules/reports/reports.service.ts`
- Suggested fix: label generic exports as operational rows and disable or explain
  named deferred exports.
- Proof: same-session screenshot:
  `C:\Users\dryos\AppData\Local\Temp\cms-ux-audit\reports-dashboard-desktop.png`.

### BIZ-P2-02 - Placeholder preview states are reachable from real navigation

- Page / route / component: audit, admin config, complaint detail comments.
- User tries to do: operate live admin or detail workflows.
- What happens: some screens show placeholder rows/text that read like product
  data.
- Why this is a problem: operators can mistake demos for live state during UAT.
- Likely files:
  - `apps/web/src/components/audit-viewer/index.tsx:13`
  - `apps/web/src/components/admin-categories-sla/index.tsx:26`
  - `apps/web/src/components/complaint-comments-panel/index.tsx:25`
- Suggested fix: replace placeholders with real empty states or hide unfinished
  screens behind explicit unavailable copy.
- Proof: same-session screenshots under
  `C:\Users\dryos\AppData\Local\Temp\cms-ux-audit\`.

### BIZ-P2-03 - Browser-local attachment download is not the same as production download proof

- Page / route / component: complaint detail attachments.
- User tries to do: download a clean attachment.
- What happens: S3 returns a signed URL, but memory storage returns a backend
  token shape that the web client does not open as a browser URL.
- Why this is a problem: local demo behavior can differ from production proof;
  pilot checklist requires S3-compatible storage proof.
- Likely files:
  - `apps/api/src/modules/attachments/attachment-storage.port.ts:54`
  - `apps/web/src/lib/staff-attachments-api.ts:54`
- Suggested fix: use S3-compatible storage for pilot/UAT proof or add a same-origin
  download proxy for memory/dev mode.
- Proof: `corepack pnpm test:api -- attachments` passed; ops pilot proof still
  needs environment validation.

## Privacy / Security UX Risks

- Management-readonly masking is the highest privacy risk. See BIZ-P0-05.
- Portal tracking correctly avoids exposing OTPs in API responses, but currently
  lacks a customer delivery channel. See BIZ-P0-01.
- Audit backend redaction tests pass, but the UI does not expose real audit
  search/export. See BIZ-P0-03.
- Report export security tests pass for branch scope, but many named reports are
  not delivered. See BIZ-P0-04.
- DMS live/provider failure telemetry is not persisted into a reportable business
  surface. See BIZ-P1-02.

## Missing Flows / Gaps

- Real audit viewer search/export UI.
- Admin category tree and SLA policy management UI.
- Customer OTP delivery and template proof.
- Initial complaint SLA deadline/acknowledgement side effects.
- Staff internal/public comment composer and portal-visible public timeline.
- Closure survey scheduling from close workflow and portal survey submit.
- Staff intake attachment upload.
- Compensation metadata workflow, if in MVP scope.
- DMS provider configuration or signed manual-DMS pilot scope.
- Report-specific outputs for deferred report IDs, or signed report deferrals.

## Suggested Fix Slices

1. Decide and sign scope: complaint MVP versus dealership accountability, plus
   report, DMS, and compensation deferrals.
2. Make portal tracking actually deliver OTPs and prove customer tracking end to
   end.
3. Start SLA deadlines and acknowledgement notifications on initial submission.
4. Wire real audit viewer and admin category/SLA UI.
5. Complete report-specific outputs or clearly signed deferrals.
6. Finish staff comments/public updates, closure survey, and intake attachments.
7. Enforce management-readonly masking from the API.
8. Prove DMS/storage/notification operations in a realistic pilot environment.

## Proof Commands

Passed:

- `corepack pnpm test:api -- reports`
- `corepack pnpm test:api -- workflow`
- `corepack pnpm test:api -- portal`
- `corepack pnpm test:api -- portal.tracking`
- `corepack pnpm test:api -- attachments`
- `corepack pnpm test:api -- notifications`
- `corepack pnpm test:api -- surveys`
- `corepack pnpm openapi:check`
- `corepack pnpm security:check`
- `corepack pnpm ops:backup:check`

Failed or blocked:

- `corepack pnpm test:api -- tracking` is not a registered suite.
- `corepack pnpm test:api -- audit` passed backend TAP tests but failed the full
  command because Docker Desktop was unavailable for append-only proof.

Previously run UX/browser proof from the same audit session:

- `corepack pnpm test:web -- shell`
- `corepack pnpm test:web -- localization`
- `corepack pnpm test:e2e -- accessibility`
- `corepack pnpm test:visual`
- `corepack pnpm web:perf`

Screenshot proof directory:

- `C:\Users\dryos\AppData\Local\Temp\cms-ux-audit\`
