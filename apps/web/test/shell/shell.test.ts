import assert from 'node:assert/strict';
import test from 'node:test';
import { renderToStaticMarkup } from 'react-dom/server';
import StaffShellPage from '../../src/app/page';

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
  assert.match(html, /عمليات الموظفين/);
  assert.match(html, /لوحة التحكم/);
  assert.match(html, /قائمة العمل/);
  assert.match(html, /إنشاء شكوى/);
  assert.match(html, /تفاصيل الشكوى/);
  assert.match(html, /الإدارة/);
  assert.match(html, /التقارير/);
  assert.match(html, /التدقيق/);
  assert.match(html, /الإشعارات/);
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
  assert.match(html, /معاينة الدور/);
  assert.match(html, /تم إخفاء شاشات المشرف فقط/);
});
