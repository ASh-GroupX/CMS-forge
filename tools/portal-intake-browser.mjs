import { mkdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createRequire } from 'node:module';
import { chromium } from 'playwright-core';
import { AxeBuilder } from '@axe-core/playwright';
import { compileTailwind } from './web-browser-check.mjs';
import { PortalIntakeSettings } from '../apps/web/src/components/portal-intake-settings/index.tsx';
const require = createRequire(new URL('../apps/web/package.json', import.meta.url));
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const output = resolve('coverage/portal-intake-browser');
mkdirSync(output, { recursive: true }); compileTailwind(output);
const option = { id: 'branch', nameEn: 'Main branch', nameAr: 'الفرع الرئيسي' };
const initial = { status: 'ok', settings: null, options: { branches: [option], categories: [{ ...option, id: 'category' }], members: [{ ...option, id: 'user', nameEn: 'Intake manager', nameAr: 'مدير الاستقبال' }] }, portalUrl: 'https://cms.laith-alobaidi-crm.com/portal' };
const browser = await chromium.launch({ headless: true });
try {
  for (const locale of ['en', 'ar']) for (const width of [390, 430, 768, 1280, 1440]) {
    const context = await browser.newContext({ viewport: { width, height: 1100 } });
    const page = await context.newPage();
    const html = renderToStaticMarkup(React.createElement(PortalIntakeSettings, { locale, initial }));
    await page.setContent(`<html lang="${locale}"><head><title>Intake settings</title><style>${readFileSync(`${output}/proof.css`, 'utf8')}</style></head><body><main class="p-4">${html}</main></body></html>`);
    if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 2)) throw Error(`Overflow ${locale} ${width}`);
    const violations = (await new AxeBuilder({ page }).analyze()).violations.filter((v) => ['critical', 'serious'].includes(v.impact));
    if (violations.length) throw Error(JSON.stringify(violations.map((v) => v.id)));
    await page.screenshot({ path: `${output}/${locale}-${width}.png`, fullPage: true }); await context.close();
  }
  console.log('Passed 10 rendered viewport/locale geometry and axe checks. Static rendering only; interactive save/QR actions require live proof.');
} finally { await browser.close(); }
