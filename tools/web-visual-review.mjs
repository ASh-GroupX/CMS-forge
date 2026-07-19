import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { compileTailwind, runBrowserArtifactChecks } from './web-browser-check.mjs';
import { routePage } from './web-proof-routes.mjs';
import { visualCases } from './web-proof-cases.mjs';

const webRequire = createRequire(new URL('../apps/web/package.json', import.meta.url));
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

function reviewHtml(testCase, renderedHtml) {
  const signals = (testCase.signals ?? []).map((signal) => `<li>${escapeHtml(signal)}</li>`).join('');
  const frameStyle = testCase.viewport?.width ? ` style="max-width:${testCase.viewport.width}px"` : '';
  return `<!doctype html>
<html class="${testCase.theme === 'dark' ? 'dark' : ''}" dir="${testCase.locale === 'ar' ? 'rtl' : 'ltr'}" lang="${testCase.locale}">
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
    .map((artifact) => `<li><a href="./${artifact.file}">${escapeHtml(artifact.name)}</a> &middot; <a href="./${artifact.file.replace(/\.html$/, '.png')}">PNG</a></li>`)
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
