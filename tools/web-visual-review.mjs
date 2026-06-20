import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import StaffShellPage from '../apps/web/src/app/page.tsx';
import PortalSubmissionPage from '../apps/web/src/app/portal/page.tsx';
import PortalSurveyPage from '../apps/web/src/app/portal/survey/page.tsx';
import PortalTrackingPage from '../apps/web/src/app/portal/track/page.tsx';
import { visualCases } from './web-proof-cases.mjs';

const webRequire = createRequire(new URL('../apps/web/package.json', import.meta.url));
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

function routePage(testCase) {
  const params = Promise.resolve(testCase.params);
  if (testCase.route === 'portal-submission') return PortalSubmissionPage({ searchParams: params });
  if (testCase.route === 'portal-tracking') return PortalTrackingPage({ searchParams: params });
  if (testCase.route === 'portal-survey') return PortalSurveyPage({ searchParams: params });
  return StaffShellPage({ searchParams: params });
}

function reviewHtml(testCase, renderedHtml) {
  const signals = (testCase.signals ?? []).map((signal) => `<li>${escapeHtml(signal)}</li>`).join('');
  return `<!doctype html>
<html lang="${testCase.locale}">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(testCase.name)}</title>
  <style>
    body { margin: 0; font-family: ui-sans-serif, system-ui, sans-serif; }
    aside { padding: 12px 16px; border-bottom: 1px solid #d4d4d8; background: #fafafa; }
    main { padding: 16px; }
  </style>
</head>
<body>
  <aside>
    <strong>${escapeHtml(testCase.name)}</strong>
    <p>Inspect layout, overflow, RTL/LTR direction, labels, and state messaging before approving golden-screen work.</p>
    <ul>${signals}</ul>
  </aside>
  <main>${renderedHtml}</main>
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
