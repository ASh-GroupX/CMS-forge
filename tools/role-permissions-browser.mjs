import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { mkdirSync, readFileSync, realpathSync } from 'node:fs';
import { resolve } from 'node:path';
import { chromium } from 'playwright-core';
import { AxeBuilder } from '@axe-core/playwright';
import { compileTailwind } from './web-browser-check.mjs';
import { RolePermissionsFixture } from '../apps/web/test/browser/role-permissions.fixture.tsx';

const webRequire = createRequire(new URL('../apps/web/package.json', import.meta.url));
const React = webRequire('react');
const { renderToString } = webRequire('react-dom/server');
const { build } = createRequire(realpathSync('node_modules/tsx/package.json'))('esbuild');
const output = resolve('coverage/role-permissions-browser');
mkdirSync(output, { recursive: true });
compileTailwind(output);
await build({ entryPoints: ['apps/web/test/browser/role-permissions.fixture.tsx'], bundle: true,
  platform: 'browser', outfile: `${output}/fixture.js`, jsx: 'automatic', tsconfig: 'apps/web/tsconfig.json',
  define: { 'process.env.NODE_ENV': '"development"' } });

const server = createServer((request, response) => {
  if (request.url === '/fixture.js' || request.url === '/proof.css') {
    response.setHeader('Content-Type', request.url.endsWith('.js') ? 'text/javascript' : 'text/css');
    return response.end(readFileSync(`${output}${request.url}`));
  }
  const locale = new URL(request.url, 'http://localhost').searchParams.get('locale') === 'ar' ? 'ar' : 'en';
  response.setHeader('Content-Type', 'text/html; charset=utf-8');
  response.end(`<!doctype html><html lang="${locale}" dir="${locale === 'ar' ? 'rtl' : 'ltr'}"><head><link rel="stylesheet" href="/proof.css"></head><body><div id="root" data-locale="${locale}">${renderToString(React.createElement(RolePermissionsFixture, { locale }))}</div><script src="/fixture.js"></script></body></html>`);
});
await new Promise((done) => server.listen(0, '127.0.0.1', done));
const browser = await chromium.launch({ headless: true });
try {
  for (const locale of ['en', 'ar']) {
    const context = await browser.newContext({ viewport: { width: locale === 'en' ? 1280 : 390, height: 900 } });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(`http://127.0.0.1:${server.address().port}/?locale=${locale}`);
    const form = page.locator('form:has(input[name="code"])');
    const nav = form.locator('fieldset').filter({ hasText: locale === 'en' ? 'Visible pages' : 'الصفحات الظاهرة' });
    assert.equal(await nav.getAttribute('disabled'), '');
    await form.locator('input[value="ROLE_VIEW_CUSTOM"]').check();
    await page.waitForFunction(() => !document.querySelector('form:has(input[name="code"]) fieldset:has(input[value="ROLE_NAV_SERVICE_BOOKING"])')?.disabled);
    await form.locator('input[value="ROLE_NAV_SERVICE_BOOKING"]').check();
    const selected = await form.evaluate((element) => new FormData(element).getAll('permissionCodes'));
    assert.deepEqual(selected.filter((code) => String(code).startsWith('ROLE_')), ['ROLE_VIEW_CUSTOM', 'ROLE_NAV_SERVICE_BOOKING']);
    assert.equal(await page.locator('article:has-text("ADMIN") input[value="ROLE_VIEW_CUSTOM"]').count(), 0);
    for (const code of ['COMPLAINT_CREATE_CROSS_BRANCH', 'TICKET_SETTINGS_MANAGE', 'BOOKING_SETTINGS_MANAGE', 'COMMUNICATION_GROUPS_MANAGE']) {
      assert.equal(await form.locator(`input[value="${code}"]`).count(), 1);
    }
    assert.ok(await form.getByText(locale === 'en' ? 'Service booking' : 'حجوزات الصيانة', { exact: true }).count());
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2));
    assert.deepEqual(errors, []);
    const severe = (await new AxeBuilder({ page }).include('#root').analyze()).violations
      .filter((item) => ['serious', 'critical'].includes(item.impact));
    assert.deepEqual(severe.map((item) => item.id), []);
    await page.screenshot({ path: `${output}/${locale}-custom-role.png`, fullPage: true });
    await context.close();
  }
  console.log('Custom role view and navigation browser proof passed in English and Arabic.');
} finally {
  await browser.close();
  await new Promise((done) => server.close(done));
}
