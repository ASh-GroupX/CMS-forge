import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { mkdirSync, readFileSync, realpathSync } from 'node:fs';
import { resolve } from 'node:path';
import { chromium } from 'playwright-core';
import { compileTailwind } from './web-browser-check.mjs';
import { TicketPhoneFixture } from '../apps/web/test/browser/ticket-phone-rule.fixture.tsx';
import { ticketPhoneRuleText, ticketPhoneRuleAdmin } from '../apps/web/src/i18n/staff-ticket-phone-rule.ts';

const webRequire = createRequire(new URL('../apps/web/package.json', import.meta.url));
const { renderToString } = webRequire('react-dom/server');
const React = webRequire('react');
const { build } = createRequire(realpathSync('node_modules/tsx/package.json'))('esbuild');
const output = resolve('coverage/ticket-phone-browser');
mkdirSync(output, { recursive: true });
compileTailwind(output);
await build({ entryPoints: ['apps/web/test/browser/ticket-phone-rule.fixture.tsx'], bundle: true, platform: 'browser',
  outfile: `${output}/fixture.js`, jsx: 'automatic', tsconfig: 'apps/web/tsconfig.json', define: { 'process.env.NODE_ENV': '"development"' },
  plugins: [{ name: 'action-test-doubles', setup(builder) {
    builder.onResolve({ filter: /staff-ticket-phone-actions$/ }, args => ({ path: args.path, namespace: 'phone-action' }));
    builder.onLoad({ filter: /.*/, namespace: 'phone-action' }, () => ({ loader: 'js', contents: `
      export async function findTicketPhoneDuplicates(input) {
        const mode=window.phoneMode || 'matches';
        if (input.phone.endsWith('001')) await new Promise(resolve=>setTimeout(resolve,800));
        if (!input.phone.startsWith('+')) return {items:[],error:'VALIDATION_FAILED'};
        if (mode==='error') return {items:[],error:'UNAVAILABLE'};
        return {items:mode==='empty'?[]:[{id:'ticket-1',referenceNumber:'TKT-100',title:'Previous problem',status:'IN_PROGRESS'}]};
      }` }));
    builder.onResolve({ filter: /^\.\/actions$/ }, args => ({ path: args.path, namespace: 'admin-action' }));
    builder.onLoad({ filter: /.*/, namespace: 'admin-action' }, () => ({ loader: 'js', contents: 'export async function createDepartmentCustomField(departmentId,data) { window.savedPhoneRule={departmentId,...data}; return data; }' }));
  } }],
});
const server = createServer((req, res) => {
  if (req.url === '/fixture.js' || req.url === '/proof.css') {
    res.setHeader('Content-Type', req.url.endsWith('.js') ? 'text/javascript' : 'text/css');
    return res.end(readFileSync(`${output}${req.url}`));
  }
  const locale = req.url?.includes('ar') ? 'ar' : 'en';
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.end(`<!doctype html><html lang="${locale}"><head><title>Ticket phone rule</title><link rel="stylesheet" href="/proof.css"></head><body><div id="root">${renderToString(React.createElement(TicketPhoneFixture, { locale }))}</div><script src="/fixture.js"></script></body></html>`);
});
await new Promise(done => server.listen(0, '127.0.0.1', done));
const browser = await chromium.launch({ headless: true });
try {
  for (const locale of ['en', 'ar']) {
    const page = await browser.newPage({ viewport: { width: locale === 'en' ? 1280 : 390, height: 1000 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const copy = ticketPhoneRuleText[locale];
    await page.goto(`http://127.0.0.1:${server.address().port}/?${locale}`);
    const phone = page.locator('input[type=tel]');
    await phone.fill('0790000000');
    await page.getByRole('alert').getByText(copy.hint, { exact: true }).waitFor();
    await phone.fill('+962790000000');
    await page.getByText(copy.duplicate, { exact: true }).waitFor();
    const link = page.getByRole('link');
    assert.equal(await link.getAttribute('href'), `/internal-tickets/ticket-1?locale=${locale}`);
    assert.ok(await page.getByText(copy.followUp, { exact: true }).isVisible());
    await page.getByRole('button', { name: copy.separate, exact: true }).click();
    assert.equal(await page.getByTestId('acknowledgement').textContent(), 'true');
    await page.screenshot({ path: `${output}/${locale}-duplicate.png`, fullPage: true });
    await page.evaluate(() => { window.phoneMode = 'empty'; });
    await phone.fill('+962790000002');
    assert.equal(await page.getByTestId('acknowledgement').textContent(), 'false');
    await page.getByText(copy.noMatches, { exact: true }).waitFor();
    await page.evaluate(() => { window.phoneMode = 'matches'; });
    await phone.fill('+962790000001');
    await page.waitForTimeout(450);
    await page.evaluate(() => { window.phoneMode = 'empty'; });
    await phone.fill('+962790000003');
    await page.getByText(copy.noMatches, { exact: true }).waitFor();
    await page.waitForTimeout(900);
    assert.equal(await page.getByText(copy.duplicate, { exact: true }).count(), 0);
    await page.evaluate(() => { window.phoneMode = 'error'; });
    await phone.fill('+962790000004');
    await page.getByRole('button', { name: copy.retry, exact: true }).waitFor();
    await page.evaluate(() => { window.phoneMode = 'matches'; });
    await page.getByRole('button', { name: copy.retry, exact: true }).click();
    await page.getByText(copy.duplicate, { exact: true }).waitFor();
    await page.getByRole('checkbox', { name: ticketPhoneRuleAdmin.label, exact: true }).check();
    assert.ok(await page.locator('input[type=checkbox]:not([aria-hidden])').isChecked());
    assert.ok(await page.locator('input[type=checkbox]:not([aria-hidden])').isDisabled());
    assert.ok(await page.locator('select').isDisabled());
    await page.getByRole('button', { name: 'Save Field / حفظ', exact: true }).click();
    await page.waitForFunction(() => window.savedPhoneRule?.phoneDuplicateCheck === true);
    assert.equal(await page.evaluate(() => window.savedPhoneRule.isRequired), true);
    assert.equal(await page.evaluate(() => window.savedPhoneRule.fieldType), 'TEXT');
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2));
    assert.deepEqual(errors, []);
    await page.close();
  }
  console.log('Ticket phone browser proof passed: EN/AR duplicate links, separate-problem choice/reset, validation, stale lookup, retry and mandatory admin rule.');
} finally { await browser.close(); await new Promise(done => server.close(done)); }
