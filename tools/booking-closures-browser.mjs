import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { mkdirSync, readFileSync, realpathSync } from 'node:fs';
import { resolve } from 'node:path';
import { chromium } from 'playwright-core';
import { AxeBuilder } from '@axe-core/playwright';
import { compileTailwind } from './web-browser-check.mjs';
import { BookingClosuresFixture } from '../apps/web/test/browser/booking-closures.fixture.tsx';
import { bookingClosuresText } from '../apps/web/src/i18n/staff-booking-closures.ts';

const output = resolve('coverage/booking-closures-browser');
mkdirSync(output, { recursive: true });
compileTailwind(output);
const webRequire = createRequire(new URL('../apps/web/package.json', import.meta.url));
const React = webRequire('react');
const { renderToString } = webRequire('react-dom/server');
const { build } = createRequire(realpathSync('node_modules/tsx/package.json'))('esbuild');
await build({ entryPoints: ['apps/web/test/browser/booking-closures.fixture.tsx'], bundle: true,
  platform: 'browser', outfile: `${output}/fixture.js`, jsx: 'automatic',
  define: { 'process.env.NODE_ENV': '"development"', 'process.env.NEXT_PUBLIC_API_URL': '""' },
  tsconfig: 'apps/web/tsconfig.json' });
const server = createServer((req, res) => {
  if (req.url === '/fixture.js' || req.url === '/proof.css') {
    res.setHeader('Content-Type', req.url.endsWith('.js') ? 'text/javascript' : 'text/css');
    return res.end(readFileSync(`${output}${req.url}`));
  }
  const locale = req.url?.includes('ar') ? 'ar' : 'en';
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.end(`<!doctype html><html lang="${locale}"><head><title>${bookingClosuresText[locale].title}</title><link rel="stylesheet" href="/proof.css"></head><body><div id="root">${renderToString(React.createElement(BookingClosuresFixture, { locale }))}</div><script src="/fixture.js"></script></body></html>`);
});
await new Promise((done) => server.listen(0, '127.0.0.1', done));
const browser = await chromium.launch({ headless: true });
try {
  for (const locale of ['en', 'ar']) {
    const context = await browser.newContext({ viewport: { width: locale === 'en' ? 1280 : 390, height: 900 } });
    const page = await context.newPage();
    const errors = [];
    let closures = [{ id: 'closure-1', serviceCenterId: 'center_main', startDate: '2026-12-21T00:00:00.000Z', endDate: '2026-12-27T00:00:00.000Z', reason: 'Christmas week' }];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.route('**/service-bookings/centers/center_main/closures**', (route) => {
      const method = route.request().method();
      if (method === 'POST') {
        const body = route.request().postDataJSON();
        if (body.startDate <= '2026-12-27' && body.endDate >= '2026-12-21') return route.fulfill({ status: 409, body: '{}' });
        closures = [...closures, { id: 'closure-2', serviceCenterId: 'center_main', startDate: `${body.startDate}T00:00:00.000Z`, endDate: `${body.endDate}T00:00:00.000Z`, reason: body.reason }];
        return route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify(closures.at(-1)) });
      }
      if (method === 'DELETE') { closures = closures.filter((item) => !route.request().url().endsWith(item.id)); return route.fulfill({ status: 200, body: '{}' }); }
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(closures) });
    });
    const t = bookingClosuresText[locale];
    await page.goto(`http://127.0.0.1:${server.address().port}/?${locale}`);
    await page.getByText('Christmas week').waitFor();
    await page.getByRole('button', { name: t.nextMonth }).click();
    assert.ok(await page.getByRole('button', { name: `2026-12-23, ${t.closedDay}: Christmas week` }).isVisible());
    await page.screenshot({ path: `${output}/${locale}.png`, fullPage: true });
    const axe = await new AxeBuilder({ page }).analyze();
    assert.deepEqual(axe.violations.filter((item) => ['critical', 'serious'].includes(item.impact)), []);
    await page.getByRole('button', { name: '2026-12-29' }).click();
    await page.getByRole('button', { name: '2026-12-30' }).click();
    await page.getByPlaceholder(t.reasonPlaceholder).fill('Year end');
    await page.getByRole('button', { name: t.close }).click();
    await page.getByText('Year end').waitFor();
    assert.equal(errors.length, 0, `${locale}: ${errors.join(', ')}`);
    await context.close();
  }
  console.log('Booking closures browser proof passed for EN/AR.');
} finally { await browser.close(); server.close(); }
