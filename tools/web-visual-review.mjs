import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { compileTailwind, runBrowserArtifactChecks } from './web-browser-check.mjs';
import StaffShellPage from '../apps/web/src/app/page.tsx';
import AdminPage from '../apps/web/src/app/(staff)/admin/page.tsx';
import AuditPage from '../apps/web/src/app/(staff)/audit/page.tsx';
import ComplaintsPage from '../apps/web/src/app/(staff)/complaints/page.tsx';
import ComplaintDetailPage from '../apps/web/src/app/(staff)/complaints/[id]/page.tsx';
import DashboardPage from '../apps/web/src/app/(staff)/dashboard/page.tsx';
import NewComplaintPage from '../apps/web/src/app/(staff)/complaints/new/page.tsx';
import ReportsPage from '../apps/web/src/app/(staff)/reports/page.tsx';
import PortalSubmissionPage from '../apps/web/src/app/portal/page.tsx';
import PortalSurveyPage from '../apps/web/src/app/portal/survey/page.tsx';
import PortalTrackingPage from '../apps/web/src/app/portal/track/page.tsx';
import { PortalShell } from '../apps/web/src/components/portal-shell/index.tsx';
import { PortalSubmissionScreen } from '../apps/web/src/components/portal-submission/index.tsx';
import { PortalTrackingPreview } from '../apps/web/src/components/portal-tracking/index.tsx';
import { portalSubmissionText } from '../apps/web/src/i18n/portal-submission.ts';
import { portalTrackingText } from '../apps/web/src/i18n/portal-tracking.ts';
import { staffShellText } from '../apps/web/src/i18n/staff-shell.ts';
import { visualCases } from './web-proof-cases.mjs';

const webRequire = createRequire(new URL('../apps/web/package.json', import.meta.url));
const React = webRequire('react');
const { renderToStaticMarkup } = webRequire('react-dom/server');
const outDir = join('coverage', 'web-visual-review');

rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });
compileTailwind(outDir);

const artifacts = [];
for (const testCase of visualCases) {
  const html = renderToStaticMarkup(await routePage(testCase));
  const file = `${slug(testCase.name)}.html`;
  writeFileSync(join(outDir, file), reviewHtml(testCase, html));
  artifacts.push({ ...testCase, file });
}

writeFileSync(join(outDir, 'index.html'), indexHtml(artifacts));
await runBrowserArtifactChecks(artifacts, outDir, { screenshots: true });
console.log(`Visual review artifacts written to ${outDir}`);
for (const artifact of artifacts) {
  console.log(`- ${artifact.name}: ${join(outDir, artifact.file)}`);
}

async function routePage(testCase) {
  const params = Promise.resolve(testCase.params);
  const staffProps = { cookieHeader: 'cms_staff_session=proof', fetchImpl: proofFetch, searchParams: params };
  if (testCase.route === 'staff-admin') return staffFrame(testCase, await AdminPage({ searchParams: params }));
  if (testCase.route === 'staff-audit') return staffFrame(testCase, await AuditPage({ searchParams: params }));
  if (testCase.route === 'staff-complaints') return staffFrame(testCase, await ComplaintsPage(staffProps));
  if (testCase.route === 'staff-complaint-detail') return staffFrame(testCase, await ComplaintDetailPage({ ...staffProps, params: Promise.resolve({ id: 'cmp-proof' }) }));
  if (testCase.route === 'staff-complaint-new') return staffFrame(testCase, await NewComplaintPage({ searchParams: params }));
  if (testCase.route === 'staff-dashboard') return staffFrame(testCase, await DashboardPage(staffProps));
  if (testCase.route === 'staff-reports') return staffFrame(testCase, await ReportsPage(staffProps));
  if (testCase.route === 'portal-submission') return testCase.params.state
    ? portalFrame(testCase, 'submit', React.createElement(PortalSubmissionScreen, { locale: testCase.locale, reference: testCase.params.reference, state: testCase.params.state }))
    : PortalSubmissionPage({ searchParams: params });
  if (testCase.route === 'portal-tracking-preview') return portalFrame(testCase, 'track', React.createElement(PortalTrackingPreview, portalTrackingProps(testCase)));
  if (testCase.route === 'portal-tracking') return PortalTrackingPage({ searchParams: params });
  if (testCase.route === 'portal-survey') return PortalSurveyPage({ searchParams: params });
  return StaffShellPage({ searchParams: params });
}

function portalTrackingProps(testCase) {
  return {
    locale: testCase.locale,
    reference: testCase.params.reference ?? portalTrackingText[testCase.locale].sample.reference,
    state: testCase.params.state,
  };
}

