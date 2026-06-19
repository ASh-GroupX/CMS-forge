import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { renderToStaticMarkup } from 'react-dom/server';
import StaffShellPage from '../../src/app/page';
import { attachmentText } from '../../src/i18n/staff-attachments';
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
  assert.match(html, /Category/);
  assert.match(html, /Severity/);
  assert.match(html, /Branch/);
  assert.match(html, /Incident date/);
  assert.match(html, /Subject/);
  assert.match(html, /Description/);
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

  assert.match(success, /Draft details are preserved for review before submission\./);
  assert.match(success, /Service concern/);
  assert.match(error, /Could not validate the draft\. Review the highlighted fields\./);
  assert.match(error, /Service concern/);
  assert.match(error, /role="alert"/);
});

test('Arabic complaint create form keeps RTL localized labels', async () => {
  const html = renderToStaticMarkup(
    await StaffShellPage({ searchParams: Promise.resolve({ locale: 'ar', create: 'validation' }) }),
  );

  assert.match(html, /dir="rtl"/);
  assert.ok(html.includes(staffShellText.ar.createForm.title));
  assert.ok(html.includes(staffShellText.ar.createForm.fields.category));
  assert.ok(html.includes(staffShellText.ar.createForm.validation.required));
});

test('complaint create form source does not submit or store draft data', () => {
  const source = readFileSync('apps/web/src/app/complaint-create-form.tsx', 'utf8');

  assert.doesNotMatch(source, /fetch\(|localStorage|sessionStorage|document\.cookie|onSubmit/);
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
