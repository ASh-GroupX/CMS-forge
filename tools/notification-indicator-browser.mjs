import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { mkdirSync, readFileSync, realpathSync } from 'node:fs';
import { resolve } from 'node:path';
import { chromium } from 'playwright-core';
import { compileTailwind } from './web-browser-check.mjs';
import { NotificationFixture } from '../apps/web/test/browser/notification-indicator.fixture.tsx';
import { notificationCenterText } from '../apps/web/src/i18n/staff-notification-center.ts';

const webRequire = createRequire(new URL('../apps/web/package.json', import.meta.url));
const { renderToString } = webRequire('react-dom/server');
const React = webRequire('react');
const { build } = createRequire(realpathSync('node_modules/tsx/package.json'))('esbuild');
const output = resolve('coverage/notification-indicator-browser');
mkdirSync(output, { recursive: true });
compileTailwind(output);
await build({ entryPoints: ['apps/web/test/browser/notification-indicator.fixture.tsx'], bundle: true, platform: 'browser',
  outfile: `${output}/fixture.js`, jsx: 'automatic', tsconfig: 'apps/web/tsconfig.json', define: { 'process.env.NODE_ENV': '"development"' } });
const server = createServer((req, res) => {
  if (req.url === '/fixture.js' || req.url === '/proof.css') {
    res.setHeader('Content-Type', req.url.endsWith('.js') ? 'text/javascript' : 'text/css');
    return res.end(readFileSync(`${output}${req.url}`));
  }
  const locale = req.url?.includes('ar') ? 'ar' : 'en';
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.end(`<!doctype html><html lang="${locale}"><head><title>Notifications</title><link rel="stylesheet" href="/proof.css"></head><body><div id="root">${renderToString(React.createElement(NotificationFixture, { locale }))}</div><script src="/fixture.js"></script></body></html>`);
});
await new Promise(done => server.listen(0, '127.0.0.1', done));
const browser = await chromium.launch({ headless: true });
try {
  for (const locale of ['en', 'ar']) {
    const page = await browser.newPage({ viewport: { width: locale === 'en' ? 1280 : 390, height: 900 } });
    await page.clock.install();
    const copy = notificationCenterText[locale];
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    let count = 3, fail = false;
    await page.route('**/api/notifications?*', route => {
      const url = new URL(route.request().url());
      assert.equal(url.searchParams.get('view'), 'unread');
      assert.equal(url.searchParams.get('limit'), '100');
      return fail ? route.fulfill({ status: 503, body: '{}' }) : route.fulfill({ json: { items: Array.from({ length: count }, (_, id) => ({ id })) } });
    });
    await page.goto(`http://127.0.0.1:${server.address().port}/?${locale}`);
    const link = page.locator('nav a').first();
    const number = new Intl.NumberFormat(locale === 'ar' ? 'ar-JO' : 'en');
    await page.waitForFunction(text => document.querySelector('nav a')?.getAttribute('aria-label')?.includes(text), number.format(3));
    assert.ok((await link.getAttribute('class')).includes('bg-brand/10'));
    assert.equal(await link.getAttribute('href'), `/notifications?locale=${locale}`);
    assert.ok((await link.boundingBox()).height >= 44);
    assert.ok(await page.getByText(locale === 'ar' ? 'يرجى مراجعة المهمة والتحديثات الأخيرة.' : 'Review the task and its latest updates.', { exact: true }).isVisible());
    await page.screenshot({ path: `${output}/${locale}-unread.png`, fullPage: true });
    count = 0;
    await page.evaluate(() => window.dispatchEvent(new Event('focus')));
    await page.getByRole('status').getByText(copy.indicator.caughtUp, { exact: true }).waitFor();
    assert.ok(!(await link.getAttribute('class')).includes('bg-brand/10'));
    count = 100;
    await page.evaluate(() => window.dispatchEvent(new Event('focus')));
    await page.waitForFunction(() => document.querySelector('nav a')?.getAttribute('aria-label')?.includes('99+'));
    fail = true;
    await page.evaluate(() => window.dispatchEvent(new Event('focus')));
    await page.getByRole('link', { name: copy.indicator.unavailable, exact: true }).waitFor();
    fail = false; count = 2;
    await page.evaluate(() => window.dispatchEvent(new Event('focus')));
    await page.waitForFunction(text => document.querySelector('nav a')?.getAttribute('aria-label')?.includes(text), number.format(2));
    count = 4;
    await page.clock.fastForward(30000);
    await page.waitForFunction(text => document.querySelector('nav a')?.getAttribute('aria-label')?.includes(text), number.format(4));
    await page.evaluate(() => Object.defineProperty(document, 'hidden', { configurable: true, value: true }));
    count = 5;
    await page.clock.fastForward(30000);
    assert.ok((await link.getAttribute('aria-label')).includes(number.format(4)));
    await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, value: false }); document.dispatchEvent(new Event('visibilitychange')); });
    await page.waitForFunction(text => document.querySelector('nav a')?.getAttribute('aria-label')?.includes(text), number.format(5));
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2));
    assert.deepEqual(errors, []);
    await page.close();
  }
  console.log('Notification indicator browser proof passed: EN desktop / AR mobile, counts, read clearing, cap, failure recovery and navigation.');
} finally {
  await browser.close();
  await new Promise(done => server.close(done));
}
