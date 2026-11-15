import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { mkdirSync, readFileSync, realpathSync } from 'node:fs';
import { resolve } from 'node:path';
import { chromium } from 'playwright-core';
import { AxeBuilder } from '@axe-core/playwright';
import { compileTailwind } from './web-browser-check.mjs';
import { PortalIntakeGrantFixture } from '../apps/web/test/browser/portal-intake-grant.fixture.tsx';

const output = resolve('coverage/portal-intake-grant-browser');
mkdirSync(output, { recursive: true });
compileTailwind(output);
const requireWeb = createRequire(new URL('../apps/web/package.json', import.meta.url));
const React = requireWeb('react');
const { renderToString } = requireWeb('react-dom/server');
const { build } = createRequire(realpathSync('node_modules/tsx/package.json'))('esbuild');
await build({ entryPoints: ['apps/web/test/browser/portal-intake-grant.fixture.tsx'], bundle: true,
  platform: 'browser', outfile: `${output}/fixture.js`, jsx: 'automatic', tsconfig: 'apps/web/tsconfig.json',
  define: { 'process.env.NODE_ENV': '"development"' } });
const server = createServer((req, res) => {
  if (req.url === '/fixture.js' || req.url === '/proof.css') {
    res.setHeader('Content-Type', req.url.endsWith('.js') ? 'text/javascript' : 'text/css');
    return res.end(readFileSync(`${output}${req.url}`));
  }
  const locale = req.url?.includes('ar') ? 'ar' : 'en';
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.end(`<!doctype html><html lang="${locale}"><head><title>QR grant proof</title><link rel="stylesheet" href="/proof.css"></head><body><div id="root">${renderToString(React.createElement(PortalIntakeGrantFixture, { locale }))}</div><script src="/fixture.js"></script></body></html>`);
});
await new Promise(done => server.listen(0, '127.0.0.1', done));
const browser = await chromium.launch({ headless: true });
try {
  for (const locale of ['en', 'ar']) {
    const context = await browser.newContext({ viewport: { width: locale === 'en' ? 1100 : 390, height: 950 } });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`http://127.0.0.1:${server.address().port}/?${locale}`);
    await page.getByRole('button', { name: locale === 'ar' ? 'الصفحات والإدارة' : 'Nav & Rules' }).click();
    const dialog = page.getByRole('dialog');
    const qr = dialog.getByRole('checkbox', { name: locale === 'ar' ? 'استقبال شكاوى QR' : 'QR complaint intake' });
    assert.equal(await qr.isChecked(), false);
    await dialog.getByRole('button', { name: locale === 'ar' ? 'تحديد الكل' : 'Select All', exact: true }).click();
    assert.equal(await qr.isChecked(), true);
    await dialog.getByRole('button', { name: locale === 'ar' ? 'إلغاء الكل' : 'Deselect All', exact: true }).click();
    assert.equal(await qr.isChecked(), false);
    await qr.check();
    await page.screenshot({ path: `${output}/${locale}-explicit-qr-grant.png`, fullPage: true });
    const severe = (await new AxeBuilder({ page }).include('[role="dialog"]').analyze())
      .violations.filter(item => ['critical', 'serious'].includes(item.impact));
    assert.deepEqual(severe.map(item => ({ id: item.id, targets: item.nodes.map(node => node.target.join(' ')) })), []);
    await dialog.getByRole('button', { name: locale === 'ar' ? 'حفظ الصلاحيات' : 'Save Rules' }).click();
    await page.waitForFunction(() => Boolean(window.savedQrGrant));
    const saved = await page.evaluate(() => window.savedQrGrant);
    assert.equal(saved.viewMode, 'CUSTOM');
    assert.ok(saved.keys.includes('admin:portal-intake'));
    assert.ok(saved.keys.includes('admin'));
    assert.deepEqual(errors, []);
    await context.close();
  }
  console.log('Explicit QR grant form proof passed in EN desktop and AR mobile.');
} finally {
  await browser.close();
  server.close();
}
