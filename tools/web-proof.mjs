import { readFileSync } from 'node:fs';
import { performance } from 'node:perf_hooks';
import { createRequire } from 'node:module';
import StaffShellPage from '../apps/web/src/app/page.tsx';
import { adminBranchesText } from '../apps/web/src/i18n/staff-admin-branches.ts';
import { adminUsersText } from '../apps/web/src/i18n/staff-admin-users.ts';
import { adminCategoriesSlaText } from '../apps/web/src/i18n/staff-admin-categories-sla.ts';
import { adminNotificationTemplatesText } from '../apps/web/src/i18n/staff-admin-notification-templates.ts';
import { auditViewerText } from '../apps/web/src/i18n/staff-audit-viewer.ts';
import { complaintDetailText } from '../apps/web/src/i18n/staff-complaint-detail.ts';
import { reportsDashboardText } from '../apps/web/src/i18n/staff-reports-dashboard.ts';
import { staffShellText } from '../apps/web/src/i18n/staff-shell.ts';

const webRequire = createRequire(new URL('../apps/web/package.json', import.meta.url));
const { renderToStaticMarkup } = webRequire('react-dom/server');

const mode = process.argv.slice(2).find((arg) => arg !== '--');
const modes = new Set(['visual', 'accessibility', 'perf', 'ui-smoke']);

if (!modes.has(mode)) {
  console.error('Use one of: visual, accessibility, perf, ui-smoke.');
  process.exit(1);
}

const smokeCases = [
  {
    name: 'English admin shell',
    locale: 'en',
    params: {
      locale: 'en',
      role: 'admin',
      session: 'signed-in',
      admin: 'success',
      dashboard: 'loading',
      notification: 'success',
      reports: 'ready',
    },
  },
  {
    name: 'Arabic management shell',
    locale: 'ar',
    params: {
      locale: 'ar',
      role: 'management',
      session: 'signed-in',
      comments: 'error',
      queue: 'empty',
      reports: 'denied',
    },
  },
];

const visualCases = ['en', 'ar'].flatMap((locale) => buildVisualCases(locale));
const accessibilityCases = buildAccessibilityCases();
const performanceCases = buildPerformanceCases();
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

if (mode === 'perf') {
  checkPerformance(rendered);
}

console.log(`web ${mode} proof passed for ${rendered.length} staff shell previews`);

async function renderCase(testCase) {
  const started = performance.now();
  const page = await StaffShellPage({ searchParams: Promise.resolve(testCase.params) });
  const html = renderToStaticMarkup(page);
  return { ...testCase, html, ms: performance.now() - started };
}

function checkVisual(results) {
  for (const result of results) {
    expect(result.html.length > 12000, `${result.name} rendered blank or tiny HTML`);
    expect(result.html.includes(`dir="${staffShellText[result.locale].dir}"`), `${result.name} missing direction`);
    for (const signal of result.signals ?? defaultVisualSignals(result.locale)) {
      expect(result.html.includes(signal), `${result.name} missing visual signal: ${signal}`);
    }
    for (const className of result.classes ?? ['rounded-md', 'overflow-x-auto']) {
      expect(result.html.includes(className), `${result.name} missing visual class: ${className}`);
    }
    expect(count(result.html, '<section') >= 8, `${result.name} missing major content sections`);
  }
}

