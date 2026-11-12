import assert from 'node:assert/strict';
import { mkdirSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright-core';
import { AxeBuilder } from '@axe-core/playwright';
import { compileTailwind } from './web-browser-check.mjs';
const output = resolve('coverage/intake-conflict-browser'); mkdirSync(output, { recursive: true }); compileTailwind(output);
const { build } = createRequire(realpathSync('node_modules/tsx/package.json'))('esbuild');
const row = { id: 'fixture', referenceNumber: 'CMS-PROOF', expectedVersion: '2026-11-12T00:00:00.000Z', customerName: 'Stored name', customerPhone: '+962790000000', vehicleMake: 'Nissan', vehicleModel: 'Patrol', vehicleVin: null, odometer: 100, incidentAt: '2026-11-12', descriptionEn: 'Synthetic complaint', branchId: 'branch', categoryId: 'category', severity: 'MEDIUM', departmentId: 'department', ownerId: null, claim: { assignedUserId: 'member' } };
const choices = { branches: [{ id: 'branch', nameEn: 'Branch', nameAr: 'الفرع' }], categories: [{ id: 'category', nameEn: 'Category', nameAr: 'التصنيف' }], departments: [{ id: 'department', nameEn: 'Department', nameAr: 'القسم' }], users: [], severities: ['MEDIUM'] };
await build({ stdin: { contents: `import React from 'react';import{createRoot}from'react-dom/client';import{RedirectComplaintEditor}from'./apps/web/src/components/redirect-complaints/editor';const locale=new URLSearchParams(location.search).get('locale')||'en';document.documentElement.lang=locale;createRoot(document.getElementById('root')).render(<RedirectComplaintEditor initial={${JSON.stringify(row)}} choices={${JSON.stringify(choices)}} actorId="member" admin={false} locale={locale}/>);`, resolveDir: process.cwd(), loader: 'tsx' }, bundle: true, nodePaths: [resolve('apps/web/node_modules')], platform: 'browser', outfile: `${output}/fixture.js`, jsx: 'automatic', tsconfig: 'apps/web/tsconfig.json', define: { 'process.env.NODE_ENV': '"development"' }, plugins: [{ name: 'mock-server-action-conflict', setup(build) { build.onResolve({ filter: /redirect-complaints\/actions$/ }, () => ({ path: 'actions', namespace: 'proof' })); build.onLoad({ filter: /.*/, namespace: 'proof' }, () => ({ contents: `export async function intakeClaimAction(){return{status:'ok',data:${JSON.stringify(row)}}}export async function loadRedirectDetail(){return{status:'ok',data:${JSON.stringify({ ...row, customerName: 'Latest name' })}}}export async function intakeCorrectionAction(){return{status:'conflict'}}` })); } }] });
writeFileSync(`${output}/index.html`, `<html><head><title>Conflict proof</title><style>${readFileSync(`${output}/proof.css`, 'utf8')}</style></head><body><main id="root" class="p-4"></main><script src="fixture.js"></script></body></html>`);
const browser = await chromium.launch({ headless: true });
try {
  for (const locale of ['en', 'ar']) for (const width of [390, 1440]) {
    const context = await browser.newContext({ viewport: { width, height: 1100 } }); const page = await context.newPage();
    await page.goto(`${pathToFileURL(`${output}/index.html`).href}?locale=${locale}`);
    await page.locator('#customerName').fill('Unsaved conflict value'); await page.locator('#reason').fill('Verified synthetic reason');
    await page.getByRole('button', { name: locale === 'ar' ? 'حفظ التصحيحات' : 'Save corrections', exact: true }).click();
    await page.getByRole('status').waitFor(); assert.equal(await page.locator('#customerName').inputValue(), 'Unsaved conflict value'); assert.equal(await page.locator('#customerName').isDisabled(), true);
    const violations = (await new AxeBuilder({ page }).analyze()).violations.filter((item) => ['serious', 'critical'].includes(item.impact)); assert.deepEqual(violations.map((item) => item.id), []);
    await page.screenshot({ path: `${output}/${locale}-${width}.png`, fullPage: true });
    await page.getByRole('button', { name: locale === 'ar' ? 'تحميل أحدث نسخة' : 'Reload latest', exact: true }).click(); await page.waitForFunction(() => document.querySelector('#customerName')?.value === 'Latest name');
    await context.close();
  }
  console.log('Passed browser conflict state: EN/AR mobile/desktop preserved edits, disabled stale writes, reloaded latest and no serious/critical axe findings. Server actions simulated; actual HTTP conflicts are covered separately.');
} finally { await browser.close(); }
