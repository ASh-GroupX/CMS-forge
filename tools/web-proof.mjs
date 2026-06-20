import { readFileSync } from 'node:fs';
import { performance } from 'node:perf_hooks';
import { createRequire } from 'node:module';
import StaffShellPage from '../apps/web/src/app/page.tsx';
import PortalSubmissionPage from '../apps/web/src/app/portal/page.tsx';
import PortalSurveyPage from '../apps/web/src/app/portal/survey/page.tsx';
import PortalTrackingPage from '../apps/web/src/app/portal/track/page.tsx';
import { portalSubmissionText } from '../apps/web/src/i18n/portal-submission.ts';
import { portalSurveyText } from '../apps/web/src/i18n/portal-survey.ts';
import { portalTrackingText } from '../apps/web/src/i18n/portal-tracking.ts';
import { staffShellText } from '../apps/web/src/i18n/staff-shell.ts';
import { accessibilityCases, defaultVisualSignals, performanceCases, smokeCases, visualCases } from './web-proof-cases.mjs';

const webRequire = createRequire(new URL('../apps/web/package.json', import.meta.url));
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

function routePage(testCase) {
  const params = Promise.resolve(testCase.params);
  if (testCase.route === 'portal-submission') return PortalSubmissionPage({ searchParams: params });
  if (testCase.route === 'portal-tracking') return PortalTrackingPage({ searchParams: params });
  if (testCase.route === 'portal-survey') return PortalSurveyPage({ searchParams: params });
  return StaffShellPage({ searchParams: params });
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
  for (const token of ['--color-brand', '--color-neutral', '--color-neutral-foreground', '--color-success', '--color-error', '--focus-ring']) {
    expect(css.includes(token), `global CSS missing contrast/focus token ${token}`);
  }
  for (const route of ['staff', 'portal-submission', 'portal-tracking', 'portal-survey']) {
    for (const locale of ['en', 'ar']) {
      expect(results.some((result) => result.route === route && result.locale === locale), `accessibility proof missing ${route} ${locale}`);
    }
  }
  for (const result of results) {
    const t = routeText(result);
    expect(result.html.includes(`<main lang="${t.lang}" dir="${t.dir}"`), `${result.name} missing language or direction`);
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

function routeText(result) {
  if (result.route === 'portal-submission') return portalSubmissionText[result.locale];
  if (result.route === 'portal-tracking') return portalTrackingText[result.locale];
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

function expect(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}
