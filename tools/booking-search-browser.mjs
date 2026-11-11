import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { mkdirSync, readFileSync, realpathSync } from 'node:fs';
import { resolve } from 'node:path';
import { chromium } from 'playwright-core';
import { AxeBuilder } from '@axe-core/playwright';
import { compileTailwind } from './web-browser-check.mjs';
import { BookingSearchFixture } from '../apps/web/test/browser/booking-search.fixture.tsx';
import { bookingSearchCopy } from '../apps/web/src/app/(staff)/service-booking/booking-search-copy.ts';

const output = resolve('coverage/booking-search-browser');
const webRequire = createRequire(new URL('../apps/web/package.json', import.meta.url));
const React = webRequire('react');
const { renderToString } = webRequire('react-dom/server');
mkdirSync(output, { recursive: true });
compileTailwind(output);
const { build } = createRequire(realpathSync('node_modules/tsx/package.json'))('esbuild');
await build({ entryPoints: ['apps/web/test/browser/booking-search.fixture.tsx'], bundle: true,
  platform: 'browser', outfile: `${output}/fixture.js`, jsx: 'automatic',
  define: { 'process.env.NODE_ENV': '"development"', 'process.env.NEXT_PUBLIC_API_URL': '""' },
  tsconfig: 'apps/web/tsconfig.json' });
const server = createServer((req, res) => {
  if (req.url === '/fixture.js' || req.url === '/proof.css') {
    res.setHeader('Content-Type', req.url.endsWith('.js') ? 'text/javascript' : 'text/css');
    return res.end(readFileSync(`${output}${req.url}`));
  }
  const locale = new URL(req.url ?? '/', 'http://localhost').searchParams.get('locale') === 'ar' ? 'ar' : 'en';
  const loadError = new URL(req.url ?? '/', 'http://localhost').searchParams.get('error') === '1';
  const markup = renderToString(React.createElement(BookingSearchFixture, { locale, loadError }));
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.end(`<!doctype html><html lang="${locale}" data-load-error="${loadError ? '1' : '0'}"><head><title>${bookingSearchCopy[locale].title}</title><link rel="stylesheet" href="/proof.css"></head><body><div id="root">${markup}</div><script src="/fixture.js"></script></body></html>`);
});
await new Promise((done) => server.listen(0, '127.0.0.1', done));
const browser = await chromium.launch({ headless: true });
try {
  for (const locale of ['en', 'ar']) {
    const context = await browser.newContext({ viewport: { width: locale === 'en' ? 1280 : 390, height: 900 } });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.route('**/service-bookings/slots-availability**', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: 'null' }));
    await page.goto(`http://127.0.0.1:${server.address().port}/?locale=${locale}`);
    const search = page.getByRole('searchbox', { name: bookingSearchCopy[locale].placeholder });
    await search.fill('Alice');
    const results = page.getByRole('listitem');
    assert.equal(await results.count(), 2, `${locale}: name matches all dates`);
    await results.first().getByText(locale === 'ar' ? 'ملغي' : 'Cancelled').waitFor({ state: 'visible' });
    await page.screenshot({ path: `${output}/${locale}-results.png`, fullPage: true });
    const accessibility = await new AxeBuilder({ page }).analyze();
    const severe = accessibility.violations.filter((violation) => ['critical', 'serious'].includes(violation.impact));
    assert.deepEqual(severe.map((violation) => ({ id: violation.id, targets: violation.nodes.map((node) => node.target.join(' ')) })), []);
    await results.first().getByRole('button', { name: new RegExp(bookingSearchCopy[locale].view) }).click();
    const probe = page.locator('#selection-probe');
    await page.waitForFunction(() => document.querySelector('#selection-probe')?.getAttribute('data-detail-open') === 'true');
    assert.equal(await probe.getAttribute('data-selected-id'), 'recent');
    assert.equal(await probe.getAttribute('data-date'), '2026-11-05');
    assert.equal(await probe.getAttribute('data-branch'), 'center_north');
    assert.equal(await probe.getAttribute('data-view'), 'day');
    await search.fill('0791112233');
    assert.equal(await results.count(), 2, `${locale}: phone punctuation normalization`);
    await search.fill('0798884444');
    assert.equal(await results.count(), 1, `${locale}: Arabic stored digits match Latin input`);
    await search.fill('٠٧٩٨٨٨٤٤٤٤');
    assert.equal(await results.count(), 1, `${locale}: Arabic query digits match`);
    await search.fill('not a customer');
    await page.getByText(bookingSearchCopy[locale].empty).waitFor({ state: 'visible' });
    await page.getByRole('button', { name: bookingSearchCopy[locale].clear }).click();
    assert.equal(await search.inputValue(), '');
    await page.getByText(bookingSearchCopy[locale].hint).waitFor({ state: 'visible' });
    assert.deepEqual(errors, [], `${locale}: browser errors`);
    await context.close();
    const errorPage = await browser.newPage({ viewport: { width: locale === 'en' ? 1280 : 390, height: 900 } });
    await errorPage.goto(`http://127.0.0.1:${server.address().port}/?locale=${locale}&error=1`);
    await errorPage.getByRole('alert').getByText(bookingSearchCopy[locale].error).waitFor({ state: 'visible' });
    assert.equal(await errorPage.getByRole('searchbox').isDisabled(), true);
    await errorPage.getByRole('button', { name: bookingSearchCopy[locale].retry }).waitFor({ state: 'visible' });
    await errorPage.screenshot({ path: `${output}/${locale}-error.png`, fullPage: true });
    await Promise.all([errorPage.waitForNavigation(), errorPage.getByRole('button', { name: bookingSearchCopy[locale].retry }).click()]);
    await errorPage.getByRole('alert').waitFor({ state: 'visible' });
    await errorPage.close();
  }
} finally {
  await browser.close();
  await new Promise((done) => server.close(done));
}
console.log('Booking search browser proof passed for EN desktop and AR mobile.');
