import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { mkdirSync, readFileSync, realpathSync } from 'node:fs';
import { resolve } from 'node:path';
import { chromium } from 'playwright-core';
import { compileTailwind } from './web-browser-check.mjs';
import { Fixture } from '../apps/web/test/browser/report-board.fixture.tsx';

const requireWeb = createRequire(new URL('../apps/web/package.json', import.meta.url));
const { renderToString } = requireWeb('react-dom/server');
const React = requireWeb('react');
const { build } = createRequire(realpathSync('node_modules/tsx/package.json'))('esbuild');
const output = resolve('coverage/report-board-browser');
mkdirSync(output, { recursive: true });
compileTailwind(output);
await build({
  entryPoints: ['apps/web/test/browser/report-board.fixture.tsx'], bundle: true, platform: 'browser',
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
const browser = await chromium.launch({ headless: true });
let assertions = 0;
try {
  for (const locale of ['en', 'ar']) {
    const page = await browser.newPage({ viewport: { width: locale === 'en' ? 1440 : 390, height: 1000 } });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const requests = [];
    let fail = false;
    let delay = 0;
    await page.route('**/api/reports/*', async route => {
      const url = new URL(route.request().url());
      requests.push(url);
      const wait = delay;
      if (wait) await new Promise(done => setTimeout(done, wait));
      if (fail) return route.fulfill({ status: 500, body: '{}' });
      const status = url.searchParams.get('status');
      const ticket = url.pathname.includes('tickets-records');
      const offset = Number(url.searchParams.get('offset'));
      const department = url.searchParams.get('targetDepartmentId') || url.searchParams.get('departmentId') || 'all';
      const total = status === 'IN_PROGRESS' ? 26 : 0;
      const items = Array.from({ length: Math.min(25, total - offset) }, (_, index) => ({
        id: `${department}-${ticket ? 'ticket' : 'complaint'}-${offset + index}`, referenceNumber: `${ticket ? 'TK' : 'CMP'}-${department}-${offset + index}`,
        title: 'Brake inspection', subject: 'Brake inspection', status, priority: 'HIGH', severity: 'HIGH',
        createdAt: '2026-11-01T08:30:00Z', requestedByName: 'Creator', createdByName: 'Creator', customerName: 'Customer',
        acceptedByName: 'Acceptor', assignedEmployeeName: 'Owner', ownerName: 'Owner',
        creatingDepartmentName: 'Reception', targetDepartmentName: department, departmentName: department,
      }));
      await route.fulfill({ json: { items, total } }).catch(() => {});
    });
    const base = `http://127.0.0.1:${server.address().port}`;
    await page.goto(`${base}/?locale=${locale}`);
    await page.getByText('Brake inspection', { exact: true }).first().waitFor();
    assert.equal(requests.length, 18); assertions++;
    assert.ok(requests.every(url => url.searchParams.get('limit') === '25' && url.searchParams.get('offset') === '0')); assertions++;
    const column = page.locator('section').filter({ has: page.getByText(locale === 'en' ? 'In progress' : 'قيد التنفيذ', { exact: true }) });
    fail = true;
    await column.getByRole('button').click();
    await column.getByRole('button', { name: /retry|إعادة/i }).waitFor();
    fail = false;
    await column.getByRole('button').click();
    await page.getByRole('link', { name: 'TK-all-25', exact: true }).waitFor();
    assert.equal(requests.filter(url => url.searchParams.get('offset') === '25').length, 4); assertions++;
    assert.match(await page.getByRole('link', { name: 'TK-all-0', exact: true }).getAttribute('href'), /returnTo=reports&locale=/); assertions++;
    await page.getByRole('link', { name: 'TK-all-0', exact: true }).scrollIntoViewIfNeeded();
    await page.getByRole('link', { name: 'TK-all-0', exact: true }).evaluate(link => link.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'instant' }));
    const selection = page.getByRole('group', { name: locale === 'en' ? 'Status columns to display' : 'أعمدة الحالات المعروضة' });
    const requestCountBeforeSelection = requests.length;
    await selection.getByRole('button', { name: locale === 'en' ? 'Clear selection' : 'مسح التحديد', exact: true }).click();
    assert.equal(await page.locator('section').count(), 0); assertions++;
    assert.ok(await selection.getByText(locale === 'en' ? 'Select at least one status above to display its column.' : 'حدد حالة واحدة على الأقل أعلاه لعرض عمودها.', { exact: true }).isVisible()); assertions++;
    await selection.getByRole('checkbox', { name: locale === 'en' ? 'In progress' : 'قيد التنفيذ', exact: true }).check();
    await selection.getByRole('checkbox', { name: locale === 'en' ? 'Completed' : 'مكتملة', exact: true }).check();
    assert.equal(await page.locator('section').count(), 2); assertions++;
    assert.equal(await page.getByRole('link', { name: 'TK-all-25', exact: true }).count(), 1); assertions++;
    await page.screenshot({ path: `${output}/${locale}-populated.png`, fullPage: true });
    await selection.getByRole('checkbox', { name: locale === 'en' ? 'Select all' : 'تحديد الكل', exact: true }).check();
    assert.equal(await page.locator('section').count(), 14); assertions++;
    assert.equal(requests.length, requestCountBeforeSelection); assertions++;
    const dates = page.locator('input[type=date]');
    await Promise.all([
      page.waitForRequest(request => new URL(request.url()).searchParams.get('dateFrom') === '2026-10-01'),
      dates.first().fill('2026-10-01'),
    ]);
    await page.getByText('Brake inspection', { exact: true }).first().waitFor();
    assert.equal(requests.at(-1).searchParams.get('dateFrom'), '2026-10-01'); assertions++;
    assert.equal(requests.at(-1).searchParams.get('dateTo'), '9999-12-31'); assertions++;
    // Exercise Radix department selection, failure recovery, and overlapping requests.
    await page.getByRole('combobox').click();
    await page.getByRole('option', { name: locale === 'en' ? 'Service' : 'الصيانة', exact: true }).click();
    await page.getByRole('link', { name: 'TK-service-0', exact: true }).waitFor();
    fail = true;
    await dates.last().fill('2026-11-01');
    await page.getByRole('alert').waitFor();
    fail = false;
    await page.getByRole('alert').getByRole('button').click();
    await page.getByRole('link', { name: 'TK-service-0', exact: true }).waitFor(); assertions++;
    delay = 500;
    await dates.first().fill('2026-09-01');
    await page.waitForTimeout(50);
    delay = 0;
    await page.getByRole('combobox').click();
    await page.getByRole('option', { name: locale === 'en' ? 'Sales' : 'المبيعات', exact: true }).click();
    await page.getByRole('link', { name: 'TK-sales-0', exact: true }).waitFor();
    await page.waitForTimeout(650);
    assert.equal(await page.getByRole('link', { name: 'TK-service-0', exact: true }).count(), 0); assertions++;
    assert.deepEqual(errors, []); assertions++;
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2)); assertions++;
    requests.length = 0;
    await page.goto(`${base}/?locale=${locale}&status=OPEN&from=2026-10-01`);
    await page.getByRole('link', { name: 'TK-all-0', exact: true }).waitFor();
    assert.ok(requests.every(url => url.searchParams.get('view') === 'active')); assertions++;
    assert.ok(requests.some(url => url.searchParams.get('dateFrom') === '2026-10-01')); assertions++;
    await page.goto(`${base}/?locale=${locale}&status=WAITING`);
    await page.getByText(locale === 'en' ? 'No records match these filters.' : 'لا توجد سجلات تطابق عوامل التصفية.', { exact: true }).waitFor();
    assertions++;
    await page.close();
  }
  console.log(`Hydrated report board browser proof passed: ${assertions} assertions; EN desktop / AR mobile screenshots in ${output}`);
} finally {
  await browser.close();
  await new Promise(done => server.close(done));
}
