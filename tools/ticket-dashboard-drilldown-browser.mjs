import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { mkdirSync, readFileSync, realpathSync } from 'node:fs';
import { resolve } from 'node:path';
import { chromium } from 'playwright-core';
import { AxeBuilder } from '@axe-core/playwright';
import { compileTailwind } from './web-browser-check.mjs';
import { TicketDashboardDrilldownFixture } from '../apps/web/test/browser/ticket-dashboard-drilldown.fixture.tsx';

const requireWeb = createRequire(new URL('../apps/web/package.json', import.meta.url));
const { renderToString } = requireWeb('react-dom/server');
const React = requireWeb('react');
const { build } = createRequire(realpathSync('node_modules/tsx/package.json'))('esbuild');
const output = resolve('coverage/ticket-dashboard-drilldown-browser');
mkdirSync(output, { recursive: true });
compileTailwind(output);
await build({
  entryPoints: ['apps/web/test/browser/ticket-dashboard-drilldown.fixture.tsx'], bundle: true, platform: 'browser',
  outfile: `${output}/fixture.js`, jsx: 'automatic', define: { 'process.env.NODE_ENV': '"development"' },
  plugins: [{ name: 'next-proof-adapters', setup(builder) {
    builder.onResolve({ filter: /^next\/(link|navigation)$/ }, args => ({ path: args.path, namespace: 'next-test' }));
    builder.onLoad({ filter: /.*/, namespace: 'next-test' }, args => ({
      contents: args.path === 'next/link'
        ? 'import React from "react"; export default function Link(props) { return React.createElement("a", props); }'
        : 'export const useRouter=()=>({push(){},replace(){}}); export const usePathname=()=>"/dashboard"; export const useSearchParams=()=>new URLSearchParams();',
      resolveDir: resolve('apps/web'), loader: 'js',
    }));
  } }],
});

const server = createServer((req, res) => {
  if (req.url === '/fixture.js' || req.url === '/proof.css') {
    res.setHeader('Content-Type', req.url.endsWith('.js') ? 'text/javascript' : 'text/css');
    return res.end(readFileSync(`${output}${req.url}`));
  }
  const locale = req.url?.includes('locale=ar') ? 'ar' : 'en';
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.end(`<!doctype html><html lang="${locale}"><head><meta charset="utf-8"><title>Ticket dashboard proof</title><link rel="stylesheet" href="/proof.css"></head><body><div id="root">${renderToString(React.createElement(TicketDashboardDrilldownFixture, { locale }))}</div><script src="/fixture.js"></script></body></html>`);
});
await new Promise((done) => server.listen(0, '127.0.0.1', done));
const browser = await chromium.launch({ headless: true });
try {
  for (const locale of ['en', 'ar']) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1100 } });
    const page = await context.newPage();
    await page.goto(`http://127.0.0.1:${server.address().port}/?locale=${locale}`);
    await page.getByRole('link', { name: locale === 'en' ? 'View justified complaints' : 'عرض الشكاوى المبررة' }).waitFor();
    assert.equal(await page.getByRole('link', { name: locale === 'en' ? 'View justified complaints' : 'عرض الشكاوى المبررة' }).getAttribute('href'), `/complaints?isJustified=true&locale=${locale}`);
    const received = page.getByRole('link', { name: locale === 'en' ? 'Received by my department: 12' : 'واردة إلى قسمي: 12' });
    const sent = page.getByRole('link', { name: locale === 'en' ? 'Sent by my department: 9' : 'مرسلة من قسمي: 9' });
    assert.equal(await received.getAttribute('href'), `/internal-tickets/my-work?filter=department-received&locale=${locale}`);
    assert.equal(await sent.getAttribute('href'), `/internal-tickets/my-work?filter=department-sent&locale=${locale}`);
    assert.equal(await page.locator('section').first().locator('h3').count(), 3);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2));
    const severe = (await new AxeBuilder({ page }).include('section[aria-labelledby="department-ticket-flows"]').analyze()).violations.filter((item) => ['serious', 'critical'].includes(item.impact));
    assert.deepEqual(severe.map((item) => item.id), []);
    await page.screenshot({ path: `${output}/${locale}.png`, fullPage: true });
    await context.close();
  }
  console.log(`Ticket/dashboard browser proof passed; EN/AR screenshots in ${output}`);
} finally {
  await browser.close();
  await new Promise((done) => server.close(done));
}
