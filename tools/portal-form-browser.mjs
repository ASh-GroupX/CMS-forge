import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { chromium } from 'playwright-core';
import { AxeBuilder } from '@axe-core/playwright';
const require = createRequire(new URL('../apps/api/package.json', import.meta.url));
const { PrismaClient } = require('@prisma/client');
const database = process.env.INTAKE_PROOF_DATABASE_URL;
if (!database || new URL(database).hostname !== '127.0.0.1' || !new URL(database).pathname.endsWith('/cms_intake_proof')) throw Error('Use isolated proof database');
const prisma = new PrismaClient({ datasourceUrl: database });
const browser = await chromium.launch({ headless: true });
const origin = 'http://127.0.0.1:3001';
const output = 'coverage/portal-form-browser'; mkdirSync(output, { recursive: true });
async function check(page, name) {
  await page.evaluate(() => document.fonts.ready);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 2), false, `overflow: ${name}`);
  const violations = (await new AxeBuilder({ page }).analyze()).violations.filter((item) => ['critical', 'serious'].includes(item.impact));
  await page.screenshot({ path: `${output}/${name}.png`, fullPage: true });
  assert.deepEqual(violations.map((item) => ({ id: item.id, nodes: item.nodes.map((node) => node.target) })), [], name);
}
try {
  await prisma.serviceCarModel.upsert({ where: { id: 'intake_camry' }, update: { isActive: true }, create: { id: 'intake_camry', brand: 'Toyota', nameEn: 'Camry', nameAr: 'كامري', isActive: true } });
  const admin = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const login = await admin.request.post('http://127.0.0.1:3100/auth/login', { data: { identifier: 'intake_admin', password: 'Intake-proof-only-2026!' } }); assert.equal(login.status(), 201);
  const page = await admin.newPage(); page.on('pageerror', (error) => { throw error; });
  await page.goto(`${origin}/admin/portal-intake/fields?locale=en`);
  await page.getByRole('heading', { name: 'QR complaint fields' }).waitFor();
  if (!await page.getByText('Preferred contact time').count()) {
    await page.getByRole('button', { name: 'Add field' }).click();
    const cards = page.locator('[data-slot="card"]');
    const added = cards.last();
    await added.getByLabel('English label').fill('Preferred contact time');
    await added.getByLabel('Arabic label').fill('وقت التواصل المفضل');
    await page.getByRole('button', { name: 'Save fields' }).click();
    await page.getByText('Fields saved.').waitFor();
  }
  assert.ok(await page.getByText('Preferred contact time').count());
  for (const locale of ['en', 'ar']) for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 1000 }); await page.goto(`${origin}/admin/portal-intake/fields?locale=${locale}`); await check(page, `fields-${locale}-${width}`);
  }
  const customer = await browser.newContext({ viewport: { width: 390, height: 1000 } }); const portal = await customer.newPage();
  for (const locale of ['en', 'ar']) for (const width of [390, 430, 768, 1280, 1440]) {
    await portal.setViewportSize({ width, height: 1000 }); await portal.goto(`${origin}/portal?locale=${locale}`); await check(portal, `portal-${locale}-${width}`);
  }
  await portal.goto(`${origin}/portal?locale=en`);
  const brand = portal.getByRole('combobox', { name: 'Car make' }); await brand.click(); await portal.getByRole('option', { name: 'Nissan' }).click();
  await portal.getByRole('combobox', { name: 'Car model' }).click(); await portal.getByRole('option', { name: 'Patrol' }).click();
  assert.equal(await portal.locator('input[name="vehicleModel"]').inputValue(), 'Patrol');
  await portal.getByRole('combobox', { name: 'Car make' }).click(); await portal.getByRole('option', { name: 'Toyota' }).click();
  assert.equal(await portal.locator('input[name="vehicleModel"]').inputValue(), '');
  await portal.getByRole('combobox', { name: 'Car model' }).click(); await portal.getByRole('option', { name: 'Camry', exact: true }).click();
  assert.equal(await portal.locator('input[name="vehicleModel"]').inputValue(), 'Camry');
  await page.goto(`${origin}/complaints/new?locale=en`);
  await page.getByRole('combobox', { name: 'Vehicle make' }).waitFor();
  await page.getByRole('combobox', { name: 'Vehicle make' }).click(); await page.getByRole('option', { name: 'Toyota' }).click();
  await page.getByRole('combobox', { name: 'Vehicle model / type' }).click(); await page.getByRole('option', { name: 'Camry', exact: true }).click();
  assert.equal(await page.locator('input[name="vehicleModel"]').inputValue(), 'Camry');
  const complaint = await prisma.complaint.findFirst({ where: { portalData: { path: ['values', 'custom_visit'], equals: 'evening' }, status: 'SUBMITTED' }, orderBy: { createdAt: 'desc' } });
  if (complaint) { await page.goto(`${origin}/redirect-complaints/${complaint.id}?locale=en`); await page.getByText('Preferred visit').waitFor(); assert.equal(await page.locator('input[name="vehicleModel"]').inputValue(), 'Patrol'); await check(page, 'redirect-custom-en-1440'); }
  console.log('Passed Admin field add/save, public and normal booking make/model dropdowns, model reset on make change, snapshot in redirect editor, 14 EN/AR viewport geometry and axe checks.');
} finally { await browser.close(); await prisma.$disconnect(); }
