import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { performance } from 'node:perf_hooks';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { compileTailwind, runBrowserArtifactChecks } from './web-browser-check.mjs';
import { proofFetch } from './web-proof-fixtures.mjs';
import StaffShellPage from '../apps/web/src/app/page.tsx';
import AdminPage from '../apps/web/src/app/(staff)/admin/page.tsx';
import AuditPage from '../apps/web/src/app/(staff)/audit/page.tsx';
import ComplaintsPage from '../apps/web/src/app/(staff)/complaints/page.tsx';
import ComplaintDetailPage from '../apps/web/src/app/(staff)/complaints/[id]/page.tsx';
import DashboardPage from '../apps/web/src/app/(staff)/dashboard/page.tsx';
import DealHandoffPage from '../apps/web/src/app/(staff)/deals/handoff/page.tsx';
import EmployeeTodayPage from '../apps/web/src/app/(staff)/tasks/today/page.tsx';
import NewComplaintPage from '../apps/web/src/app/(staff)/complaints/new/page.tsx';
import ReportsPage from '../apps/web/src/app/(staff)/reports/page.tsx';
import PortalSubmissionPage from '../apps/web/src/app/portal/page.tsx';
import PortalSurveyPage from '../apps/web/src/app/portal/survey/page.tsx';
import PortalTrackingPage from '../apps/web/src/app/portal/track/page.tsx';
import { StaffAuthLanding } from '../apps/web/src/app/staff-auth-landing.tsx';
import { ComplaintDetailWorkspace } from '../apps/web/src/components/complaint-detail-workspace/index.tsx';
import { ComplaintIntakeWorkspace } from '../apps/web/src/components/complaint-intake-workspace/index.tsx';
import { PortalShell } from '../apps/web/src/components/portal-shell/index.tsx';
import { PortalSubmissionScreen } from '../apps/web/src/components/portal-submission/index.tsx';
import { PortalSurveyScreen } from '../apps/web/src/components/portal-survey/index.tsx';
import { PortalTrackingPreview } from '../apps/web/src/components/portal-tracking/index.tsx';
import { portalSubmissionText } from '../apps/web/src/i18n/portal-submission.ts';
import { portalSurveyText } from '../apps/web/src/i18n/portal-survey.ts';
import { portalTrackingText } from '../apps/web/src/i18n/portal-tracking.ts';
import { staffShellText } from '../apps/web/src/i18n/staff-shell.ts';
import { accessibilityCases, defaultVisualSignals, performanceCases, smokeCases, visualCases } from './web-proof-cases.mjs';

const webRequire = createRequire(new URL('../apps/web/package.json', import.meta.url));
const React = webRequire('react');
const { renderToStaticMarkup } = webRequire('react-dom/server');

const mode = process.argv.slice(2).find((arg) => arg !== '--');
const modes = new Set(['visual', 'accessibility', 'perf', 'ui-smoke']);

if (!modes.has(mode)) {
  console.error('Use one of: visual, accessibility, perf, ui-smoke.');
  process.exit(1);
}

const cases =
  mode === 'visual' ? visualCases : mode === 'accessibility' ? accessibilityCases : mode === 'perf' ? performanceCases : smokeCases;
const rendered = [];
for (const testCase of cases) {
  rendered.push(await renderCase(testCase));
}

if (mode === 'visual' || mode === 'ui-smoke') {
  checkVisual(rendered);
}
if (mode === 'accessibility') {
  checkAccessibility(rendered);
}
if (mode === 'visual' || mode === 'accessibility') {
  const outDir = join('coverage', `web-proof-${mode}`);
  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });
  compileTailwind(outDir);
  const artifacts = rendered.map((result) => {
    const file = `${slug(result.name)}.html`;
    writeFileSync(join(outDir, file), proofHtml(result, result.html));
    return { ...result, file };
  });
  await runBrowserArtifactChecks(artifacts, outDir, { axe: mode === 'accessibility' });
}

if (mode === 'perf') {
  checkPerformance(rendered);
}

