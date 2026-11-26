import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { mkdirSync, readFileSync, realpathSync } from 'node:fs';
import { resolve } from 'node:path';
import { chromium } from 'playwright-core';
import { compileTailwind } from './web-browser-check.mjs';
import { Fixture } from '../apps/web/test/browser/report-workspace.fixture.tsx';

const requireWeb = createRequire(new URL('../apps/web/package.json', import.meta.url));
const { renderToString } = requireWeb('react-dom/server');
const React = requireWeb('react');
const { build } = createRequire(realpathSync('node_modules/tsx/package.json'))('esbuild');
const output = resolve('coverage/report-workspace-browser');
mkdirSync(output, { recursive: true });
compileTailwind(output);
await build({
  entryPoints: ['apps/web/test/browser/report-workspace.fixture.tsx'], bundle: true, platform: 'browser',
  outfile: `${output}/fixture.js`, jsx: 'automatic', define: { 'process.env.NODE_ENV': '"development"' },
  plugins: [{ name: 'isolated-next-adapters', setup(builder) {
    builder.onResolve({ filter: /^next\/(link|headers)$/ }, args => ({ path: args.path, namespace: 'next-test' }));
    builder.onLoad({ filter: /.*/, namespace: 'next-test' }, args => ({
      contents: args.path === 'next/link'
        ? 'import React from "react"; export default function Link(props) { return React.createElement("a", props); }'
        : 'export async function headers() { throw new Error("Server headers unavailable in browser"); }',
      resolveDir: resolve('apps/web'), loader: 'js',
    }));
  } }],
});
const server = createServer((req, res) => {
  if (req.url === '/fixture.js' || req.url === '/proof.css') {
    res.setHeader('Content-Type', req.url.endsWith('.js') ? 'text/javascript' : 'text/css');
    return res.end(readFileSync(`${output}${req.url}`));
  }
  const locale = req.url?.includes('ar') ? 'ar' : 'en';
  const query = new URL(req.url, 'http://localhost').searchParams;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.end(`<!doctype html><html lang="${locale}"><head><link rel="stylesheet" href="/proof.css"></head><body><div id="root">${renderToString(React.createElement(Fixture, { locale, status: query.get('status'), from: query.get('from') }))}</div><script src="/fixture.js"></script></body></html>`);
});
await new Promise(done => server.listen(0, '127.0.0.1', done));
const browser = await chromium.launch({ headless: true, args: ['--disable-features=BackForwardCache'] });

try {
  for (const locale of ['en', 'ar']) {
    const page = await browser.newPage({ viewport: { width: locale === 'en' ? 1440 : 390, height: 1000 } });
    const requests = [];
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    await page.route('**/api/reports/*', async route => {
      const url = new URL(route.request().url());
      requests.push(url);
      if (url.pathname.includes('department')) return route.fulfill({ json: [] });
      if (url.pathname.includes('analytics')) return route.fulfill({ json: {
        kpis: { totalCreated: 70, openWorkload: 4, inProgress: 2, waiting: 0, resolved: 66, closed: 0, overdue: 2, unassigned: 1, onTimeSlaRate: 90, slaComplianceRate: 90, avgResolutionDays: 2, avgResolutionHours: 48, deltas: {} },
        timeline: [], statusBreakdown: [], agingBuckets: [], officers: [],
      } });
      const status = url.searchParams.get('status');
      const items = status === 'IN_PROGRESS' ? [{
        id: 'proof', referenceNumber: 'PROOF-001', title: 'Report proof', subject: 'Report proof',
        status, priority: 'HIGH', severity: 'HIGH', createdAt: '2026-11-01T08:00:00Z',
        requestedByName: 'Requester', customerName: 'Customer', assignedEmployeeName: 'Owner', ownerName: 'Owner',
        targetDepartmentName: 'Service', departmentName: 'Service', creatingDepartmentName: 'Reception',
      }] : [];
      return route.fulfill({ json: { items, total: items.length } });
    });
    await page.goto('http://127.0.0.1:' + server.address().port + '/?locale=' + locale);
    const overdue = page.getByRole('button').filter({ hasText: locale === 'en' ? 'Overdue' : 'متأخر' }).first();
    await overdue.waitFor();
    await overdue.click();
    await page.getByText('PROOF-001', { exact: true }).first().waitFor();
    assert.equal(await page.getByRole('tab', { selected: true }).textContent(), locale === 'en' ? 'Records' : 'السجلات');
    assert.equal(await page.evaluate(() => document.activeElement?.tagName), 'SECTION');
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2));
    const recordRequests = requests.filter(url => url.pathname.includes('-records'));
    assert.ok(recordRequests.length > 0);
    assert.ok(recordRequests.every(url => url.searchParams.get('view') === 'overdue'));
    await page.getByRole('button', { name: locale === 'en' ? 'Export as CSV' : 'تصدير كملف CSV', exact: true }).click();
    await page.getByRole('button', { name: locale === 'en' ? 'Customer Complaints (CSV)' : 'شكاوى العملاء (CSV)', exact: true }).waitFor();
    await page.screenshot({ path: output + '/' + locale + '-records.png', fullPage: true });
    await page.getByRole('tab', { name: locale === 'en' ? 'Overview' : 'نظرة عامة', exact: true }).click();
    await overdue.focus(); await page.keyboard.press('Enter');
    await page.getByText('PROOF-001', { exact: true }).first().waitFor();
    assert.equal(new URL(page.url()).searchParams.get('report.status'), 'overdue');
    await page.reload();
    await page.getByText('PROOF-001', { exact: true }).first().waitFor();
    assert.equal(await page.getByRole('tab', { selected: true }).textContent(), locale === 'en' ? 'Records' : 'السجلات');
    await page.goto('http://127.0.0.1:' + server.address().port + '/?locale=' + locale);
    await page.getByText('PROOF-001', { exact: true }).first().waitFor();
    assert.equal(await page.getByRole('tab', { selected: true }).textContent(), locale === 'en' ? 'Records' : 'السجلات');
    assert.deepEqual(errors, []);
    await page.close();
  }
  console.log('Report workspace click and keyboard drill-down passed EN/AR.');
} finally { await browser.close(); await new Promise(done => server.close(done)); }
