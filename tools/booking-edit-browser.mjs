import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { mkdirSync, readFileSync, realpathSync } from 'node:fs';
import { resolve } from 'node:path';
import { chromium } from 'playwright-core';
import { AxeBuilder } from '@axe-core/playwright';
import { compileTailwind } from './web-browser-check.mjs';
import { BookingEditFixture } from '../apps/web/test/browser/booking-edit.fixture.tsx';
import { serviceBookingText } from '../apps/web/src/i18n/staff-service-booking.ts';

const output = resolve('coverage/booking-edit-browser');
mkdirSync(output, { recursive: true });
compileTailwind(output);
const webRequire = createRequire(new URL('../apps/web/package.json', import.meta.url));
const React = webRequire('react');
const { renderToString } = webRequire('react-dom/server');
const { build } = createRequire(realpathSync('node_modules/tsx/package.json'))('esbuild');
await build({ entryPoints: ['apps/web/test/browser/booking-edit.fixture.tsx'], bundle: true, platform: 'browser',
  outfile: `${output}/fixture.js`, jsx: 'automatic', define: { 'process.env.NODE_ENV': '"development"', 'process.env.NEXT_PUBLIC_API_URL': '""' },
  tsconfig: 'apps/web/tsconfig.json', plugins: [{ name: 'booking-actions', setup(builder) {
    builder.onResolve({ filter: /(?:service-booking\/actions|\.\/actions)$/ }, (args) => ({ path: args.path, namespace: 'test-actions' }));
    builder.onResolve({ filter: /(?:booking-settings\/booking-lane-actions|\.\/booking-lane-actions)$/ }, (args) => ({ path: args.path, namespace: 'test-lane-actions' }));
    builder.onLoad({ filter: /.*/, namespace: 'test-actions' }, () => ({ loader: 'js', contents:
      'export async function updateAppointmentAction(id, data) { window.savedBooking = {id, data}; return {success:true, appointment:{...window.fixtureAppointment,...data}}; }' }));
    builder.onLoad({ filter: /.*/, namespace: 'test-lane-actions' }, () => ({ loader: 'js', contents:
      'export async function saveBookingLaneAction(data) { window.savedLane = data; return {success:true,lane:data}; }' }));
  } }] });
const server = createServer((req, res) => {
  if (req.url === '/fixture.js' || req.url === '/proof.css') {
    res.setHeader('Content-Type', req.url.endsWith('.js') ? 'text/javascript' : 'text/css');
    return res.end(readFileSync(`${output}${req.url}`));
  }
  const locale = req.url?.includes('ar') ? 'ar' : 'en';
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.end(`<!doctype html><html lang="${locale}"><head><title>Booking edit proof</title><link rel="stylesheet" href="/proof.css"></head><body><div id="root">${renderToString(React.createElement(BookingEditFixture, { locale }))}</div><script src="/fixture.js"></script></body></html>`);
});
await new Promise((done) => server.listen(0, '127.0.0.1', done));
const browser = await chromium.launch({ headless: true });
try {
  for (const locale of ['en', 'ar']) {
    const context = await browser.newContext({ viewport: { width: locale === 'en' ? 1280 : 390, height: 900 } });
    const page = await context.newPage();
    const t = serviceBookingText[locale];
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.route('**/service-bookings/centers/**/lanes?all=true', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([
      { id: 'lane-notes', serviceCenterId: 'center_main', code: 'NOTES', nameEn: 'Notes', nameAr: 'نوتس', color: 'amber',
        maxDailyAppointments: 80, maxPerHour: 9, maxPerSlot: 3, position: 0, isActive: true, updatedAt: '2026-11-14T08:00:00.000Z' },
    ]) }));
    await page.goto(`http://127.0.0.1:${server.address().port}/?${locale}`);
    await page.getByRole('button', { name: t.modal.saveDetails }).click();
    assert.equal(await page.evaluate(() => 'maintenanceTypeId' in window.savedBooking.data), false, `${locale}: archived type stays untouched when editing other details`);
    await page.getByRole('combobox', { name: t.modal.maintenanceType }).click();
    assert.equal(await page.getByRole('option').count(), 5);
    assert.equal(await page.getByRole('option', { name: locale === 'ar' ? 'تغيير الزيت والفلتر' : 'Oil and Filter Change' }).count(), 0);
    await page.getByRole('option', { name: locale === 'ar' ? 'صيانة دورية مع ملاحظات ميكانيك' : 'Periodic Maintenance with Mechanical Notes' }).click();
    await page.getByRole('combobox', { name: t.modal.periodicMileage }).click();
    await page.getByRole('option').nth(5).click();
    await page.locator('form').first().evaluate((form) => { form.scrollTop = 0; });
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: `${output}/${locale}-edit-and-lane-color.png`, fullPage: true });
    if (locale === 'ar') {
      await page.getByRole('combobox', { name: t.modal.periodicMileage }).scrollIntoViewIfNeeded();
      await page.screenshot({ path: `${output}/ar-periodic-mileage.png`, fullPage: true });
    }
    const severe = (await new AxeBuilder({ page }).include('main').analyze()).violations.filter((item) => ['critical', 'serious'].includes(item.impact));
    assert.deepEqual(severe.map((item) => ({ id: item.id, targets: item.nodes.map((node) => node.target.join(' ')) })), []);
    await page.getByRole('button', { name: t.modal.saveDetails }).click();
    assert.equal(await page.evaluate(() => window.savedBooking.data.maintenanceTypeId), 'maint_periodic_mechanical_notes');
    assert.equal(await page.evaluate(() => window.savedBooking.data.periodicMileageKm), 40000);
    await page.getByRole('button', { name: `${t.adminSettings.lanes.edit} Notes` }).click();
    await page.getByRole('combobox', { name: t.adminSettings.lanes.color }).click();
    await page.getByRole('option', { name: t.adminSettings.lanes.colors.rose }).click();
    await page.screenshot({ path: `${output}/${locale}-admin-lane-color.png`, fullPage: true });
    await page.getByRole('button', { name: t.adminSettings.lanes.save }).click();
    assert.equal(await page.evaluate(() => window.savedLane.color), 'rose');
    assert.deepEqual(errors, []);
    await context.close();
  }
  console.log('Booking detail edit and lane color proof passed in EN desktop and AR mobile.');
} finally {
  await browser.close();
  await new Promise((done) => server.close(done));
}