console.log(`web ${mode} proof passed for ${rendered.length} route previews`);

async function renderCase(testCase) {
  const started = performance.now();
  const page = await routePage(testCase);
  const html = renderToStaticMarkup(page);
  return { route: 'staff', ...testCase, html, ms: performance.now() - started };
}

async function routePage(testCase) {
  const params = Promise.resolve(testCase.params);
  const staffProps = { cookieHeader: 'cms_staff_session=proof', fetchImpl: proofFetch, searchParams: params };
  if (testCase.route === 'staff-auth') return React.createElement(StaffAuthLanding, { authError: false, locale: testCase.locale });
  if (testCase.route === 'staff-admin') return staffFrame(testCase, await AdminPage(staffProps));
  if (testCase.route === 'staff-audit') return staffFrame(testCase, await AuditPage({ searchParams: params }));
  if (testCase.route === 'staff-complaints') return staffFrame(testCase, await ComplaintsPage(staffProps));
  if (testCase.route === 'staff-complaint-detail') return staffFrame(testCase, hasAnyParam(testCase, ['attachment', 'comments', 'detail', 'lookup', 'sla', 'workflow'])
    ? await proofComplaintDetail(testCase)
    : await ComplaintDetailPage({ ...staffProps, params: Promise.resolve({ id: 'cmp-proof' }) }));
  if (testCase.route === 'staff-complaint-new') return staffFrame(testCase, hasAnyParam(testCase, ['create', 'lookup'])
    ? React.createElement(ComplaintIntakeWorkspace, { createState: testCase.params.create, locale: testCase.locale, lookupState: testCase.params.lookup, options: await proofJson('/complaints/form-options') })
    : await NewComplaintPage({ searchParams: params }));
  if (testCase.route === 'staff-dashboard') return staffFrame(testCase, await DashboardPage(staffProps));
  if (testCase.route === 'staff-deal-handoff') return staffFrame(testCase, await DealHandoffPage(staffProps));
  if (testCase.route === 'staff-reports') return staffFrame(testCase, await ReportsPage(staffProps));
  if (testCase.route === 'staff-today') return staffFrame(testCase, await EmployeeTodayPage(staffProps));
  if (testCase.route === 'portal-submission') return testCase.params.state
    ? portalFrame(testCase, 'submit', React.createElement(PortalSubmissionScreen, { locale: testCase.locale, reference: testCase.params.reference, state: testCase.params.state }))
    : PortalSubmissionPage({ searchParams: params });
  if (testCase.route === 'portal-tracking-preview') return portalFrame(testCase, 'track', React.createElement(PortalTrackingPreview, portalTrackingProps(testCase)));
  if (testCase.route === 'portal-tracking') return PortalTrackingPage({ searchParams: params });
  if (testCase.route === 'portal-survey') return testCase.params.state
    ? portalFrame(testCase, 'survey', React.createElement(PortalSurveyScreen, { locale: testCase.locale, state: testCase.params.state, surveyKey: 'proof-survey' }))
    : PortalSurveyPage({ searchParams: params });
  return StaffShellPage({ searchParams: params });
}

async function proofComplaintDetail(testCase) {
  const [{ complaint }, options, { staff }] = await Promise.all([
    proofJson('/complaints/cmp-proof'),
    proofJson('/complaints/form-options'),
    proofJson('/staff/assignable'),
  ]);
  return React.createElement(ComplaintDetailWorkspace, {
    attachmentState: testCase.params.attachment,
    commentsState: testCase.params.comments,
    detail: proofDetail(complaint, testCase),
    locale: testCase.locale,
    lookupState: testCase.params.lookup,
    options,
    relations: proofRelations(),
    staff,
    state: testCase.params.detail,
    workflowState: testCase.params.workflow,
  });
}

