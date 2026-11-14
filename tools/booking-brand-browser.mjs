import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { mkdirSync, readFileSync, realpathSync } from 'node:fs';
import { resolve } from 'node:path';
import { chromium } from 'playwright-core';
import { AxeBuilder } from '@axe-core/playwright';
import { compileTailwind } from './web-browser-check.mjs';
import { BookingFixture } from '../apps/web/test/browser/booking-brand.fixture.tsx';
import { serviceBookingText } from '../apps/web/src/i18n/staff-service-booking.ts';

const webRequire = createRequire(new URL('../apps/web/package.json', import.meta.url));
const { renderToString } = webRequire('react-dom/server');
const React = webRequire('react');
const { build } = createRequire(realpathSync('node_modules/tsx/package.json'))('esbuild');
const output = resolve('coverage/booking-brand-browser');
mkdirSync(output, { recursive: true });
compileTailwind(output);
await build({ entryPoints: ['apps/web/test/browser/booking-brand.fixture.tsx'], bundle: true, platform: 'browser',
  outfile: `${output}/fixture.js`, jsx: 'automatic', define: { 'process.env.NODE_ENV': '"development"' },
  tsconfig: 'apps/web/tsconfig.json', plugins: [{ name: 'server-action-test-double', setup(builder) {
    builder.onResolve({ filter: /service-booking\/actions$/ }, args => ({ path: args.path, namespace: 'test-actions' }));
    builder.onLoad({ filter: /.*/, namespace: 'test-actions' }, () => ({ contents:
      'export async function saveCarModelAction(data) { window.savedCar = data; return {success:true,model:{...data,id:"new-car"}}; } export async function deleteCarModelAction() { return {success:true}; }', loader: 'js' }));
  } }] });
