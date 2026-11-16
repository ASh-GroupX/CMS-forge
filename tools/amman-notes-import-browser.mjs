import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { mkdirSync, readFileSync, realpathSync } from 'node:fs';
import { resolve } from 'node:path';
import { chromium } from 'playwright-core';
import { AxeBuilder } from '@axe-core/playwright';
import { compileTailwind } from './web-browser-check.mjs';
import { AmmanNotesImportFixture } from '../apps/web/test/browser/amman-notes-import.fixture.tsx';

const output = resolve('coverage/amman-notes-import-browser');
mkdirSync(output, { recursive: true });
compileTailwind(output);
const webRequire = createRequire(new URL('../apps/web/package.json', import.meta.url));
const React = webRequire('react');
const { renderToString } = webRequire('react-dom/server');
const { build } = createRequire(realpathSync('node_modules/tsx/package.json'))('esbuild');
await build({ entryPoints: ['apps/web/test/browser/amman-notes-import.fixture.tsx'], bundle: true, platform: 'browser',
  outfile: `${output}/fixture.js`, jsx: 'automatic', define: { 'process.env.NODE_ENV': '"development"', 'process.env.NEXT_PUBLIC_API_URL': '""' },
  tsconfig: 'apps/web/tsconfig.json' });
const server = createServer((req, res) => {
  if (req.url === '/fixture.js' || req.url === '/proof.css') {
    res.setHeader('Content-Type', req.url.endsWith('.js') ? 'text/javascript' : 'text/css');
    return res.end(readFileSync(`${output}${req.url}`));
  }
  const locale = req.url?.includes('ar') ? 'ar' : 'en';
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.end(`<!doctype html><html lang="${locale}"><head><link rel="stylesheet" href="/proof.css"></head><body><div id="root">${renderToString(React.createElement(AmmanNotesImportFixture, { locale }))}</div><script src="/fixture.js"></script></body></html>`);
});
await new Promise((done) => server.listen(0, '127.0.0.1', done));
const browser = await chromium.launch({ headless: true });
try {
  for (const locale of ['en', 'ar']) {
    const context = await browser.newContext({ viewport: { width: locale === 'en' ? 1280 : 390, height: 900 } });
    await context.addCookies([{ name: 'cms_csrf_token', value: 'proof-csrf', url: `http://127.0.0.1:${server.address().port}` }]);
    const page = await context.newPage();
    const errors = [];
    const posted = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.route('**/service-bookings/car-models?*', (route) => route.fulfill({ status: 200, contentType: 'application/json',
      body: JSON.stringify([
        { id: 'mage', brand: 'Dongfeng', nameEn: 'Dongfeng Mage ICE', isActive: true },
        { id: 'nami', brand: 'Dongfeng', nameEn: 'Dongfeng Nammi-01 EV 430 KM Plus CCC', isActive: true },
        { id: 'vigo', brand: 'Dongfeng', nameEn: 'Dongfeng Nammi-06 VIGO EV 410 KM E1 GCC', isActive: true },
        { id: 'friday', brand: 'Forthing', nameEn: 'Forthing Friday EV', isActive: true },
      ]) }));
    await page.route('**/service-bookings/centers/center_main/lanes', (route) => route.fulfill({ status: 200, contentType: 'application/json',
      body: JSON.stringify([{ id: 'notes', serviceCenterId: 'center_main', code: 'NOT', nameEn: 'notes', nameAr: 'ملاحظات',
        maxDailyAppointments: 70, maxPerHour: 9, maxPerSlot: 3, isActive: true }]) }));
    await page.route('**/service-bookings/appointments?*', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
    await page.route('**/service-bookings/appointments', (route) => {
      const body = route.request().postDataJSON();
      posted.push({ csrf: route.request().headers()['x-csrf-token'], body });
      return route.fulfill({ status: posted.length === 1 ? 200 : 403, contentType: 'application/json',
        body: JSON.stringify(posted.length === 1 ? { ...body, id: 'created-1', status: 'BOOKED' } : { error: { message: 'Denied' } }) });
    });
    await page.goto(`http://127.0.0.1:${server.address().port}/?${locale}`);
    const rows = Array.from({ length: 359 }, (_, index) => {
      const day = new Date(Date.UTC(2026, 10, 19 + Math.floor(index / 15))).toISOString().slice(0, 10);
      const carType = ['Mage', 'Nami', 'Vigo', 'Friday', 'BYD Seagull'][index % 5];
      return { sourceKey: `${day}-B2-${index + 1}`, date: day, hour: `${String(9 + Math.floor(index % 15 / 4)).padStart(2, '0')}:00`,
        suggestedStart: `${String(9 + Math.floor(index % 15 / 4)).padStart(2, '0')}:00`,
        customerName: `Customer ${index + 1}`, customerPhone: `079${String(index).padStart(7, '0')}`,
        carType, originalText: `Original note ${index + 1}` };
    });
    await page.locator('input[type=file]').setInputFiles({ name: 'Amman_Notes_Clear_359.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(rows)) });
    await page.getByText(locale === 'en' ? 'Needs review:' : 'يحتاج مراجعة:').waitFor();
    assert.match(await page.locator('main').innerText(), /72/);
    await page.screenshot({ path: `${output}/${locale}-import-preview.png`, fullPage: true });
    const severe = (await new AxeBuilder({ page }).include('main').analyze()).violations.filter((item) => ['critical', 'serious'].includes(item.impact));
    assert.deepEqual(severe.map((item) => ({ id: item.id, targets: item.nodes.map((node) => node.target.join(' ')) })), []);
    await page.getByRole('button', { name: locale === 'en' ? 'Create ready bookings' : 'إنشاء الحجوزات الجاهزة' }).click();
    await page.getByText(locale === 'en' ? 'Created: 1' : 'تم إنشاء: 1').waitFor();
    assert.equal(posted.length, 2);
    assert.equal(posted[0].csrf, 'proof-csrf');
    assert.match(posted[0].body.notes, /Notes \/ Customer Requests:/);
    assert.deepEqual(errors, []);
    await context.close();
  }
  console.log('Amman Notes import preview passed in EN desktop and AR mobile.');
} finally {
  await browser.close();
  await new Promise((done) => server.close(done));
}
