import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { buildStaffComplaintCreateSubmission } from '../../src/app/complaint-create-form';
import StaffShellPage from '../../src/app/page';
import DashboardPage from '../../src/app/(staff)/dashboard/page';
import EmployeeTodayPage from '../../src/app/(staff)/tasks/today/page';
import SentTasksPage from '../../src/app/(staff)/tasks/sent/page';
import PromisesPage from '../../src/app/(staff)/tasks/promises/page';
import ManagerControlRoomPage from '../../src/app/(staff)/tasks/manager/page';
import DealHandoffPage from '../../src/app/(staff)/deals/handoff/page';
import ConfidentialCasePage from '../../src/app/(staff)/cases/confidential/[caseId]/page';
import { shouldRedirectStaffRoute } from '../../src/app/(staff)/layout';
import ComplaintsPage from '../../src/app/(staff)/complaints/page';
import NewComplaintPage from '../../src/app/(staff)/complaints/new/page';
import ComplaintDetailPage from '../../src/app/(staff)/complaints/[id]/page';
import AuditPage from '../../src/app/(staff)/audit/page';
import AdminPage from '../../src/app/(staff)/admin/page';
import AdminBranchesPage from '../../src/app/(staff)/admin/branches/page';
import AdminCategoriesPage from '../../src/app/(staff)/admin/categories/page';
import AdminNotificationTemplatesPage from '../../src/app/(staff)/admin/notification-templates/page';
import AdminUsersPage from '../../src/app/(staff)/admin/users/page';
import { AdminUsersRoles } from '../../src/components/admin-users-roles';
import PasswordResetPage from '../../src/app/(staff)/auth/reset/page';
import NotificationsPage from '../../src/app/(staff)/notifications/page';
import ReportsPage from '../../src/app/(staff)/reports/page';
import PortalSubmissionPage from '../../src/app/portal/page';
import PortalSurveyPage from '../../src/app/portal/survey/page';
import PortalTrackingPage from '../../src/app/portal/track/page';
import { adminBranchesText } from '../../src/i18n/staff-admin-branches';
import { adminCategoriesSlaText } from '../../src/i18n/staff-admin-categories-sla';
import { adminNotificationTemplatesText } from '../../src/i18n/staff-admin-notification-templates';
import { adminUsersText } from '../../src/i18n/staff-admin-users';
import { auditViewerText } from '../../src/i18n/staff-audit-viewer';
import { attachmentText } from '../../src/i18n/staff-attachments';
import { complaintDetailText } from '../../src/i18n/staff-complaint-detail';
import { complaintCreateText } from '../../src/i18n/staff-complaint-create';
import { confirmationText } from '../../src/i18n/staff-confirmations';
import { notificationCenterText } from '../../src/i18n/staff-notification-center';
import { portalSubmissionText } from '../../src/i18n/portal-submission';
import { portalSurveyText } from '../../src/i18n/portal-survey';
import { portalTrackingText } from '../../src/i18n/portal-tracking';
import { reportsDashboardText } from '../../src/i18n/staff-reports-dashboard';
import { employeeTodayText } from '../../src/i18n/staff-employee-today';
import { sentTasksText } from '../../src/i18n/staff-sent-tasks';
import { staffPromisesText } from '../../src/i18n/staff-promises';
import { managerControlRoomText } from '../../src/i18n/staff-manager-control-room';
import { dealHandoffText } from '../../src/i18n/staff-deal-handoff';
import { confidentialCaseText } from '../../src/i18n/staff-confidential-cases';
import { staffShellText } from '../../src/i18n/staff-shell';

test('staff shell renders English LTR operational navigation', async () => {
  const html = renderToStaticMarkup(
    await StaffShellPage({ searchParams: Promise.resolve({ locale: 'en', role: 'admin', session: 'signed-in' }) }),
  );

  assert.match(html, /dir="ltr"/);
  assert.match(html, /Staff Operations/);
  assert.match(html, /Today/);
  assert.match(html, /Sent Tasks/);
  assert.match(html, /Promises/);
  assert.match(html, /Team/);
  assert.match(html, /Deals/);
  assert.match(html, /Overview/);
  assert.match(html, /Cases/);
  assert.match(html, /New intake/);
  assert.match(html, /Admin/);
  assert.match(html, /Reports/);
  assert.match(html, /Audit/);
  assert.match(html, /Notifications/);
});

test('staff shell renders app top bar controls', async () => {
  const html = renderToStaticMarkup(
    await StaffShellPage({ searchParams: Promise.resolve({ locale: 'en', role: 'admin', session: 'signed-in' }) }),
  );

  assert.match(html, /aria-label="Switch language"/);
  assert.match(html, /href="\?locale=ar"/);
  assert.match(html, /aria-label="Toggle theme"/);
  assert.match(html, /aria-pressed="false"/);
});

test('root and textarea avoid hydration-prone client mutations', () => {
  const rootSource = readFileSync('apps/web/src/app/layout.tsx', 'utf8');
  const textareaSource = readFileSync('apps/web/src/components/ui/textarea.tsx', 'utf8');

  assert.match(rootSource, /next\/script/);
  assert.doesNotMatch(rootSource, /<script/);
  assert.match(textareaSource, /data-enable-grammarly="false"/);
  assert.match(textareaSource, /data-lt-active="false"/);
  assert.match(textareaSource, /spellCheck=\{false\}/);
});

test('staff routes require a session except password reset', () => {
  assert.equal(shouldRedirectStaffRoute(false, '/dashboard'), true);
  assert.equal(shouldRedirectStaffRoute(false, '/complaints/new'), true);
  assert.equal(shouldRedirectStaffRoute(false, '/auth/reset'), false);
  assert.equal(shouldRedirectStaffRoute(true, '/complaints/new'), false);
});

test('staff shell renders Arabic RTL labels', async () => {
  const html = renderToStaticMarkup(
    await StaffShellPage({ searchParams: Promise.resolve({ locale: 'ar', role: 'admin', session: 'signed-in' }) }),
  );

  assert.match(html, /dir="rtl"/);
  assert.ok(html.includes(staffShellText.ar.subtitle));
  assert.ok(html.includes(staffShellText.ar.nav.today[0]));
  assert.ok(html.includes(staffShellText.ar.nav.sent[0]));
  assert.ok(html.includes(staffShellText.ar.nav.promises[0]));
  assert.ok(html.includes(staffShellText.ar.nav.manager[0]));
  assert.ok(html.includes(staffShellText.ar.nav.handoff[0]));
  assert.ok(html.includes(staffShellText.ar.nav.dashboard[0]));
  assert.ok(html.includes(staffShellText.ar.nav.queue[0]));
  assert.ok(html.includes(staffShellText.ar.nav.create[0]));
  assert.ok(html.includes(staffShellText.ar.nav.admin[0]));
  assert.ok(html.includes(staffShellText.ar.nav.reports[0]));
  assert.ok(html.includes(staffShellText.ar.nav.audit[0]));
  assert.ok(html.includes(staffShellText.ar.nav.notifications[0]));
});

test('staff shell falls back to English for unsupported locale input', async () => {
  const html = renderToStaticMarkup(await StaffShellPage({ searchParams: Promise.resolve({ locale: 'fr' }) }));

  assert.match(html, /dir="ltr"/);
  assert.match(html, /Staff Operations/);
  assert.doesNotMatch(html, /dir="rtl"/);
});

test('staff shell shows only generic login failure text', async () => {
  const html = renderToStaticMarkup(await StaffShellPage({ searchParams: Promise.resolve({ auth: 'error' }) }));

  assert.match(html, /Could not sign in\. Check your credentials and try again\./);
  assert.doesNotMatch(html, /inactive/i);
  assert.doesNotMatch(html, /locked/i);
});

test('staff login surface has no preview sign-in shortcuts', () => {
  const panelSource = readFileSync('apps/web/src/app/staff-shell-panels.tsx', 'utf8');
  const pageSource = readFileSync('apps/web/src/app/page.tsx', 'utf8');

  assert.doesNotMatch(panelSource, /previewSignedIn|previewError|Preview signed-in shell|Preview error/);
  assert.doesNotMatch(pageSource, /hasPreviewParam/);
  assert.match(pageSource, /if \(await isNextRequest\(\)\)/);
});

test('staff shell renders signed-in preview with logout affordance', async () => {
  const html = renderToStaticMarkup(await StaffShellPage({ searchParams: Promise.resolve({ session: 'signed-in' }) }));

  assert.match(html, /Signed in/);
  assert.match(html, /Log out/);
  assert.match(html, /type="submit"/);
  assert.doesNotMatch(html, /Staff sign in/);
});

test('staff role preview hides admin-only navigation', async () => {
  const html = renderToStaticMarkup(
    await StaffShellPage({ searchParams: Promise.resolve({ session: 'signed-in', role: 'staff' }) }),
  );

  assert.match(html, /Role preview/);
  assert.match(html, /Admin-only surfaces hidden/);
  assert.doesNotMatch(html, /Team/);
  assert.doesNotMatch(html, /Users, branches, categories/);
});

test('admin role preview shows admin-only navigation', async () => {
  const html = renderToStaticMarkup(
    await StaffShellPage({ searchParams: Promise.resolve({ session: 'signed-in', role: 'admin' }) }),
  );

  assert.match(html, /Admin/);
  assert.match(html, /Team/);
  assert.match(html, /Deals/);
  assert.match(html, /Users, branches, categories/);
  assert.doesNotMatch(html, /Admin-only surfaces hidden/);
});

test('staff shell resolves signed-in authority from auth me session principal', async () => {
  const calls: Array<{ input: string | URL | Request; init?: RequestInit }> = [];
  const fetchImpl: typeof fetch = async (input, init) => {
    calls.push({ input, init });
    return jsonResponse({ user: principal({ roleCode: 'ADMIN', branchId: null }) });
  };
  const html = renderToStaticMarkup(
    await StaffShellPage({
      cookieHeader: 'cms_staff_session=raw-session; other=value',
      fetchImpl,
      searchParams: Promise.resolve({ role: 'staff', session: 'signed-in' }),
    }),
  );

  assert.equal(String(calls[0]?.input), 'http://localhost:3000/auth/me');
  assert.deepEqual(calls[0]?.init?.headers, {
    Accept: 'application/json',
    cookie: 'cms_staff_session=raw-session; other=value',
  });
  assert.equal(calls[0]?.init?.cache, 'no-store');
  assert.match(html, /Admin/);
  assert.match(html, /Users, branches, categories/);
  assert.doesNotMatch(html, /Admin-only surfaces hidden/);
});

test('staff shell ignores role query when a real session principal is present', async () => {
  const fetchImpl: typeof fetch = async () => jsonResponse({ user: principal({ roleCode: 'CR_OFFICER' }) });
  const html = renderToStaticMarkup(
    await StaffShellPage({
      cookieHeader: 'cms_staff_session=raw-session',
      fetchImpl,
      searchParams: Promise.resolve({ role: 'admin', session: 'signed-in' }),
    }),
  );

  assert.match(html, /Admin-only surfaces hidden/);
  assert.doesNotMatch(html, /Users, branches, categories/);
  assert.doesNotMatch(html, /Reports dashboard/);
});

test('staff shell does not call auth me without a staff session cookie', async () => {
  let calls = 0;
  const fetchImpl: typeof fetch = async () => {
    calls += 1;
    return jsonResponse({});
  };
  const html = renderToStaticMarkup(
    await StaffShellPage({ cookieHeader: 'other=value', fetchImpl, searchParams: Promise.resolve({ locale: 'en' }) }),
  );

  assert.equal(calls, 0);
  assert.match(html, /Signed out/);
});

test('Arabic role preview keeps RTL direction and localized hidden state', async () => {
  const html = renderToStaticMarkup(
    await StaffShellPage({ searchParams: Promise.resolve({ locale: 'ar', session: 'signed-in', role: 'staff' }) }),
  );

  assert.match(html, /dir="rtl"/);
  assert.ok(html.includes(staffShellText.ar.role.label));
  assert.ok(html.includes(staffShellText.ar.role.adminHidden));
});

test('portal submission renders English responsive complaint form', async () => {
  const html = renderToStaticMarkup(await PortalSubmissionPage({ searchParams: Promise.resolve({ locale: 'en' }) }));

  assert.match(html, /dir="ltr"/);
  assert.match(html, /Customer complaint portal/);
  assert.match(html, /Customer name/);
  assert.match(html, /Customer phone/);
  assert.match(html, /Branch/);
  assert.match(html, /Category/);
  assert.match(html, /Subcategory/);
  assert.match(html, /Severity/);
  assert.match(html, /Incident date/);
  assert.match(html, /Subject/);
  assert.match(html, /Description/);
  assert.match(html, /Vehicle VIN/);
  assert.match(html, /type="file"/);
  assert.match(html, /PDF, PNG, or JPG only/);
  assert.match(html, /Submit complaint/);
  assert.doesNotMatch(html, /audit|DMS|staff PII|internal comments/i);
});

test('portal submission keeps Arabic RTL localized labels', async () => {
  const html = renderToStaticMarkup(
    await PortalSubmissionPage({ searchParams: Promise.resolve({ locale: 'ar', state: 'validation' }) }),
  );

  assert.match(html, /dir="rtl"/);
  assert.ok(html.includes(portalSubmissionText.ar.title));
  assert.ok(html.includes(portalSubmissionText.ar.fields.customerName));
  assert.ok(html.includes(portalSubmissionText.ar.fields.attachment));
  assert.ok(html.includes(portalSubmissionText.ar.validation.required));
});

test('portal submission renders safe success reference result', async () => {
  const html = renderToStaticMarkup(
    await PortalSubmissionPage({
      searchParams: Promise.resolve({ locale: 'en', state: 'success', reference: 'CMP-PORTAL-001' }),
    }),
  );

  assert.match(html, /Complaint submitted/);
  assert.match(html, /Reference number: CMP-PORTAL-001/);
  assert.match(html, /role="status"/);
  assert.doesNotMatch(html, /\+966500000001|SEEDDEMO00001|audit|DMS|staff PII/i);
});

test('portal submission renders loading validation and error states', async () => {
  const loading = renderToStaticMarkup(
    await PortalSubmissionPage({ searchParams: Promise.resolve({ locale: 'en', state: 'loading' }) }),
  );
  const validation = renderToStaticMarkup(
    await PortalSubmissionPage({ searchParams: Promise.resolve({ locale: 'en', state: 'validation' }) }),
  );
  const error = renderToStaticMarkup(
    await PortalSubmissionPage({ searchParams: Promise.resolve({ locale: 'en', state: 'error' }) }),
  );

  assert.match(loading, /Submitting complaint\./);
  assert.match(loading, /disabled=""/);
  assert.match(validation, /Review the highlighted fields\./);
  assert.match(validation, /This field is required\./);
  assert.match(error, /Complaint could not be submitted\. Review the details and try again\./);
  assert.match(error, /role="alert"/);
});

