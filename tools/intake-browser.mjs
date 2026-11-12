import assert from 'node:assert/strict';
import { mkdirSync, readFileSync } from 'node:fs';
import { chromium } from 'playwright-core';
import { AxeBuilder } from '@axe-core/playwright';
import jsQR from 'jsqr';
const origin = 'http://127.0.0.1:3001', api = 'http://127.0.0.1:3100';
const out = 'coverage/intake-live-browser'; mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ headless: true });
const fixture = JSON.parse(readFileSync('coverage/intake-browser-fixture.json', 'utf8'));
async function context(user) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 1100 }, extraHTTPHeaders: { 'x-forwarded-for': '127.0.0.2' } });
  if (user) { const response = await ctx.request.post(`${api}/auth/login`, { data: { identifier: user, password: 'Intake-proof-only-2026!' } }); assert.equal(response.status(), 201); }
  return ctx;
}
async function visual(page, name) {
  await page.evaluate(() => document.fonts.ready); await page.emulateMedia({ reducedMotion: 'reduce' });
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2), `overflow ${name}`);
  const violations = (await new AxeBuilder({ page }).analyze()).violations.filter((item) => ['critical', 'serious'].includes(item.impact));
  await page.screenshot({ path: `${out}/${name}.png`, fullPage: true });
  assert.deepEqual(violations.map((item) => ({ id: item.id, nodes: item.nodes.map((node) => ({ target: node.target, summary: node.failureSummary })) })), [], name);
}
try {
  const admin = await context('intake_admin'); const adminPage = await admin.newPage(); adminPage.on('pageerror', (error) => console.error('Browser error:', error.message));
  await adminPage.goto(`${origin}/admin/portal-intake?locale=en`);
  await adminPage.getByLabel('Phone country code', { exact: true }).fill('+962');
  const invalid = await adminPage.locator('input:invalid').evaluateAll((inputs) => inputs.map((input) => ({ name: input.id, message: input.validationMessage, pattern: input.pattern })));
  assert.deepEqual(invalid, []);
  await adminPage.getByRole('button', { name: 'Save settings', exact: true }).click();
  await adminPage.getByText('Settings saved.', { exact: true }).waitFor();
  const download = adminPage.waitForEvent('download'); await adminPage.getByRole('button', { name: 'Download QR', exact: true }).click();
  assert.equal((await download).suggestedFilename(), 'complaint-portal-qr.svg');
  const pixels = await adminPage.locator('svg[role="img"], svg').evaluateAll(async (nodes) => {
    const svg = nodes.find((node) => node.querySelector('title')?.textContent === 'Customer QR code');
    if (!svg) throw Error('QR missing');
    const source = new XMLSerializer().serializeToString(svg); const image = new Image(); image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(source)}`; await image.decode();
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 512; const ctx = canvas.getContext('2d'); ctx.drawImage(image, 0, 0, 512, 512); return Array.from(ctx.getImageData(0, 0, 512, 512).data);
  });
  assert.equal(jsQR(new Uint8ClampedArray(pixels), 512, 512)?.data, 'https://cms.laith-alobaidi-crm.com/portal');
  const customer = await context(); const portal = await customer.newPage();
  for (const locale of ['en', 'ar']) for (const width of [390, 430, 768, 1280, 1440]) {
    await portal.setViewportSize({ width, height: 1100 }); await portal.goto(`${origin}/portal?locale=${locale}`); await visual(portal, `portal-${locale}-${width}`);
    await adminPage.setViewportSize({ width, height: 1100 }); await adminPage.goto(`${origin}/admin/portal-intake?locale=${locale}`); await visual(adminPage, `admin-${locale}-${width}`);
  }
  await portal.goto(`${origin}/portal?locale=en`);
  await portal.getByLabel('Customer name', { exact: true }).fill('Browser proof customer');
  await portal.getByLabel('Customer phone', { exact: true }).fill(`079${String(Date.now()).slice(-7)}`);
  await portal.getByLabel('Car make', { exact: true }).fill('Nissan'); await portal.getByLabel('Car model', { exact: true }).fill('Patrol');
  await portal.getByLabel('What happened?', { exact: true }).fill('Browser proof description');
  await portal.route('**/api/portal/complaints', (route) => route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: { code: 'INTERNAL_ERROR', message: 'Unavailable' } }) }));
  await portal.getByRole('button', { name: 'Submit complaint', exact: true }).click(); await portal.getByText('Complaint could not be submitted. Check the fields and try again.', { exact: true }).waitFor();
  assert.equal(await portal.getByLabel('Customer name', { exact: true }).inputValue(), 'Browser proof customer');
  await visual(portal, 'portal-error-preserved'); await portal.unroute('**/api/portal/complaints');
  await portal.getByRole('button', { name: 'Submit complaint', exact: true }).click(); await portal.getByRole('heading', { name: 'Complaint submitted', exact: true }).waitFor();
  await visual(portal, 'portal-success');
  const member = await context('intake_one'); const page = await member.newPage();
  for (const locale of ['en', 'ar']) for (const width of [390, 430, 768, 1280, 1440]) {
    await page.setViewportSize({ width, height: 1100 }); await page.goto(`${origin}/redirect-complaints?locale=${locale}`); await visual(page, `queue-${locale}-${width}`);
    await page.goto(`${origin}/redirect-complaints/${fixture.browserComplaintId}?locale=${locale}`); await visual(page, `detail-${locale}-${width}`);
  }
  await page.goto(`${origin}/redirect-complaints/${fixture.browserComplaintId}?locale=en`);
  assert.equal(await page.getByLabel('Customer name', { exact: true }).isDisabled(), true);
  await page.getByRole('button', { name: 'Claim complaint', exact: true }).click();
  await page.getByLabel('Customer name', { exact: true }).fill('Edited browser customer');
  await page.getByLabel('Correction / redirect reason', { exact: true }).fill('Verified browser details');
  await page.getByRole('button', { name: 'Save corrections', exact: true }).click(); await page.getByText('Corrections saved.', { exact: true }).waitFor();
  const other = await context('intake_two'); const otherPage = await other.newPage();
  await otherPage.goto(`${origin}/redirect-complaints/${fixture.browserComplaintId}?locale=en`); await otherPage.getByText('Claimed by another team member. Details are read-only.', { exact: true }).waitFor();
  assert.equal(await otherPage.getByLabel('Customer name', { exact: true }).isDisabled(), true); await visual(otherPage, 'claimed-by-other');
  const latest = await (await member.request.get(`${api}/complaints/${fixture.browserComplaintId}/intake`)).json();
  const csrf = (await member.cookies()).find((cookie) => cookie.name === 'cms_csrf_token')?.value;
  assert.equal((await member.request.delete(`${api}/complaints/${fixture.browserComplaintId}/intake-claim`, { headers: { 'x-csrf-token': csrf }, data: { expectedVersion: latest.expectedVersion } })).status(), 200);
  await page.getByLabel('Customer name', { exact: true }).fill('Unsaved conflict text');
  await page.getByRole('button', { name: 'Save corrections', exact: true }).click();
  await page.getByText('Another member changed or claimed this complaint. Your edits are preserved. Reload the latest version before continuing.', { exact: true }).waitFor();
  assert.equal(await page.getByLabel('Customer name', { exact: true }).inputValue(), 'Unsaved conflict text'); await visual(page, 'conflict-preserved');
  await page.getByRole('button', { name: 'Reload latest', exact: true }).click();
  await page.getByRole('button', { name: 'Claim complaint', exact: true }).click();
  await page.getByLabel('Correction / redirect reason', { exact: true }).fill('Verified browser details');
  await page.getByRole('button', { name: 'Redirect complaint', exact: true }).click(); await page.getByText('Complaint redirected.', { exact: true }).waitFor(); await visual(page, 'redirect-success');
  await adminPage.goto(`${origin}/redirect-complaints?filter=mine&locale=en`); await adminPage.getByText('No complaints in this view.', { exact: true }).waitFor(); await visual(adminPage, 'queue-empty');
  await admin.close(); await customer.close(); await member.close(); await other.close();
  console.log('Passed live browser settings save, QR download/decoding, failed submission value preservation, submission/reference success, queue/detail at five widths EN/AR with axe, claim/edit/save, claimed-by-other read-only and redirect.');
} finally { await browser.close(); }