const server = createServer((req, res) => {
  if (req.url === '/fixture.js' || req.url === '/proof.css') {
    res.setHeader('Content-Type', req.url.endsWith('.js') ? 'text/javascript' : 'text/css');
    return res.end(readFileSync(`${output}${req.url}`));
  }
  const locale = req.url?.includes('ar') ? 'ar' : 'en';
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.end(`<!doctype html><html lang="${locale}"><head><link rel="stylesheet" href="/proof.css"></head><body><div id="root">${renderToString(React.createElement(BookingFixture, { locale }))}</div><script src="/fixture.js"></script></body></html>`);
});
await new Promise(done => server.listen(0, '127.0.0.1', done));
const browser = await chromium.launch({ headless: true });
try {
  for (const locale of ['en', 'ar']) {
    const context = await browser.newContext({ viewport: { width: locale === 'en' ? 1280 : 390, height: 900 } });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const copy = serviceBookingText[locale].modal;
    await page.goto(`http://127.0.0.1:${server.address().port}/?${locale}`);
    const brand = page.getByRole('combobox', { name: copy.brand, exact: true });
    const model = page.getByRole('combobox', { name: copy.carModel, exact: true });
    const search = page.getByRole('textbox', { name: copy.searchCarModel, exact: true }).first();
    assert.equal(await model.isDisabled(), false, `${locale}: model search works before choosing a make`);
    await search.fill(locale === 'ar' ? 'بي جي ٣٠' : 'BJ30');
    await model.click();
    const modelFirstLabel = `BAIC · ${locale === 'ar' ? 'بي جي ٣٠' : 'BJ30'}`;
    assert.equal(await page.getByRole('option').count(), 1);
    await page.screenshot({ path: `${output}/${locale}-model-first-search.png`, fullPage: true });
    await page.getByRole('option', { name: modelFirstLabel, exact: true }).click();
    assert.equal(await page.getByTestId('selected').textContent(), 'baic-1');
    assert.match(await brand.textContent(), /BAIC/, `${locale}: choosing a model fills its make`);
    await brand.click();
    await page.getByRole('option', { name: 'BYD', exact: true }).click();
    assert.equal(await page.getByTestId('selected').textContent(), '');
    await model.click();
    assert.equal(await page.getByRole('option').count(), 1);
    await page.getByRole('option').click();
    assert.equal(await page.getByTestId('selected').textContent(), 'byd-1');
    await brand.click();
    assert.equal(await page.getByRole('option').count(), 2);
    await page.getByRole('option', { name: 'BAIC', exact: true }).click();
    assert.equal(await page.getByTestId('selected').textContent(), '');
    await model.click();
    assert.equal(await page.getByRole('option').count(), 2);
    await page.getByRole('option', { name: locale === 'en' ? 'BJ30' : 'بي جي ٣٠', exact: true }).click();
    assert.equal(await page.getByTestId('selected').textContent(), 'baic-1');
    await page.screenshot({ path: `${output}/${locale}-brand-model.png`, fullPage: true });
    await page.locator('input[aria-label]').first().fill('unmatched');
    assert.ok(await page.getByText(copy.noCarFound, { exact: true }).isVisible());
    await page.getByRole('button', { name: 'Open appointment vehicle' }).click();
    const appointmentDialog = page.getByRole('dialog');
    const dialogBrand = appointmentDialog.getByRole('combobox', { name: copy.brand, exact: true });
    await dialogBrand.click();
    await page.getByRole('option', { name: 'BAIC', exact: true }).click();
    await dialogBrand.click();
    await page.getByRole('option', { name: 'BYD', exact: true }).click();
    assert.ok(await appointmentDialog.isVisible(), `${locale}: changing brand keeps appointment dialog open`);
    await appointmentDialog.getByRole('textbox', { name: copy.searchCarModel }).fill(locale === 'ar' ? 'هان' : 'HAN');
    const dialogModel = appointmentDialog.getByRole('combobox', { name: copy.carModel, exact: true });
    await dialogModel.click();
    assert.equal(await page.getByRole('option').count(), 1, `${locale}: car search filters the model list`);
    await page.getByRole('option').click();
    assert.equal(await page.getByTestId('selected').textContent(), 'byd-1');
    assert.ok(await appointmentDialog.isVisible(), `${locale}: choosing searched car keeps appointment dialog open`);
    await page.screenshot({ path: `${output}/${locale}-appointment-dialog-brand-change.png`, fullPage: true });
    await appointmentDialog.getByRole('button', { name: locale === 'ar' ? 'إغلاق' : 'Close' }).click();
    const admin = serviceBookingText[locale].adminSettings;
    await page.getByRole('button', { name: admin.addCar, exact: true }).click();
    const dialog = page.getByRole('dialog');
    const brandInput = dialog.getByRole('textbox', { name: admin.brand, exact: true });
    assert.equal(await brandInput.inputValue(), '');
    assert.equal(await dialog.locator('form').evaluate(form => form.checkValidity()), false);
    await brandInput.fill('BAIC');
    assert.equal(await dialog.locator('form').evaluate(form => form.checkValidity()), false);
    await dialog.getByRole('textbox', { name: admin.nameEn, exact: true }).fill('BJ60');
    assert.equal(await dialog.locator('form').evaluate(form => form.checkValidity()), true);
    await page.screenshot({ path: `${output}/${locale}-admin-required.png`, fullPage: true });
    await dialog.getByRole('button', { name: admin.addCar, exact: true }).click();
    await dialog.waitFor({ state: 'hidden' });
    assert.equal(await page.evaluate(() => window.savedCar.brand), 'BAIC');
    assert.equal(await page.evaluate(() => window.savedCar.nameEn), 'BJ60');
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2));
    const accessibility = await new AxeBuilder({ page }).include('main').analyze();
    assert.deepEqual(accessibility.violations.filter(violation => ['critical', 'serious'].includes(violation.impact)).map(violation => violation.id), []);
    assert.deepEqual(errors, []);
    await context.close();
  }
  console.log('Booking brand/model hydrated proof passed for EN desktop and AR mobile.');
} finally {
  await browser.close();
  await new Promise(done => server.close(done));
}
