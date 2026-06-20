# Phase 7 UAT Checklist

Human sign-off is separate from this deterministic checklist. Use this artifact
to prepare, execute, and capture pilot UAT evidence; do not mark UAT accepted
until business reviewers sign the completed run.

## Seed Data

Use seeded or equivalent L4 realistic automotive complaint data:

- CMP-SEED-001: Toyota Camry, VIN SEEDDEMO00001, engine knocking after cold
  start, Main Branch, submitted.
- CMP-SEED-002: Hyundai Sonata, VIN SEEDDEMO00002, service appointment delayed
  two hours, North Branch, in progress.
- CMP-SEED-003: body and paint bubbling during warranty period, Main Branch,
  resolved.

Use role-based seeded accounts supplied by the test lead. Do not write account
passwords, OTP values, session cookies, reset links, or provider credentials in
screenshots, notes, or defect tickets.

## Screen Coverage

| ID | Screen | UAT proof |
|---|---|---|
| UI-001 | Staff login | Generic denial, successful login, logout, inactive/locked wording |
| UI-001A | Staff password reset | Generic request, reset form, used/expired states |
| UI-002 | Staff home dashboard | Open, overdue, SLA warning, closed, average TAT cards |
| UI-003 | Complaint work queue | Filters by status, branch, category, severity, owner, date, customer, reference |
| UI-004 | Complaint creation | Matched customer/VIN and manual fallback creation |
| UI-005 | Complaint detail | Facts, customer, vehicle, owner, SLA timer, timeline, survey |
| UI-006 | Workflow action modal | Approve, send back, assign, resolve, close, reject, reopen validation |
| UI-007 | Customer/vehicle lookup panel | Search by phone, name, VIN, plate, source indicator, manual override |
| UI-008 | Attachments panel | Upload rules, scan status, authorized staff download, portal upload |
| UI-009 | Comments and public updates | Internal note hidden from portal, public update visible after verification |
| UI-010 | Admin users and roles | Create/update/deactivate/reactivate, roles, branch scope, reset affordance |
| UI-011 | Admin branches/departments | Active/inactive branch and department management |
| UI-012 | Admin categories/severity | Category tree, severity values, active/inactive states |
| UI-013 | Admin SLA policies | Stage duration, warning threshold, escalation, timezone/calendar |
| UI-014 | Admin notification templates | Arabic/English templates, channel, preview, activate/deactivate |
| UI-014A | In-app notification center | Unread/read list, mark read, scoped complaint link |
| UI-015 | Reports dashboard | Volume, SLA breach, average TAT, aging, branch/category/severity filters |
| UI-016 | Report export | CSV/Excel export, row limit, RBAC-filtered data, export audit |
| UI-017 | Audit viewer | Search by actor/action/target/date/correlation, capped export |
| UI-018 | Customer portal submission | Submit complaint, attachment affordance, reference result |
| UI-019 | Customer portal tracking | Reference plus verification before tracking details, public timeline, follow-up |
| UI-020 | Customer satisfaction survey | One-time link, rating 1-5, optional comment, used/expired handling |

Run UI-001 through UI-020 in English LTR and Arabic RTL where the screen has user
visible form labels, validation, tables, modals, or portal text.

## Scenario Scripts

| ID | Scenario | Data | Expected result |
|---|---|---|---|
| UAT-001 | CR Officer creates sales delivery complaint for a matched customer/VIN | SEEDDEMO00001 or equivalent matched VIN | Complaint reference generated and visible in queue |
| UAT-002 | DMS is unavailable and staff creates complaint manually | New fictional customer and vehicle | Warning shown, manual entry accepted, complaint not blocked |
| UAT-003 | CR Manager approves complaint and routes to branch | CMP-SEED-001 | Status changes, owner/branch assigned, audit entry created |
| UAT-004 | CR Manager sends complaint back for correction | CMP-SEED-001 | Reason required, history preserved, creator notified |
| UAT-005 | Branch Manager assigns investigation | CMP-SEED-002 | Investigator sees complaint and SLA deadline |
| UAT-006 | Investigator adds internal note and public update | CMP-SEED-002 | Internal note stays staff-only, public update appears after portal verification |
| UAT-007 | SLA warning and breach are triggered | Seeded overdue or clock-controlled complaint | Notification queued, dashboard/report show warning or breach |
| UAT-008 | Branch Manager resolves and closes complaint | CMP-SEED-002 | Closure recorded, survey scheduled, SLA stopped |
| UAT-009 | Customer tracks complaint from portal | CMP-SEED-001 with matching phone | Verification is required before tracking details and public timeline are shown |
| UAT-010 | Customer attempts to access another complaint | Wrong phone/reference pair | Access denied or verification failure, no unrelated complaint data |
| UAT-011 | CR Manager reopens closed complaint | CMP-SEED-003 | Reopen reason required and history preserved |
| UAT-012 | Admin changes category and SLA policy | Service Quality category and medium severity SLA | Change saved, audit entry created |
| UAT-013 | Branch-scoped user tries another branch complaint | Main role against CMP-SEED-002 | API denies access and security event is logged |
| UAT-014 | Management exports report | Date range covering all seed complaints | Export respects scope, row limit, and audit entry |
| UAT-015 | Arabic UI test | Any staff and portal path above | Arabic RTL labels, validation, tables, and modal layout are usable |
| UAT-016 | Attachment access control | Staff and portal attachment paths | Unauthorized download denied; authorized access is audited |

## Evidence Capture

- Capture screenshots or recordings for the critical workflows: login, create,
  route, investigate, resolve, close, portal submit, portal track, survey,
  report export, and audit viewer.
- Record open defects with severity, owner, screen ID, UAT ID, seed data used,
  expected result, actual result, and target fix date.
- Portal evidence must never show internal comments, audit logs, staff names,
  staff email addresses, unrelated complaints, or DMS identifiers.
