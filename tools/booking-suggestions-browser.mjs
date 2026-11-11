import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { mkdirSync, readFileSync, realpathSync } from 'node:fs';
import { resolve } from 'node:path';
import { chromium } from 'playwright-core';
import { compileTailwind } from './web-browser-check.mjs';
import { BookingSuggestionsFixture, proofBranch, proofDate } from '../apps/web/test/browser/booking-suggestions.fixture.tsx';
import { serviceBookingText } from '../apps/web/src/i18n/staff-service-booking.ts';
import { AxeBuilder } from '@axe-core/playwright';

const output = resolve('coverage/booking-suggestions-browser');
mkdirSync(output, { recursive: true });
compileTailwind(output);
const webRequire = createRequire(new URL('../apps/web/package.json', import.meta.url));
const React = webRequire('react');
const { renderToString } = webRequire('react-dom/server');
const { build } = createRequire(realpathSync('node_modules/tsx/package.json'))('esbuild');
await build({ entryPoints: ['apps/web/test/browser/booking-suggestions.fixture.tsx'], bundle: true,
  platform: 'browser', outfile: `${output}/fixture.js`, jsx: 'automatic',
  define: { 'process.env.NODE_ENV': '"development"', 'process.env.NEXT_PUBLIC_API_URL': '""' },
  tsconfig: 'apps/web/tsconfig.json', plugins: [{ name: 'server-action-test-double', setup(builder) {
    builder.onResolve({ filter: /\.\/actions$/ }, (args) => ({ path: args.path, namespace: 'test-actions' }));
    builder.onLoad({ filter: /.*/, namespace: 'test-actions' }, () => ({ contents:
      'export async function createAppointmentAction(data) { window.createdAppointment = data; return { success: false, error: "Proof only" }; }', loader: 'js' }));
  } }] });