function checkAccessibility(results) {
  const css = readFileSync('apps/web/src/globals.css', 'utf8');
  expect(css.includes(':focus-visible'), 'global CSS missing focus-visible affordance');
  expect(css.includes('prefers-reduced-motion: reduce'), 'global CSS missing reduced-motion media query');
  for (const result of results) {
    const t = staffShellText[result.locale];
    expect(result.html.includes(`<main lang="${t.lang}" dir="${t.dir}"`), `${result.name} missing language or direction`);
    expect(result.html.includes(`aria-label="${t.title}"`), `${result.name} missing nav accessible name`);
    for (const signal of result.signals ?? []) {
      expect(result.html.includes(signal), `${result.name} missing accessibility signal: ${signal}`);
    }
    expect(count(result.html, 'aria-label=') >= 8, `${result.name} missing labelled regions`);
    expect(count(result.html, '<label') >= 8, `${result.name} missing form labels`);
    expect(count(result.html, 'focus:ring-2') >= 8, `${result.name} missing focus-ring affordances`);
    expect(!/<svg(?![^>]*aria-hidden="true")/.test(result.html), `${result.name} has visible SVG without aria-hidden`);
    expect(!/<button(?![^>]*\btype=)/.test(result.html), `${result.name} has button without explicit type`);
    expect(result.html.includes('role="status"') || result.html.includes('role="alert"'), `${result.name} missing feedback role`);
    if (result.a11y?.dialog) {
      expect(result.html.includes('role="dialog"'), `${result.name} missing dialog role`);
      expect(result.html.includes(`aria-label="${result.a11y.dialog}"`), `${result.name} missing dialog name`);
    }
    if (result.a11y?.minButtons) {
      expect(count(result.html, '<button') >= result.a11y.minButtons, `${result.name} missing named controls`);
    }
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
    expect(count(result.html, '<script') === 0, `${result.name} static proof unexpectedly emitted scripts`);
    expect(!/<img(?![^>]*(?:width|height)=)/.test(result.html), `${result.name} has image without dimensions`);
  }
}

function count(text, needle) {
  return text.split(needle).length - 1;
}

