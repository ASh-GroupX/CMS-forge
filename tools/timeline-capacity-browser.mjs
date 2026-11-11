import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { mkdirSync, readFileSync, realpathSync } from 'node:fs';
import { resolve } from 'node:path';
import { chromium } from 'playwright-core';
import { compileTailwind } from './web-browser-check.mjs';
import { serviceBookingText } from '../apps/web/src/i18n/staff-service-booking.ts';
import { getTodayDateString } from '../apps/web/src/app/(staff)/service-booking/service-booking-utils.ts';

const output = resolve('coverage/service-booking-timeline');
const proofDate = new Date(Date.parse(`${getTodayDateString()}T00:00:00Z`) + 86400000).toISOString().slice(0, 10);
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
  const history = url.searchParams.get('history') === '1';
  const markup = renderToString(React.createElement(TimelineCapacityFixture, { locale, history }));
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.end(`<!doctype html><html lang="${locale}" data-history="${history ? '1' : '0'}"><head><link rel="stylesheet" href="/proof.css"></head><body><div id="root">${markup}</div><script src="/fixture.js"></script></body></html>`);
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
      await page.route('**/service-bookings/slots-availability**', (route) => {
        const branchId = new URL(route.request().url()).searchParams.get('branchId');
        const main = branchId === 'center_main';
        return route.fulfill({
        status: 200, contentType: 'application/json', body: JSON.stringify({
          date: proofDate, dayOfWeek: new Date(`${proofDate}T00:00:00Z`).getUTCDay(), branchId, isOpen: true,
          startTime: '08:00', endTime: '18:00', maxDailyAppointments: full ? (main ? 2 : 0) : 20, bookedDailyCount: main ? 2 : 0,
          slots: Array.from({ length: 10 }, (_, hourOffset) => 8 + hourOffset).flatMap((hour) =>
            ['00', '15', '30', '45'].map((minute) => {
              const isBooked = main && hour === 12 && minute === '00';
              return {
                slot: `${String(hour).padStart(2, '0')}:${minute}`, hour: `${String(hour).padStart(2, '0')}:00`,
                bookedCount: isBooked ? 2 : 0, hourBookedCount: main && hour === 12 ? 2 : 0,
                maxPerSlot: 3, maxPerHour: 3, status: isBooked ? 'PARTIAL' : 'AVAILABLE',
                remainingInSlot: isBooked ? 1 : 3, remainingInHour: main && hour === 12 ? 1 : 3,
              };
            })),
        }),
      });
      });
      const params = new URLSearchParams({ locale, full: full ? '1' : '0' });
      await page.goto(`http://127.0.0.1:${server.address().port}/?${params}`);
      await page.getByText('Customer One', { exact: true }).waitFor({ state: 'visible' });
      await page.getByText('Customer Two', { exact: true }).waitFor({ state: 'visible' });
      const mainSlot = page.locator('[data-branch-id="center_main"][data-slot-time="12:00"]');
      const northSlot = page.locator('[data-branch-id="center_north"][data-slot-time="12:00"]');
      const region = mainSlot.getByRole('region', { name: `12:00 ${serviceBookingText[locale].timeline.appointment}` });
      await region.waitFor({ state: 'visible' });
      await page.getByText(new RegExp(`${serviceBookingText[locale].timeline.slotOccupancy}: 2/3`)).first().waitFor({ state: 'visible', timeoutMs: 2000 });
      const add = mainSlot.getByRole('button', { name: `${serviceBookingText[locale].timeline.addAppointment} 12:00` });
      assert.equal(await add.count(), full ? 0 : 1, `${locale} full=${full}: Add capacity state; ${JSON.stringify(errors)}`);
      const mainBox = await mainSlot.boundingBox();
      const northBox = await northSlot.boundingBox();
      assert.ok(mainBox && northBox && Math.abs(mainBox.y - northBox.y) < 1 && Math.abs(mainBox.height - northBox.height) < 1,
        `${locale}: branch subslots must align`);
      if (!full) {
        const plus = await add.boundingBox();
        const first = await region.getByRole('button', { name: /Customer One/ }).boundingBox();
        const second = await region.getByRole('button', { name: /Customer Two/ }).boundingBox();
        assert.ok(plus && first && second && plus.x < first.x && first.x < second.x, `${locale}: plus and bookings must sit left to right`);
        await region.evaluate((el) => { el.scrollLeft = el.scrollWidth; });
        const pinned = await add.boundingBox();
        assert.ok(pinned && Math.abs(pinned.x - plus.x) < 1, `${locale}: add button stays pinned when cards scroll`);
      }
      assert.equal(await region.evaluate((el) => getComputedStyle(el).overflowX), 'auto');
      assert.deepEqual(errors, [], `${locale} full=${full}: browser errors`);
      if (!full) {
        await page.screenshot({ path: `${output}/${locale}-capacity-available.png`, fullPage: true });
        await page.locator('[data-hour="12"]').screenshot({ path: `${output}/${locale}-noon-detail.png` });
      }
      await page.close();
    }
    const page = await browser.newPage({ viewport: { width: locale === 'en' ? 1440 : 390, height: 950 } });
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    let cancelled = false;
    await page.route('**/service-bookings/slots-availability**', (route) => {
      const branchId = new URL(route.request().url()).searchParams.get('branchId');
      const booked = branchId === 'center_main' && !cancelled ? 1 : 0;
      const slots = Array.from({ length: 10 }, (_, offset) => 8 + offset).flatMap((hour) =>
        ['00', '15', '30', '45'].map((minute) => ({
          slot: `${String(hour).padStart(2, '0')}:${minute}`, hour: `${String(hour).padStart(2, '0')}:00`,
          bookedCount: hour === 12 && minute === '00' ? booked : 0,
          hourBookedCount: hour === 12 ? booked : 0,
          maxPerSlot: 3, maxPerHour: 3, status: 'AVAILABLE',
          remainingInSlot: 3 - booked, remainingInHour: 3 - booked,
        })));
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({
        branchId, isOpen: true, maxDailyAppointments: 20, bookedDailyCount: booked, slots,
      }) });
    });
    await page.goto(`http://127.0.0.1:${server.address().port}/?locale=${locale}&history=1`);
    const expand = page.getByRole('button', { name: new RegExp(serviceBookingText[locale].timeline.showPastHours.split('{count}')[0]) });
    await expand.waitFor({ state: 'visible' });
    assert.equal(await page.locator('[data-hour="12"]').count(), 0, `${locale}: past hours start collapsed`);
    await expand.click();
    await page.locator('[data-hour="12"]').waitFor({ state: 'visible' });
    cancelled = true;
    await page.getByRole('button', { name: 'Cancel booking' }).click();
    assert.equal(await page.locator('[data-appointment-status="CANCELLED"]').count(), 1);
    const slot = page.locator('[data-branch-id="center_main"][data-slot-time="12:00"]');
    await slot.getByText(serviceBookingText[locale].status.CANCELLED, { exact: true }).waitFor({ state: 'visible' });
    await slot.getByText(new RegExp(`${serviceBookingText[locale].timeline.slotOccupancy}: 0/3`)).waitFor({ state: 'visible' });
    await page.screenshot({ path: `${output}/${locale}-cancelled-day.png`, fullPage: true });
    await page.getByRole('button', { name: serviceBookingText[locale].timeline.hidePastHours }).click();
    assert.equal(await page.locator('[data-hour="12"]').count(), 0, `${locale}: earlier hours collapse again`);
    assert.match(await expand.innerText(), new RegExp(serviceBookingText[locale].status.CANCELLED));
    await page.getByRole('button', { name: 'week view' }).click();
    await page.getByRole('button', { name: /Historical Customer/ }).waitFor({ state: 'visible' });
    await page.getByText(serviceBookingText[locale].status.CANCELLED, { exact: true }).waitFor({ state: 'visible' });
    if (locale === 'ar') {
      await page.waitForFunction(() => {
        const selected = document.querySelector('[data-selected-date="true"]');
        const viewport = selected?.closest('.overflow-x-auto');
        if (!selected || !viewport) return false;
        const day = selected.getBoundingClientRect();
        const frame = viewport.getBoundingClientRect();
        return viewport.scrollWidth > viewport.clientWidth && day.width >= 120 && day.left >= frame.left && day.right <= frame.right;
      });
    }
    await page.screenshot({ path: `${output}/${locale}-cancelled-week.png`, fullPage: true });
    await page.getByRole('button', { name: 'month view' }).click();
    await page.getByText(serviceBookingText[locale].status.CANCELLED, { exact: true }).waitFor({ state: 'visible' });
    if (locale === 'ar') {
      await page.waitForFunction(() => {
        const selected = document.querySelector('[data-selected-date="true"]');
        const viewport = selected?.closest('.overflow-x-auto');
        if (!selected || !viewport) return false;
        const day = selected.getBoundingClientRect();
        const frame = viewport.getBoundingClientRect();
        return viewport.scrollWidth > viewport.clientWidth && day.width >= 120 && day.left >= frame.left && day.right <= frame.right;
      });
    }
    await page.screenshot({ path: `${output}/${locale}-cancelled-month.png`, fullPage: true });
    assert.deepEqual(errors, [], `${locale}: history browser errors`);
    await page.close();
  }
} finally {
  await browser.close();
  await new Promise((done) => server.close(done));
}
console.log('Timeline capacity and cancellation browser proof passed for EN/AR.');