const server = createServer((req, res) => {
  if (req.url === '/fixture.js' || req.url === '/proof.css') {
    res.setHeader('Content-Type', req.url.endsWith('.js') ? 'text/javascript' : 'text/css');
    return res.end(readFileSync(`${output}${req.url}`));
  }
  const locale = req.url?.includes('ar') ? 'ar' : 'en';
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.end(`<!doctype html><html lang="${locale}"><head><title>Booking suggestions proof</title><link rel="stylesheet" href="/proof.css"></head><body><div id="root">${renderToString(React.createElement(BookingSuggestionsFixture, { locale }))}</div><script src="/fixture.js"></script></body></html>`);
});
await new Promise((done) => server.listen(0, '127.0.0.1', done));
const browser = await chromium.launch({ headless: true });
try {
  for (const locale of ['en', 'ar']) {
    const context = await browser.newContext({ viewport: { width: locale === 'en' ? 1280 : 390, height: 900 } });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    if (locale === 'en') await page.clock.install();
    await page.route('**/service-bookings/next-available**', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([
      { branchId: proofBranch.id, branchNameEn: proofBranch.nameEn, branchNameAr: proofBranch.nameAr,
        date: proofDate, time: '12:15', bookedCount: 1, maxPerSlot: 3, remainingInSlot: 2 },
      { branchId: proofBranch.id, branchNameEn: proofBranch.nameEn, branchNameAr: proofBranch.nameAr,
        date: proofDate, time: '12:30', bookedCount: 0, maxPerSlot: 3, remainingInSlot: 3 },
      { branchId: proofBranch.id, branchNameEn: proofBranch.nameEn, branchNameAr: proofBranch.nameAr,
        date: proofDate, time: '12:45', bookedCount: 0, maxPerSlot: 3, remainingInSlot: 3 },
    ]) }));
    await page.route('**/service-bookings/slots-availability**', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ isOpen: true, bookedDailyCount: 0, maxDailyAppointments: 24,
      slots: ['12:15', '12:30', '12:45', '19:15'].map((slot) => ({ slot, bookedCount: 0, maxPerSlot: 3, remainingInSlot: 3, remainingInHour: 3 })) }) }));
    const copy = serviceBookingText[locale];
    await page.goto(`http://127.0.0.1:${server.address().port}/?${locale}`);
    const card = page.getByRole('region', { name: copy.nextAvailable.title });
    await card.getByRole('button', { name: /12:15/ }).waitFor();
    assert.equal(await card.locator('li').count(), 3);
    if (locale === 'en') {
      const refresh = page.waitForRequest((request) => request.url().includes('/service-bookings/next-available'));
      await page.clock.fastForward(60001);
      await refresh;
    }
    assert.ok((await card.boundingBox()).y > (await page.getByText(copy.dailyStats.title).boundingBox()).y);
    await page.screenshot({ path: `${output}/${locale}-sidebar.png`, fullPage: true });
    await card.getByRole('button', { name: /12:15/ }).click();
    const dialog = page.getByRole('dialog');
    await dialog.waitFor();
    assert.equal(await dialog.locator('input[type="date"]').inputValue(), proofDate);
    assert.equal(await dialog.locator('select').last().inputValue(), '12:15');
    await dialog.getByRole('combobox', { name: copy.modal.selectMaintenanceType }).click();
    await page.getByRole('option', { name: copy.modal.periodicMaintenance }).click();
    await dialog.getByRole('combobox', { name: copy.modal.periodicMileage }).click();
    assert.equal(await page.getByRole('option').count(), 17);
    await page.getByRole('option').last().click();
    await page.screenshot({ path: `${output}/${locale}-maintenance.png`, fullPage: true });
    const accessibility = await new AxeBuilder({ page }).analyze();
    const severe = accessibility.violations.filter((violation) => ['critical', 'serious'].includes(violation.impact));
    assert.deepEqual(severe.map((violation) => ({ id: violation.id, targets: violation.nodes.map((node) => node.target.join(' ')) })), []);
    if (locale === 'en') {
      await dialog.getByRole('combobox', { name: copy.modal.brand }).click();
      await page.getByRole('option', { name: 'BYD' }).click();
      await dialog.getByRole('combobox', { name: copy.modal.carModel }).click();
      await page.getByRole('option', { name: 'Song L' }).click();
      await dialog.getByRole('textbox', { name: /Customer Name/ }).fill('Test Customer');
      await dialog.getByRole('textbox', { name: /Phone Number/ }).fill('0790000000');
      for (const [mileage, id, duration] of [['20,000 km', 'maint_periodic_20k', 45], ['40,000 km', 'maint_periodic_40k', 60]]) {
        await dialog.getByRole('combobox', { name: copy.modal.periodicMileage }).click();
        await page.getByRole('option', { name: mileage, exact: true }).click();
        await dialog.getByRole('button', { name: copy.modal.save }).click();
        const submitted = await page.evaluate(() => window.createdAppointment);
        assert.equal(submitted.maintenanceTypeId, id);
        assert.equal(submitted.durationMinutes, duration);
        assert.equal(submitted.periodicMileageKm, Number(mileage.replace(/\D/g, '')));
      }
      const late = (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([
        { branchId: proofBranch.id, branchNameEn: proofBranch.nameEn, branchNameAr: proofBranch.nameAr,
          date: proofDate, time: '19:15', bookedCount: 0, maxPerSlot: 3, remainingInSlot: 3 },
      ]) });
      await page.route('**/service-bookings/next-available**', late);
      await page.reload();
      await page.getByRole('region', { name: copy.nextAvailable.title }).getByRole('button', { name: /19:15/ }).click();
      assert.equal(await page.getByRole('dialog').locator('select').last().inputValue(), '19:15');
      assert.equal(await page.getByRole('dialog').locator('option[value="19:15"]').count(), 1);
      await page.unroute('**/service-bookings/next-available**', late);
      const failure = (route) => route.fulfill({ status: 503, contentType: 'application/json', body: '{}' });
      await page.route('**/service-bookings/next-available**', failure);
      await page.reload();
      await page.getByRole('alert').getByText(copy.nextAvailable.error).waitFor();
      await page.unroute('**/service-bookings/next-available**', failure);
      await page.getByRole('button', { name: copy.nextAvailable.retry }).click();
      await page.getByRole('region', { name: copy.nextAvailable.title }).locator('li').first().waitFor();
      const empty = (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
      await page.route('**/service-bookings/next-available**', empty);
      await page.reload();
      await page.getByText(copy.nextAvailable.empty).waitFor();
    }
    assert.deepEqual(errors, []);
    await context.close();
  }
  console.log('Booking suggestions and periodic mileage proof passed for EN desktop and AR mobile.');
} finally {
  await browser.close();
  await new Promise((done) => server.close(done));
}
