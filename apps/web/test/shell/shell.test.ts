import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { buildStaffComplaintCreateSubmission } from '../../src/app/complaint-create-form';
import StaffShellPage from '../../src/app/page';
import { adminBranchesText } from '../../src/i18n/staff-admin-branches';
import { adminCategoriesSlaText } from '../../src/i18n/staff-admin-categories-sla';
import { adminNotificationTemplatesText } from '../../src/i18n/staff-admin-notification-templates';
import { adminUsersText } from '../../src/i18n/staff-admin-users';
import { auditViewerText } from '../../src/i18n/staff-audit-viewer';
import { attachmentText } from '../../src/i18n/staff-attachments';
import { complaintDetailText } from '../../src/i18n/staff-complaint-detail';
import { complaintCreateText } from '../../src/i18n/staff-complaint-create';
import { notificationCenterText } from '../../src/i18n/staff-notification-center';
import { reportsDashboardText } from '../../src/i18n/staff-reports-dashboard';
import { staffShellText } from '../../src/i18n/staff-shell';

test('staff shell renders English LTR operational navigation', async () => {
  const html = renderToStaticMarkup(
    await StaffShellPage({ searchParams: Promise.resolve({ locale: 'en', role: 'admin', session: 'signed-in' }) }),
  );

  assert.match(html, /dir="ltr"/);
  assert.match(html, /Staff Operations/);
  assert.match(html, /Dashboard/);
  assert.match(html, /Work queue/);
  assert.match(html, /Create complaint/);
  assert.match(html, /Complaint detail/);
  assert.match(html, /Admin/);
  assert.match(html, /Reports/);
  assert.match(html, /Audit/);
  assert.match(html, /Notifications/);
});

