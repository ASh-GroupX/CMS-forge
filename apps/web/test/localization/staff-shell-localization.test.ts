import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { renderToStaticMarkup } from 'react-dom/server';
import StaffShellPage from '../../src/app/page';
import PortalSubmissionPage from '../../src/app/portal/page';
import PortalSurveyPage from '../../src/app/portal/survey/page';
import PortalTrackingPage from '../../src/app/portal/track/page';
import { resolveRequestLocale } from '../../src/middleware';
import { adminBranchesText } from '../../src/i18n/staff-admin-branches';
import { adminCategoriesSlaText } from '../../src/i18n/staff-admin-categories-sla';
import { adminNotificationTemplatesText } from '../../src/i18n/staff-admin-notification-templates';
import { adminUsersText } from '../../src/i18n/staff-admin-users';
import { auditViewerText } from '../../src/i18n/staff-audit-viewer';
import { attachmentText } from '../../src/i18n/staff-attachments';
import { complaintCreateText } from '../../src/i18n/staff-complaint-create';
import { complaintDetailText } from '../../src/i18n/staff-complaint-detail';
import { confirmationText } from '../../src/i18n/staff-confirmations';
import { notificationCenterText } from '../../src/i18n/staff-notification-center';
import { reportsDashboardText } from '../../src/i18n/staff-reports-dashboard';
import { portalSubmissionText } from '../../src/i18n/portal-submission';
import { portalSurveyText } from '../../src/i18n/portal-survey';
import { portalTrackingText } from '../../src/i18n/portal-tracking';
import { staffShellText } from '../../src/i18n/staff-shell';

const mojibakeMarkers = /[\u00c2\u00c3\u00d8\u00d9\ufffd]/;
const arabic = /[\u0600-\u06ff]/;

test('staff shell Arabic text uses real Arabic codepoints', () => {
  const source = readFileSync('apps/web/src/i18n/staff-shell.ts', 'utf8');

  assert.doesNotMatch(source, mojibakeMarkers);
  assert.match(staffShellText.en.switchTarget, arabic);
  assert.match(staffShellText.ar.title, arabic);

  for (const value of stringsFrom(staffShellText.ar)) {
    assert.doesNotMatch(value, mojibakeMarkers);
  }
});

test('staff shell renders Arabic RTL and English LTR', async () => {
  const arabicHtml = renderToStaticMarkup(await StaffShellPage({ searchParams: Promise.resolve({ locale: 'ar' }) }));
  const englishHtml = renderToStaticMarkup(await StaffShellPage({ searchParams: Promise.resolve({ locale: 'en' }) }));

  assert.match(arabicHtml, /lang="ar" dir="rtl"/);
  assert.match(arabicHtml, arabic);
  assert.match(englishHtml, /lang="en" dir="ltr"/);
});

test('root locale bridge resolves html language and direction', () => {
  const layoutSource = readFileSync('apps/web/src/app/layout.tsx', 'utf8');
  const middlewareSource = readFileSync('apps/web/src/middleware.ts', 'utf8');

  assert.equal(resolveRequestLocale(new URL('https://cms.test/?locale=ar')), 'ar');
  assert.equal(resolveRequestLocale(new URL('https://cms.test/?locale=fr')), 'en');
  assert.match(layoutSource, /rootLocaleHeader = 'x-cms-locale'/);
  assert.match(middlewareSource, /rootLocaleHeader = 'x-cms-locale'/);
  assert.match(layoutSource, /<html lang=\{locale\} dir=\{rootDirection\(locale\)\} suppressHydrationWarning>/);
  assert.match(layoutSource, /return staffShellText\[locale\]\.dir;/);
});

test('portal Arabic text uses real Arabic codepoints', () => {
  const files = ['portal-submission', 'portal-tracking', 'portal-survey'];
  const bundles = [portalSubmissionText, portalTrackingText, portalSurveyText];

  for (const file of files) {
    assert.doesNotMatch(readFileSync(`apps/web/src/i18n/${file}.ts`, 'utf8'), mojibakeMarkers);
  }

  for (const bundle of bundles) {
    assert.match(bundle.en.switchTarget, arabic);
    assert.match(bundle.ar.title, arabic);
    for (const value of stringsFrom(bundle.ar)) {
      assert.doesNotMatch(value, mojibakeMarkers);
    }
  }

  assert.match(portalTrackingText.en.subtitle, /Verification is required/);
  assert.match(portalTrackingText.ar.subtitle, arabic);
});

test('portal screens render Arabic RTL and English LTR', async () => {
  const pages = [
    PortalSubmissionPage,
    PortalTrackingPage,
    PortalSurveyPage,
  ];

  for (const page of pages) {
    const arabicHtml = renderToStaticMarkup(await page({ searchParams: Promise.resolve({ locale: 'ar' }) }));
    const englishHtml = renderToStaticMarkup(await page({ searchParams: Promise.resolve({ locale: 'en' }) }));

    assert.match(arabicHtml, /lang="ar" dir="rtl"/);
    assert.match(arabicHtml, arabic);
    assert.match(englishHtml, /lang="en" dir="ltr"/);
  }
});

