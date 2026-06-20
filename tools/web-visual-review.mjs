import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
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
import { staffShellText } from '../apps/web/src/i18n/staff-shell.ts';
import { visualCases } from './web-proof-cases.mjs';

const webRequire = createRequire(new URL('../apps/web/package.json', import.meta.url));
const React = webRequire('react');
const { renderToStaticMarkup } = webRequire('react-dom/server');
const outDir = join('coverage', 'web-visual-review');

rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

const artifacts = [];
for (const testCase of visualCases) {
  const html = renderToStaticMarkup(await routePage(testCase));
  const file = `${slug(testCase.name)}.html`;
  writeFileSync(join(outDir, file), reviewHtml(testCase, html));
  artifacts.push({ ...testCase, file });
}

writeFileSync(join(outDir, 'index.html'), indexHtml(artifacts));
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
  if (testCase.route === 'portal-submission') return PortalSubmissionPage({ searchParams: params });
  if (testCase.route === 'portal-tracking') return PortalTrackingPage({ searchParams: params });
  if (testCase.route === 'portal-survey') return PortalSurveyPage({ searchParams: params });
  return StaffShellPage({ searchParams: params });
}

function staffFrame(testCase, children) {
  const t = staffShellText[testCase.locale];
  return React.createElement('div', { className: 'min-h-screen bg-neutral p-4 text-neutral-foreground md:p-6', dir: t.dir, lang: t.lang },
    React.createElement('section', { className: 'grid content-start gap-4' }, children));
}

async function proofFetch(input) {
  const path = new URL(String(input)).pathname;
  if (path === '/reports/dashboard') return json({ summary: { openComplaints: 9, overdueComplaints: 2, slaWarningComplaints: 3, closedComplaints: 7, averageTatHours: 18 } });
  if (path === '/complaints') return json({ items: [proofRow('CMP-PROOF-001', 'Proof queue row')] });
  if (path === '/reports') return json({ items: [proofRow('CMP-PROOF-RPT-001', 'Proof report row', { categoryId: 'cat_proof' })] });
  if (path.startsWith('/complaints/')) return json({ complaint: { ...proofRow('CMP-PROOF-DETAIL', 'Proof detail row'), description: 'Proof detail description.', incidentAt: '2026-06-19T00:00:00.000Z', statusHistory: [{ id: 'hist_1', toStatus: 'SUBMITTED', createdAt: '2026-06-19T00:00:00.000Z' }] } });
  return json({}, 404);
}

function proofRow(referenceNumber, subject, extra = {}) {
  return { id: 'proof_1', referenceNumber, status: 'IN_PROGRESS', severity: 'HIGH', subject, branchId: 'branch_proof', ownerId: 'usr_proof', createdAt: '2026-06-20T00:00:00.000Z', updatedAt: '2026-06-20T10:00:00.000Z', ...extra };
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
  <style>
    body { margin: 0; font-family: ui-sans-serif, system-ui, sans-serif; }
    aside { padding: 12px 16px; border-bottom: 1px solid #d4d4d8; background: #fafafa; }
    main { padding: 16px; }
    .frame { margin: 0 auto; outline: 1px solid #d4d4d8; }
  </style>
</head>
<body>
  <aside>
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
    .map((artifact) => `<li><a href="./${artifact.file}">${escapeHtml(artifact.name)}</a></li>`)
    .join('');
  return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8" /><title>CMS-Auto Visual Review</title></head>
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