test('portal submission source is public and render-only', () => {
  const source = readFileSync('apps/web/src/components/portal-submission/index.tsx', 'utf8');

  assert.doesNotMatch(source, /fetch\(|localStorage|sessionStorage|document\.cookie|createObjectURL|Blob|download/);
  assert.doesNotMatch(source, /roleCode|principal|branchScope|actorId|ownerId|workflow|password|otp|token|secret|provider/);
  assert.doesNotMatch(source, /audit|DMS|staff PII|internal comments/i);
});

test('portal tracking starts with verification gate and no status timeline', async () => {
  const html = renderToStaticMarkup(await PortalTrackingPage({ searchParams: Promise.resolve({ locale: 'en' }) }));

  assert.match(html, /dir="ltr"/);
  assert.match(html, /Track a complaint/);
  assert.match(html, /Reference number/);
  assert.match(html, /Customer phone/);
  assert.match(html, /Verification code/);
  assert.match(html, /Verification is required before complaint status is shown\./);
  assert.doesNotMatch(html, /Public timeline/);
  assert.doesNotMatch(html, /IN_PROGRESS/);
});

test('portal tracking keeps Arabic RTL localized labels', async () => {
  const html = renderToStaticMarkup(
    await PortalTrackingPage({ searchParams: Promise.resolve({ locale: 'ar', state: 'requested' }) }),
  );

  assert.match(html, /dir="rtl"/);
  assert.ok(html.includes(portalTrackingText.ar.title));
  assert.ok(html.includes(portalTrackingText.ar.sections.request));
  assert.ok(html.includes(portalTrackingText.ar.fields.code));
  assert.ok(html.includes(portalTrackingText.ar.states.requested));
});

test('portal tracking renders verified public status timeline only after verification', async () => {
  const html = renderToStaticMarkup(
    await PortalTrackingPage({
      searchParams: Promise.resolve({ locale: 'en', state: 'verified', reference: 'CMP-TRACK-001' }),
    }),
  );

  assert.match(html, /Verification complete\./);
  assert.match(html, /Reference number/);
  assert.match(html, /CMP-TRACK-001/);
  assert.match(html, /Public timeline/);
  assert.match(html, /SUBMITTED - 2026-06-19/);
  assert.match(html, /IN_PROGRESS - 2026-06-19/);
  assert.doesNotMatch(html, /\+966500000001|audit|DMS|staff PII|internal/i);
});

test('portal tracking renders invalid expired error and follow-up states', async () => {
  const invalid = renderToStaticMarkup(
    await PortalTrackingPage({ searchParams: Promise.resolve({ locale: 'en', state: 'invalid' }) }),
  );
  const expired = renderToStaticMarkup(
    await PortalTrackingPage({ searchParams: Promise.resolve({ locale: 'en', state: 'expired' }) }),
  );
  const error = renderToStaticMarkup(
    await PortalTrackingPage({ searchParams: Promise.resolve({ locale: 'en', state: 'error' }) }),
  );
  const followup = renderToStaticMarkup(
    await PortalTrackingPage({ searchParams: Promise.resolve({ locale: 'en', state: 'followup' }) }),
  );

  assert.match(invalid, /Verification failed\. Check the reference and code, then try again\./);
  assert.match(expired, /Verification expired\. Request a new code\./);
  assert.match(error, /Tracking could not be loaded\. Try again\./);
  assert.match(error, /role="alert"/);
  assert.match(followup, /Follow-up received\./);
  assert.match(followup, /Add follow-up/);
  assert.match(followup, /Please add the missing service invoice\./);
});

test('portal tracking source does not render secrets or private data paths', () => {
  const source = readFileSync('apps/web/src/components/portal-tracking/index.tsx', 'utf8');

  assert.doesNotMatch(source, /fetch\(|localStorage|sessionStorage|document\.cookie|createObjectURL|Blob|download/);
  assert.doesNotMatch(source, /sessionToken|verificationId|roleCode|principal|branchScope|actorId|ownerId|workflow|password|secret|provider/);
  assert.doesNotMatch(source, /audit|DMS|staff PII|internal comments|unrelated/i);
});

test('portal survey renders bounded accessible rating controls', async () => {
  const html = renderToStaticMarkup(await PortalSurveyPage({ searchParams: Promise.resolve({ locale: 'en' }) }));

  assert.match(html, /dir="ltr"/);
  assert.match(html, /Customer satisfaction survey/);
  assert.match(html, /This survey link can be used once/);
  assert.equal(html.match(/type="radio"/g)?.length, 5);
  assert.match(html, /aria-label="1 - Very dissatisfied"/);
  assert.match(html, /aria-label="5 - Very satisfied"/);
  assert.match(html, /Optional comment/);
  assert.match(html, /Submit survey/);
});

test('portal survey keeps Arabic RTL localized labels', async () => {
  const html = renderToStaticMarkup(
    await PortalSurveyPage({ searchParams: Promise.resolve({ locale: 'ar', state: 'validation' }) }),
  );

  assert.match(html, /dir="rtl"/);
  assert.ok(html.includes(portalSurveyText.ar.title));
  assert.ok(html.includes(portalSurveyText.ar.fields.rating));
  assert.ok(html.includes(portalSurveyText.ar.ratingLabels[4]));
  assert.ok(html.includes(portalSurveyText.ar.states.validation));
});

test('portal survey renders success without preserving comment details', async () => {
  const html = renderToStaticMarkup(
    await PortalSurveyPage({ searchParams: Promise.resolve({ locale: 'en', state: 'success' }) }),
  );

  assert.match(html, /Survey submitted\. Thank you for your feedback\./);
  assert.match(html, /role="status"/);
  assert.doesNotMatch(html, /The issue was resolved clearly|audit|DMS|staff PII/i);
});

test('portal survey used and expired states prevent resubmission', async () => {
  const used = renderToStaticMarkup(await PortalSurveyPage({ searchParams: Promise.resolve({ locale: 'en', state: 'used' }) }));
  const expired = renderToStaticMarkup(
    await PortalSurveyPage({ searchParams: Promise.resolve({ locale: 'en', state: 'expired' }) }),
  );

  assert.match(used, /This survey link has already been used\./);
  assert.match(expired, /This survey link has expired\./);
  assert.doesNotMatch(used, /Submit survey/);
  assert.doesNotMatch(expired, /Submit survey/);
});

test('portal survey renders validation loading and error states', async () => {
  const validation = renderToStaticMarkup(
    await PortalSurveyPage({ searchParams: Promise.resolve({ locale: 'en', state: 'validation' }) }),
  );
  const loading = renderToStaticMarkup(
    await PortalSurveyPage({ searchParams: Promise.resolve({ locale: 'en', state: 'loading' }) }),
  );
  const error = renderToStaticMarkup(await PortalSurveyPage({ searchParams: Promise.resolve({ locale: 'en', state: 'error' }) }));

  assert.match(validation, /Choose a rating from 1 to 5\./);
  assert.match(loading, /Submitting survey\./);
  assert.match(loading, /disabled=""/);
  assert.match(error, /Survey could not be submitted\. Try again\./);
  assert.match(error, /role="alert"/);
});

test('portal survey source does not render tokens or private data paths', () => {
  const source = readFileSync('apps/web/src/components/portal-survey/index.tsx', 'utf8');

  assert.doesNotMatch(source, /fetch\(|localStorage|sessionStorage|document\.cookie|createObjectURL|Blob|download/);
  assert.doesNotMatch(source, /token|session|verification|roleCode|principal|branchScope|actorId|ownerId|workflow|password|secret|provider/i);
  assert.doesNotMatch(source, /audit|DMS|staff PII|internal comments|unrelated/i);
});

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { headers: { 'content-type': 'application/json' }, status });
}

function employeeTodayEmpty() {
  return { dueToday: [], overdue: [], overduePromises: [], assignedToMe: [], waitingOnMe: [] };
}

function managerRollupEmpty() {
  return {
    overdueByEmployee: [],
    dueToday: [],
    overduePromises: [],
    stuck: [],
    workloadByAssignee: [],
    escalated: [],
    promiseKpi: { openPromiseCount: 0, overduePromiseCount: 0 },
  };
}

function dealHandoffEmpty() {
  return {
    byStage: ['LEAD', 'BOOKING', 'PAYMENT', 'FINANCE', 'INSURANCE', 'REGISTRATION', 'PDI', 'DELIVERY', 'POST_DELIVERY'].map((stage) => ({ stage, count: 0, deals: [] })),
    stuck: [],
    currentHolder: [],
  };
}

function taskFixture(overrides: Record<string, unknown> = {}) {
  return {
    id: 'task_base',
    title: 'Base task',
    ownerId: 'usr_owner',
    assigneeId: 'usr_staff',
    dueAt: '2026-06-20T12:00:00.000Z',
    status: 'OPEN',
    nextAction: { what: 'Call customer', whoId: 'usr_staff', when: '2026-06-20T13:00:00.000Z' },
    isCustomerPromise: false,
    visibility: 'PARTICIPANTS',
    confidentialityLevel: 'NORMAL',
    links: [],
    participantUserIds: ['usr_owner', 'usr_staff'],
    createdAt: '2026-06-19T08:00:00.000Z',
    updatedAt: '2026-06-20T09:00:00.000Z',
    ...overrides,
  };
}

function dealFixture(overrides: Record<string, unknown> = {}) {
  return {
    id: 'deal_base',
    title: 'Base deal',
    branchId: 'branch_main',
    branchName: 'Main Branch',
    ownerId: 'usr_owner',
    ownerName: 'Deal Owner',
    currentHolderId: 'usr_sales',
    currentHolderName: 'Sales Holder',
    stage: 'BOOKING',
    stageDueAt: '2026-06-20T12:00:00.000Z',
    blocker: null,
    delayAgeMinutes: 90,
    createdAt: '2026-06-19T08:00:00.000Z',
    updatedAt: '2026-06-20T09:00:00.000Z',
    ...overrides,
  };
}

function confidentialCaseFixture(overrides: Record<string, unknown> = {}) {
  return {
    case: {
      id: 'case_hr_1',
      type: 'EMPLOYEE_GRIEVANCE',
      status: 'IN_PROGRESS',
      lifecycleStatus: 'HR_REVIEW',
      confidentialityLevel: 'CONFIDENTIAL',
      branchId: 'branch_main',
      branchName: 'Main Branch',
      ownerId: 'usr_hr',
      ownerName: 'HR Owner',
      subject: 'Workplace grievance',
      descriptionEn: 'Confidential HR review',
      descriptionAr: null,
      links: [{ entityType: 'EMPLOYEE', entityId: 'usr_employee' }],
      createdAt: '2026-06-20T08:00:00.000Z',
      updatedAt: '2026-06-20T09:00:00.000Z',
    },
    taskLink: { entityType: 'CASE', entityId: 'case_hr_1' },
    capaActions: [],
    restrictedNotes: [{ id: 'note_hr_1', authorId: 'usr_hr', body: 'Private HR note', createdAt: '2026-06-20T08:10:00.000Z' }],
    repeatIssue: { isRepeat: false, rootCauses: [] },
    events: [{ type: 'CASE_CREATED', occurredAt: '2026-06-20T08:00:00.000Z' }],
    ...overrides,
  };
}

function workQueueHtml(html: string): string {
  return html.match(/aria-label="Cases"[\s\S]*?aria-label="Complaint detail"/)?.[0] ?? '';
}

function principal(overrides: { roleCode?: string; branchId?: string | null } = {}) {
  return {
    sessionId: 'ses_test',
    userId: 'usr_test',
    email: 'staff@cms-auto.test',
    nameEn: 'Staff User',
    nameAr: 'موظف',
    roleCode: overrides.roleCode ?? 'CR_OFFICER',
    branchId: overrides.branchId ?? 'branch_main',
  };
}

test('staff shell exposes password reset entry points', async () => {
  const html = renderToStaticMarkup(await StaffShellPage({ searchParams: Promise.resolve({ locale: 'en' }) }));
  const source = readFileSync('apps/web/src/app/staff-shell-panels.tsx', 'utf8');

  assert.match(html, /Password reset/);
  assert.match(html, /Forgot password\?/);
  assert.match(html, /Use reset token/);
  assert.match(source, /action=\{loginStaffAction\}/);
  assert.match(source, /action=\{logoutStaffAction\}/);
  assert.doesNotMatch(source, /type="button"/);
});

test('staff route layout exposes server-action logout', () => {
  const source = readFileSync('apps/web/src/app/(staff)/layout.tsx', 'utf8');

  assert.match(source, /logoutStaffAction/);
  assert.match(source, /action=\{logoutStaffAction\}/);
  assert.match(source, /name="locale"/);
  assert.doesNotMatch(source, /localStorage|sessionStorage|document\.cookie/);
});

test('password reset request state uses generic safe messaging', async () => {
  const html = renderToStaticMarkup(
    await StaffShellPage({ searchParams: Promise.resolve({ locale: 'en', reset: 'requested' }) }),
  );

  assert.match(html, /If the account can reset a password, instructions will be sent\./);
  assert.match(html, /name="resetIdentifier"/);
  assert.doesNotMatch(html, /inactive/i);
  assert.doesNotMatch(html, /locked/i);
  assert.doesNotMatch(html, /not found/i);
});

test('password reset token state renders token and new-password inputs', async () => {
  const html = renderToStaticMarkup(
    await StaffShellPage({ searchParams: Promise.resolve({ locale: 'en', reset: 'token' }) }),
  );
  const source = readFileSync('apps/web/src/components/password-reset/index.tsx', 'utf8');

  assert.match(html, /name="resetToken"/);
  assert.match(html, /name="newPassword"/);
  assert.match(html, /autoComplete="off"/);
  assert.match(html, /autoComplete="new-password"/);
  assert.doesNotMatch(source, /defaultValue|value=/);
});

test('password reset result states stay generic', async () => {
  const success = renderToStaticMarkup(
    await StaffShellPage({ searchParams: Promise.resolve({ locale: 'en', reset: 'success' }) }),
  );
  const invalid = renderToStaticMarkup(
    await StaffShellPage({ searchParams: Promise.resolve({ locale: 'en', reset: 'invalid' }) }),
  );

  assert.match(success, /Password reset complete\. Sign in with the new password\./);
  assert.match(invalid, /Reset link is invalid or expired\. Request a new reset link\./);
  assert.doesNotMatch(invalid, /consumed/i);
  assert.doesNotMatch(invalid, /used/i);
});

test('Arabic password reset UI keeps RTL localized labels', async () => {
  const html = renderToStaticMarkup(
    await StaffShellPage({ searchParams: Promise.resolve({ locale: 'ar', reset: 'token' }) }),
  );

  assert.match(html, /dir="rtl"/);
  assert.ok(html.includes(staffShellText.ar.reset.title));
  assert.ok(html.includes(staffShellText.ar.reset.token));
  assert.ok(html.includes(staffShellText.ar.reset.newPassword));
});

test('password reset UI source does not use browser token storage', () => {
  const pageSource = readFileSync('apps/web/src/app/page.tsx', 'utf8');
  const resetSource = readFileSync('apps/web/src/components/password-reset/index.tsx', 'utf8');
  const actionsSource = readFileSync('apps/web/src/lib/staff-auth-actions.ts', 'utf8');
  const source = `${pageSource}\n${resetSource}\n${actionsSource}`;

  assert.doesNotMatch(source, /localStorage|sessionStorage|document\.cookie/);
});

test('password reset route renders English request and token states', async () => {
  const request = renderToStaticMarkup(
    await PasswordResetPage({ searchParams: Promise.resolve({ locale: 'en', reset: 'request' }) }),
  );
  const token = renderToStaticMarkup(
    await PasswordResetPage({ searchParams: Promise.resolve({ locale: 'en', reset: 'token' }) }),
  );

  assert.match(request, /Password reset/);
  assert.match(request, /name="resetIdentifier"/);
  assert.match(request, /autoComplete="username"/);
  assert.match(token, /name="resetToken"/);
  assert.match(token, /autoComplete="off"/);
  assert.match(token, /name="newPassword"/);
  assert.match(token, /autoComplete="new-password"/);
});

test('password reset route keeps safe success and invalid states', async () => {
  const success = renderToStaticMarkup(
    await PasswordResetPage({ searchParams: Promise.resolve({ locale: 'en', reset: 'success' }) }),
  );
  const invalid = renderToStaticMarkup(
    await PasswordResetPage({ searchParams: Promise.resolve({ locale: 'en', reset: 'invalid' }) }),
  );

  assert.match(success, /Password reset complete\. Sign in with the new password\./);
  assert.match(success, /role="status"/);
  assert.match(invalid, /Reset link is invalid or expired\. Request a new reset link\./);
  assert.match(invalid, /role="alert"/);
  assert.doesNotMatch(invalid, /consumed|used|inactive|locked/i);
});

test('password reset route keeps Arabic RTL localized labels', async () => {
  const html = renderToStaticMarkup(
    await PasswordResetPage({ searchParams: Promise.resolve({ locale: 'ar', reset: 'token' }) }),
  );

  assert.match(html, /dir="rtl"/);
  assert.ok(html.includes(staffShellText.ar.reset.title));
  assert.ok(html.includes(staffShellText.ar.reset.token));
  assert.ok(html.includes(staffShellText.ar.reset.newPassword));
});

test('staff dashboard summary shows staff role cards only', async () => {
  const html = renderToStaticMarkup(
    await StaffShellPage({ searchParams: Promise.resolve({ locale: 'en', role: 'staff', session: 'signed-in' }) }),
  );

  assert.match(html, /Active cases/);
  assert.match(html, /SLA warnings/);
  assert.match(html, /Overdue cases/);
  assert.doesNotMatch(html, /Average TAT/);
});

test('admin dashboard summary shows all operational cards', async () => {
  const html = renderToStaticMarkup(
    await StaffShellPage({ searchParams: Promise.resolve({ locale: 'en', role: 'admin', session: 'signed-in' }) }),
  );

  assert.match(html, /Active cases/);
  assert.match(html, /SLA warnings/);
  assert.match(html, /Overdue cases/);
  assert.match(html, /Closed cases/);
  assert.match(html, /Average TAT/);
});

test('management dashboard summary focuses management cards', async () => {
  const html = renderToStaticMarkup(
    await StaffShellPage({ searchParams: Promise.resolve({ locale: 'en', role: 'management', session: 'signed-in' }) }),
  );

  assert.match(html, /Active cases/);
  assert.match(html, /Overdue cases/);
  assert.match(html, /Closed cases/);
  assert.match(html, /Average TAT/);
  assert.doesNotMatch(html, /Needs attention soon/);
});

test('Arabic dashboard summary keeps RTL localized card labels', async () => {
  const html = renderToStaticMarkup(
    await StaffShellPage({ searchParams: Promise.resolve({ locale: 'ar', role: 'admin', session: 'signed-in' }) }),
  );

  assert.match(html, /dir="rtl"/);
  assert.ok(html.includes(staffShellText.ar.dashboard.cards.open[0]));
  assert.ok(html.includes(staffShellText.ar.dashboard.cards.closed[0]));
  assert.ok(html.includes(staffShellText.ar.dashboard.cards.averageTat[0]));
});

test('dashboard summary preview states render loading empty and error messages', async () => {
  const loading = renderToStaticMarkup(
    await StaffShellPage({ searchParams: Promise.resolve({ dashboard: 'loading' }) }),
  );
  const empty = renderToStaticMarkup(await StaffShellPage({ searchParams: Promise.resolve({ dashboard: 'empty' }) }));
  const error = renderToStaticMarkup(await StaffShellPage({ searchParams: Promise.resolve({ dashboard: 'error' }) }));

  assert.match(loading, /Loading accountability overview\./);
  assert.match(empty, /No accountability overview is available yet\./);
  assert.match(error, /Accountability overview could not be loaded\. Try again\./);
  assert.match(error, /role="alert"/);
});

test('dashboard summary renders real backend values through the session cookie', async () => {
  const calls: Array<{ input: string | URL | Request; init?: RequestInit }> = [];
  const fetchImpl: typeof fetch = async (input, init) => {
    calls.push({ input, init });
    if (String(input).endsWith('/auth/me')) return jsonResponse({ user: principal({ roleCode: 'ADMIN', branchId: null }) });
    return jsonResponse({
      summary: {
        openComplaints: 42,
        overdueComplaints: 7,
        slaWarningComplaints: 9,
        closedComplaints: 30,
        averageTatHours: 36,
      },
    });
  };
  const html = renderToStaticMarkup(
    await StaffShellPage({
      cookieHeader: 'cms_staff_session=raw-session',
      fetchImpl,
      searchParams: Promise.resolve({ role: 'staff', session: 'signed-in' }),
    }),
  );

  const dashboardCall = calls.find((call) => String(call.input).endsWith('/reports/dashboard'));
  assert.ok(dashboardCall);
  assert.deepEqual(dashboardCall.init?.headers, {
    Accept: 'application/json',
    cookie: 'cms_staff_session=raw-session',
  });
  assert.match(html, />42</);
  assert.match(html, />7</);
  assert.match(html, />9</);
  assert.match(html, />30</);
  assert.match(html, />1.5d</);
  assert.doesNotMatch(html, />18</);
});

test('dashboard summary keeps preview fallback when backend denies the session', async () => {
  const fetchImpl: typeof fetch = async (input) => {
    if (String(input).endsWith('/auth/me')) return jsonResponse({ user: principal({ roleCode: 'CR_OFFICER' }) });
    return jsonResponse({ error: { code: 'RBAC_FORBIDDEN' } }, 403);
  };
  const html = renderToStaticMarkup(
    await StaffShellPage({
      cookieHeader: 'cms_staff_session=raw-session',
      fetchImpl,
      searchParams: Promise.resolve({ role: 'staff', session: 'signed-in' }),
    }),
  );

  assert.match(html, />18</);
  assert.doesNotMatch(html, />42</);
});

test('work queue renders localized headers filters and pagination', async () => {
  const html = renderToStaticMarkup(await StaffShellPage({ searchParams: Promise.resolve({ locale: 'en' }) }));

  assert.match(html, /Reference/);
  assert.match(html, /Severity/);
  assert.match(html, /Owner/);
  assert.match(html, /SLA state/);
  assert.match(html, /Next action/);
  assert.match(html, /Status/);
  assert.match(html, /Branch/);
  assert.match(html, /Search/);
  assert.match(html, /Page 1 of 1/);
  assert.match(html, /Previous/);
  assert.match(html, /Next/);
});

test('work queue source has no fallback complaint rows or private data paths', async () => {
  const source = readFileSync('apps/web/src/app/work-queue.tsx', 'utf8');

  assert.doesNotMatch(source, /CMP-2026-/);
  assert.doesNotMatch(source, /[\w.-]+@[\w.-]+/);
  assert.doesNotMatch(source, /\b\+?\d{10,}\b/);
  assert.doesNotMatch(source, /VIN|audit|internal comment|portal|document\.cookie|localStorage|sessionStorage|fetch\(/i);
  assert.match(source, /STATUS_OPTIONS/);
  assert.match(source, /SEVERITY_OPTIONS/);
  assert.match(source, /filters\[key\]\.map/);
});

test('Arabic work queue keeps RTL localized labels', async () => {
  const html = renderToStaticMarkup(await StaffShellPage({ searchParams: Promise.resolve({ locale: 'ar' }) }));

  assert.match(html, /dir="rtl"/);
  assert.ok(html.includes(staffShellText.ar.workQueue.headers[0]));
  assert.ok(html.includes(staffShellText.ar.workQueue.filters.severity));
  assert.ok(html.includes(staffShellText.ar.workQueue.pagination.page));
});

test('work queue preview states render loading empty error success and conflict messages', async () => {
  const loading = renderToStaticMarkup(await StaffShellPage({ searchParams: Promise.resolve({ queue: 'loading' }) }));
  const empty = renderToStaticMarkup(await StaffShellPage({ searchParams: Promise.resolve({ queue: 'empty' }) }));
  const error = renderToStaticMarkup(await StaffShellPage({ searchParams: Promise.resolve({ queue: 'error' }) }));
  const success = renderToStaticMarkup(await StaffShellPage({ searchParams: Promise.resolve({ queue: 'success' }) }));
  const conflict = renderToStaticMarkup(await StaffShellPage({ searchParams: Promise.resolve({ queue: 'conflict' }) }));

  assert.match(loading, /Loading cases\./);
  assert.match(loading, /role="status"/);
  assert.match(empty, /No cases match the current filters\./);
  assert.match(empty, /role="status"/);
  assert.match(error, /Cases could not be loaded\. Try again\./);
  assert.match(error, /role="alert"/);
  assert.match(success, /Cases refreshed\./);
  assert.match(success, /role="status"/);
  assert.match(conflict, /Case data changed\. Reload before continuing\./);
  assert.match(conflict, /role="alert"/);
});

test('work queue renders real complaint rows through the session cookie', async () => {
  const calls: Array<{ input: string | URL | Request; init?: RequestInit }> = [];
  const fetchImpl: typeof fetch = async (input, init) => {
    calls.push({ input, init });
    if (String(input).endsWith('/auth/me')) return jsonResponse({ user: principal({ roleCode: 'CR_OFFICER' }) });
    if (String(input).endsWith('/complaints')) {
      return jsonResponse({
        items: [{
          id: 'cmp_real_1',
          referenceNumber: 'CMP-QUEUE-001',
          status: 'IN_PROGRESS',
          severity: 'HIGH',
          subject: 'Engine noise',
          branchId: 'branch_main',
          branchName: 'Main Branch',
          ownerId: 'usr_owner',
          ownerName: 'Owner User',
          createdAt: '2026-06-18T00:00:00.000Z',
          updatedAt: '2026-06-19T09:30:00.000Z',
        }],
      });
    }
    return jsonResponse({ error: { code: 'RBAC_FORBIDDEN' } }, 403);
  };
  const html = renderToStaticMarkup(
    await StaffShellPage({
      cookieHeader: 'cms_staff_session=raw-session',
      fetchImpl,
      searchParams: Promise.resolve({ role: 'admin', session: 'signed-in' }),
    }),
  );

  const queueCall = calls.find((call) => String(call.input).endsWith('/complaints'));
  assert.ok(queueCall);
  assert.equal(String(queueCall.input), 'http://localhost:3000/complaints');
  assert.doesNotMatch(String(queueCall.input), /role|actor|workflow|branchId/i);
  assert.deepEqual(queueCall.init?.headers, {
    Accept: 'application/json',
    cookie: 'cms_staff_session=raw-session',
  });
  assert.match(html, /CMP-QUEUE-001/);
  assert.match(html, /Engine noise/);
  assert.match(html, /IN_PROGRESS/);
  assert.match(html, /HIGH/);
  assert.match(html, /Owner User/);
  assert.match(html, /Main Branch/);
  assert.doesNotMatch(html, /usr_owner|branch_main/);
  assert.match(html, /2026-06-19/);
  assert.doesNotMatch(html, /@|\+?\d{10,}/);
});

test('work queue renders empty state when backend denies queue read', async () => {
  const fetchImpl: typeof fetch = async (input) => {
    if (String(input).endsWith('/auth/me')) return jsonResponse({ user: principal({ roleCode: 'CR_OFFICER' }) });
    return jsonResponse({ error: { code: 'RBAC_FORBIDDEN' } }, 403);
  };
  const html = renderToStaticMarkup(
    await StaffShellPage({
      cookieHeader: 'cms_staff_session=raw-session',
      fetchImpl,
      searchParams: Promise.resolve({ role: 'staff', session: 'signed-in' }),
    }),
  );

  assert.match(html, /No cases match the current filters\./);
  assert.match(html, /role="status"/);
  assert.doesNotMatch(workQueueHtml(html), /CMP-2026-/);
  assert.doesNotMatch(html, /CMP-QUEUE-001/);
});

test('staff shell keeps responsive layout classes for dashboard and queue', async () => {
  const html = renderToStaticMarkup(
    await StaffShellPage({ searchParams: Promise.resolve({ locale: 'en', role: 'admin', session: 'signed-in' }) }),
  );

  assert.match(html, /lg:grid-cols-\[18rem_1fr\]/);
  assert.match(html, /md:grid-cols-3/);
  assert.match(html, /xl:grid-cols-5/);
  assert.match(html, /md:grid-cols-5/);
  assert.match(html, /overflow-x-auto/);
  assert.match(html, /min-w-\[58rem\]/);
});

test('English and Arabic render dashboard and queue labels together', async () => {
  const english = renderToStaticMarkup(
    await StaffShellPage({ searchParams: Promise.resolve({ locale: 'en', role: 'admin' }) }),
  );
  const arabic = renderToStaticMarkup(
    await StaffShellPage({ searchParams: Promise.resolve({ locale: 'ar', role: 'admin' }) }),
  );

  assert.match(english, /dir="ltr"/);
  assert.ok(english.includes(staffShellText.en.dashboard.cards.open[0]));
  assert.ok(english.includes(staffShellText.en.workQueue.headers[0]));
  assert.match(arabic, /dir="rtl"/);
  assert.ok(arabic.includes(staffShellText.ar.dashboard.cards.open[0]));
  assert.ok(arabic.includes(staffShellText.ar.workQueue.headers[0]));
});

test('complaint detail workspace renders core regions and safe placeholders', async () => {
  const html = renderToStaticMarkup(await StaffShellPage({ searchParams: Promise.resolve({ locale: 'en' }) }));

  assert.match(html, /Complaint detail/);
  assert.match(html, /Complaint facts/);
  assert.match(html, /Customer data/);
  assert.match(html, /Vehicle data/);
  assert.match(html, /Responsible staff and SLA/);
  assert.match(html, /Timeline/);
  assert.match(html, /Survey results/);
  assert.match(html, /Internal comments/);
  assert.match(html, /Public updates/);
  assert.match(html, /Attachments/);
  assert.match(html, /Current responsible staff/);
  assert.match(html, /SLA timer/);
  assert.match(html, /Masked customer placeholder/);
  assert.match(html, /Survey submitted placeholder/);
});

test('Arabic complaint detail workspace keeps RTL localized labels', async () => {
  const html = renderToStaticMarkup(await StaffShellPage({ searchParams: Promise.resolve({ locale: 'ar' }) }));

  assert.match(html, /dir="rtl"/);
  assert.ok(html.includes(complaintDetailText.ar.title));
  assert.ok(html.includes(complaintDetailText.ar.sections.timeline));
  assert.ok(html.includes(complaintDetailText.ar.labels.sla));
  assert.ok(html.includes(complaintDetailText.ar.sections.survey));
  assert.ok(html.includes(complaintDetailText.ar.sections.internalComments));
  assert.ok(html.includes(complaintDetailText.ar.badges.public));
});

test('complaint detail route renders English and Arabic localized workspace labels', async () => {
  const english = renderToStaticMarkup(
    await ComplaintDetailPage({ cookieHeader: '', params: Promise.resolve({ id: 'cmp_1' }), searchParams: Promise.resolve({ locale: 'en' }) }),
  );
  const arabic = renderToStaticMarkup(
    await ComplaintDetailPage({ cookieHeader: '', params: Promise.resolve({ id: 'cmp_1' }), searchParams: Promise.resolve({ locale: 'ar', workflow: 'validation' }) }),
  );

  assert.match(english, /Complaint detail/);
  assert.match(english, /Complaint facts/);
  assert.match(arabic, /dir="rtl"/);
  assert.ok(arabic.includes(complaintDetailText.ar.title));
  assert.ok(arabic.includes(complaintDetailText.ar.sections.workflow));
  assert.ok(arabic.includes(complaintDetailText.ar.workflow.validation));
});

test('complaint detail workspace preview states render loading empty and error messages', async () => {
  const loading = renderToStaticMarkup(await ComplaintDetailPage({ params: Promise.resolve({ id: 'cmp_1' }), searchParams: Promise.resolve({ detail: 'loading' }) }));
  const empty = renderToStaticMarkup(await ComplaintDetailPage({ params: Promise.resolve({ id: 'cmp_1' }), searchParams: Promise.resolve({ detail: 'empty' }) }));
  const error = renderToStaticMarkup(await ComplaintDetailPage({ params: Promise.resolve({ id: 'cmp_1' }), searchParams: Promise.resolve({ detail: 'error' }) }));

  assert.match(loading, /Loading complaint detail\./);
  assert.match(empty, /Select a complaint to view detail\./);
  assert.match(error, /Complaint detail could not be loaded\. Try again\./);
  assert.match(error, /role="alert"/);
});

test('complaint detail route renders real backend facts through the session cookie', async () => {
  const calls: Array<{ input: string | URL | Request; init?: RequestInit }> = [];
  const fetchImpl: typeof fetch = async (input, init) => {
    calls.push({ input, init });
    if (String(input).endsWith('/complaints/cmp%2Fdetail')) {
      return jsonResponse({
        complaint: {
          id: 'cmp/detail',
          referenceNumber: 'CMP-DETAIL-001',
          status: 'IN_PROGRESS',
          severity: 'HIGH',
          subject: 'Engine noise',
          branchId: 'branch_main',
          ownerId: 'usr_owner',
          createdAt: '2026-06-18T00:00:00.000Z',
          updatedAt: '2026-06-19T09:30:00.000Z',
          description: 'Scoped complaint detail.',
          incidentAt: '2026-06-17T00:00:00.000Z',
          caseSummary: {
            id: 'case_cmp_1',
            type: 'CUSTOMER_COMPLAINT',
            status: 'SUBMITTED',
            lifecycleStatus: 'DRAFT',
            confidentialityLevel: 'NORMAL',
            branchId: 'branch_main',
            branchName: 'Main Branch',
            ownerId: 'usr_owner',
            ownerName: 'Owner User',
          },
          statusHistory: [
            { id: 'h1', fromStatus: null, toStatus: 'SUBMITTED', action: 'SUBMIT', actorId: 'usr_staff', actorRole: 'CR_OFFICER', requestSource: 'STAFF', reason: null, correlationId: null, createdAt: '2026-06-18T00:00:00.000Z' },
            { id: 'h2', fromStatus: 'SUBMITTED', toStatus: 'IN_PROGRESS', action: 'ASSIGN_INVESTIGATION', actorId: 'usr_mgr', actorRole: 'BRANCH_MANAGER', requestSource: 'STAFF', reason: null, correlationId: null, createdAt: '2026-06-19T00:00:00.000Z' },
          ],
        },
      });
    }
    if (String(input).endsWith('/cases/case_cmp_1/timeline')) {
      return jsonResponse({
        events: [
          { type: 'CASE_CREATED', occurredAt: '2026-06-18T00:00:00.000Z' },
          { type: 'COMPLAINT_STATUS', toStatus: 'SUBMITTED', action: 'SUBMIT', occurredAt: '2026-06-18T00:00:00.000Z' },
        ],
      });
    }
    if (String(input).endsWith('/cases/case_cmp_1/capa')) {
      return jsonResponse({
        items: [{
          id: 'capa_1',
          caseId: 'case_cmp_1',
          rootCause: 'Parts delay',
          correctiveAction: 'Call before 10 AM',
          preventiveAction: 'Daily parts review',
          ownerId: 'usr_owner',
          ownerName: 'Owner User',
          dueAt: '2026-06-25T09:00:00.000Z',
          status: 'OPEN',
          createdAt: '2026-06-20T08:00:00.000Z',
          updatedAt: '2026-06-20T08:00:00.000Z',
        }],
      });
    }
    if (String(input).endsWith('/staff/assignable')) {
      return jsonResponse({
        staff: [{
          userId: 'usr_owner',
          displayName: 'Owner User',
          displayNameAr: 'موظف مسؤول',
          role: 'CR Manager',
          roleAr: 'مدير علاقات العملاء',
          branchLabel: 'Main Branch',
          branchLabelAr: 'الفرع الرئيسي',
        }],
      });
    }
    return jsonResponse({ error: { code: 'RBAC_FORBIDDEN' } }, 403);
  };
  const html = renderToStaticMarkup(
    await ComplaintDetailPage({
      cookieHeader: 'cms_staff_session=raw-session',
      fetchImpl,
      params: Promise.resolve({ id: 'cmp/detail' }),
      searchParams: Promise.resolve({ locale: 'en' }),
    }),
  );

  const detailCall = calls.find((call) => String(call.input).endsWith('/complaints/cmp%2Fdetail'));
  const caseCall = calls.find((call) => String(call.input).endsWith('/cases/case_cmp_1/timeline'));
  const capaCall = calls.find((call) => String(call.input).endsWith('/cases/case_cmp_1/capa'));
  const staffCall = calls.find((call) => String(call.input).endsWith('/staff/assignable'));
  assert.ok(detailCall);
  assert.ok(caseCall);
  assert.ok(capaCall);
  assert.ok(staffCall);
  assert.equal(String(detailCall.input), 'http://localhost:3000/complaints/cmp%2Fdetail');
  assert.equal(String(caseCall.input), 'http://localhost:3000/cases/case_cmp_1/timeline');
  assert.equal(String(capaCall.input), 'http://localhost:3000/cases/case_cmp_1/capa');
  assert.equal(String(staffCall.input), 'http://localhost:3000/staff/assignable');
  assert.doesNotMatch(String(detailCall.input), /role|actor|workflow|branchId/i);
  assert.doesNotMatch(String(caseCall.input), /role|actor|workflow|branchId/i);
  assert.doesNotMatch(String(capaCall.input), /role|actor|workflow|branchId/i);
  assert.doesNotMatch(String(staffCall.input), /role|actor|workflow|branchId|owner|token|credential/i);
  assert.deepEqual(detailCall.init?.headers, {
    Accept: 'application/json',
    cookie: 'cms_staff_session=raw-session',
  });
  assert.deepEqual(staffCall.init?.headers, {
    Accept: 'application/json',
    cookie: 'cms_staff_session=raw-session',
  });
  assert.match(html, /CMP-DETAIL-001/);
  assert.match(html, /IN_PROGRESS/);
  assert.match(html, /HIGH/);
  assert.match(html, /Engine noise/);
  assert.match(html, /Main Branch/);
  assert.match(html, /Case timeline/);
  assert.match(html, /Case status/);
  assert.match(html, /CUSTOMER_COMPLAINT/);
  assert.match(html, /Main Branch/);
  assert.match(html, /Owner User/);
  assert.match(html, /CAPA owner/);
  assert.match(html, /Owner User - CR Manager - Main Branch/);
  assert.match(html, /Parts delay/);
  assert.match(html, /Open/);
  assert.match(html, /Complaint SUBMITTED - 2026-06-18/);
  assert.match(html, /SUBMITTED - 2026-06-18/);
  assert.match(html, /IN_PROGRESS - 2026-06-19/);
  assert.doesNotMatch(html, /usr_mgr|usr_staff/);
});

test('complaint detail keeps preview fallback when backend denies detail read', async () => {
  const fetchImpl: typeof fetch = async () => jsonResponse({ error: { code: 'BRANCH_SCOPE_FORBIDDEN' } }, 403);
  const html = renderToStaticMarkup(
    await ComplaintDetailPage({
      cookieHeader: 'cms_staff_session=raw-session',
      fetchImpl,
      params: Promise.resolve({ id: 'cmp_denied' }),
      searchParams: Promise.resolve({ locale: 'en' }),
    }),
  );

  assert.match(html, /CMP-2026-001/);
  assert.doesNotMatch(html, /CMP-DETAIL-001/);
});

test('complaint detail workspace keeps responsive detail layout classes', async () => {
  const html = renderToStaticMarkup(await StaffShellPage({ searchParams: Promise.resolve({ locale: 'en' }) }));

  assert.match(html, /xl:grid-cols-\[1\.1fr_0\.9fr\]/);
  assert.match(html, /md:grid-cols-2/);
  assert.match(html, /grid-cols-\[8rem_1fr\]/);
});

test('complaint detail workspace source is privacy-safe and render-only', () => {
  const source = readFileSync('apps/web/src/components/complaint-detail-workspace/index.tsx', 'utf8');
  const wrapper = readFileSync('apps/web/src/app/complaint-detail-workspace.tsx', 'utf8');
  const textSource = readFileSync('apps/web/src/i18n/staff-complaint-detail.ts', 'utf8');
  const combined = `${source}\n${textSource}`;

  assert.doesNotMatch(combined, /fetch\(|localStorage|sessionStorage|document\.cookie|https?:\/\//);
  assert.doesNotMatch(combined, /[\w.-]+@[\w.-]+/);
  assert.doesNotMatch(combined, /\b\+?\d{10,}\b/);
  assert.doesNotMatch(combined, /DMS|audit|portal|staff PII|provider|storage URL/i);
  assert.match(wrapper, /components\/complaint-detail-workspace/);
});

test('complaint detail comments render visibility badges and safe placeholders', async () => {
  const html = renderToStaticMarkup(await StaffShellPage({ searchParams: Promise.resolve({ locale: 'en' }) }));

  assert.match(html, /Internal only/);
  assert.match(html, /Customer visible/);
  assert.match(html, /Staff-only note placeholder/);
  assert.match(html, /Customer-visible update placeholder/);
  assert.match(html, /Author/);
  assert.match(html, /Time/);
  assert.match(html, /Visibility/);
});

test('complaint detail comments preview states render loading empty and error messages', async () => {
  const loading = renderToStaticMarkup(await StaffShellPage({ searchParams: Promise.resolve({ comments: 'loading' }) }));
  const empty = renderToStaticMarkup(await StaffShellPage({ searchParams: Promise.resolve({ comments: 'empty' }) }));
  const error = renderToStaticMarkup(await StaffShellPage({ searchParams: Promise.resolve({ comments: 'error' }) }));

  assert.match(loading, /Loading comments\./);
  assert.match(empty, /No comments or public updates yet\./);
  assert.match(error, /Comments could not be loaded\. Try again\./);
  assert.match(error, /role="alert"/);
});

test('complaint detail comments source is render-only and privacy-safe', () => {
  const source = readFileSync('apps/web/src/components/complaint-comments-panel/index.tsx', 'utf8');

  assert.doesNotMatch(source, /fetch\(|localStorage|sessionStorage|document\.cookie|https?:\/\//);
  assert.doesNotMatch(source, /[\w.-]+@[\w.-]+|\b\+?\d{10,}\b/);
  assert.doesNotMatch(source, /DMS|audit|portal|staff PII|provider|storage URL|uploadUrl|downloadUrl|token|credentials/i);
});

test('complaint detail attachment controls render actions and scan states', async () => {
  const pending = renderToStaticMarkup(await StaffShellPage({ searchParams: Promise.resolve({ attachment: 'pending' }) }));
  const clean = renderToStaticMarkup(await StaffShellPage({ searchParams: Promise.resolve({ attachment: 'clean' }) }));
  const rejected = renderToStaticMarkup(await StaffShellPage({ searchParams: Promise.resolve({ attachment: 'rejected' }) }));

  assert.match(pending, /Upload file/);
  assert.match(pending, /Download when authorized/);
  assert.match(pending, /Scan pending/);
  assert.match(pending, /Backend authorizes every upload and download/);
  assert.match(clean, /Scan clean/);
  assert.match(rejected, /Scan rejected/);
});

test('attachment rejection requires confirmation UI', async () => {
  const html = renderToStaticMarkup(await StaffShellPage({ searchParams: Promise.resolve({ locale: 'en', attachment: 'rejected' }) }));

  assert.ok(html.includes(confirmationText.en.attachmentReject.title));
  assert.ok(html.includes(confirmationText.en.attachmentReject.body));
  assert.ok(html.includes(confirmationText.en.attachmentReject.confirm));
  assert.match(html, /role="alert"/);
});

test('complaint detail attachment preview states render loading empty and error messages', async () => {
  const loading = renderToStaticMarkup(await StaffShellPage({ searchParams: Promise.resolve({ attachment: 'loading' }) }));
  const empty = renderToStaticMarkup(await StaffShellPage({ searchParams: Promise.resolve({ attachment: 'empty' }) }));
  const error = renderToStaticMarkup(await StaffShellPage({ searchParams: Promise.resolve({ attachment: 'error' }) }));

  assert.match(loading, /Loading attachments\./);
  assert.match(empty, /No attachments are available yet\./);
  assert.match(error, /Attachments could not be loaded\. Try again\./);
  assert.match(error, /role="alert"/);
});

test('Arabic complaint detail attachment controls keep RTL localized labels', async () => {
  const html = renderToStaticMarkup(await StaffShellPage({ searchParams: Promise.resolve({ locale: 'ar', attachment: 'clean' }) }));

  assert.match(html, /dir="rtl"/);
  assert.ok(html.includes(complaintDetailText.ar.sections.attachments));
  assert.ok(html.includes(complaintDetailText.ar.attachmentActions.upload));
  assert.ok(html.includes(complaintDetailText.ar.badges.clean));
});

test('complaint detail attachment controls do not transfer or expose files', () => {
  const source = readFileSync('apps/web/src/components/complaint-attachment-controls/index.tsx', 'utf8');

  assert.doesNotMatch(source, /fetch\(|FileReader|createObjectURL|localStorage|sessionStorage|document\.cookie|https?:\/\//);
  assert.doesNotMatch(source, /uploadUrl|downloadUrl|storageUrl|token|credentials/i);
});

test('complaint detail workflow modal renders actions and required comment validation', async () => {
  const html = renderToStaticMarkup(await StaffShellPage({ searchParams: Promise.resolve({ locale: 'en', workflow: 'validation' }) }));

  for (const action of complaintDetailText.en.workflow.actions) {
    assert.ok(html.includes(action));
  }
  assert.match(html, /Workflow action/);
  assert.match(html, /Required comment/);
  assert.match(html, /Comment or reason is required\./);
  assert.match(html, /role="dialog"/);
  assert.match(html, /role="alert"/);
});

test('complaint detail workflow requires close and reject confirmation UI', async () => {
  const html = renderToStaticMarkup(await StaffShellPage({ searchParams: Promise.resolve({ locale: 'en', workflow: 'validation' }) }));

  assert.ok(html.includes(confirmationText.en.workflowCloseReject.title));
  assert.ok(html.includes(confirmationText.en.workflowCloseReject.body));
  assert.ok(html.includes(confirmationText.en.workflowCloseReject.confirmClose));
  assert.ok(html.includes(confirmationText.en.workflowCloseReject.confirmReject));
  assert.match(html, /role="alert"/);
});

test('complaint detail workflow preview states render safely', async () => {
  const loading = renderToStaticMarkup(await StaffShellPage({ searchParams: Promise.resolve({ workflow: 'loading' }) }));
  const empty = renderToStaticMarkup(await StaffShellPage({ searchParams: Promise.resolve({ workflow: 'empty' }) }));
  const error = renderToStaticMarkup(await StaffShellPage({ searchParams: Promise.resolve({ workflow: 'error' }) }));
  const success = renderToStaticMarkup(await StaffShellPage({ searchParams: Promise.resolve({ workflow: 'success' }) }));
  const conflict = renderToStaticMarkup(await StaffShellPage({ searchParams: Promise.resolve({ workflow: 'conflict' }) }));

  assert.match(loading, /Submitting workflow action\./);
  assert.match(empty, /No workflow actions are available\./);
  assert.match(error, /Workflow action could not be submitted\. Try again\./);
  assert.match(success, /Workflow action submitted\./);
  assert.match(conflict, /Record changed by someone else\. Reload latest detail before retrying\./);
  assert.match(conflict, /Reload latest detail/);
  assert.match(conflict, /Retry after reload/);
});

test('Arabic complaint detail workflow modal keeps RTL localized labels', async () => {
  const html = renderToStaticMarkup(await StaffShellPage({ searchParams: Promise.resolve({ locale: 'ar', workflow: 'validation' }) }));

  assert.match(html, /dir="rtl"/);
  assert.ok(html.includes(complaintDetailText.ar.sections.workflow));
  assert.ok(html.includes(complaintDetailText.ar.workflow.actions[0]));
  assert.ok(html.includes(complaintDetailText.ar.workflow.validation));
});

test('complaint detail workflow source does not decide transitions', () => {
  const source = readFileSync('apps/web/src/components/complaint-workflow-modal/index.tsx', 'utf8');

  assert.doesNotMatch(source, /fetch\(|localStorage|sessionStorage|document\.cookie/);
  assert.doesNotMatch(source, /applyTransition|fromStatus|toStatus|nextStatus|currentState|ownerId|branchScope|roleCode/);
  assert.doesNotMatch(source, /PATCH|DELETE|POST|createObjectURL|Blob/);
});

test('English and Arabic render complete detail workspace regions together', async () => {
  const english = renderToStaticMarkup(await StaffShellPage({ searchParams: Promise.resolve({ locale: 'en', workflow: 'conflict', attachment: 'clean' }) }));
  const arabic = renderToStaticMarkup(await StaffShellPage({ searchParams: Promise.resolve({ locale: 'ar', workflow: 'conflict', attachment: 'clean' }) }));

  assert.match(english, /dir="ltr"/);
  assert.ok(english.includes(complaintDetailText.en.sections.facts));
  assert.ok(english.includes(complaintDetailText.en.sections.internalComments));
  assert.ok(english.includes(complaintDetailText.en.sections.attachments));
  assert.ok(english.includes(complaintDetailText.en.sections.workflow));
  assert.match(arabic, /dir="rtl"/);
  assert.ok(arabic.includes(complaintDetailText.ar.sections.facts));
  assert.ok(arabic.includes(complaintDetailText.ar.sections.internalComments));
  assert.ok(arabic.includes(complaintDetailText.ar.sections.attachments));
  assert.ok(arabic.includes(complaintDetailText.ar.sections.workflow));
});

test('complaint detail conflict recovery remains UI-only', () => {
  const source = readFileSync('apps/web/src/components/complaint-workflow-modal/index.tsx', 'utf8');

  assert.match(source, /reload/);
  assert.match(source, /retry/);
  assert.doesNotMatch(source, /fetch\(|location\.reload|router\.refresh|window\.location|setInterval|localStorage|sessionStorage/);
});

test('admin branches departments screen renders only for admin preview', async () => {
  const admin = renderToStaticMarkup(await StaffShellPage({ searchParams: Promise.resolve({ role: 'admin', session: 'signed-in' }) }));
  const staff = renderToStaticMarkup(await StaffShellPage({ searchParams: Promise.resolve({ role: 'staff', session: 'signed-in' }) }));

  assert.match(admin, /Branches and departments/);
  assert.match(admin, /Branches/);
  assert.match(admin, /Departments/);
  assert.match(admin, /Create/);
  assert.match(admin, /Edit/);
  assert.match(admin, /Deactivate/);
  assert.ok(admin.includes(confirmationText.en.deactivate.title));
  assert.ok(admin.includes(confirmationText.en.deactivate.confirm));
  assert.match(admin, /Active/);
  assert.match(admin, /Inactive/);
  assert.doesNotMatch(staff, /Branches and departments/);
});

test('admin branches departments preview states render safely', async () => {
  const loading = renderToStaticMarkup(await StaffShellPage({ searchParams: Promise.resolve({ role: 'admin', admin: 'loading' }) }));
  const empty = renderToStaticMarkup(await StaffShellPage({ searchParams: Promise.resolve({ role: 'admin', admin: 'empty' }) }));
  const error = renderToStaticMarkup(await StaffShellPage({ searchParams: Promise.resolve({ role: 'admin', admin: 'error' }) }));
  const success = renderToStaticMarkup(await StaffShellPage({ searchParams: Promise.resolve({ role: 'admin', admin: 'success' }) }));
  const validation = renderToStaticMarkup(await StaffShellPage({ searchParams: Promise.resolve({ role: 'admin', admin: 'validation' }) }));
  const conflict = renderToStaticMarkup(await StaffShellPage({ searchParams: Promise.resolve({ role: 'admin', admin: 'conflict' }) }));

  assert.match(loading, /Loading branches and departments\./);
  assert.match(empty, /No branches or departments are configured yet\./);
  assert.match(error, /Admin configuration could not be loaded\. Try again\./);
  assert.match(success, /Configuration change saved\./);
  assert.match(validation, /Review the highlighted fields\./);
  assert.match(conflict, /Record changed by someone else\. Reload before retrying\./);
});

test('Arabic admin branches departments keeps RTL localized labels', async () => {
  const html = renderToStaticMarkup(await StaffShellPage({ searchParams: Promise.resolve({ locale: 'ar', role: 'admin' }) }));

  assert.match(html, /dir="rtl"/);
  assert.ok(html.includes(adminBranchesText.ar.title));
  assert.ok(html.includes(adminBranchesText.ar.sections.branches));
  assert.ok(html.includes(adminBranchesText.ar.actions.create));
});

test('admin overview route renders real admin users surface without preview controls', async () => {
  const english = renderToStaticMarkup(await AdminPage({ searchParams: Promise.resolve({ locale: 'en' }) }));
  const arabic = renderToStaticMarkup(await AdminPage({ searchParams: Promise.resolve({ locale: 'ar' }) }));

  assert.match(english, /dir="ltr"/);
  assert.match(english, /Users, roles, and branch scope/);
  assert.match(english, /Admin settings could not be loaded\. Try again\./);
  assert.match(english, /Complaint intake dropdowns/);
  assert.match(english, /Intake dropdown values could not be loaded\./);
  assert.doesNotMatch(english, /Branches and departments/);
  assert.doesNotMatch(english, /Categories, severities, and SLA policies/);
  assert.doesNotMatch(english, /Notification templates/);
  assert.doesNotMatch(english, /Audit viewer/);
  assert.match(arabic, /dir="rtl"/);
  assert.ok(arabic.includes(adminUsersText.ar.title));
  assert.ok(arabic.includes(adminUsersText.ar.masterData.title));
});

test('admin overview route renders real intake dropdown values from backend data', async () => {
  const calls: Array<{ input: string | URL | Request; init?: RequestInit }> = [];
  const fetchImpl: typeof fetch = async (input, init) => {
    calls.push({ input, init });
    if (String(input).endsWith('/admin/users')) {
      return jsonResponse({
        users: [],
        roles: [{ id: 'role_admin', code: 'ADMIN', nameEn: 'System Admin', nameAr: 'مدير النظام' }],
        branches: [{ id: 'branch_main', code: 'MAIN', nameEn: 'Main Branch', nameAr: 'الفرع الرئيسي' }],
      });
    }
    if (String(input).endsWith('/complaints/form-options')) {
      return jsonResponse({
        branches: [{ id: 'branch_main', code: 'MAIN', nameEn: 'Main Branch', nameAr: 'الفرع الرئيسي' }],
        categories: [
          { id: 'cat_vehicle', code: 'VEHICLE', nameEn: 'Vehicle issue', nameAr: 'مشكلة مركبة', parentId: null },
          { id: 'cat_engine', code: 'ENGINE', nameEn: 'Engine noise', nameAr: 'صوت المحرك', parentId: 'cat_vehicle' },
        ],
        severities: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'],
      });
    }
    return jsonResponse({});
  };

  const html = renderToStaticMarkup(
    await AdminPage({
      cookieHeader: 'cms_staff_session=raw-session',
      fetchImpl,
      searchParams: Promise.resolve({ locale: 'en' }),
    }),
  );

  assert.equal(calls.length, 2);
  assert.match(html, /Complaint intake dropdowns/);
  assert.match(html, /Main Branch/);
  assert.match(html, /Vehicle issue/);
  assert.match(html, /Engine noise/);
  assert.match(html, /HIGH/);
  assert.match(html, /Add/);
  assert.match(html, /Save/);
  assert.doesNotMatch(html, /disabled=""/);
});

test('admin overview route does not render disabled preview action buttons', async () => {
  const html = renderToStaticMarkup(await AdminPage({ searchParams: Promise.resolve({ locale: 'en', admin: 'conflict' }) }));

  assert.match(html, /Admin settings could not be loaded\. Try again\./);
  assert.doesNotMatch(html, /Confirm deactivate/);
  assert.doesNotMatch(html, /disabled=""/);
});

test('admin branches route renders English and Arabic labels', async () => {
  const english = renderToStaticMarkup(await AdminBranchesPage({ searchParams: Promise.resolve({ locale: 'en' }) }));
  const arabic = renderToStaticMarkup(await AdminBranchesPage({ searchParams: Promise.resolve({ locale: 'ar' }) }));

  assert.match(english, /dir="ltr"/);
  assert.match(english, /Branches and departments/);
  assert.match(english, /Departments/);
  assert.match(arabic, /dir="rtl"/);
  assert.ok(arabic.includes(adminBranchesText.ar.title));
  assert.ok(arabic.includes(adminBranchesText.ar.sections.departments));
});

test('admin branches route renders preview states safely', async () => {
  const validation = renderToStaticMarkup(
    await AdminBranchesPage({ searchParams: Promise.resolve({ locale: 'en', admin: 'validation' }) }),
  );
  const conflict = renderToStaticMarkup(
    await AdminBranchesPage({ searchParams: Promise.resolve({ locale: 'en', admin: 'conflict' }) }),
  );

  assert.match(validation, /Review the highlighted fields\./);
  assert.match(validation, /role="alert"/);
  assert.match(conflict, /Record changed by someone else\. Reload before retrying\./);
  assert.match(conflict, /role="alert"/);
});

test('admin branches departments source is render-only and privacy-safe', () => {
  const source = readFileSync('apps/web/src/components/admin-branches-departments/index.tsx', 'utf8');
  const wrapper = readFileSync('apps/web/src/app/admin-branches-departments.tsx', 'utf8');
  const surfaces = readFileSync('apps/web/src/components/admin-surfaces/index.tsx', 'utf8');
  const surfacesWrapper = readFileSync('apps/web/src/app/admin-surfaces.tsx', 'utf8');

  assert.match(source, /xl:grid-cols-2/);
  assert.match(source, /min-w-\[34rem\]/);
  assert.doesNotMatch(source, /fetch\(|localStorage|sessionStorage|document\.cookie/);
  assert.doesNotMatch(source, /roleCode|principal|branchScope|audit|portal|DMS|@|\b\+?\d{10,}\b/i);
  assert.match(wrapper, /components\/admin-branches-departments/);
  assert.doesNotMatch(surfaces, /fetch\(|localStorage|sessionStorage|document\.cookie|mutation|PATCH|DELETE|POST/);
  assert.match(surfacesWrapper, /components\/admin-surfaces/);
});

test('admin users roles screen is hidden from staff and does not expose fake reset actions', async () => {
  const admin = renderToStaticMarkup(await StaffShellPage({ searchParams: Promise.resolve({ role: 'admin', session: 'signed-in' }) }));
  const staff = renderToStaticMarkup(await StaffShellPage({ searchParams: Promise.resolve({ role: 'staff', session: 'signed-in' }) }));

  assert.match(admin, /Users, roles, and branch scope/);
  assert.doesNotMatch(admin, /Staff user placeholder/);
  assert.doesNotMatch(admin, /Send reset/);
  assert.match(admin, /Accounts use the initial password until the user changes it through password reset\./);
  assert.doesNotMatch(admin, /reset token/i);
  assert.doesNotMatch(staff, /Users, roles, and branch scope/);
});

test('admin users roles preview states render safely', async () => {
  const loading = renderToStaticMarkup(await StaffShellPage({ searchParams: Promise.resolve({ role: 'admin', admin: 'loading' }) }));
  const validation = renderToStaticMarkup(await StaffShellPage({ searchParams: Promise.resolve({ role: 'admin', admin: 'validation' }) }));

  assert.match(loading, /Loading admin settings\./);
  assert.match(validation, /Review the required admin fields\./);
  assert.match(validation, /role="alert"/);
});

test('Arabic admin users roles keeps RTL localized labels', async () => {
  const html = renderToStaticMarkup(await StaffShellPage({ searchParams: Promise.resolve({ locale: 'ar', role: 'admin' }) }));

  assert.match(html, /dir="rtl"/);
  assert.ok(html.includes(adminUsersText.ar.title));
  assert.ok(html.includes(adminUsersText.ar.resetMessage));
});

test('admin users route renders English and Arabic labels', async () => {
  const english = renderToStaticMarkup(await AdminUsersPage({ searchParams: Promise.resolve({ locale: 'en' }) }));
  const arabic = renderToStaticMarkup(await AdminUsersPage({ searchParams: Promise.resolve({ locale: 'ar' }) }));

  assert.match(english, /dir="ltr"/);
  assert.match(english, /Users, roles, and branch scope/);
  assert.match(english, /Admin settings could not be loaded\. Try again\./);
  assert.match(arabic, /dir="rtl"/);
  assert.ok(arabic.includes(adminUsersText.ar.title));
  assert.ok(arabic.includes(adminUsersText.ar.states.error));
});

test('admin users route fails closed when backend data is unavailable', async () => {
  const html = renderToStaticMarkup(
    await AdminUsersPage({ searchParams: Promise.resolve({ locale: 'en', admin: 'validation' }) }),
  );

  assert.match(html, /Admin settings could not be loaded\. Try again\./);
  assert.match(html, /role="alert"/);
  assert.doesNotMatch(html, /Create user/);
  assert.doesNotMatch(html, /disabled=""/);
});

test('admin users roles renders real account actions when backend data is present', () => {
  const html = renderToStaticMarkup(
    React.createElement(AdminUsersRoles, {
      createAction: async () => undefined,
      data: {
        users: [
          {
            id: 'usr_1',
            email: 'advisor@cms-auto.test',
            nameEn: 'Service Advisor',
            nameAr: 'Service Advisor',
            roleCode: 'CR_OFFICER',
            roleName: 'CR Officer',
            branchId: 'branch_main',
            branchName: 'Main branch',
            isActive: true,
          },
        ],
        roles: [{ id: 'role_1', code: 'CR_OFFICER', nameEn: 'CR Officer', nameAr: 'CR Officer' }],
        branches: [{ id: 'branch_main', code: 'MAIN', nameEn: 'Main branch', nameAr: 'Main branch' }],
      },
      locale: 'en',
      toggleAction: async () => undefined,
    }),
  );

  assert.match(html, /Create user/);
  assert.match(html, /Service Advisor/);
  assert.match(html, /advisor@cms-auto\.test/);
  assert.match(html, /Deactivate/);
  assert.doesNotMatch(html, /disabled=""/);
});

test('admin users roles source is render-only and reset-safe', () => {
  const source = readFileSync('apps/web/src/components/admin-users-roles/index.tsx', 'utf8');
  const wrapper = readFileSync('apps/web/src/app/admin-users-roles.tsx', 'utf8');

  assert.match(source, /min-w-\[50rem\]/);
  assert.doesNotMatch(source, /fetch\(|localStorage|sessionStorage|document\.cookie/);
  assert.doesNotMatch(source, /resetToken|token|otp|hash|principal|audit|portal|DMS|\b\+?\d{10,}\b/i);
  assert.match(wrapper, /components\/admin-users-roles/);
});

test('admin categories severity SLA screen renders only for admin preview', async () => {
  const admin = renderToStaticMarkup(await StaffShellPage({ searchParams: Promise.resolve({ role: 'admin', session: 'signed-in' }) }));
  const staff = renderToStaticMarkup(await StaffShellPage({ searchParams: Promise.resolve({ role: 'staff', session: 'signed-in' }) }));

  assert.match(admin, /Categories, severities, and SLA policies/);
  assert.match(admin, /Category tree/);
  assert.match(admin, /Severity values/);
  assert.match(admin, /SLA policies/);
  assert.match(admin, /80% warning/);
  assert.match(admin, /2 hours/);
  assert.match(admin, /SLA deadlines are calculated and enforced by the backend\./);
  assert.doesNotMatch(staff, /Categories, severities, and SLA policies/);
});

test('admin categories severity SLA preview states render safely', async () => {
  const loading = renderToStaticMarkup(await StaffShellPage({ searchParams: Promise.resolve({ role: 'admin', admin: 'loading' }) }));
  const empty = renderToStaticMarkup(await StaffShellPage({ searchParams: Promise.resolve({ role: 'admin', admin: 'empty' }) }));
  const error = renderToStaticMarkup(await StaffShellPage({ searchParams: Promise.resolve({ role: 'admin', admin: 'error' }) }));
  const success = renderToStaticMarkup(await StaffShellPage({ searchParams: Promise.resolve({ role: 'admin', admin: 'success' }) }));
  const validation = renderToStaticMarkup(await StaffShellPage({ searchParams: Promise.resolve({ role: 'admin', admin: 'validation' }) }));
  const conflict = renderToStaticMarkup(await StaffShellPage({ searchParams: Promise.resolve({ role: 'admin', admin: 'conflict' }) }));

  assert.match(loading, /Loading category and SLA settings\./);
  assert.match(empty, /No category or SLA settings are configured yet\./);
  assert.match(error, /Admin settings could not be loaded\. Try again\./);
  assert.match(success, /Admin setting saved\./);
  assert.match(validation, /Review category hierarchy, severity value, and SLA duration fields\./);
  assert.match(conflict, /Record changed by someone else\. Reload before retrying\./);
});

test('Arabic admin categories severity SLA keeps RTL localized labels', async () => {
  const html = renderToStaticMarkup(await StaffShellPage({ searchParams: Promise.resolve({ locale: 'ar', role: 'admin', admin: 'validation' }) }));

  assert.match(html, /dir="rtl"/);
  assert.ok(html.includes(adminCategoriesSlaText.ar.title));
  assert.ok(html.includes(adminCategoriesSlaText.ar.sections.sla));
  assert.ok(html.includes(adminCategoriesSlaText.ar.states.validation));
});

test('admin categories route renders English and Arabic labels', async () => {
  const english = renderToStaticMarkup(await AdminCategoriesPage({ searchParams: Promise.resolve({ locale: 'en' }) }));
  const arabic = renderToStaticMarkup(await AdminCategoriesPage({ searchParams: Promise.resolve({ locale: 'ar' }) }));

  assert.match(english, /dir="ltr"/);
  assert.match(english, /Categories, severities, and SLA policies/);
  assert.match(english, /SLA policies/);
  assert.match(english, /SLA deadlines are calculated and enforced by the backend\./);
  assert.match(arabic, /dir="rtl"/);
  assert.ok(arabic.includes(adminCategoriesSlaText.ar.title));
  assert.ok(arabic.includes(adminCategoriesSlaText.ar.sections.sla));
});

test('admin categories route renders preview states safely', async () => {
  const error = renderToStaticMarkup(
    await AdminCategoriesPage({ searchParams: Promise.resolve({ locale: 'en', admin: 'error' }) }),
  );
  const validation = renderToStaticMarkup(
    await AdminCategoriesPage({ searchParams: Promise.resolve({ locale: 'en', admin: 'validation' }) }),
  );

  assert.match(error, /Admin settings could not be loaded\. Try again\./);
  assert.match(error, /role="alert"/);
  assert.match(validation, /Review category hierarchy, severity value, and SLA duration fields\./);
  assert.match(validation, /role="alert"/);
});

test('admin categories severity SLA source is render-only and does not calculate SLA truth', () => {
  const source = readFileSync('apps/web/src/components/admin-categories-sla/index.tsx', 'utf8');
  const wrapper = readFileSync('apps/web/src/app/admin-categories-sla.tsx', 'utf8');

  assert.match(source, /min-w-\[54rem\]/);
  assert.doesNotMatch(source, /fetch\(|localStorage|sessionStorage|document\.cookie|Date\.now|setInterval|deadlineAt|escalate|audit|principal|roleCode|portal|DMS|@|\b\+?\d{10,}\b/i);
  assert.match(wrapper, /components\/admin-categories-sla/);
});

test('admin notification templates screen renders only for admin preview', async () => {
  const admin = renderToStaticMarkup(await StaffShellPage({ searchParams: Promise.resolve({ role: 'admin', session: 'signed-in' }) }));
  const staff = renderToStaticMarkup(await StaffShellPage({ searchParams: Promise.resolve({ role: 'staff', session: 'signed-in' }) }));

  assert.match(admin, /Notification templates/);
  assert.match(admin, /Complaint created/);
  assert.match(admin, /SLA warning/);
  assert.match(admin, /Email, in-app/);
  assert.match(admin, /Arabic \+ English/);
  assert.match(admin, /Template preview/);
  assert.match(admin, /Placeholder tokens/);
  assert.match(admin, /\{\{referenceNumber\}\}/);
  assert.match(admin, /Activate/);
  assert.match(admin, /Deactivate/);
  assert.doesNotMatch(staff, /Notification templates/);
});

test('admin notification templates preview states render safely', async () => {
  const loading = renderToStaticMarkup(await StaffShellPage({ searchParams: Promise.resolve({ role: 'admin', admin: 'loading' }) }));
  const empty = renderToStaticMarkup(await StaffShellPage({ searchParams: Promise.resolve({ role: 'admin', admin: 'empty' }) }));
  const error = renderToStaticMarkup(await StaffShellPage({ searchParams: Promise.resolve({ role: 'admin', admin: 'error' }) }));
  const success = renderToStaticMarkup(await StaffShellPage({ searchParams: Promise.resolve({ role: 'admin', admin: 'success' }) }));
  const validation = renderToStaticMarkup(await StaffShellPage({ searchParams: Promise.resolve({ role: 'admin', admin: 'validation' }) }));
  const conflict = renderToStaticMarkup(await StaffShellPage({ searchParams: Promise.resolve({ role: 'admin', admin: 'conflict' }) }));

  assert.match(loading, /Loading notification templates\./);
  assert.match(empty, /No notification templates are configured yet\./);
  assert.match(error, /Notification templates could not be loaded\. Try again\./);
  assert.match(success, /Notification template saved\./);
  assert.match(validation, /Review bilingual content, channel, event trigger, and placeholders\./);
  assert.match(conflict, /Template changed by someone else\. Reload before retrying\./);
});

test('Arabic admin notification templates keeps RTL localized labels', async () => {
  const html = renderToStaticMarkup(await StaffShellPage({ searchParams: Promise.resolve({ locale: 'ar', role: 'admin', admin: 'validation' }) }));

  assert.match(html, /dir="rtl"/);
  assert.ok(html.includes(adminNotificationTemplatesText.ar.title));
  assert.ok(html.includes(adminNotificationTemplatesText.ar.previewTitle));
  assert.ok(html.includes(adminNotificationTemplatesText.ar.states.validation));
});

test('admin notification templates route renders English and Arabic labels', async () => {
  const english = renderToStaticMarkup(await AdminNotificationTemplatesPage({ searchParams: Promise.resolve({ locale: 'en' }) }));
  const arabic = renderToStaticMarkup(await AdminNotificationTemplatesPage({ searchParams: Promise.resolve({ locale: 'ar' }) }));

  assert.match(english, /dir="ltr"/);
  assert.match(english, /Notification templates/);
  assert.match(english, /Template preview/);
  assert.match(english, /\{\{referenceNumber\}\}/);
  assert.match(arabic, /dir="rtl"/);
  assert.ok(arabic.includes(adminNotificationTemplatesText.ar.title));
  assert.ok(arabic.includes(adminNotificationTemplatesText.ar.previewTitle));
});

test('admin notification templates route renders preview states safely', async () => {
  const error = renderToStaticMarkup(
    await AdminNotificationTemplatesPage({ searchParams: Promise.resolve({ locale: 'en', admin: 'error' }) }),
  );
  const conflict = renderToStaticMarkup(
    await AdminNotificationTemplatesPage({ searchParams: Promise.resolve({ locale: 'en', admin: 'conflict' }) }),
  );

  assert.match(error, /Notification templates could not be loaded\. Try again\./);
  assert.match(error, /role="alert"/);
  assert.match(conflict, /Template changed by someone else\. Reload before retrying\./);
  assert.match(conflict, /role="alert"/);
});

test('admin notification templates source is render-only and placeholder-safe', () => {
  const source = readFileSync('apps/web/src/components/admin-notification-templates/index.tsx', 'utf8');
  const wrapper = readFileSync('apps/web/src/app/admin-notification-templates.tsx', 'utf8');

  assert.match(source, /min-w-\[48rem\]/);
  assert.doesNotMatch(source, /fetch\(|localStorage|sessionStorage|document\.cookie|send[A-Z]|provider|credential|secret|apiKey|token|audit|deliveryLog|portal|DMS|https?:\/\/|@|\b\+?\d{10,}\b/i);
  assert.match(wrapper, /components\/admin-notification-templates/);
});

test('audit viewer renders only for admin preview with filters and export affordance', async () => {
  const admin = renderToStaticMarkup(await StaffShellPage({ searchParams: Promise.resolve({ role: 'admin', session: 'signed-in' }) }));
  const staff = renderToStaticMarkup(await StaffShellPage({ searchParams: Promise.resolve({ role: 'staff', session: 'signed-in' }) }));

  assert.match(admin, /Audit viewer/);
  assert.match(admin, /Actor/);
  assert.match(admin, /Action/);
  assert.match(admin, /Target/);
  assert.match(admin, /Correlation ID/);
  assert.match(admin, /Export results/);
  assert.match(admin, /CONFIG_UPDATED/);
  assert.match(admin, /corr-placeholder-001/);
  assert.match(admin, /Backend search owns redaction, limits, and authorization\./);
  assert.doesNotMatch(staff, /Audit viewer/);
});

test('audit viewer preview states render safely', async () => {
  const loading = renderToStaticMarkup(await StaffShellPage({ searchParams: Promise.resolve({ role: 'admin', admin: 'loading' }) }));
  const empty = renderToStaticMarkup(await StaffShellPage({ searchParams: Promise.resolve({ role: 'admin', admin: 'empty' }) }));
  const error = renderToStaticMarkup(await StaffShellPage({ searchParams: Promise.resolve({ role: 'admin', admin: 'error' }) }));
  const success = renderToStaticMarkup(await StaffShellPage({ searchParams: Promise.resolve({ role: 'admin', admin: 'success' }) }));
  const validation = renderToStaticMarkup(await StaffShellPage({ searchParams: Promise.resolve({ role: 'admin', admin: 'validation' }) }));
  const conflict = renderToStaticMarkup(await StaffShellPage({ searchParams: Promise.resolve({ role: 'admin', admin: 'conflict' }) }));

  assert.match(loading, /Loading audit entries\./);
  assert.match(empty, /No audit entries match these filters\./);
  assert.match(error, /Audit entries could not be loaded\. Try again\./);
  assert.match(success, /Audit export request prepared\./);
  assert.match(validation, /Review filter values and date range\./);
  assert.match(conflict, /Audit query changed\. Reload before exporting\./);
});

test('Arabic audit viewer keeps RTL localized labels', async () => {
  const html = renderToStaticMarkup(await StaffShellPage({ searchParams: Promise.resolve({ locale: 'ar', role: 'admin', admin: 'validation' }) }));

  assert.match(html, /dir="rtl"/);
  assert.ok(html.includes(auditViewerText.ar.title));
  assert.ok(html.includes(auditViewerText.ar.filters.export));
  assert.ok(html.includes(auditViewerText.ar.states.validation));
});

test('audit route renders English and Arabic audit labels', async () => {
  const english = renderToStaticMarkup(await AuditPage({ searchParams: Promise.resolve({ locale: 'en' }) }));
  const arabic = renderToStaticMarkup(await AuditPage({ searchParams: Promise.resolve({ locale: 'ar', admin: 'validation' }) }));

  assert.match(english, /dir="ltr"/);
  assert.match(english, /Audit viewer/);
  assert.match(english, /Export results/);
  assert.match(english, /Correlation ID/);
  assert.match(arabic, /dir="rtl"/);
  assert.ok(arabic.includes(auditViewerText.ar.title));
  assert.ok(arabic.includes(auditViewerText.ar.filters.export));
  assert.ok(arabic.includes(auditViewerText.ar.states.validation));
});

test('audit route renders preview states safely', async () => {
  const success = renderToStaticMarkup(await AuditPage({ searchParams: Promise.resolve({ locale: 'en', admin: 'success' }) }));
  const conflict = renderToStaticMarkup(await AuditPage({ searchParams: Promise.resolve({ locale: 'en', admin: 'conflict' }) }));

  assert.match(success, /Audit export request prepared\./);
  assert.match(success, /role="status"/);
  assert.match(conflict, /Audit query changed\. Reload before exporting\./);
  assert.match(conflict, /role="alert"/);
});

test('audit viewer source is render-only and uses safe placeholders', () => {
  const source = readFileSync('apps/web/src/components/audit-viewer/index.tsx', 'utf8');
  const wrapper = readFileSync('apps/web/src/app/audit-viewer.tsx', 'utf8');

  assert.match(source, /min-w-\[58rem\]/);
  assert.doesNotMatch(source, /fetch\(|localStorage|sessionStorage|document\.cookie|createObjectURL|Blob|download|password|otp|token|secret|provider|portal|DMS|@|\b\+?\d{10,}\b/i);
  assert.match(wrapper, /components\/audit-viewer/);
});

test('notification center renders for staff with unread read and scoped complaint affordances', async () => {
  const html = renderToStaticMarkup(await StaffShellPage({ searchParams: Promise.resolve({ role: 'staff', session: 'signed-in' }) }));

  assert.match(html, /Notifications/);
  assert.match(html, /Unread/);
  assert.match(html, /Read/);
  assert.match(html, /Workflow/);
  assert.match(html, /SLA/);
  assert.match(html, /CMP-SCOPED-001/);
  assert.match(html, /Open scoped complaint/);
  assert.match(html, /Mark read/);
  assert.match(html, /Complaint links stay scoped by the backend/);
});

test('notification center preview states render safely', async () => {
  const loading = renderToStaticMarkup(await StaffShellPage({ searchParams: Promise.resolve({ notification: 'loading' }) }));
  const empty = renderToStaticMarkup(await StaffShellPage({ searchParams: Promise.resolve({ notification: 'empty' }) }));
  const error = renderToStaticMarkup(await StaffShellPage({ searchParams: Promise.resolve({ notification: 'error' }) }));
  const success = renderToStaticMarkup(await StaffShellPage({ searchParams: Promise.resolve({ notification: 'success' }) }));
  const validation = renderToStaticMarkup(await StaffShellPage({ searchParams: Promise.resolve({ notification: 'validation' }) }));
  const conflict = renderToStaticMarkup(await StaffShellPage({ searchParams: Promise.resolve({ notification: 'conflict' }) }));

  assert.match(loading, /Loading notifications\./);
  assert.match(empty, /No notifications are available\./);
  assert.match(error, /Notifications could not be loaded\. Try again\./);
  assert.match(success, /Notification marked as read\./);
  assert.match(validation, /Notification action is not available\./);
  assert.match(conflict, /Notification changed by someone else\. Reload before retrying\./);
});

test('Arabic notification center keeps RTL localized labels', async () => {
  const html = renderToStaticMarkup(await StaffShellPage({ searchParams: Promise.resolve({ locale: 'ar', notification: 'validation' }) }));

  assert.match(html, /dir="rtl"/);
  assert.ok(html.includes(notificationCenterText.ar.title));
  assert.ok(html.includes(notificationCenterText.ar.labels.markRead));
  assert.ok(html.includes(notificationCenterText.ar.states.validation));
});

test('notification center source is render-only and scoped-link safe', () => {
  const source = readFileSync('apps/web/src/components/notification-center/index.tsx', 'utf8');

  assert.match(source, /xl:grid-cols-2/);
  assert.doesNotMatch(source, /[\w.-]+@[\w.-]+/);
  assert.doesNotMatch(source, /fetch\(|localStorage|sessionStorage|document\.cookie|router\.push|window\.location|branchScope|roleCode|password|otp|token|secret|provider|portal|DMS|\b\+?\d{10,}\b/i);
});

test('notifications route renders English notification center labels', async () => {
  const html = renderToStaticMarkup(
    await NotificationsPage({ searchParams: Promise.resolve({ locale: 'en' }) }),
  );

  assert.match(html, /Notifications/);
  assert.match(html, /Unread/);
  assert.match(html, /Read/);
  assert.match(html, /Open scoped complaint/);
  assert.match(html, /Complaint links stay scoped by the backend/);
});

test('notifications route renders fetched task notifications through the session cookie', async () => {
  const calls: Array<{ input: string | URL | Request; init?: RequestInit }> = [];
  const html = renderToStaticMarkup(
    await NotificationsPage({
      cookieHeader: 'cms_staff_session=raw-session',
      fetchImpl: async (input, init) => {
        calls.push({ input, init });
        return jsonResponse({
          items: [{
            id: 'notif_task',
            status: 'QUEUED',
            templateCode: 'task.nudge.internal',
            queuedAt: '2026-06-21T09:00:00.000Z',
            payload: { taskId: 'task_sent', title: 'Send finance update', status: 'WAITING' },
          }],
        });
      },
      searchParams: Promise.resolve({ locale: 'en' }),
    }),
  );

  const call = calls.find((entry) => String(entry.input).endsWith('/notifications'));
  assert.ok(call);
  assert.deepEqual(call.init?.headers, { Accept: 'application/json', cookie: 'cms_staff_session=raw-session' });
  assert.match(html, /Send finance update/);
  assert.match(html, /Task link/);
  assert.match(html, /task_sent/);
});

test('notifications route renders Arabic RTL labels', async () => {
  const html = renderToStaticMarkup(
    await NotificationsPage({ searchParams: Promise.resolve({ locale: 'ar', notification: 'validation' }) }),
  );

  assert.match(html, /dir="rtl"/);
  assert.ok(html.includes(notificationCenterText.ar.title));
  assert.ok(html.includes(notificationCenterText.ar.labels.markRead));
  assert.ok(html.includes(notificationCenterText.ar.states.validation));
});

test('notifications route renders loading empty error and conflict states', async () => {
  const loading = renderToStaticMarkup(
    await NotificationsPage({ searchParams: Promise.resolve({ notification: 'loading' }) }),
  );
  const empty = renderToStaticMarkup(
    await NotificationsPage({ searchParams: Promise.resolve({ notification: 'empty' }) }),
  );
  const error = renderToStaticMarkup(
    await NotificationsPage({ searchParams: Promise.resolve({ notification: 'error' }) }),
  );
  const conflict = renderToStaticMarkup(
    await NotificationsPage({ searchParams: Promise.resolve({ notification: 'conflict' }) }),
  );

  assert.match(loading, /Loading notifications\./);
  assert.match(loading, /role="status"/);
  assert.match(empty, /No notifications are available\./);
  assert.match(error, /Notifications could not be loaded\. Try again\./);
  assert.match(error, /role="alert"/);
  assert.match(conflict, /Notification changed by someone else\. Reload before retrying\./);
});

test('reports dashboard renders RPT-001 through RPT-017 for report-capable roles only', async () => {
  const management = renderToStaticMarkup(await StaffShellPage({ searchParams: Promise.resolve({ role: 'management', session: 'signed-in' }) }));
  const admin = renderToStaticMarkup(await StaffShellPage({ searchParams: Promise.resolve({ role: 'admin', session: 'signed-in' }) }));
  const staff = renderToStaticMarkup(await StaffShellPage({ searchParams: Promise.resolve({ role: 'staff', session: 'signed-in' }) }));

  assert.match(management, /Reports dashboard/);
  assert.match(admin, /Reports dashboard/);
  for (let index = 1; index <= 17; index += 1) {
    assert.match(management, new RegExp(`RPT-${String(index).padStart(3, '0')}`));
  }
  assert.match(management, /API pending/);
  assert.match(management, /Report data, metrics, filters, and exports remain backend-scoped\./);
  assert.doesNotMatch(staff, /Reports dashboard/);
});

test('reports dashboard preview states render safely', async () => {
  const ready = renderToStaticMarkup(await StaffShellPage({ searchParams: Promise.resolve({ role: 'management', reports: 'ready' }) }));
  const loading = renderToStaticMarkup(await StaffShellPage({ searchParams: Promise.resolve({ role: 'management', reports: 'loading' }) }));
  const empty = renderToStaticMarkup(await StaffShellPage({ searchParams: Promise.resolve({ role: 'management', reports: 'empty' }) }));
  const error = renderToStaticMarkup(await StaffShellPage({ searchParams: Promise.resolve({ role: 'management', reports: 'error' }) }));
  const success = renderToStaticMarkup(await StaffShellPage({ searchParams: Promise.resolve({ role: 'management', reports: 'success' }) }));
  const validation = renderToStaticMarkup(await StaffShellPage({ searchParams: Promise.resolve({ role: 'management', reports: 'validation' }) }));
  const denied = renderToStaticMarkup(await StaffShellPage({ searchParams: Promise.resolve({ role: 'management', reports: 'denied' }) }));
  const conflict = renderToStaticMarkup(await StaffShellPage({ searchParams: Promise.resolve({ role: 'management', reports: 'conflict' }) }));

  assert.match(ready, /Export controls are ready\./);
  assert.match(loading, /Loading report entries\./);
  assert.match(empty, /No report entries are configured yet\./);
  assert.match(error, /Reports dashboard could not be loaded\. Try again\./);
  assert.match(success, /Report entry selected\./);
  assert.match(validation, /Report filters are pending backend validation\./);
  assert.match(denied, /Export is unavailable for this report or role\./);
  assert.match(conflict, /Report catalog changed\. Reload before continuing\./);
});

test('reports dashboard renders export affordance without file generation', async () => {
  const html = renderToStaticMarkup(await StaffShellPage({ searchParams: Promise.resolve({ role: 'management', reports: 'ready' }) }));

  assert.match(html, /Report export/);
  assert.match(html, /CSV/);
  assert.match(html, /Excel/);
  assert.match(html, /href="\/reports\/export\?format=csv"/);
  assert.match(html, /href="\/reports\/export\?format=excel"/);
  assert.match(html, /Exports use backend configured row limits\./);
  assert.match(html, /Export data is RBAC-filtered with the same report scope\./);
  assert.match(html, /Successful exports are audit logged by the backend\./);
});

test('reports dashboard renders real scoped rows from the backend read', async () => {
  const calls: Array<{ input: string | URL | Request; init?: RequestInit }> = [];
  const fetchImpl: typeof fetch = async (input, init) => {
    calls.push({ input, init });
    const url = String(input);
    if (url.endsWith('/auth/me')) return jsonResponse({ user: principal({ roleCode: 'ADMIN', branchId: null }) });
    if (url.endsWith('/reports/dashboard')) {
      return jsonResponse({ summary: { openComplaints: 1, overdueComplaints: 0, slaWarningComplaints: 0, closedComplaints: 0, averageTatHours: 0 } });
    }
    if (url.endsWith('/complaints/form-options')) {
      return jsonResponse({
        branches: [{ id: 'branch_main', code: 'MAIN', nameEn: 'Main Branch', nameAr: 'الفرع الرئيسي' }],
        categories: [{ id: 'cat_engine', code: 'ENGINE', nameEn: 'Engine', nameAr: 'المحرك', parentId: null }],
        severities: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'],
      });
    }
    if (url.endsWith('/staff/assignable')) {
      return jsonResponse({
        staff: [{
          userId: 'usr_owner',
          displayName: 'Case Owner',
          displayNameAr: 'مسؤول الحالة',
          role: 'CR Manager',
          roleAr: 'مدير علاقات العملاء',
          branchLabel: 'Main Branch',
          branchLabelAr: 'الفرع الرئيسي',
        }],
      });
    }
    return jsonResponse({
      items: [{
        id: 'r1',
        referenceNumber: 'CMP-REAL-001',
        branchId: 'branch_main',
        categoryId: 'cat_engine',
        status: 'IN_PROGRESS',
        severity: 'HIGH',
        subject: 'Engine noise',
        ownerId: 'usr_owner',
        createdAt: '2026-06-19T00:00:00.000Z',
        updatedAt: '2026-06-19T01:00:00.000Z',
      }],
    });
  };
  const html = renderToStaticMarkup(
    await StaffShellPage({
      cookieHeader: 'cms_staff_session=raw-session',
      fetchImpl,
      searchParams: Promise.resolve({ role: 'staff', session: 'signed-in' }),
    }),
  );

  const reportsCall = calls.find((call) => String(call.input).endsWith('/reports'));
  assert.ok(reportsCall);
  assert.equal(String(reportsCall.input), 'http://localhost:3000/reports');
  assert.doesNotMatch(String(reportsCall.input), /role|actor|branchId/i);
  assert.deepEqual(reportsCall.init?.headers, {
    Accept: 'application/json',
    cookie: 'cms_staff_session=raw-session',
  });
  assert.match(html, /CMP-REAL-001 - Engine noise/);
  assert.match(html, /Unavailable \/ Unavailable/);
  assert.match(html, />Unavailable</);
  assert.doesNotMatch(html, />cat_engine<|branch_main \/ usr_owner/);
  assert.match(html, /IN_PROGRESS/);
  assert.doesNotMatch(html, /RPT-017/);
});

test('reports dashboard keeps catalog fallback when backend denies report rows', async () => {
  const fetchImpl: typeof fetch = async (input) => {
    if (String(input).endsWith('/auth/me')) return jsonResponse({ user: principal({ roleCode: 'ADMIN', branchId: null }) });
    if (String(input).endsWith('/reports/dashboard')) return jsonResponse({ summary: { openComplaints: 0, overdueComplaints: 0, slaWarningComplaints: 0, closedComplaints: 0, averageTatHours: 0 } });
    return jsonResponse({ error: { code: 'RBAC_FORBIDDEN' } }, 403);
  };
  const html = renderToStaticMarkup(
    await StaffShellPage({
      cookieHeader: 'cms_staff_session=raw-session',
      fetchImpl,
      searchParams: Promise.resolve({ role: 'management', session: 'signed-in' }),
    }),
  );

  assert.match(html, /RPT-017/);
  assert.doesNotMatch(html, /CMP-REAL-001/);
});

test('Arabic reports dashboard keeps RTL localized labels', async () => {
  const html = renderToStaticMarkup(await StaffShellPage({ searchParams: Promise.resolve({ locale: 'ar', role: 'management', reports: 'validation' }) }));

  assert.match(html, /dir="rtl"/);
  assert.ok(html.includes(reportsDashboardText.ar.title));
  assert.ok(html.includes(reportsDashboardText.ar.export.title));
  assert.ok(html.includes(reportsDashboardText.ar.badges.pending));
  assert.ok(html.includes(reportsDashboardText.ar.states.validation));
});

test('reports route renders English and Arabic report labels', async () => {
  const english = renderToStaticMarkup(await ReportsPage({ cookieHeader: '', searchParams: Promise.resolve({ locale: 'en' }) }));
  const arabic = renderToStaticMarkup(
    await ReportsPage({ cookieHeader: '', searchParams: Promise.resolve({ locale: 'ar', reports: 'validation' }) }),
  );

  assert.match(english, /dir="ltr"/);
  assert.match(english, /Reports dashboard/);
  assert.match(english, /Report export/);
  assert.match(english, /RPT-017/);
  assert.match(arabic, /dir="rtl"/);
  assert.ok(arabic.includes(reportsDashboardText.ar.title));
  assert.ok(arabic.includes(reportsDashboardText.ar.export.title));
  assert.ok(arabic.includes(reportsDashboardText.ar.states.validation));
});

test('reports route renders real scoped rows through the session cookie', async () => {
  const calls: Array<{ input: string | URL | Request; init?: RequestInit }> = [];
  const fetchImpl: typeof fetch = async (input, init) => {
    calls.push({ input, init });
    const url = String(input);
    if (url.endsWith('/reports/kpis')) {
      return jsonResponse({
        kpis: {
          onTimeCompletionPercent: 87.5,
          activeOverdueCount: 3,
          averageDelayHours: 1.75,
          customerPromiseKeptPercent: 92,
          reopenedCount: 2,
          escalationCount: 4,
          averageFirstResponseHours: 0.5,
          averageResolutionHours: 12.25,
        },
      });
    }
    if (url.endsWith('/complaints/form-options')) {
      return jsonResponse({
        branches: [{ id: 'branch_report', code: 'REPORT', nameEn: 'Reports Branch', nameAr: 'فرع التقارير' }],
        categories: [{ id: 'cat_report', code: 'REPORT', nameEn: 'Reports Category', nameAr: 'تصنيف التقارير', parentId: null }],
        severities: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'],
      });
    }
    if (url.endsWith('/staff/assignable')) {
      return jsonResponse({
        staff: [{
          userId: 'usr_report',
          displayName: 'Reports Owner',
          displayNameAr: 'مسؤول التقارير',
          role: 'CR Manager',
          roleAr: 'مدير علاقات العملاء',
          branchLabel: 'Reports Branch',
          branchLabelAr: 'فرع التقارير',
        }],
      });
    }
    return jsonResponse({
      items: [{
        id: 'rpt_route_1',
        referenceNumber: 'CMP-RPT-ROUTE-001',
        branchId: 'branch_report',
        categoryId: 'cat_report',
        status: 'IN_PROGRESS',
        severity: 'HIGH',
        subject: 'Route report row',
        ownerId: 'usr_report',
        createdAt: '2026-06-20T00:00:00.000Z',
        updatedAt: '2026-06-20T10:00:00.000Z',
      }],
    });
  };
  const html = renderToStaticMarkup(
    await ReportsPage({
      cookieHeader: 'cms_staff_session=raw-session',
      fetchImpl,
      searchParams: Promise.resolve({ locale: 'en', branchId: 'branch_report', categoryId: 'cat_report', ownerId: 'usr_report' }),
    }),
  );

  const reportsCall = calls.find((call) => String(call.input).startsWith('http://localhost:3000/reports?'));
  const kpisCall = calls.find((call) => String(call.input).endsWith('/reports/kpis'));
  const optionsCall = calls.find((call) => String(call.input).endsWith('/complaints/form-options'));
  const staffCall = calls.find((call) => String(call.input).endsWith('/staff/assignable'));
  assert.ok(reportsCall);
  assert.ok(kpisCall);
  assert.ok(optionsCall);
  assert.ok(staffCall);
  assert.deepEqual(reportsCall.init?.headers, { Accept: 'application/json', cookie: 'cms_staff_session=raw-session' });
  assert.deepEqual(kpisCall.init?.headers, { Accept: 'application/json', cookie: 'cms_staff_session=raw-session' });
  assert.deepEqual(optionsCall.init?.headers, { Accept: 'application/json', cookie: 'cms_staff_session=raw-session' });
  assert.deepEqual(staffCall.init?.headers, { Accept: 'application/json', cookie: 'cms_staff_session=raw-session' });
  assert.match(String(reportsCall.input), /branchId=branch_report/);
  assert.match(String(reportsCall.input), /categoryId=cat_report/);
  assert.match(String(reportsCall.input), /ownerId=usr_report/);
  assert.doesNotMatch(String(reportsCall.input), /role|actor|token|credential/i);
  assert.doesNotMatch(String(kpisCall.input), /role|actor|branchId|owner|token|credential/i);
  assert.match(html, /CMP-RPT-ROUTE-001 - Route report row/);
  assert.match(html, /Reports Branch \/ Reports Owner - CR Manager/);
  assert.match(html, /Reports Category/);
  assert.match(html, /Owner filter: Reports Owner - CR Manager - Reports Branch/);
  assert.doesNotMatch(html, /name="ownerLabel"/);
  assert.match(html, /href="\/reports\/export\?format=csv&amp;branchId=branch_report&amp;categoryId=cat_report&amp;ownerId=usr_report"/);
  assert.doesNotMatch(html, /branch_report \/ usr_report|>cat_report</);
  assert.match(html, /IN_PROGRESS/);
  assert.match(html, /Accountability KPIs/);
  assert.match(html, /87\.5%/);
  assert.match(html, /Active overdue/);
  assert.match(html, /3/);
  assert.match(html, /0\.5 h/);
  assert.match(html, /12\.25 h/);
  assert.doesNotMatch(html, /RPT-017/);
});

test('reports route handles KPI denial without exposing privileged values', async () => {
  const calls: Array<{ input: string | URL | Request; init?: RequestInit }> = [];
  const fetchImpl: typeof fetch = async (input, init) => {
    calls.push({ input, init });
    if (String(input).endsWith('/reports/kpis')) return jsonResponse({ error: { code: 'RBAC_FORBIDDEN' } }, 403);
    return jsonResponse({ items: [] });
  };
  const html = renderToStaticMarkup(
    await ReportsPage({
      cookieHeader: 'cms_staff_session=raw-session',
      fetchImpl,
      searchParams: Promise.resolve({ locale: 'en' }),
    }),
  );

  const kpisCall = calls.find((call) => String(call.input).endsWith('/reports/kpis'));
  assert.ok(kpisCall);
  assert.deepEqual(kpisCall.init?.headers, { Accept: 'application/json', cookie: 'cms_staff_session=raw-session' });
  assert.doesNotMatch(String(kpisCall.input), /role|actor|branchId|owner|token|credential/i);
  assert.match(html, /KPI values are unavailable for this session or role\./);
  assert.doesNotMatch(html, /87\.5%|12\.25 h/);
});

test('reports dashboard source is render-only and placeholder-safe', () => {
  const source = readFileSync('apps/web/src/components/reports-dashboard/index.tsx', 'utf8');
  const i18n = readFileSync('apps/web/src/i18n/staff-reports-dashboard.ts', 'utf8');
  const wrapper = readFileSync('apps/web/src/app/reports-dashboard.tsx', 'utf8');

  assert.match(source, /reportCatalogText/);
  assert.match(i18n, /RPT-017/);
  assert.match(source, /min-w-\[56rem\]/);
  assert.doesNotMatch(source, /fetch\(|localStorage|sessionStorage|document\.cookie|Chart|canvas|createObjectURL|Blob|download|branchScope|roleCode|customerPhone|password|otp|token|secret|provider|portal|DMS-[A-Z0-9]+|@|\b\+?\d{10,}\b/i);
  assert.match(wrapper, /components\/reports-dashboard/);
});

test('customer vehicle lookup renders search fields and manual fallback', async () => {
  const html = renderToStaticMarkup(await StaffShellPage({ searchParams: Promise.resolve({ locale: 'en' }) }));

  assert.match(html, /Customer and vehicle lookup/);
  assert.match(html, /Phone/);
  assert.match(html, /Customer code/);
  assert.match(html, /Customer name/);
  assert.match(html, /VIN/);
  assert.match(html, /Plate number/);
  assert.match(html, /Manual fallback/);
  assert.match(html, /Continue manually/);
});

test('customer vehicle lookup sample result uses safe source badges only', async () => {
  const html = renderToStaticMarkup(await StaffShellPage({ searchParams: Promise.resolve({ locale: 'en' }) }));

  assert.match(html, /Local source/);
  assert.match(html, /DMS source/);
  assert.match(html, /Matched customer placeholder/);
  assert.match(html, /Vehicle profile placeholder/);
  assert.doesNotMatch(html, /@/);
  assert.doesNotMatch(html, /\b\+?\d{10,}\b/);
  assert.doesNotMatch(html, /DMS-[A-Z0-9]+/);
});

test('Arabic customer vehicle lookup keeps RTL localized labels', async () => {
  const html = renderToStaticMarkup(await StaffShellPage({ searchParams: Promise.resolve({ locale: 'ar' }) }));

  assert.match(html, /dir="rtl"/);
  assert.ok(html.includes(staffShellText.ar.lookup.title));
  assert.ok(html.includes(staffShellText.ar.lookup.fields.customerCode));
  assert.ok(html.includes(staffShellText.ar.lookup.manualTitle));
});

test('customer vehicle lookup preview states render loading no-match and error messages', async () => {
  const loading = renderToStaticMarkup(await StaffShellPage({ searchParams: Promise.resolve({ lookup: 'loading' }) }));
  const none = renderToStaticMarkup(await StaffShellPage({ searchParams: Promise.resolve({ lookup: 'none' }) }));
  const error = renderToStaticMarkup(await StaffShellPage({ searchParams: Promise.resolve({ lookup: 'error' }) }));

  assert.match(loading, /Searching customer and vehicle records\./);
  assert.match(none, /No match found\. Continue with manual entry\./);
  assert.match(error, /Lookup could not be completed\. Continue manually or try again\./);
  assert.match(error, /role="alert"/);
});

test('complaint new route renders English customer vehicle lookup panel', async () => {
  const html = renderToStaticMarkup(
    await NewComplaintPage({ searchParams: Promise.resolve({ locale: 'en' }) }),
  );

  assert.match(html, /Customer and vehicle lookup/);
  assert.match(html, /Phone/);
  assert.match(html, /Customer code/);
  assert.match(html, /Customer name/);
  assert.match(html, /VIN/);
  assert.match(html, /Plate number/);
  assert.match(html, /Local source/);
  assert.match(html, /DMS source/);
  assert.match(html, /Manual fallback/);
  assert.match(html, /Continue manually/);
});

test('complaint new route keeps Arabic RTL lookup labels', async () => {
  const html = renderToStaticMarkup(
    await NewComplaintPage({ searchParams: Promise.resolve({ locale: 'ar', lookup: 'none' }) }),
  );

  assert.match(html, /dir="rtl"/);
  assert.ok(html.includes(staffShellText.ar.lookup.title));
  assert.ok(html.includes(staffShellText.ar.lookup.fields.plate));
  assert.ok(html.includes(staffShellText.ar.lookup.states.none));
});

test('complaint new route renders lookup loading and error roles', async () => {
  const loading = renderToStaticMarkup(
    await NewComplaintPage({ searchParams: Promise.resolve({ lookup: 'loading' }) }),
  );
  const error = renderToStaticMarkup(
    await NewComplaintPage({ searchParams: Promise.resolve({ lookup: 'error' }) }),
  );

  assert.match(loading, /Searching customer and vehicle records\./);
  assert.match(loading, /role="status"/);
  assert.match(error, /Lookup could not be completed\. Continue manually or try again\./);
  assert.match(error, /role="alert"/);
});

test('customer vehicle lookup source does not use APIs or browser storage', () => {
  const source = readFileSync('apps/web/src/components/customer-vehicle-lookup/index.tsx', 'utf8');
  const wrapper = readFileSync('apps/web/src/app/customer-vehicle-lookup.tsx', 'utf8');

  assert.doesNotMatch(source, /fetch\(|localStorage|sessionStorage|document\.cookie/);
  assert.doesNotMatch(source, /roleCode|principal|branchScope|actorId|ownerId|workflow|password|otp|token|secret|provider/i);
  assert.match(wrapper, /components\/customer-vehicle-lookup/);
});

test('complaint create form renders required complaint fields', async () => {
  const html = renderToStaticMarkup(await StaffShellPage({ searchParams: Promise.resolve({ locale: 'en' }) }));

  assert.match(html, /Create complaint/);
  assert.match(html, /Customer name/);
  assert.match(html, /Customer phone/);
  assert.match(html, /Customer number/);
  assert.match(html, /Category/);
  assert.match(html, /Subcategory/);
  assert.match(html, /Severity/);
  assert.match(html, /Branch/);
  assert.match(html, /Incident date/);
  assert.match(html, /Subject/);
  assert.match(html, /Description/);
  assert.match(html, /Vehicle-related complaint/);
  assert.match(html, /Vehicle VIN/);
  assert.match(html, /Submit complaint/);
});

test('complaint create form renders localized field validation messages', async () => {
  const html = renderToStaticMarkup(
    await StaffShellPage({ searchParams: Promise.resolve({ locale: 'en', create: 'validation' }) }),
  );

  assert.match(html, /This field is required\./);
  assert.match(html, /VIN is required when the complaint is vehicle-related\./);
});

test('complaint create form preserves visible input values in success and error states', async () => {
  const success = renderToStaticMarkup(
    await StaffShellPage({ searchParams: Promise.resolve({ locale: 'en', create: 'success' }) }),
  );
  const error = renderToStaticMarkup(
    await StaffShellPage({ searchParams: Promise.resolve({ locale: 'en', create: 'error' }) }),
  );

  assert.match(success, /Complaint created/);
  assert.match(success, /Reference: CMP-2026-001/);
  assert.match(success, /Status: SUBMITTED/);
  assert.match(success, /Service concern/);
  assert.match(error, /Complaint could not be submitted\. Review the details and try again\./);
  assert.match(error, /Service concern/);
  assert.match(error, /role="alert"/);
});

test('complaint create form renders loading and network failure states', async () => {
  const loading = renderToStaticMarkup(await StaffShellPage({ searchParams: Promise.resolve({ locale: 'en', create: 'loading' }) }));
  const network = renderToStaticMarkup(await StaffShellPage({ searchParams: Promise.resolve({ locale: 'en', create: 'network' }) }));

  assert.match(loading, /Submitting complaint\./);
  assert.match(loading, /disabled=""/);
  assert.match(network, /Unable to reach server\. Try again\./);
  assert.match(network, /Service concern/);
  assert.match(network, /role="alert"/);
});

test('Arabic complaint create form keeps RTL localized labels', async () => {
  const html = renderToStaticMarkup(
    await StaffShellPage({ searchParams: Promise.resolve({ locale: 'ar', create: 'validation' }) }),
  );

  assert.match(html, /dir="rtl"/);
  assert.ok(html.includes(staffShellText.ar.createForm.title));
  assert.ok(html.includes(staffShellText.ar.createForm.fields.category));
  assert.ok(html.includes(complaintCreateText.ar.fields.customerName));
  assert.ok(html.includes(staffShellText.ar.createForm.validation.required));
});

test('complaint new route renders lookup and complaint create form together', async () => {
  const html = renderToStaticMarkup(
    await NewComplaintPage({ searchParams: Promise.resolve({ locale: 'en', create: 'validation' }) }),
  );

  assert.match(html, /Customer and vehicle lookup/);
  assert.match(html, /Create complaint/);
  assert.match(html, /Customer name/);
  assert.match(html, /Customer phone/);
  assert.match(html, /Customer number/);
  assert.match(html, /Category/);
  assert.match(html, /Subcategory/);
  assert.match(html, /Severity/);
  assert.match(html, /Branch/);
  assert.match(html, /Incident date/);
  assert.match(html, /Subject/);
  assert.match(html, /Description/);
  assert.match(html, /Vehicle-related complaint/);
  assert.match(html, /Vehicle VIN/);
  assert.match(html, /This field is required\./);
});

test('complaint new route renders real branch category and severity options from the backend', async () => {
  const fetchImpl: typeof fetch = async (input, init) => {
    assert.equal(String(input), 'http://localhost:3000/complaints/form-options');
    assert.deepEqual(init?.headers, { Accept: 'application/json', cookie: 'cms_staff_session=raw-session' });
    return jsonResponse({
      branches: [{ id: 'branch_main', code: 'MAIN', nameEn: 'Main Branch', nameAr: 'الفرع الرئيسي' }],
      categories: [{ id: 'cat_engine', code: 'ENGINE', nameEn: 'Engine & Mechanical', nameAr: 'المحرك', parentId: null }],
      severities: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'],
    });
  };
  const html = renderToStaticMarkup(
    await NewComplaintPage({
      cookieHeader: 'cms_staff_session=raw-session',
      fetchImpl,
      searchParams: Promise.resolve({ locale: 'en' }),
    }),
  );

  assert.match(html, /Main Branch/);
  assert.match(html, /Engine &amp; Mechanical/);
  assert.match(html, /CRITICAL/);
  assert.match(html, /LOW/);
  assert.doesNotMatch(html, /Sample option/);
});

test('complaint new route keeps Arabic RTL complaint create labels', async () => {
  const html = renderToStaticMarkup(
    await NewComplaintPage({ searchParams: Promise.resolve({ locale: 'ar', create: 'validation' }) }),
  );

  assert.match(html, /dir="rtl"/);
  assert.ok(html.includes(staffShellText.ar.createForm.title));
  assert.ok(html.includes(complaintCreateText.ar.fields.customerName));
  assert.ok(html.includes(staffShellText.ar.createForm.validation.required));
});

test('complaint new route renders create success loading and network states', async () => {
  const success = renderToStaticMarkup(
    await NewComplaintPage({ searchParams: Promise.resolve({ locale: 'en', create: 'success' }) }),
  );
  const loading = renderToStaticMarkup(
    await NewComplaintPage({ searchParams: Promise.resolve({ locale: 'en', create: 'loading' }) }),
  );
  const network = renderToStaticMarkup(
    await NewComplaintPage({ searchParams: Promise.resolve({ locale: 'en', create: 'network' }) }),
  );

  assert.match(success, /Complaint created/);
  assert.match(success, /role="status"/);
  assert.match(loading, /Submitting complaint\./);
  assert.match(loading, /role="status"/);
  assert.match(network, /Unable to reach server\. Try again\./);
  assert.match(network, /role="alert"/);
});

test('complaint create form builds the backend request without client authority fields', () => {
  const formData = new FormData();
  formData.set('customerName', ' Faisal Al-Otaibi ');
  formData.set('customerPhone', '+966500000001');
  formData.set('customerNumber', '');
  formData.set('categoryId', 'cat_parent');
  formData.set('subcategoryId', 'cat_engine');
  formData.set('description', ' Engine makes a knocking noise. ');
  formData.set('incidentAt', '2026-06-19');
  formData.set('subject', ' Engine noise ');
  formData.set('severity', 'HIGH');
  formData.set('branchId', 'branch_main');
  formData.set('vehicleRelated', 'on');
  formData.set('vehicleVin', 'SEEDDEMO00001');

  const submission = buildStaffComplaintCreateSubmission(formData);
  const body = submission.complaint as Record<string, unknown>;

  assert.equal(submission.branchId, 'branch_main');
  assert.deepEqual(submission.complaint, {
    customerName: 'Faisal Al-Otaibi',
    customerPhone: '+966500000001',
    customerNumber: null,
    categoryId: 'cat_parent',
    subcategoryId: 'cat_engine',
    description: 'Engine makes a knocking noise.',
    incidentAt: '2026-06-19T00:00:00.000Z',
    subject: 'Engine noise',
    severity: 'HIGH',
    vehicleRelated: true,
    vehicleVin: 'SEEDDEMO00001',
    vehicleId: null,
  });
  assert.equal('role' in body, false);
  assert.equal('actorId' in body, false);
  assert.equal('workflow' in body, false);
  assert.equal('status' in body, false);
  assert.equal('branchId' in body, false);
  assert.equal('token' in body, false);
  assert.equal('credentials' in body, false);
});

test('complaint create form source submits only through the staff write helper', () => {
  const source = readFileSync('apps/web/src/components/complaint-create-form/index.tsx', 'utf8');
  const wrapper = readFileSync('apps/web/src/app/complaint-create-form.tsx', 'utf8');

  assert.match(source, /createStaffComplaint/);
  assert.doesNotMatch(source, /fetch\(|localStorage|sessionStorage|document\.cookie/);
  assert.doesNotMatch(source, /roleId|actorId|workflow|ownerId|session|token|credentials/);
  assert.match(wrapper, /components\/complaint-create-form/);
});

test('attachment panel renders upload controls and file rules', async () => {
  const html = renderToStaticMarkup(await StaffShellPage({ searchParams: Promise.resolve({ locale: 'en' }) }));

  assert.match(html, /Attachments/);
  assert.match(html, /type="file"/);
  assert.match(html, /PDF, PNG, or JPG only/);
  assert.match(html, /Maximum size follows the backend policy/);
  assert.match(html, /Do not upload credentials or secrets/);
});

test('attachment panel renders scan status states', async () => {
  const pending = renderToStaticMarkup(
    await StaffShellPage({ searchParams: Promise.resolve({ attachment: 'pending' }) }),
  );
  const clean = renderToStaticMarkup(await StaffShellPage({ searchParams: Promise.resolve({ attachment: 'clean' }) }));
  const rejected = renderToStaticMarkup(
    await StaffShellPage({ searchParams: Promise.resolve({ attachment: 'rejected' }) }),
  );

  assert.match(pending, /Scan pending/);
  assert.match(clean, /Scan clean/);
  assert.match(rejected, /Scan rejected/);
});

test('attachment panel renders loading empty and error states', async () => {
  const loading = renderToStaticMarkup(
    await StaffShellPage({ searchParams: Promise.resolve({ attachment: 'loading' }) }),
  );
  const empty = renderToStaticMarkup(await StaffShellPage({ searchParams: Promise.resolve({ attachment: 'empty' }) }));
  const error = renderToStaticMarkup(await StaffShellPage({ searchParams: Promise.resolve({ attachment: 'error' }) }));

  assert.match(loading, /Preparing attachment panel\./);
  assert.match(empty, /No attachment selected yet\./);
  assert.match(error, /Attachment panel could not be prepared\./);
  assert.match(error, /role="alert"/);
});

test('Arabic attachment panel keeps RTL localized labels', async () => {
  const html = renderToStaticMarkup(
    await StaffShellPage({ searchParams: Promise.resolve({ locale: 'ar', attachment: 'clean' }) }),
  );

  assert.match(html, /dir="rtl"/);
  assert.ok(html.includes(attachmentText.ar.title));
  assert.ok(html.includes(attachmentText.ar.fileRules[0]));
  assert.ok(html.includes(attachmentText.ar.scan.clean));
});

test('complaint new route renders attachment panel and states', async () => {
  const base = renderToStaticMarkup(
    await NewComplaintPage({ searchParams: Promise.resolve({ locale: 'en', attachment: 'clean' }) }),
  );
  const loading = renderToStaticMarkup(
    await NewComplaintPage({ searchParams: Promise.resolve({ locale: 'en', attachment: 'loading' }) }),
  );
  const error = renderToStaticMarkup(
    await NewComplaintPage({ searchParams: Promise.resolve({ locale: 'en', attachment: 'error' }) }),
  );

  assert.match(base, /Customer and vehicle lookup/);
  assert.match(base, /Create complaint/);
  assert.match(base, /Attachments/);
  assert.match(base, /type="file"/);
  assert.match(base, /Scan clean/);
  assert.match(loading, /Preparing attachment panel\./);
  assert.match(loading, /role="status"/);
  assert.match(error, /Attachment panel could not be prepared\./);
  assert.match(error, /role="alert"/);
});

test('complaint new route keeps Arabic RTL attachment labels', async () => {
  const html = renderToStaticMarkup(
    await NewComplaintPage({ searchParams: Promise.resolve({ locale: 'ar', attachment: 'rejected' }) }),
  );

  assert.match(html, /dir="rtl"/);
  assert.ok(html.includes(attachmentText.ar.title));
  assert.ok(html.includes(attachmentText.ar.scan.rejected));
  assert.ok(html.includes(confirmationText.ar.attachmentReject.title));
});

test('attachment panel source does not upload read or expose file URLs', () => {
  const source = readFileSync('apps/web/src/components/attachment-upload-panel/index.tsx', 'utf8');
  const wrapper = readFileSync('apps/web/src/app/attachment-upload-panel.tsx', 'utf8');

  assert.doesNotMatch(source, /fetch\(|FileReader|createObjectURL|localStorage|sessionStorage|document\.cookie|https?:\/\//);
  assert.doesNotMatch(source, /roleCode|principal|branchScope|actorId|ownerId|workflow|password|otp|token|secret|provider/i);
  assert.match(wrapper, /components\/attachment-upload-panel/);
});

// ---- (staff)/complaints route: golden screen ----

test('work queue component source has no hardcoded data no PreviewState and no private paths', () => {
  const source = readFileSync('apps/web/src/components/work-queue/index.tsx', 'utf8');

  assert.doesNotMatch(source, /CMP-2026-/);
  assert.doesNotMatch(source, /[\w.-]+@[\w.-]+/);
  assert.doesNotMatch(source, /\b\+?\d{10,}\b/);
  assert.doesNotMatch(source, /VIN|audit|internal comment|portal|document\.cookie|localStorage|sessionStorage|fetch\(/i);
  assert.doesNotMatch(source, /QueuePreviewState|PreviewState/);
});

test('complaints route renders English work queue filters and pagination', async () => {
  const html = renderToStaticMarkup(
    await ComplaintsPage({ cookieHeader: '', searchParams: Promise.resolve({ locale: 'en' }) }),
  );

  assert.match(html, /Cases/);
  assert.match(html, /Branch-scoped cases/);
  assert.match(html, /Status/);
  assert.match(html, /Severity/);
  assert.match(html, /SLA state/);
  assert.match(html, /Search/);
  assert.match(html, /Page 1 of 1/);
  assert.match(html, /Previous/);
  assert.match(html, /Next/);
});

test('complaints route renders Arabic RTL work queue labels', async () => {
  const html = renderToStaticMarkup(
    await ComplaintsPage({ cookieHeader: '', searchParams: Promise.resolve({ locale: 'ar' }) }),
  );

  assert.ok(html.includes(staffShellText.ar.workQueue.title));
  assert.ok(html.includes(staffShellText.ar.workQueue.filters.severity));
  assert.ok(html.includes(staffShellText.ar.workQueue.pagination.page));
});

test('complaints route renders colored severity and status badges for real rows', async () => {
  const fetchImpl: typeof fetch = async (input) => {
    if (String(input).endsWith('/complaints')) {
      return jsonResponse({
        items: [{
          id: 'cmp_badge_1',
          referenceNumber: 'CMP-BADGE-001',
          status: 'IN_PROGRESS',
          severity: 'HIGH',
          subject: 'Engine noise badge test',
          branchId: 'branch_main',
          ownerId: null,
          createdAt: '2026-06-20T00:00:00.000Z',
          updatedAt: '2026-06-20T00:00:00.000Z',
        }],
      });
    }
    return jsonResponse({});
  };
  const html = renderToStaticMarkup(
    await ComplaintsPage({
      cookieHeader: 'cms_staff_session=raw-session',
      fetchImpl,
      searchParams: Promise.resolve({ locale: 'en' }),
    }),
  );

  assert.match(html, /CMP-BADGE-001/);
  assert.match(html, /Engine noise badge test/);
  assert.match(html, /bg-status-error/);
  assert.match(html, /bg-brand/);
  assert.match(html, /Unassigned/);
  assert.match(html, /branch_main/);
  assert.match(html, /2026-06-20/);
  assert.match(html, /Open case/);
  assert.doesNotMatch(html, /QueuePreviewState/);
});

test('complaints route renders empty state when backend returns no items', async () => {
  const fetchImpl: typeof fetch = async (input) => {
    if (String(input).endsWith('/complaints')) return jsonResponse({ items: [] });
    return jsonResponse({});
  };
  const html = renderToStaticMarkup(
    await ComplaintsPage({
      cookieHeader: 'cms_staff_session=raw-session',
      fetchImpl,
      searchParams: Promise.resolve({ locale: 'en' }),
    }),
  );

  assert.match(html, /No cases match the current filters\./);
  assert.match(html, /role="status"/);
  assert.doesNotMatch(html, /CMP-BADGE-001/);
});

test('complaints route renders error state when backend denies queue access', async () => {
  const fetchImpl: typeof fetch = async () => new Response('', { status: 403 });
  const html = renderToStaticMarkup(
    await ComplaintsPage({
      cookieHeader: 'cms_staff_session=raw-session',
      fetchImpl,
      searchParams: Promise.resolve({ locale: 'en' }),
    }),
  );

  assert.match(html, /Cases could not be loaded\. Try again\./);
  assert.match(html, /role="alert"/);
});

test('complaints route renders real rows through the session cookie', async () => {
  const calls: Array<{ input: string | URL | Request; init?: RequestInit }> = [];
  const fetchImpl: typeof fetch = async (input, init) => {
    calls.push({ input, init });
    if (String(input).endsWith('/complaints')) {
      return jsonResponse({
        items: [{
          id: 'cmp_route_1',
          referenceNumber: 'CMP-ROUTE-001',
          status: 'SUBMITTED',
          severity: 'MEDIUM',
          subject: 'Route test complaint',
          branchId: 'branch_route',
          branchName: 'Route Branch',
          ownerId: 'usr_route',
          ownerName: 'Route Owner',
          createdAt: '2026-06-20T00:00:00.000Z',
          updatedAt: '2026-06-20T10:00:00.000Z',
        }],
      });
    }
    return jsonResponse({});
  };
  const html = renderToStaticMarkup(
    await ComplaintsPage({
      cookieHeader: 'cms_staff_session=raw-session',
      fetchImpl,
      searchParams: Promise.resolve({ locale: 'en' }),
    }),
  );

  const queueCall = calls.find((c) => String(c.input).endsWith('/complaints'));
  assert.ok(queueCall);
  assert.deepEqual(queueCall.init?.headers, { Accept: 'application/json', cookie: 'cms_staff_session=raw-session' });
  assert.doesNotMatch(String(queueCall.input), /role|actor|branchId/i);
  assert.match(html, /CMP-ROUTE-001/);
  assert.match(html, /Route test complaint/);
  assert.match(html, /SUBMITTED/);
  assert.match(html, /MEDIUM/);
  assert.match(html, /Route Owner/);
  assert.match(html, /Route Branch/);
  assert.doesNotMatch(html, /usr_route/);
  assert.doesNotMatch(html, /branch_route/);
  assert.match(html, /2026-06-20/);
  assert.match(html, /bg-status-warning/);
});

// ---- (staff)/tasks/today route ----

test('employee today route renders real task buckets through the session cookie', async () => {
  const calls: Array<{ input: string | URL | Request; init?: RequestInit }> = [];
  const fetchImpl: typeof fetch = async (input, init) => {
    calls.push({ input, init });
    if (String(input).endsWith('/tasks/today')) {
      return jsonResponse({
        completed: [taskFixture({ id: 'task_done', title: 'Customer call completed', status: 'DONE' })],
        dueToday: [taskFixture({ id: 'task_due', title: 'Prepare delivery checklist' })],
        overdue: [taskFixture({ id: 'task_late', title: 'Recover missed handover', dueAt: '2026-06-19T09:00:00.000Z' })],
        overduePromises: [taskFixture({
          id: 'task_promise',
          title: 'Call customer with finance answer',
          isCustomerPromise: true,
          links: [{ entityType: 'CASE', entityId: 'case_finance_1' }],
        })],
        assignedToMe: [taskFixture({ id: 'task_assigned', title: 'Confirm registration papers' })],
        waitingOnMe: [taskFixture({
          id: 'task_waiting',
          title: 'Approve discount exception',
          nextAction: { what: 'Approve exception', whoId: 'usr_staff', when: '2026-06-20T15:00:00.000Z' },
        })],
      });
    }
    if (String(input).endsWith('/staff/assignable')) {
      return jsonResponse({
        staff: [{
          userId: 'usr_layla',
          displayName: 'Layla Al-Farsi',
          displayNameAr: 'ليلى الفارسي',
          role: 'CR Manager',
          roleAr: 'مديرة علاقات العملاء',
          branchLabel: 'Main Branch',
          branchLabelAr: 'الفرع الرئيسي',
        }],
      });
    }
    if (String(input).includes('/tasks/related-records')) {
      const type = new URL(String(input)).searchParams.get('type');
      return jsonResponse({
        records: type === 'CUSTOMER'
          ? [{ recordType: 'CUSTOMER', recordId: 'customer_noor_1', label: 'Noor Customer', labelAr: 'عميل نور', context: '0501234567 - Main Branch', contextAr: '0501234567 - الفرع الرئيسي' }]
          : [],
      });
    }
    return jsonResponse({});
  };
  const html = renderToStaticMarkup(
    await EmployeeTodayPage({
      cookieHeader: 'cms_staff_session=raw-session',
      fetchImpl,
      searchParams: Promise.resolve({ locale: 'en' }),
    }),
  );

  const todayCall = calls.find((call) => String(call.input).endsWith('/tasks/today'));
  const staffCall = calls.find((call) => String(call.input).endsWith('/staff/assignable'));
  const relatedCalls = calls.filter((call) => String(call.input).includes('/tasks/related-records'));
  assert.ok(todayCall);
  assert.ok(staffCall);
  assert.equal(relatedCalls.length, 4);
  assert.deepEqual(todayCall.init?.headers, { Accept: 'application/json', cookie: 'cms_staff_session=raw-session' });
  assert.deepEqual(staffCall.init?.headers, { Accept: 'application/json', cookie: 'cms_staff_session=raw-session' });
  assert.deepEqual(relatedCalls[0]?.init?.headers, { Accept: 'application/json', cookie: 'cms_staff_session=raw-session' });
  assert.doesNotMatch(String(todayCall.input), /role|actor|branchId/i);
  assert.doesNotMatch(String(staffCall.input), /role|actor|branchId/i);
  assert.ok(relatedCalls.every((call) => !/role|actor|branchId|owner|token|credential/i.test(String(call.input))));
  assert.match(html, /Employee Today/);
  assert.match(html, /Layla Al-Farsi - CR Manager - Main Branch/);
  assert.match(html, /Related to/);
  assert.match(html, /Noor Customer - 0501234567 - Main Branch/);
  assert.doesNotMatch(html, /usr_layla/);
  assert.doesNotMatch(html, /customer_noor_1/);
  assert.match(html, /Overdue/);
  assert.match(html, /Due today/);
  assert.match(html, /Waiting on me/);
  assert.match(html, /Assigned to me/);
  assert.match(html, /Overdue promises/);
  assert.match(html, /Completed recently/);
  assert.match(html, /Customer call completed/);
  assert.match(html, /DONE/);
  assert.match(html, /Prepare delivery checklist/);
  assert.match(html, /Recover missed handover/);
  assert.match(html, /Call customer with finance answer/);
  assert.match(html, /Customer promise/);
  assert.match(html, /Approve exception/);
  assert.match(html, /Case/);
  assert.doesNotMatch(html, /case_finance_1/);
});

test('employee today route renders empty and denied states safely', async () => {
  const emptyFetch: typeof fetch = async () => jsonResponse(employeeTodayEmpty());
  const empty = renderToStaticMarkup(
    await EmployeeTodayPage({
      cookieHeader: 'cms_staff_session=raw-session',
      fetchImpl: emptyFetch,
      searchParams: Promise.resolve({ locale: 'en' }),
    }),
  );
  const denied = renderToStaticMarkup(
    await EmployeeTodayPage({
      cookieHeader: 'cms_staff_session=raw-session',
      fetchImpl: async () => new Response('', { status: 403 }),
      searchParams: Promise.resolve({ locale: 'en' }),
    }),
  );

  assert.match(empty, /No tasks need your attention right now\./);
  assert.match(empty, /role="status"/);
  assert.match(denied, /Employee Today could not be loaded\. Sign in and try again\./);
  assert.match(denied, /role="alert"/);
});

test('employee today route keeps Arabic RTL labels', async () => {
  const html = renderToStaticMarkup(
    await EmployeeTodayPage({
      cookieHeader: 'cms_staff_session=raw-session',
      fetchImpl: async () => jsonResponse(employeeTodayEmpty()),
      searchParams: Promise.resolve({ locale: 'ar' }),
    }),
  );

  assert.match(html, /dir="rtl"/);
  assert.ok(html.includes(employeeTodayText.ar.title));
  assert.ok(html.includes(employeeTodayText.ar.fields.assignee));
  assert.ok(html.includes(employeeTodayText.ar.fields.relatedTo));
  assert.ok(html.includes(employeeTodayText.ar.recordPicker.error));
  assert.ok(html.includes(employeeTodayText.ar.staffPicker.error));
  assert.ok(html.includes(employeeTodayText.ar.states.empty));
});

// ---- (staff)/tasks/sent route ----

test('sent tasks route renders sent task status comments and nudge controls', async () => {
  const calls: Array<{ input: string | URL | Request; init?: RequestInit }> = [];
  const fetchImpl: typeof fetch = async (input, init) => {
    calls.push({ input, init });
    const url = String(input);
    if (url.endsWith('/tasks/sent-by-me')) {
      return jsonResponse({ tasks: [taskFixture({ id: 'task_sent', title: 'Send finance update', status: 'WAITING' })] });
    }
    if (url.endsWith('/tasks/task_sent/comments')) {
      return jsonResponse({ comments: [{ id: 'comment_1', taskId: 'task_sent', authorId: 'usr_assignee', authorName: 'Assignee User', body: 'Waiting for bank answer.', createdAt: '2026-06-20T10:00:00.000Z' }] });
    }
    return jsonResponse({});
  };
  const html = renderToStaticMarkup(
    await SentTasksPage({
      cookieHeader: 'cms_staff_session=raw-session',
      fetchImpl,
      searchParams: Promise.resolve({ locale: 'en' }),
    }),
  );

  const sentCall = calls.find((call) => String(call.input).endsWith('/tasks/sent-by-me'));
  assert.ok(sentCall);
  assert.deepEqual(sentCall.init?.headers, { Accept: 'application/json', cookie: 'cms_staff_session=raw-session' });
  assert.doesNotMatch(String(sentCall.input), /ownerId|branchId/i);
  assert.match(html, /Sent Tasks/);
  assert.match(html, /Send finance update/);
  assert.match(html, /WAITING/);
  assert.match(html, /Waiting for bank answer\./);
  assert.match(html, /Add comment/);
  assert.match(html, /Remind/);
});

test('sent tasks route renders empty denied and Arabic states safely', async () => {
  const empty = renderToStaticMarkup(
    await SentTasksPage({
      cookieHeader: 'cms_staff_session=raw-session',
      fetchImpl: async (input) => String(input).endsWith('/tasks/sent-by-me') ? jsonResponse({ tasks: [] }) : jsonResponse({ comments: [] }),
      searchParams: Promise.resolve({ locale: 'en' }),
    }),
  );
  const denied = renderToStaticMarkup(
    await SentTasksPage({
      cookieHeader: 'cms_staff_session=raw-session',
      fetchImpl: async () => new Response('', { status: 403 }),
      searchParams: Promise.resolve({ locale: 'en' }),
    }),
  );
  const arabic = renderToStaticMarkup(
    await SentTasksPage({
      cookieHeader: 'cms_staff_session=raw-session',
      fetchImpl: async (input) => String(input).endsWith('/tasks/sent-by-me') ? jsonResponse({ tasks: [] }) : jsonResponse({ comments: [] }),
      searchParams: Promise.resolve({ locale: 'ar' }),
    }),
  );

  assert.match(empty, /No sent tasks are waiting on colleagues\./);
  assert.match(empty, /role="status"/);
  assert.match(denied, /Sent tasks could not be loaded\. Sign in and try again\./);
  assert.match(denied, /role="alert"/);
  assert.match(arabic, /dir="rtl"/);
  assert.ok(arabic.includes(sentTasksText.ar.title));
});

// ---- (staff)/tasks/promises route ----

test('promises route renders server-scoped promise KPIs and labels through the session cookie', async () => {
  const calls: Array<{ input: string | URL | Request; init?: RequestInit }> = [];
  const fetchImpl: typeof fetch = async (input, init) => {
    calls.push({ input, init });
    if (String(input).endsWith('/tasks/promises')) {
      return jsonResponse({
        openPromiseCount: 2,
        overduePromiseCount: 1,
        keptOnTimePercent: 50,
        promises: [
          taskFixture({
            id: 'promise_delivery',
            title: 'Promise customer delivery date',
            isCustomerPromise: true,
            customerLabel: 'Noor Customer',
            dealLabel: 'June Delivery',
            links: [{ entityType: 'DEAL', entityId: 'deal_delivery_1' }],
          }),
        ],
      });
    }
    return jsonResponse({});
  };
  const html = renderToStaticMarkup(
    await PromisesPage({
      cookieHeader: 'cms_staff_session=raw-session',
      fetchImpl,
      searchParams: Promise.resolve({ locale: 'en' }),
    }),
  );

  const promisesCall = calls.find((call) => String(call.input).endsWith('/tasks/promises'));
  assert.ok(promisesCall);
  assert.deepEqual(promisesCall.init?.headers, { Accept: 'application/json', cookie: 'cms_staff_session=raw-session' });
  assert.doesNotMatch(String(promisesCall.input), /role|actor|workflow|branchId|owner|token|credential/i);
  assert.match(html, /Promises/);
  assert.match(html, /Open promises/);
  assert.match(html, /Overdue promises/);
  assert.match(html, /Kept on time/);
  assert.match(html, /Promise customer delivery date/);
  assert.match(html, /Noor Customer/);
  assert.match(html, /June Delivery/);
  assert.match(html, /Deal/);
  assert.doesNotMatch(html, /deal_delivery_1/);
});

test('promises route renders empty and denied states safely', async () => {
  const empty = renderToStaticMarkup(
    await PromisesPage({
      cookieHeader: 'cms_staff_session=raw-session',
      fetchImpl: async () => jsonResponse({ openPromiseCount: 0, overduePromiseCount: 0, keptOnTimePercent: 0, promises: [] }),
      searchParams: Promise.resolve({ locale: 'en' }),
    }),
  );
  const denied = renderToStaticMarkup(
    await PromisesPage({
      cookieHeader: 'cms_staff_session=raw-session',
      fetchImpl: async () => new Response('', { status: 403 }),
      searchParams: Promise.resolve({ locale: 'en' }),
    }),
  );

  assert.match(empty, /No customer promises are visible right now\./);
  assert.match(empty, /role="status"/);
  assert.match(denied, /Promises could not be loaded\. Sign in and try again\./);
  assert.match(denied, /role="alert"/);
});

// ---- (staff)/tasks/manager route ----

test('manager control room route renders rollup sections through the session cookie', async () => {
  const calls: Array<{ input: string | URL | Request; init?: RequestInit }> = [];
  const fetchImpl: typeof fetch = async (input, init) => {
    calls.push({ input, init });
    if (String(input).endsWith('/tasks/manager-rollup')) {
      return jsonResponse({
        overdueByEmployee: [{ assigneeId: 'usr_late', count: 2 }],
        dueToday: [taskFixture({ id: 'task_due_manager', title: 'Release delivery gate' })],
        overduePromises: [taskFixture({ id: 'task_promise_manager', title: 'Confirm customer refund date', isCustomerPromise: true })],
        stuck: [taskFixture({ id: 'task_stuck_manager', title: 'Move blocked registration', stuckReasons: ['NEXT_ACTION_OVERDUE', 'NO_MOVEMENT'] })],
        workloadByAssignee: [{ assigneeId: 'usr_busy', count: 4 }],
        escalated: [taskFixture({ id: 'task_escalated_manager', title: 'Escalate missed handover' })],
        promiseKpi: { openPromiseCount: 3, overduePromiseCount: 1 },
      });
    }
    return jsonResponse({});
  };
  const html = renderToStaticMarkup(
    await ManagerControlRoomPage({
      cookieHeader: 'cms_staff_session=raw-session',
      fetchImpl,
      searchParams: Promise.resolve({ locale: 'en' }),
    }),
  );

  const rollupCall = calls.find((call) => String(call.input).endsWith('/tasks/manager-rollup'));
  assert.ok(rollupCall);
  assert.deepEqual(rollupCall.init?.headers, { Accept: 'application/json', cookie: 'cms_staff_session=raw-session' });
  assert.doesNotMatch(String(rollupCall.input), /role|actor|workflow|branchId|owner|token|credential/i);
  assert.match(html, /Manager Control Room/);
  assert.match(html, /Overdue by employee/);
  assert.match(html, /Due today/);
  assert.match(html, /Stuck tasks/);
  assert.match(html, /Workload by assignee/);
  assert.match(html, /Escalated tasks/);
  assert.match(html, /Overdue promises/);
  assert.match(html, /Promise KPI/);
  assert.match(html, /From staff session/);
  assert.match(html, /Release delivery gate/);
  assert.match(html, /Confirm customer refund date/);
  assert.match(html, /Customer promise/);
  assert.match(html, /NEXT_ACTION_OVERDUE, NO_MOVEMENT/);
  assert.match(html, /Open promises/);
});

test('manager control room route renders empty and denied states safely', async () => {
  const empty = renderToStaticMarkup(
    await ManagerControlRoomPage({
      cookieHeader: 'cms_staff_session=raw-session',
      fetchImpl: async () => jsonResponse(managerRollupEmpty()),
      searchParams: Promise.resolve({ locale: 'en' }),
    }),
  );
  const denied = renderToStaticMarkup(
    await ManagerControlRoomPage({
      cookieHeader: 'cms_staff_session=raw-session',
      fetchImpl: async () => new Response('', { status: 403 }),
      searchParams: Promise.resolve({ locale: 'en' }),
    }),
  );

  assert.match(empty, /No manager rollup items are active right now\./);
  assert.match(empty, /role="status"/);
  assert.match(denied, /Manager Control Room could not be loaded\. Sign in with a manager or admin role\./);
  assert.match(denied, /role="alert"/);
});

test('manager control room route keeps Arabic RTL labels', async () => {
  const html = renderToStaticMarkup(
    await ManagerControlRoomPage({
      cookieHeader: 'cms_staff_session=raw-session',
      fetchImpl: async () => jsonResponse(managerRollupEmpty()),
      searchParams: Promise.resolve({ locale: 'ar' }),
    }),
  );

  assert.match(html, /dir="rtl"/);
  assert.ok(html.includes(managerControlRoomText.ar.title));
  assert.ok(html.includes(managerControlRoomText.ar.states.empty));
});

// ---- (staff)/deals/handoff route ----

test('deal handoff board route renders scoped deal data through the session cookie', async () => {
  const calls: Array<{ input: string | URL | Request; init?: RequestInit }> = [];
  const fetchImpl: typeof fetch = async (input, init) => {
    calls.push({ input, init });
    if (String(input).endsWith('/deals/handoff-board')) {
      const blocked = dealFixture({ id: 'deal_stuck', title: 'Unblock finance approval', blocker: 'Missing bank approval', delayAgeMinutes: 120 });
      const delivery = dealFixture({ id: 'deal_delivery', title: 'Prepare customer handoff', stage: 'DELIVERY', currentHolderId: 'usr_delivery', delayAgeMinutes: 0 });
      return jsonResponse({
        byStage: [
          { stage: 'BOOKING', count: 1, deals: [blocked] },
          { stage: 'DELIVERY', count: 1, deals: [delivery] },
        ],
        stuck: [blocked],
        currentHolder: [{ currentHolderId: 'usr_sales', currentHolderName: 'Sales Holder', count: 1 }, { currentHolderId: 'usr_delivery', currentHolderName: 'Delivery Holder', count: 1 }],
      });
    }
    if (String(input).endsWith('/staff/assignable')) {
      return jsonResponse({
        staff: [{
          userId: 'usr_delivery',
          displayName: 'Delivery Holder',
          displayNameAr: 'مسؤول التسليم',
          role: 'Delivery',
          roleAr: 'التسليم',
          branchLabel: 'Main Branch',
          branchLabelAr: 'الفرع الرئيسي',
        }],
      });
    }
    return jsonResponse({});
  };
  const html = renderToStaticMarkup(
    await DealHandoffPage({
      cookieHeader: 'cms_staff_session=raw-session',
      fetchImpl,
      searchParams: Promise.resolve({ locale: 'en' }),
    }),
  );

  const handoffCall = calls.find((call) => String(call.input).endsWith('/deals/handoff-board'));
  const staffCall = calls.find((call) => String(call.input).endsWith('/staff/assignable'));
  assert.ok(handoffCall);
  assert.ok(staffCall);
  assert.deepEqual(handoffCall.init?.headers, { Accept: 'application/json', cookie: 'cms_staff_session=raw-session' });
  assert.deepEqual(staffCall.init?.headers, { Accept: 'application/json', cookie: 'cms_staff_session=raw-session' });
  assert.doesNotMatch(String(handoffCall.input), /role|actor|workflow|branchId|owner|token|credential/i);
  assert.doesNotMatch(String(staffCall.input), /role|actor|workflow|branchId|owner|token|credential/i);
  assert.match(html, /Deal Handoff Board/);
  assert.match(html, /By stage/);
  assert.match(html, /Stuck deals/);
  assert.match(html, /Current holders/);
  assert.match(html, /Unblock finance approval/);
  assert.match(html, /Prepare customer handoff/);
  assert.match(html, /Delivery Holder - Delivery - Main Branch/);
  assert.match(html, /Missing bank approval/);
  assert.match(html, /120m/);
});

test('deal handoff board route renders empty and denied states safely', async () => {
  const empty = renderToStaticMarkup(
    await DealHandoffPage({
      cookieHeader: 'cms_staff_session=raw-session',
      fetchImpl: async () => jsonResponse(dealHandoffEmpty()),
      searchParams: Promise.resolve({ locale: 'en' }),
    }),
  );
  const denied = renderToStaticMarkup(
    await DealHandoffPage({
      cookieHeader: 'cms_staff_session=raw-session',
      fetchImpl: async () => new Response('', { status: 403 }),
      searchParams: Promise.resolve({ locale: 'en' }),
    }),
  );

  assert.match(empty, /No deal handoff items are active right now\./);
  assert.match(empty, /role="status"/);
  assert.match(denied, /Deal Handoff Board could not be loaded\. Sign in with a manager or admin role\./);
  assert.match(denied, /role="alert"/);
});

test('deal handoff board route keeps Arabic RTL labels', async () => {
  const html = renderToStaticMarkup(
    await DealHandoffPage({
      cookieHeader: 'cms_staff_session=raw-session',
      fetchImpl: async () => jsonResponse(dealHandoffEmpty()),
      searchParams: Promise.resolve({ locale: 'ar' }),
    }),
  );

  assert.match(html, /dir="rtl"/);
  assert.ok(html.includes(dealHandoffText.ar.title));
  assert.ok(html.includes(dealHandoffText.ar.states.empty));
});

// ---- (staff)/cases/confidential/[caseId] route ----

test('confidential case route renders actor-scoped restricted notes through the session cookie', async () => {
  const calls: Array<{ input: string | URL | Request; init?: RequestInit }> = [];
  const fetchImpl: typeof fetch = async (input, init) => {
    calls.push({ input, init });
    return jsonResponse(confidentialCaseFixture());
  };
  const html = renderToStaticMarkup(
    await ConfidentialCasePage({
      cookieHeader: 'cms_staff_session=raw-session',
      fetchImpl,
      params: Promise.resolve({ caseId: 'case_hr_1' }),
      searchParams: Promise.resolve({ locale: 'en' }),
    }),
  );

  const caseCall = calls.find((call) => String(call.input).endsWith('/cases/case_hr_1/confidential-timeline'));
  assert.ok(caseCall);
  assert.deepEqual(caseCall.init?.headers, { Accept: 'application/json', cookie: 'cms_staff_session=raw-session' });
  assert.doesNotMatch(String(caseCall.input), /role|actor|workflow|branchId|owner|participant|token|credential/i);
  assert.match(html, /Confidential case timeline/);
  assert.match(html, /EMPLOYEE_GRIEVANCE/);
  assert.match(html, /HR_REVIEW/);
  assert.match(html, /Workplace grievance/);
  assert.match(html, /Main Branch/);
  assert.match(html, /HR Owner/);
  assert.match(html, /Private HR note/);
  assert.match(html, /CASE_CREATED/);
  assert.doesNotMatch(html, /case_hr_1/);
  assert.doesNotMatch(html, /branch_main/);
  assert.doesNotMatch(html, /usr_hr/);
});

test('confidential case route renders denied and no-note states without private notes', async () => {
  const denied = renderToStaticMarkup(
    await ConfidentialCasePage({
      cookieHeader: 'cms_staff_session=raw-session',
      fetchImpl: async () => new Response('', { status: 403 }),
      params: Promise.resolve({ caseId: 'case_hr_1' }),
      searchParams: Promise.resolve({ locale: 'en' }),
    }),
  );
  const empty = renderToStaticMarkup(
    await ConfidentialCasePage({
      cookieHeader: 'cms_staff_session=raw-session',
      fetchImpl: async () => jsonResponse(confidentialCaseFixture({ restrictedNotes: [] })),
      params: Promise.resolve({ caseId: 'case_hr_1' }),
      searchParams: Promise.resolve({ locale: 'en' }),
    }),
  );

  assert.match(denied, /Confidential case timeline could not be loaded/);
  assert.match(denied, /role="alert"/);
  assert.doesNotMatch(denied, /Private HR note/);
  assert.match(empty, /No restricted notes are available for this actor\./);
  assert.match(empty, /role="status"/);
});

test('confidential case route keeps Arabic RTL labels', async () => {
  const html = renderToStaticMarkup(
    await ConfidentialCasePage({
      cookieHeader: 'cms_staff_session=raw-session',
      fetchImpl: async () => jsonResponse(confidentialCaseFixture({ restrictedNotes: [] })),
      params: Promise.resolve({ caseId: 'case_hr_1' }),
      searchParams: Promise.resolve({ locale: 'ar' }),
    }),
  );

  assert.match(html, /dir="rtl"/);
  assert.ok(html.includes(confidentialCaseText.ar.title));
  assert.ok(html.includes(confidentialCaseText.ar.states.empty));
});

// ---- (staff)/dashboard route ----

test('dashboard route renders English summary labels', async () => {
  const html = renderToStaticMarkup(
    await DashboardPage({ cookieHeader: '', searchParams: Promise.resolve({ locale: 'en' }) }),
  );

  assert.match(html, /Accountability overview/);
  assert.match(html, /Active cases/);
  assert.match(html, /SLA warnings/);
  assert.match(html, /Overdue cases/);
  assert.match(html, /Closed cases/);
  assert.match(html, /Average TAT/);
});

test('dashboard route renders Arabic RTL summary labels', async () => {
  const html = renderToStaticMarkup(
    await DashboardPage({ cookieHeader: '', searchParams: Promise.resolve({ locale: 'ar' }) }),
  );

  assert.match(html, /dir="rtl"/);
  assert.ok(html.includes(staffShellText.ar.dashboard.title));
  assert.ok(html.includes(staffShellText.ar.dashboard.cards.open[0]));
  assert.ok(html.includes(staffShellText.ar.dashboard.cards.averageTat[0]));
});

test('dashboard route renders real metric values through the session cookie', async () => {
  const calls: Array<{ input: string | URL | Request; init?: RequestInit }> = [];
  const fetchImpl: typeof fetch = async (input, init) => {
    calls.push({ input, init });
    return jsonResponse({
      summary: {
        openComplaints: 42,
        overdueComplaints: 7,
        slaWarningComplaints: 9,
        closedComplaints: 30,
        averageTatHours: 36,
      },
    });
  };
  const html = renderToStaticMarkup(
    await DashboardPage({
      cookieHeader: 'cms_staff_session=raw-session',
      fetchImpl,
      searchParams: Promise.resolve({ locale: 'en' }),
    }),
  );

  const dashboardCall = calls.find((call) => String(call.input).endsWith('/reports/dashboard'));
  assert.ok(dashboardCall);
  assert.deepEqual(dashboardCall.init?.headers, { Accept: 'application/json', cookie: 'cms_staff_session=raw-session' });
  assert.doesNotMatch(String(dashboardCall.input), /role|actor|branchId/i);
  assert.match(html, />42</);
  assert.match(html, />7</);
  assert.match(html, />9</);
  assert.match(html, />30</);
  assert.match(html, />1.5</);
});

test('dashboard route renders empty zero state from all-zero metrics', async () => {
  const fetchImpl: typeof fetch = async () => jsonResponse({
    summary: {
      openComplaints: 0,
      overdueComplaints: 0,
      slaWarningComplaints: 0,
      closedComplaints: 0,
      averageTatHours: 0,
    },
  });
  const html = renderToStaticMarkup(
    await DashboardPage({
      cookieHeader: 'cms_staff_session=raw-session',
      fetchImpl,
      searchParams: Promise.resolve({ locale: 'en' }),
    }),
  );

  assert.match(html, /No accountability overview is available yet\./);
  assert.match(html, /role="status"/);
  assert.equal(html.match(/>0</g)?.length, 5);
});

test('dashboard route renders error state when backend denies summary access', async () => {
  const fetchImpl: typeof fetch = async () => new Response('', { status: 403 });
  const html = renderToStaticMarkup(
    await DashboardPage({
      cookieHeader: 'cms_staff_session=raw-session',
      fetchImpl,
      searchParams: Promise.resolve({ locale: 'en' }),
    }),
  );

  assert.match(html, /Accountability overview could not be loaded\. Try again\./);
  assert.match(html, /role="alert"/);
});

test('dashboard summary component source has no preview state or private data paths', () => {
  const source = readFileSync('apps/web/src/components/dashboard-summary/index.tsx', 'utf8');

  assert.doesNotMatch(source, /QueuePreviewState|PreviewState/);
  assert.doesNotMatch(source, /[\w.-]+@[\w.-]+/);
  assert.doesNotMatch(source, /password|otp|token|secret|credentials|document\.cookie|localStorage|sessionStorage|fetch\(/i);
});