function staffFrame(testCase, children) {
  const t = staffShellText[testCase.locale];
  return React.createElement('div', { className: 'min-h-screen bg-neutral p-4 text-neutral-foreground md:p-6', dir: t.dir, lang: t.lang },
    React.createElement('section', { className: 'grid content-start gap-4' }, children));
}

function portalFrame(testCase, current, children) {
  const t = current === 'submit' ? portalSubmissionText[testCase.locale] : portalTrackingText[testCase.locale];
  const switchLocale = testCase.locale === 'ar' ? 'en' : 'ar';
  const switchPath = current === 'submit' ? '/portal' : '/portal/track';
  return React.createElement(PortalShell, {
    current,
    locale: testCase.locale,
    privacy: t.privacy,
    subtitle: t.subtitle,
    switchHref: `${switchPath}?locale=${switchLocale}`,
    switchLabel: t.switchLabel,
    switchTarget: t.switchTarget,
    title: t.title,
  }, children);
}

async function proofFetch(input) {
  const path = new URL(String(input)).pathname;
  if (path === '/reports/dashboard') return json({ summary: { openComplaints: 9, overdueComplaints: 2, slaWarningComplaints: 3, closedComplaints: 7, averageTatHours: 18 } });
  if (path === '/complaints/search') return json({ items: [proofRow('CMP-PROOF-001', 'Proof queue row')] });
  if (path === '/reports') return json({ items: [proofRow('CMP-PROOF-RPT-001', 'Proof report row', { categoryId: 'cat_proof' })] });
  if (path.startsWith('/complaints/')) return json({ complaint: { ...proofRow('CMP-PROOF-DETAIL', 'Proof detail row'), description: 'Proof detail description.', incidentAt: '2026-06-19T00:00:00.000Z', customer: proofCustomer(), customerSource: 'DMS', manualCustomer: false, vehicleRelated: true, vehicle: proofVehicle(), vehicleSource: 'LOCAL', manualVehicle: false, vehicleDataUnavailableReason: null, statusHistory: [{ id: 'hist_1', toStatus: 'SUBMITTED', createdAt: '2026-06-19T00:00:00.000Z' }] } });
  return json({}, 404);
}

function proofRow(referenceNumber, subject, extra = {}) {
  return { id: 'proof_1', referenceNumber, status: 'IN_PROGRESS', severity: 'HIGH', subject, branchId: 'branch_proof', ownerId: 'usr_proof', createdAt: '2026-06-20T00:00:00.000Z', updatedAt: '2026-06-20T10:00:00.000Z', ...extra };
}

function proofCustomer() {
  return { id: 'cust_proof', name: 'Proof Customer', phone: '+966500000099', identifier: 'CUST-PROOF', source: 'DMS' };
}

function proofVehicle() {
  return { id: 'veh_proof', vin: 'PROOFVIN00001', plate: 'PRF123', make: 'Nissan', model: 'Patrol', year: 2024, source: 'LOCAL' };
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), { headers: { 'content-type': 'application/json' }, status });
}

function reviewHtml(testCase, renderedHtml) {
  const signals = (testCase.signals ?? []).map((signal) => `<li>${escapeHtml(signal)}</li>`).join('');
  const frameStyle = testCase.viewport?.width ? ` style="max-width:${testCase.viewport.width}px"` : '';
  return `<!doctype html>
<html lang="${testCase.locale}">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(testCase.name)}</title>
  <link rel="stylesheet" href="./proof.css" />
  <style>
    aside.review-chrome { padding: 12px 16px; border-bottom: 1px solid hsl(var(--border)); background: hsl(var(--surface-raised)); }
    main { padding: 16px; }
    .frame { margin: 0 auto; outline: 1px solid hsl(var(--border)); }
  </style>
</head>
<body>
  <aside class="review-chrome">
    <strong>${escapeHtml(testCase.name)}</strong>
    <p>Inspect layout, overflow, RTL/LTR direction, labels, and state messaging before approving golden-screen work.</p>
    <ul>${signals}</ul>
  </aside>
  <main><div class="frame"${frameStyle}>${renderedHtml}</div></main>
</body>
</html>`;
}

function indexHtml(artifacts) {
  const links = artifacts
    .map((artifact) => `<li><a href="./${artifact.file}">${escapeHtml(artifact.name)}</a> · <a href="./${artifact.file.replace(/\.html$/, '.png')}">PNG</a></li>`)
    .join('');
  return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8" /><title>CMS-Auto Visual Review</title><link rel="stylesheet" href="./proof.css" /></head>
<body><h1>CMS-Auto Visual Review</h1><ul>${links}</ul></body>
</html>`;
}

function slug(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}
