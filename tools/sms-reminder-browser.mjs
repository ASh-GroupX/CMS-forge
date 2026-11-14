import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { mkdirSync, readFileSync, realpathSync } from 'node:fs';
import { resolve } from 'node:path';
import { chromium } from 'playwright-core';
import { compileTailwind } from './web-browser-check.mjs';
import { serviceBookingText } from '../apps/web/src/i18n/staff-service-booking.ts';
import { SmsReminderFixture } from '../apps/web/test/browser/sms-reminder.fixture.tsx';

const output = resolve('coverage/sms-reminder-browser');
const webRequire = createRequire(new URL('../apps/web/package.json', import.meta.url));
const React = webRequire('react');
const { renderToString } = webRequire('react-dom/server');
mkdirSync(output, { recursive: true });
compileTailwind(output);
const { build } = createRequire(realpathSync('node_modules/tsx/package.json'))('esbuild');
await build({ entryPoints: ['apps/web/test/browser/sms-reminder.fixture.tsx'], bundle: true, platform: 'browser',
  outfile: `${output}/fixture.js`, jsx: 'automatic', define: { 'process.env.NODE_ENV': '"development"', 'process.env.NEXT_PUBLIC_API_URL': '""' }, tsconfig: 'apps/web/tsconfig.json',
  plugins: [{ name: 'server-action-test-double', setup(builder) {
    builder.onResolve({ filter: /service-booking\/actions$/ }, args => ({ path: args.path, namespace: 'booking-actions' }));
    builder.onLoad({ filter: /.*/, namespace: 'booking-actions' }, () => ({ contents: `
      export async function saveBranchRulesAction() { return {success:true}; }
      export async function initWeekRulesAction() { return {success:true}; }
      export async function updateBranchNameAction() { return {success:true}; }
      export async function saveCarModelAction() { return {success:true}; }
      export async function deleteCarModelAction() { return {success:true}; }
      export async function saveMaintenanceTypeAction() { return {success:true}; }
      export async function deleteMaintenanceTypeAction() { return {success:true}; }
      export async function saveServiceCenterAction() { return {success:true}; }
      export async function deleteServiceCenterAction() { return {success:true}; }
    `, loader: 'js' }));
    builder.onResolve({ filter: /user-rules-actions$/ }, args => ({ path: args.path, namespace: 'test-actions' }));
    builder.onLoad({ filter: /.*/, namespace: 'test-actions' }, () => ({ contents: `
      export async function getAllUsersBookingRulesAction() { return []; }
      export async function updateUserBookingRulesAction() { return {success:true}; }
      export async function getSmsReminderSettingsAction() { return {success:true,settings:{enabled:true,leadHours:24,senderNumber:'+962790000000',messageTemplate:'Hello {{customerName}}',providerMode:'test',providerReady:false,deliveries:[{id:'d1',status:'SENT',sentAt:'2026-11-09T08:00:00.000Z',scheduledAt:'2026-11-09T08:00:00.000Z',serviceAppointment:{referenceNumber:'APT-001'}}]}}; }
      export async function updateSmsReminderSettingsAction(data) { window.savedReminderSettings=data; return {success:true,settings:{...data,deliveries:[{id:'d1',status:'SENT',sentAt:'2026-11-09T08:00:00.000Z',scheduledAt:'2026-11-09T08:00:00.000Z',serviceAppointment:{referenceNumber:'APT-001'}}]}}; }
    `, loader: 'js' }));
    builder.onResolve({ filter: /booking-lane-actions$/ }, args => ({ path: args.path, namespace: 'lane-actions' }));
    builder.onLoad({ filter: /.*/, namespace: 'lane-actions' }, () => ({ contents: `
      export async function saveBookingLaneAction(data) { window.savedBookingLane=data; return {success:true,lane:{id:'lane-notes',...data}}; }
    `, loader: 'js' }));
  } }] });

const server = createServer((req, res) => {
  if (req.url === '/fixture.js' || req.url === '/proof.css') {
    res.setHeader('Content-Type', req.url.endsWith('.js') ? 'text/javascript' : 'text/css');
    return res.end(readFileSync(`${output}${req.url}`));
  }
  const locale = req.url?.includes('ar') ? 'ar' : 'en';
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  const markup = renderToString(React.createElement(SmsReminderFixture, { locale }));
  res.end(`<!doctype html><html lang="${locale}"><head><link rel="stylesheet" href="/proof.css"></head><body><div id="root">${markup}</div><script src="/fixture.js"></script></body></html>`);
});
await new Promise(done => server.listen(0, '127.0.0.1', done));
const browser = await chromium.launch({ headless: true });
try {
  for (const locale of ['en', 'ar']) {
    const page = await browser.newPage({ viewport: { width: locale === 'en' ? 1280 : 390, height: 900 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const copy = serviceBookingText[locale].adminSettings.smsReminder;
    const admin = serviceBookingText[locale].adminSettings;
    await page.route('**/service-bookings/centers/*/lanes*', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([
      { id: 'lane-other', serviceCenterId: 'center-main', code: 'OTHER', nameEn: 'Other services', nameAr: 'الخدمات الأخرى', maxDailyAppointments: 50, maxPerHour: 5, maxPerSlot: 2, position: 1, isActive: true, updatedAt: '2026-11-14T10:00:00.000Z' },
    ]) }));
    await page.goto(`http://127.0.0.1:${server.address().port}/?${locale}`);
    const laneCopy = admin.lanes;
    await page.getByRole('button', { name: admin.tabLanes }).click();
    await page.getByText(locale === 'ar' ? 'الخدمات الأخرى' : 'Other services', { exact: true }).waitFor();
    await page.getByRole('button', { name: laneCopy.add }).click();
    await page.getByLabel(laneCopy.nameEn).fill('Notes');
    await page.getByLabel(laneCopy.nameAr).fill('نوتس');
    await page.getByLabel(laneCopy.code).fill('NOTES');
    await page.getByLabel(laneCopy.hourly).fill('9');
    await page.screenshot({ path: `${output}/${locale}-booking-lanes.png`, fullPage: true });
    await page.getByRole('button', { name: laneCopy.save }).click();
    await page.getByText(laneCopy.saved, { exact: true }).waitFor();
    assert.equal((await page.evaluate(() => window.savedBookingLane)).maxPerHour, 9);
    await page.getByRole('button', { name: admin.tabSmsReminder }).click();
    await page.getByRole('heading', { name: copy.title }).waitFor();
    await page.getByLabel(copy.leadHours).fill('48');
    await page.getByLabel(copy.senderNumber).fill('+962790000001');
    await page.getByLabel(copy.message).fill('Dear {{customerName}}, see you at {{time}}');
    await page.screenshot({ path: `${output}/${locale}-settings.png`, fullPage: true });
    await page.getByRole('button', { name: copy.save }).click();
    await page.getByText(copy.saved, { exact: true }).waitFor();
    assert.deepEqual(await page.evaluate(() => window.savedReminderSettings), {
      enabled: true, leadHours: 48, senderNumber: '+962790000001', messageTemplate: 'Dear {{customerName}}, see you at {{time}}',
    });
    assert.ok(await page.getByText(copy.statuses.SENT, { exact: true }).isVisible());
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2));
    assert.deepEqual(errors, []);
    await page.close();
  }
  console.log('SMS reminder settings browser proof passed for EN desktop and AR mobile.');
} finally {
  await browser.close();
  await new Promise(done => server.close(done));
}