test('complaint and attachment Arabic text uses real Arabic codepoints', () => {
  const files = ['staff-complaint-create', 'staff-complaint-detail', 'staff-confirmations', 'staff-attachments'];
  const bundles = [complaintCreateText, complaintDetailText, confirmationText, attachmentText];

  for (const file of files) {
    assert.doesNotMatch(readFileSync(`apps/web/src/i18n/${file}.ts`, 'utf8'), mojibakeMarkers);
  }

  for (const bundle of bundles) {
    assert.match(stringsFrom(bundle.ar).join(' '), arabic);
    for (const value of stringsFrom(bundle.ar)) {
      assert.doesNotMatch(value, mojibakeMarkers);
    }
  }

  assert.match(confirmationText.en.workflowCloseReject.body, /final confirmation/);
  assert.match(confirmationText.ar.workflowCloseReject.body, arabic);
});

test('complaint and attachment screens render Arabic RTL and English LTR', async () => {
  const arabicHtml = renderToStaticMarkup(
    await StaffShellPage({ searchParams: Promise.resolve({ locale: 'ar', create: 'validation', attachment: 'clean' }) }),
  );
  const englishHtml = renderToStaticMarkup(
    await StaffShellPage({ searchParams: Promise.resolve({ locale: 'en', create: 'validation', attachment: 'clean' }) }),
  );

  assert.match(arabicHtml, /lang="ar" dir="rtl"/);
  assert.ok(arabicHtml.includes(complaintCreateText.ar.fields.customerName));
  assert.ok(arabicHtml.includes(complaintDetailText.ar.title));
  assert.ok(arabicHtml.includes(attachmentText.ar.title));
  assert.match(englishHtml, /lang="en" dir="ltr"/);
});

test('admin Arabic text uses real Arabic codepoints', () => {
  const files = ['staff-admin-branches', 'staff-admin-categories-sla', 'staff-admin-users', 'staff-admin-notification-templates'];
  const bundles = [adminBranchesText, adminCategoriesSlaText, adminUsersText, adminNotificationTemplatesText];

  for (const file of files) {
    assert.doesNotMatch(readFileSync(`apps/web/src/i18n/${file}.ts`, 'utf8'), mojibakeMarkers);
  }

  for (const bundle of bundles) {
    assert.match(stringsFrom(bundle.ar).join(' '), arabic);
    for (const value of stringsFrom(bundle.ar)) {
      assert.doesNotMatch(value, mojibakeMarkers);
    }
  }
});

test('admin screens render Arabic RTL and English LTR', async () => {
  const arabicHtml = renderToStaticMarkup(
    await StaffShellPage({ searchParams: Promise.resolve({ locale: 'ar', role: 'admin', admin: 'validation' }) }),
  );
  const englishHtml = renderToStaticMarkup(
    await StaffShellPage({ searchParams: Promise.resolve({ locale: 'en', role: 'admin', admin: 'validation' }) }),
  );

  assert.match(arabicHtml, /lang="ar" dir="rtl"/);
  assert.ok(arabicHtml.includes(adminBranchesText.ar.title));
  assert.ok(arabicHtml.includes(adminCategoriesSlaText.ar.title));
  assert.ok(arabicHtml.includes(adminUsersText.ar.title));
  assert.ok(arabicHtml.includes(adminNotificationTemplatesText.ar.title));
  assert.match(englishHtml, /lang="en" dir="ltr"/);
});

test('remaining staff Arabic text uses real Arabic codepoints', () => {
  const files = ['staff-audit-viewer', 'staff-notification-center', 'staff-reports-dashboard'];
  const bundles = [auditViewerText, notificationCenterText, reportsDashboardText];

  for (const file of files) {
    assert.doesNotMatch(readFileSync(`apps/web/src/i18n/${file}.ts`, 'utf8'), mojibakeMarkers);
  }

  for (const bundle of bundles) {
    assert.match(stringsFrom(bundle.ar).join(' '), arabic);
    for (const value of stringsFrom(bundle.ar)) {
      assert.doesNotMatch(value, mojibakeMarkers);
    }
  }

  assert.match(reportsDashboardText.en.export.scoped, /RBAC-filtered/);
  assert.match(reportsDashboardText.ar.export.scoped, arabic);
});

test('remaining staff screens render Arabic RTL and English LTR', async () => {
  const arabicHtml = renderToStaticMarkup(
    await StaffShellPage({ searchParams: Promise.resolve({ locale: 'ar', role: 'admin', reports: 'ready' }) }),
  );
  const englishHtml = renderToStaticMarkup(
    await StaffShellPage({ searchParams: Promise.resolve({ locale: 'en', role: 'admin', reports: 'ready' }) }),
  );

  assert.match(arabicHtml, /lang="ar" dir="rtl"/);
  assert.ok(arabicHtml.includes(auditViewerText.ar.title));
  assert.ok(arabicHtml.includes(notificationCenterText.ar.title));
  assert.ok(arabicHtml.includes(reportsDashboardText.ar.title));
  assert.match(englishHtml, /lang="en" dir="ltr"/);
});

function stringsFrom(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(stringsFrom);
  if (value && typeof value === 'object') return Object.values(value).flatMap(stringsFrom);
  return [];
}