async function proofJson(path) {
  return (await proofFetch(new URL(path, 'http://localhost:3000'))).json();
}
const hasAnyParam = (testCase, names) => names.some((name) => testCase.params[name]);
function proofRelations() {
  return { candidates: [{ id: 'cmp_rel', referenceNumber: 'CMP-PROOF-REL-001', status: 'IN_PROGRESS', severity: 'HIGH', subject: 'Related proof complaint', branchName: 'Proof branch', customerName: 'Proof Customer', createdAt: '2026-06-18T00:00:00.000Z', updatedAt: '2026-06-20T00:00:00.000Z' }], related: [], state: 'ready', windowDays: 30 };
}
function proofDetail(complaint, testCase) {
  return {
    ...complaint,
    ...(testCase.params.sla === 'missing' ? { slaPercentElapsed: undefined } : {}),
    allowedActions: complaint.allowedActions ?? ['ACCEPT_INTAKE', 'ASSIGN_INVESTIGATION', 'REJECT_AS_INVALID'],
    capaActions: complaint.capaActions ?? [],
    caseTimeline: complaint.caseTimeline ?? [],
    communicationTimeline: complaint.communicationTimeline ?? [],
  };
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
    React.createElement('section', { className: 'grid min-w-0 content-start gap-4' }, children));
}
function portalFrame(testCase, current, children) {
  const t = routeText(testCase);
  const switchLocale = testCase.locale === 'ar' ? 'en' : 'ar';
  const switchPath = current === 'submit' ? '/portal' : current === 'track' ? '/portal/track' : '/portal/survey';
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

function checkVisual(results) {
  for (const result of results) {
    expect(result.html.length > (result.visual?.minHtml ?? 12000), `${result.name} rendered blank or tiny HTML`);
    expect(result.html.includes(`dir="${staffShellText[result.locale].dir}"`), `${result.name} missing direction`);
    for (const signal of result.signals ?? defaultVisualSignals(result.locale)) {
      expect(result.html.includes(signal), `${result.name} missing visual signal: ${signal}`);
    }
    for (const className of result.classes ?? ['rounded-md', 'overflow-x-auto']) {
      expect(result.html.includes(className), `${result.name} missing visual class: ${className}`);
    }
    expect(count(result.html, '<section') >= (result.visual?.minSections ?? 8), `${result.name} missing major content sections`);
  }
}

function checkAccessibility(results) {
  const css = readFileSync('apps/web/src/globals.css', 'utf8');
  expect(css.includes(':focus-visible'), 'global CSS missing focus-visible affordance');
  expect(css.includes('prefers-reduced-motion: reduce'), 'global CSS missing reduced-motion media query');
  for (const token of ['--color-brand', '--color-neutral', '--color-neutral-foreground', '--color-success', '--color-error', '--focus-ring']) {
    expect(css.includes(token), `global CSS missing contrast/focus token ${token}`);
  }
  for (const route of ['portal-submission', 'portal-tracking-preview', 'portal-survey']) {
    for (const locale of ['en', 'ar']) {
      expect(results.some((result) => result.route === route && result.locale === locale), `accessibility proof missing ${route} ${locale}`);
    }
  }
  for (const locale of ['en', 'ar']) {
    expect(results.some((result) => String(result.route ?? 'staff').startsWith('staff') && result.locale === locale), `accessibility proof missing staff ${locale}`);
  }
  for (const result of results) {
    const t = routeText(result);
    if (String(result.route ?? 'staff').startsWith('staff')) {
      expect(result.html.includes(`dir="${t.dir}"`), `${result.name} missing direction`);
    } else {
      expect(result.html.includes(`lang="${t.lang}"`) && result.html.includes(`dir="${t.dir}"`), `${result.name} missing language or direction`);
    }
    if (result.route === 'staff') {
      expect(result.html.includes(`aria-label="${t.title}"`), `${result.name} missing nav accessible name`);
    }
    for (const signal of result.signals ?? []) {
      expect(result.html.includes(signal), `${result.name} missing accessibility signal: ${signal}`);
    }
    expect(count(result.html, 'aria-label=') >= (result.a11y?.minAria ?? (result.route === 'staff' ? 8 : 2)), `${result.name} missing labelled regions or controls`);
    expect(count(result.html, '<label') >= (result.a11y?.minLabels ?? (result.route === 'staff' ? 8 : 2)), `${result.name} missing form labels`);
    expect(count(result.html, 'focus:ring-2') >= (result.a11y?.minFocus ?? (result.route === 'staff' ? 8 : 1)), `${result.name} missing focus-ring affordances`);
    expect(!/<a\b(?![^>]*\bhref=)/.test(result.html), `${result.name} has link without href`);
    expect(!/<svg(?![^>]*aria-hidden="true")/.test(result.html), `${result.name} has visible SVG without aria-hidden`);
    expect(!/<button(?![^>]*\btype=)/.test(result.html), `${result.name} has button without explicit type`);
    expectNamedButtons(result.html, result.name);
    if (result.a11y?.feedbackRole !== false) {
      expect(result.html.includes('role="status"') || result.html.includes('role="alert"'), `${result.name} missing feedback role`);
    }
    if (result.a11y?.dialog) {
      expect(result.html.includes('role="dialog"'), `${result.name} missing dialog role`);
      expect(result.html.includes(`aria-label="${result.a11y.dialog}"`), `${result.name} missing dialog name`);
    }
    if (result.a11y?.minButtons) {
      expect(count(result.html, '<button') >= result.a11y.minButtons, `${result.name} missing named controls`);
    }
  }
}

function routeText(result) {
  if (result.route === 'portal-submission') return portalSubmissionText[result.locale];
  if (result.route === 'portal-tracking' || result.route === 'portal-tracking-preview') return portalTrackingText[result.locale];
  if (result.route === 'portal-survey') return portalSurveyText[result.locale];
  return staffShellText[result.locale];
}

function expectNamedButtons(html, name) {
  for (const match of html.matchAll(/<button\b([^>]*)>(.*?)<\/button>/gs)) {
    const attrs = match[1];
    const label = match[2].replace(/<[^>]+>/g, '').trim();
    expect(Boolean(label || /aria-label=/.test(attrs)), `${name} has unnamed button`);
  }
}

function checkPerformance(results) {
  for (const result of results) {
    const budget = result.perf ?? {};
    for (const signal of result.signals ?? []) {
      expect(result.html.includes(signal), `${result.name} missing performance surface signal: ${signal}`);
    }
    expect(result.ms < (budget.maxMs ?? 1000), `${result.name} server render exceeded budget: ${result.ms.toFixed(1)}ms`);
    expect(result.html.length < (budget.maxHtml ?? 180000), `${result.name} HTML exceeded smoke budget`);
    expect(count(result.html, '<tr') <= (budget.maxRows ?? 80), `${result.name} renders too many table rows for the smoke page`);
    expect(count(result.html, 'md:grid-cols') >= (budget.minResponsiveGuards ?? 2), `${result.name} missing responsive guards`);
    expect(!/<script\b[^>]*\bsrc=/.test(result.html), `${result.name} emitted external script tags`);
    expect(count(result.html, '<script') <= (budget.maxInlineScripts ?? 1), `${result.name} emitted too many inline script tags`);
    expect(!/<img(?![^>]*(?:width|height)=)/.test(result.html), `${result.name} has image without dimensions`);
  }
}

function count(text, needle) {
  return text.split(needle).length - 1;
}

function proofHtml(testCase, renderedHtml) {
  const width = testCase.viewport?.width ? ` style="max-width:${testCase.viewport.width}px"` : '';
  return `<!doctype html>
<html lang="${testCase.locale}">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(testCase.name)}</title>
  <link rel="stylesheet" href="./proof.css" />
  <style>body{margin:0}.proof-frame{margin:0 auto;padding:16px}${testCase.locale === 'ar' ? 'body{direction:rtl}' : ''}</style>
</head>
<body><main class="proof-frame"${width}>${renderedHtml}</main></body>
</html>`;
}

function slug(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function escapeHtml(value) {
  return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
}

function expect(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}