function expect(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function defaultVisualSignals(locale) {
  const t = staffShellText[locale];
  const reports = reportsDashboardText[locale];
  return [t.title, t.nav.dashboard[0], t.nav.queue[0], t.nav.notifications[0], reports.title, reports.export.title];
}

function buildVisualCases(locale) {
  const t = staffShellText[locale];
  const detail = complaintDetailText[locale];
  const adminBranches = adminBranchesText[locale];
  const adminUsers = adminUsersText[locale];
  const adminCategories = adminCategoriesSlaText[locale];
  const adminTemplates = adminNotificationTemplatesText[locale];
  const reports = reportsDashboardText[locale];
  const audit = auditViewerText[locale];
  const base = { locale, role: 'admin', session: 'signed-in' };

  return [
    visualCase('dashboard', locale, { ...base }, [
      t.dashboard.title,
      t.dashboard.cards.open[0],
      t.dashboard.cards.averageTat[0],
    ], ['md:grid-cols-3', 'xl:grid-cols-5']),
    visualCase('work queue', locale, { ...base, queue: 'empty' }, [
      t.workQueue.title,
      t.workQueue.filters.status,
      t.workQueue.pagination.page,
    ], ['md:grid-cols-5', 'overflow-x-auto']),
    visualCase('complaint create', locale, { ...base, create: 'validation' }, [
      t.createForm.title,
      t.createForm.fields.category,
      t.createForm.validation.vinRequired,
    ], ['md:grid-cols-2', 'md:col-span-2']),
    visualCase('complaint detail', locale, { ...base, attachment: 'clean' }, [
      detail.title,
      detail.sections.customer,
      detail.sections.timeline,
      detail.sections.attachments,
    ], ['xl:grid-cols-[1.1fr_0.9fr]', 'md:grid-cols-2']),
    visualCase('workflow modal', locale, { ...base, workflow: 'validation' }, [
      detail.sections.workflow,
      detail.workflow.actions[0],
      detail.workflow.validation,
    ], ['role="dialog"', 'xl:col-span-2']),
    visualCase('admin surfaces', locale, { ...base, admin: 'validation' }, [
      adminBranches.title,
      adminUsers.title,
      adminCategories.title,
      adminTemplates.title,
    ], ['overflow-x-auto', 'md:grid-cols-3']),
    visualCase('reports', locale, { ...base, reports: 'ready' }, [
      reports.title,
      reports.export.title,
      reports.export.scoped,
    ], ['min-w-[56rem]', 'md:grid-cols-3']),
    visualCase('audit viewer', locale, { ...base, admin: 'success' }, [
      audit.title,
      audit.filters.correlationId,
      audit.filters.export,
    ], ['xl:grid-cols-5', 'overflow-x-auto']),
  ];
}

function visualCase(surface, locale, params, signals, classes) {
  return {
    name: `${locale.toUpperCase()} ${surface} visual regression`,
    locale,
    params: { ...params, locale },
    signals,
    classes,
  };
}

function buildAccessibilityCases() {
  const en = 'en';
  const ar = 'ar';
  const enBase = { locale: en, role: 'admin', session: 'signed-in' };
  const arBase = { locale: ar, role: 'admin', session: 'signed-in' };
  const enText = staffShellText.en;
  const arText = staffShellText.ar;
  const enDetail = complaintDetailText.en;
  const arDetail = complaintDetailText.ar;

  return [
    accessibilityCase('dashboard status', en, { ...enBase, dashboard: 'loading' }, [enText.dashboard.title, enText.dashboard.states.loading]),
    accessibilityCase('dashboard alert', ar, { ...arBase, dashboard: 'error' }, [arText.dashboard.title, arText.dashboard.states.error]),
    accessibilityCase('queue form labels', en, { ...enBase, queue: 'empty' }, [enText.workQueue.title, enText.workQueue.filters.search], { minButtons: 3 }),
    accessibilityCase('queue alert', ar, { ...arBase, queue: 'error' }, [arText.workQueue.title, arText.workQueue.states.error]),
    accessibilityCase('create validation', en, { ...enBase, create: 'validation' }, [enText.createForm.title, enText.createForm.validation.vinRequired], { minButtons: 5 }),
    accessibilityCase('create network alert', ar, { ...arBase, create: 'network' }, [arText.createForm.title]),
    accessibilityCase('detail alert', en, { ...enBase, detail: 'error' }, [enDetail.title, enDetail.states.error]),
    accessibilityCase('workflow dialog', ar, { ...arBase, workflow: 'validation' }, [arDetail.sections.workflow, arDetail.workflow.comment], { dialog: arDetail.sections.workflow, minButtons: 8 }),
    accessibilityCase('admin feedback', en, { ...enBase, admin: 'validation' }, [adminUsersText.en.title, adminUsersText.en.states.validation], { minButtons: 8 }),
    accessibilityCase('reports denied', ar, { ...arBase, reports: 'denied' }, [reportsDashboardText.ar.title, reportsDashboardText.ar.states.denied], { minButtons: 5 }),
    accessibilityCase('audit status', en, { ...enBase, admin: 'success' }, [auditViewerText.en.title, auditViewerText.en.filters.correlationId], { minButtons: 8 }),
  ];
}

function accessibilityCase(surface, locale, params, signals, a11y = {}) {
  return {
    name: `${locale.toUpperCase()} ${surface} accessibility`,
    locale,
    params,
    signals,
    a11y,
  };
}

function buildPerformanceCases() {
  return [
    performanceCase('staff dashboard', 'en', { locale: 'en', role: 'staff', session: 'signed-in' }, [
      staffShellText.en.dashboard.title,
      staffShellText.en.dashboard.cards.open[0],
      staffShellText.en.dashboard.cards.warnings[0],
    ], { maxMs: 750, maxHtml: 90000, maxRows: 16, minResponsiveGuards: 4 }),
    performanceCase('staff work queue', 'ar', { locale: 'ar', role: 'staff', session: 'signed-in' }, [
      staffShellText.ar.workQueue.title,
      staffShellText.ar.workQueue.filters.search,
      staffShellText.ar.workQueue.pagination.page,
    ], { maxMs: 750, maxHtml: 90000, maxRows: 16, minResponsiveGuards: 4 }),
  ];
}

function performanceCase(surface, locale, params, signals, perf) {
  return {
    name: `${locale.toUpperCase()} ${surface} performance`,
    locale,
    params,
    signals,
    perf,
  };
}
