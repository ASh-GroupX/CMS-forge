// Shared hermetic harness for the Kanban board e2e proofs (docs/CMSS_REVAMP_PLAN.md
// Phase C). Bundles a real board client island with fixture data + recording stub
// actions, compiles the proof Tailwind, and hydrates it in headless Chromium so a
// proof can drive genuine pointer/keyboard interaction — no live server or login.
// The Radix Sheet/Dialog portals mount for real here (unlike renderToStaticMarkup),
// which is exactly what lets Phase C register the OPEN drawer.
import assert from 'node:assert/strict';
import { mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { compileTailwind } from './web-browser-check.mjs';

// Bundle a `tsx` entry that imports the real island from apps/web and renders it.
export async function bundleIsland(entryContents) {
  const esbuild = createRequire(import.meta.url)(esbuildPath());
  const bundle = await esbuild.build({
    bundle: true,
    define: { 'process.env.NODE_ENV': '"production"' },
    format: 'iife',
    jsx: 'automatic',
    stdin: { contents: entryContents, loader: 'tsx', resolveDir: resolve('apps/web') },
    write: false,
  });
  return bundle.outputFiles[0].text;
}

// Write the hydrating HTML page + proof CSS into a fresh output directory.
export function writeBoardPage(outDir, jsText, { lang = 'en', dir = 'ltr' } = {}) {
  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });
  compileTailwind(outDir);
  const file = join(outDir, 'board.html');
  // Shim `process` so modules that read process.env.* at import time (e.g. the
  // client API wrappers' default API_URL) don't throw in the browser. NODE_ENV is
  // already inlined by esbuild; these env reads sit on never-invoked fetch paths.
  writeFileSync(file, `<!doctype html>
<html dir="${dir}" lang="${lang}"><head><meta charset="utf-8" /><title>board island proof</title><link rel="stylesheet" href="./proof.css" /></head>
<body><div id="root"></div><script>globalThis.process=globalThis.process||{env:{}};</script><script>${jsText}</script></body></html>`);
  return pathToFileURL(file).href;
}

export async function loadPlaywright() {
  const entryDir = pnpmPackage('playwright-core@');
  return import(pathToFileURL(join(entryDir, 'node_modules', 'playwright-core', 'index.mjs')).href);
}

// AxeBuilder for live a11y assertions against an interacted (open-drawer) page.
export async function loadAxe() {
  const { AxeBuilder } = await import('@axe-core/playwright');
  return AxeBuilder;
}

export async function assertNoSeriousAxe(AxeBuilder, page, name) {
  const results = await new AxeBuilder({ page }).analyze();
  const violations = results.violations.filter((violation) => ['critical', 'serious'].includes(violation.impact));
  assert.equal(violations.length, 0, `${name} axe violations: ${violations.map((v) => `${v.id} (${v.impact})`).join(', ')}`);
}

function esbuildPath() {
  const dir = pnpmPackage('esbuild@');
  return join(dir, 'node_modules', 'esbuild', 'lib', 'main.js');
}

function pnpmPackage(prefix) {
  const pnpmDir = resolve('node_modules', '.pnpm');
  const entryDir = readdirSync(pnpmDir).find((name) => name.startsWith(prefix));
  assert.ok(entryDir, `${prefix} package must be installed`);
  return join(pnpmDir, entryDir);
}
