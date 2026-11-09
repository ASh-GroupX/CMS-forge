import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { mkdirSync, readFileSync, realpathSync } from 'node:fs';
import { resolve } from 'node:path';
import { chromium } from 'playwright-core';
import { compileTailwind } from './web-browser-check.mjs';
import { serviceBookingText } from '../apps/web/src/i18n/staff-service-booking.ts';

const output = resolve('coverage/service-booking-timeline');
const webRequire = createRequire(new URL('../apps/web/package.json', import.meta.url));
const React = webRequire('react');
const { renderToString } = webRequire('react-dom/server');
mkdirSync(output, { recursive: true });
compileTailwind(output);
const { build } = createRequire(realpathSync('node_modules/tsx/package.json'))('esbuild');
await build({ entryPoints: ['apps/web/test/browser/timeline-capacity.fixture.tsx'], bundle: true,
  platform: 'browser', outfile: `${output}/fixture.js`, jsx: 'automatic',
  define: { 'process.env.NODE_ENV': '"development"', 'process.env.NEXT_PUBLIC_API_URL': '""' },
  tsconfig: 'apps/web/tsconfig.json' });

const server = createServer((req, res) => {
  if (req.url === '/fixture.js' || req.url === '/proof.css') {
    res.setHeader('Content-Type', req.url.endsWith('.js') ? 'text/javascript' : 'text/css');
    return res.end(readFileSync(`${output}${req.url}`));
  }
  const url = new URL(req.url ?? '/', 'http://localhost');
  const locale = url.searchParams.get('locale') === 'ar' ? 'ar' : 'en';
  const full = url.searchParams.get('full') === '1';
  const markup = renderToString(React.createElement(TimelineCapacityFixture, { locale }));
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.end(`<!doctype html><html lang="${locale}"><head><link rel="stylesheet" href="/proof.css"></head><body><div id="root">${markup}</div><script src="/fixture.js"></script></body></html>`);
});
const { TimelineCapacityFixture } = await import('../apps/web/test/browser/timeline-capacity.fixture.tsx');
await new Promise((done) => server.listen(0, '127.0.0.1', done));
const browser = await chromium.launch({ headless: true });
try {
  for (const locale of ['en', 'ar']) {
    for (const full of [false, true]) {
      const page = await browser.newPage({ viewport: { width: locale === 'en' ? 1440 : 390, height: 950 } });
      const errors = [];
      page.on('pageerror', (error) => errors.push(error.message));
      page.on('requestfailed', (request) => errors.push(`request failed ${request.url()}`));
      await page.route('**/service-bookings/slots-availability**', (route) => route.fulfill({
        status: 200, contentType: 'application/json', body: JSON.stringify({
          date: '2026-11-10', dayOfWeek: 2, branchId: 'center_main', isOpen: true,
          startTime: '08:00', endTime: '18:00', maxDailyAppointments: full ? 2 : 20, bookedDailyCount: 2,
          slots: Array.from({ length: 10 }, (_, hourOffset) => 8 + hourOffset).flatMap((hour) =>
            ['00', '15', '30', '45'].map((minute) => {
              const isBooked = hour === 12 && minute === '00';
              return {
                slot: `${String(hour).padStart(2, '0')}:${minute}`, hour: `${String(hour).padStart(2, '0')}:00`,
                bookedCount: isBooked ? 2 : 0, hourBookedCount: hour === 12 ? 2 : 0,
                maxPerSlot: 3, maxPerHour: 3, status: isBooked ? 'PARTIAL' : 'AVAILABLE',
                remainingInSlot: isBooked ? 1 : 3, remainingInHour: hour === 12 ? 1 : 3,
              };
            })),
        }),
      }));
      const params = new URLSearchParams({ locale, full: full ? '1' : '0' });
      await page.goto(`http://127.0.0.1:${server.address().port}/?${params}`);
      await page.getByText('Customer One', { exact: true }).waitFor({ state: 'visible' });
      await page.getByText('Customer Two', { exact: true }).waitFor({ state: 'visible' });
      await page.getByText(`${serviceBookingText[locale].timeline.slotOccupancy}: 2/3`, { exact: true }).waitFor({ state: 'visible', timeoutMs: 2000 });
      const add = page.getByRole('button', { name: /2\/3/ });
      assert.equal(await add.count(), full ? 0 : 1, `${locale} full=${full}: Add capacity state; ${JSON.stringify(errors)}`);
      if (!full) assert.match(await add.innerText(), new RegExp(serviceBookingText[locale].timeline.addAppointment));
      assert.deepEqual(errors, [], `${locale} full=${full}: browser errors`);
      if (locale === 'en' && !full) await page.screenshot({ path: `${output}/en-capacity-available.png`, fullPage: true });
      if (locale === 'ar' && !full) await page.screenshot({ path: `${output}/ar-capacity-available.png`, fullPage: true });
      await page.close();
    }
  }
} finally {
  await browser.close();
  await new Promise((done) => server.close(done));
}
console.log('Timeline capacity browser proof passed for EN/AR and available/full states.');