test('staff shell renders Arabic RTL labels', async () => {
  const html = renderToStaticMarkup(
    await StaffShellPage({ searchParams: Promise.resolve({ locale: 'ar', role: 'admin', session: 'signed-in' }) }),
  );

  assert.match(html, /dir="rtl"/);
  assert.ok(html.includes(staffShellText.ar.title));
  assert.ok(html.includes(staffShellText.ar.nav.dashboard[0]));
  assert.ok(html.includes(staffShellText.ar.nav.queue[0]));
  assert.ok(html.includes(staffShellText.ar.nav.create[0]));
  assert.ok(html.includes(staffShellText.ar.nav.detail[0]));
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

test('staff shell renders signed-in preview with logout affordance', async () => {
  const html = renderToStaticMarkup(await StaffShellPage({ searchParams: Promise.resolve({ session: 'signed-in' }) }));

  assert.match(html, /Signed in/);
  assert.match(html, /Log out/);
  assert.doesNotMatch(html, /Staff sign in/);
});

test('staff role preview hides admin-only navigation', async () => {
  const html = renderToStaticMarkup(
    await StaffShellPage({ searchParams: Promise.resolve({ session: 'signed-in', role: 'staff' }) }),
  );

  assert.match(html, /Role preview/);
  assert.match(html, /Admin-only surfaces hidden/);
  assert.doesNotMatch(html, /Users, branches, categories/);
});

test('admin role preview shows admin-only navigation', async () => {
  const html = renderToStaticMarkup(
    await StaffShellPage({ searchParams: Promise.resolve({ session: 'signed-in', role: 'admin' }) }),
  );

  assert.match(html, /Admin/);
  assert.match(html, /Users, branches, categories/);
  assert.doesNotMatch(html, /Admin-only surfaces hidden/);
});

test('Arabic role preview keeps RTL direction and localized hidden state', async () => {
  const html = renderToStaticMarkup(
    await StaffShellPage({ searchParams: Promise.resolve({ locale: 'ar', session: 'signed-in', role: 'staff' }) }),
  );

  assert.match(html, /dir="rtl"/);
  assert.ok(html.includes(staffShellText.ar.role.label));
  assert.ok(html.includes(staffShellText.ar.role.adminHidden));
});

test('staff shell exposes password reset entry points', async () => {
  const html = renderToStaticMarkup(await StaffShellPage({ searchParams: Promise.resolve({ locale: 'en' }) }));

  assert.match(html, /Password reset/);
  assert.match(html, /Forgot password\?/);
  assert.match(html, /Use reset token/);
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
  const source = readFileSync('apps/web/src/app/password-reset-panel.tsx', 'utf8');

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
  const resetSource = readFileSync('apps/web/src/app/password-reset-panel.tsx', 'utf8');
  const source = `${pageSource}\n${resetSource}`;

  assert.doesNotMatch(source, /localStorage|sessionStorage|document\.cookie/);
});

test('staff dashboard summary shows staff role cards only', async () => {
  const html = renderToStaticMarkup(
    await StaffShellPage({ searchParams: Promise.resolve({ locale: 'en', role: 'staff', session: 'signed-in' }) }),
  );

  assert.match(html, /Open complaints/);
  assert.match(html, /SLA warnings/);
  assert.match(html, /Overdue complaints/);
  assert.doesNotMatch(html, /Average TAT/);
});

test('admin dashboard summary shows all operational cards', async () => {
  const html = renderToStaticMarkup(
    await StaffShellPage({ searchParams: Promise.resolve({ locale: 'en', role: 'admin', session: 'signed-in' }) }),
  );

  assert.match(html, /Open complaints/);
  assert.match(html, /SLA warnings/);
  assert.match(html, /Overdue complaints/);
  assert.match(html, /Closed complaints/);
  assert.match(html, /Average TAT/);
});

test('management dashboard summary focuses management cards', async () => {
  const html = renderToStaticMarkup(
    await StaffShellPage({ searchParams: Promise.resolve({ locale: 'en', role: 'management', session: 'signed-in' }) }),
  );

  assert.match(html, /Open complaints/);
  assert.match(html, /Overdue complaints/);
  assert.match(html, /Closed complaints/);
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

  assert.match(loading, /Loading dashboard summary\./);
  assert.match(empty, /No dashboard summary is available yet\./);
  assert.match(error, /Dashboard summary could not be loaded\. Try again\./);
  assert.match(error, /role="alert"/);
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

test('work queue sample rows avoid customer PII and portal data', async () => {
  const source = readFileSync('apps/web/src/app/work-queue.tsx', 'utf8');

  assert.match(source, /CMP-2026-001/);
  assert.doesNotMatch(source, /@/);
  assert.doesNotMatch(source, /\b\+?\d{10,}\b/);
  assert.doesNotMatch(source, /VIN|audit|internal comment|portal/i);
});

test('Arabic work queue keeps RTL localized labels', async () => {
  const html = renderToStaticMarkup(await StaffShellPage({ searchParams: Promise.resolve({ locale: 'ar' }) }));

  assert.match(html, /dir="rtl"/);
  assert.ok(html.includes(staffShellText.ar.workQueue.headers[0]));
  assert.ok(html.includes(staffShellText.ar.workQueue.filters.severity));
  assert.ok(html.includes(staffShellText.ar.workQueue.pagination.page));
});

test('work queue preview states render loading empty and error messages', async () => {
  const loading = renderToStaticMarkup(await StaffShellPage({ searchParams: Promise.resolve({ queue: 'loading' }) }));
  const empty = renderToStaticMarkup(await StaffShellPage({ searchParams: Promise.resolve({ queue: 'empty' }) }));
  const error = renderToStaticMarkup(await StaffShellPage({ searchParams: Promise.resolve({ queue: 'error' }) }));

  assert.match(loading, /Loading work queue\./);
  assert.match(empty, /No complaints match the current filters\./);
  assert.match(error, /Work queue could not be loaded\. Try again\./);
  assert.match(error, /role="alert"/);
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
  assert.match(html, /Owner and SLA/);
  assert.match(html, /Timeline/);
  assert.match(html, /Survey results/);
  assert.match(html, /Internal comments/);
  assert.match(html, /Public updates/);
  assert.match(html, /Attachments/);
  assert.match(html, /Current owner/);
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

test('complaint detail workspace preview states render loading empty and error messages', async () => {
  const loading = renderToStaticMarkup(await StaffShellPage({ searchParams: Promise.resolve({ detail: 'loading' }) }));
  const empty = renderToStaticMarkup(await StaffShellPage({ searchParams: Promise.resolve({ detail: 'empty' }) }));
  const error = renderToStaticMarkup(await StaffShellPage({ searchParams: Promise.resolve({ detail: 'error' }) }));

  assert.match(loading, /Loading complaint detail\./);
  assert.match(empty, /Select a complaint to view detail\./);
  assert.match(error, /Complaint detail could not be loaded\. Try again\./);
  assert.match(error, /role="alert"/);
});

test('complaint detail workspace keeps responsive detail layout classes', async () => {
  const html = renderToStaticMarkup(await StaffShellPage({ searchParams: Promise.resolve({ locale: 'en' }) }));

  assert.match(html, /xl:grid-cols-\[1\.1fr_0\.9fr\]/);
  assert.match(html, /md:grid-cols-2/);
  assert.match(html, /grid-cols-\[8rem_1fr\]/);
});

test('complaint detail workspace source is privacy-safe and render-only', () => {
  const source = readFileSync('apps/web/src/app/complaint-detail-workspace.tsx', 'utf8');
  const textSource = readFileSync('apps/web/src/i18n/staff-complaint-detail.ts', 'utf8');
  const combined = `${source}\n${textSource}`;

  assert.doesNotMatch(combined, /fetch\(|localStorage|sessionStorage|document\.cookie|https?:\/\//);
  assert.doesNotMatch(combined, /@/);
  assert.doesNotMatch(combined, /\b\+?\d{10,}\b/);
  assert.doesNotMatch(combined, /DMS|audit|portal|staff PII|provider|storage URL/i);
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
  const source = readFileSync('apps/web/src/app/complaint-detail-workspace.tsx', 'utf8');

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
  const source = readFileSync('apps/web/src/app/complaint-detail-workspace.tsx', 'utf8');

  assert.doesNotMatch(source, /fetch\(|localStorage|sessionStorage|document\.cookie/);
  assert.doesNotMatch(source, /applyTransition|fromStatus|toStatus|nextStatus|currentState|ownerId|branchScope|roleCode/);
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
  const source = readFileSync('apps/web/src/app/complaint-detail-workspace.tsx', 'utf8');

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

test('admin branches departments source is render-only and privacy-safe', () => {
  const source = readFileSync('apps/web/src/app/admin-branches-departments.tsx', 'utf8');

  assert.match(source, /xl:grid-cols-2/);
  assert.match(source, /min-w-\[34rem\]/);
  assert.doesNotMatch(source, /fetch\(|localStorage|sessionStorage|document\.cookie/);
  assert.doesNotMatch(source, /roleCode|principal|branchScope|audit|portal|DMS|@|\b\+?\d{10,}\b/i);
});

test('admin users roles screen renders only for admin preview with reset affordance', async () => {
  const admin = renderToStaticMarkup(await StaffShellPage({ searchParams: Promise.resolve({ role: 'admin', session: 'signed-in' }) }));
  const staff = renderToStaticMarkup(await StaffShellPage({ searchParams: Promise.resolve({ role: 'staff', session: 'signed-in' }) }));

  assert.match(admin, /Users, roles, and branch scope/);
  assert.match(admin, /CR Officer/);
  assert.match(admin, /CR Manager/);
  assert.match(admin, /Main branch/);
  assert.match(admin, /Create user/);
  assert.match(admin, /Send reset/);
  assert.match(admin, /If the account can reset a password, instructions will be sent\./);
  assert.doesNotMatch(admin, /reset token/i);
  assert.doesNotMatch(staff, /Users, roles, and branch scope/);
});

test('admin users roles preview states render safely', async () => {
  const loading = renderToStaticMarkup(await StaffShellPage({ searchParams: Promise.resolve({ role: 'admin', admin: 'loading' }) }));
  const validation = renderToStaticMarkup(await StaffShellPage({ searchParams: Promise.resolve({ role: 'admin', admin: 'validation' }) }));

  assert.match(loading, /Loading users and roles\./);
  assert.match(validation, /Review the user role and branch scope fields\./);
  assert.match(validation, /role="alert"/);
});

test('Arabic admin users roles keeps RTL localized labels', async () => {
  const html = renderToStaticMarkup(await StaffShellPage({ searchParams: Promise.resolve({ locale: 'ar', role: 'admin' }) }));

  assert.match(html, /dir="rtl"/);
  assert.ok(html.includes(adminUsersText.ar.title));
  assert.ok(html.includes(adminUsersText.ar.actions.create));
  assert.ok(html.includes(adminUsersText.ar.actions.reset));
});

test('admin users roles source is render-only and reset-safe', () => {
  const source = readFileSync('apps/web/src/app/admin-users-roles.tsx', 'utf8');

  assert.match(source, /min-w-\[50rem\]/);
  assert.doesNotMatch(source, /fetch\(|localStorage|sessionStorage|document\.cookie/);
  assert.doesNotMatch(source, /password|resetToken|token|otp|hash|roleCode|principal|branchScope|audit|portal|DMS|@|\b\+?\d{10,}\b/i);
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

test('admin categories severity SLA source is render-only and does not calculate SLA truth', () => {
  const source = readFileSync('apps/web/src/app/admin-categories-sla.tsx', 'utf8');

  assert.match(source, /min-w-\[54rem\]/);
  assert.doesNotMatch(source, /fetch\(|localStorage|sessionStorage|document\.cookie|Date\.now|setInterval|deadlineAt|escalate|audit|principal|roleCode|portal|DMS|@|\b\+?\d{10,}\b/i);
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

test('admin notification templates source is render-only and placeholder-safe', () => {
  const source = readFileSync('apps/web/src/app/admin-notification-templates.tsx', 'utf8');

  assert.match(source, /min-w-\[48rem\]/);
  assert.doesNotMatch(source, /fetch\(|localStorage|sessionStorage|document\.cookie|send[A-Z]|provider|credential|secret|apiKey|token|audit|deliveryLog|portal|DMS|https?:\/\/|@|\b\+?\d{10,}\b/i);
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

test('audit viewer source is render-only and uses safe placeholders', () => {
  const source = readFileSync('apps/web/src/app/audit-viewer.tsx', 'utf8');

  assert.match(source, /min-w-\[58rem\]/);
  assert.doesNotMatch(source, /fetch\(|localStorage|sessionStorage|document\.cookie|createObjectURL|Blob|download|password|otp|token|secret|provider|portal|DMS|@|\b\+?\d{10,}\b/i);
});

test('notification center renders for staff with unread read and scoped complaint affordances', async () => {
  const html = renderToStaticMarkup(await StaffShellPage({ searchParams: Promise.resolve({ role: 'staff', session: 'signed-in' }) }));

  assert.match(html, /Notifications/);
  assert.match(html, /Unread/);
  assert.match(html, /Read/);
  assert.match(html, /Workflow update placeholder/);
  assert.match(html, /SLA warning placeholder/);
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
  const source = readFileSync('apps/web/src/app/notification-center.tsx', 'utf8');

  assert.match(source, /xl:grid-cols-2/);
  assert.doesNotMatch(source, /fetch\(|localStorage|sessionStorage|document\.cookie|router\.push|window\.location|branchScope|roleCode|password|otp|token|secret|provider|portal|DMS|@|\b\+?\d{10,}\b/i);
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
  assert.match(html, /Exports use backend configured row limits\./);
  assert.match(html, /Export data is RBAC-filtered with the same report scope\./);
  assert.match(html, /Successful exports are audit logged by the backend\./);
});

test('Arabic reports dashboard keeps RTL localized labels', async () => {
  const html = renderToStaticMarkup(await StaffShellPage({ searchParams: Promise.resolve({ locale: 'ar', role: 'management', reports: 'validation' }) }));

  assert.match(html, /dir="rtl"/);
  assert.ok(html.includes(reportsDashboardText.ar.title));
  assert.ok(html.includes(reportsDashboardText.ar.export.title));
  assert.ok(html.includes(reportsDashboardText.ar.badges.pending));
  assert.ok(html.includes(reportsDashboardText.ar.states.validation));
});

test('reports dashboard source is render-only and placeholder-safe', () => {
  const source = readFileSync('apps/web/src/app/reports-dashboard.tsx', 'utf8');

  assert.match(source, /RPT-017/);
  assert.match(source, /min-w-\[56rem\]/);
  assert.doesNotMatch(source, /fetch\(|localStorage|sessionStorage|document\.cookie|Chart|canvas|createObjectURL|Blob|download|branchScope|roleCode|customerPhone|password|otp|token|secret|provider|portal|DMS-[A-Z0-9]+|@|\b\+?\d{10,}\b/i);
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

test('customer vehicle lookup source does not use APIs or browser storage', () => {
  const source = readFileSync('apps/web/src/app/customer-vehicle-lookup.tsx', 'utf8');

  assert.doesNotMatch(source, /fetch\(|localStorage|sessionStorage|document\.cookie/);
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
  const source = readFileSync('apps/web/src/app/complaint-create-form.tsx', 'utf8');

  assert.match(source, /createStaffComplaint/);
  assert.doesNotMatch(source, /fetch\(|localStorage|sessionStorage|document\.cookie/);
  assert.doesNotMatch(source, /roleId|actorId|workflow|ownerId|session|token|credentials/);
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

test('attachment panel source does not upload read or expose file URLs', () => {
  const source = readFileSync('apps/web/src/app/attachment-upload-panel.tsx', 'utf8');

  assert.doesNotMatch(source, /fetch\(|FileReader|createObjectURL|localStorage|sessionStorage|document\.cookie|https?:\/\//);
});
